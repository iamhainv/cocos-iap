# OpenIAP extension — iOS CMake build rules.
#
# Mirrors the structure and variable conventions of admob.cmake.
# Key differences:
#   * One xcframework (OpenIAP.xcframework) rather than a glob of many.
#   * The framework slice directories follow the pattern used by Swift PM:
#       ios-arm64/OpenIAP.framework         (device)
#       ios-arm64_x86_64-simulator/OpenIAP.framework   (simulator)
#   * StoreKit.framework is the only required system framework; no WebKit /
#     JavaScriptCore dependency (unlike AdMob).
#   * ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES is set YES on the executable
#     because OpenIAP.xcframework contains Swift code (Swift 6 runtime).
#
# Minimum iOS deployment target: the OpenIAP Swift library requires iOS 15.0
# (StoreKit 2 / async-await entry point).  If the Cocos project's current
# CMAKE_OSX_DEPLOYMENT_TARGET is lower than 15.0, the Xcode build will still
# succeed because the xcframework itself enforces the limit via
# SWIFT_DEPLOYMENT_TARGET, but any StoreKit 2 API called at runtime on a
# device below iOS 15 will crash.  Set the project minimum to 15.0 or higher
# in native/engine/ios/CMakeLists.txt to be safe.

# ---------------------------------------------------------------------------
# 1. Collect ObjC++ bridge sources
# ---------------------------------------------------------------------------

set(IAP_PROJ_SOURCES)

list(APPEND IAP_PROJ_SOURCES
    ${CMAKE_CURRENT_LIST_DIR}/IapServiceHub.mm
    ${CMAKE_CURRENT_LIST_DIR}/IapServiceHub.h
    ${CMAKE_CURRENT_LIST_DIR}/IapMethodRouter.mm
    ${CMAKE_CURRENT_LIST_DIR}/IapMethodRouter.h
)

source_group(TREE ${CMAKE_CURRENT_LIST_DIR} PREFIX "Source Files" FILES ${IAP_PROJ_SOURCES})

# Enable ARC on every source file (mirrors admob.cmake per-file approach).
foreach(file ${IAP_PROJ_SOURCES})
    set_source_files_properties(${file} PROPERTIES COMPILE_OPTIONS "-fobjc-arc")
endforeach()

# ---------------------------------------------------------------------------
# 2. Build the bridge as a static library
# ---------------------------------------------------------------------------

add_library(iap ${IAP_PROJ_SOURCES})

target_include_directories(iap PRIVATE
    ${CMAKE_CURRENT_LIST_DIR}
)

# ---------------------------------------------------------------------------
# 3. Link OpenIAP.xcframework
#
# The xcframework was built with build-xcframework.sh (BUILD_LIBRARY_FOR_DISTRIBUTION).
# It contains three slices:
#   ios-arm64/                        → device (physical iPhone/iPad)
#   ios-arm64_x86_64-simulator/       → simulator (x86_64 + arm64)
#   ios-arm64_x86_64-maccatalyst/     → Mac Catalyst (not linked here)
#
# CMake cannot automatically select xcframework slices, so we use the same
# technique as admob.cmake: find_library on the device slice (arm64) and
# then replace the architecture literal with the Xcode build variable
# ${CURRENT_ARCH} so the correct slice is resolved at Xcode build time for
# both device and simulator.
# ---------------------------------------------------------------------------

set(OPENIAP_XCFRAMEWORK_DIR "${CMAKE_CURRENT_LIST_DIR}/OpenIAP.xcframework")

# Device slice (arm64 → resolves to ios-arm64)
find_library(OPENIAP_LIB OpenIAP
    PATHS "${OPENIAP_XCFRAMEWORK_DIR}/ios-arm64"
    NO_DEFAULT_PATH
    NO_CMAKE_FIND_ROOT_PATH
)

if(OPENIAP_LIB STREQUAL "OPENIAP_LIB-NOTFOUND")
    message(WARNING "OpenIAP.xcframework not found at ${OPENIAP_XCFRAMEWORK_DIR}/ios-arm64 — IAP bridge will not link")
else()
    # Replace the literal "arm64" path component with the Xcode variable so
    # the linker resolves the correct slice for simulator builds as well.
    string(REPLACE "ios-arm64/" "ios-\${CURRENT_ARCH}/" OPENIAP_LIB_XCODE "${OPENIAP_LIB}")
    target_link_libraries(iap "${OPENIAP_LIB_XCODE}")
    message(STATUS "OpenIAP xcframework linked: ${OPENIAP_LIB_XCODE}")
endif()

# ---------------------------------------------------------------------------
# 4. Link system frameworks
#
# StoreKit is the only mandatory system framework for IAP.
# ---------------------------------------------------------------------------

target_link_libraries(iap "-framework StoreKit")

# ---------------------------------------------------------------------------
# 5. Link engine and wire iap into the final executable
# ---------------------------------------------------------------------------

target_link_libraries(iap ${ENGINE_NAME})
target_include_directories(${EXECUTABLE_NAME} PUBLIC ${CMAKE_CURRENT_LIST_DIR})
target_link_libraries(${EXECUTABLE_NAME} iap)

# Force-load ensures +load / constructor functions inside the static lib run
# even if no symbol from the lib is directly referenced.
target_link_options(${EXECUTABLE_NAME} PRIVATE -ObjC)

# ---------------------------------------------------------------------------
# 6. Swift runtime search paths (mirrors admob.cmake exactly)
#
# OpenIAP.xcframework was compiled from Swift source.  A pure ObjC/C++ host
# app must add the Swift runtime lib paths or the link fails with:
#   "Undefined symbols: _$s.../swift_*"
# The $(…) tokens are Xcode build variables that resolve correctly for both
# iphoneos and iphonesimulator destinations.
# ---------------------------------------------------------------------------

target_link_options(${EXECUTABLE_NAME} PRIVATE
    "-L$(SDKROOT)/usr/lib/swift"
    "-L$(TOOLCHAIN_DIR)/usr/lib/swift/$(PLATFORM_NAME)"
    "-Wl,-rpath,/usr/lib/swift"
)

# ---------------------------------------------------------------------------
# 7. Embed Swift standard libraries into the app bundle
#
# Required because the xcframework was built with BUILD_LIBRARY_FOR_DISTRIBUTION
# (Swift 6, async/await).  Without this flag the app crashes on launch on
# OS versions whose dyld doesn't ship the exact Swift ABI the framework was
# built against.
# ---------------------------------------------------------------------------

set_target_properties(${EXECUTABLE_NAME} PROPERTIES
    XCODE_ATTRIBUTE_ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES "YES"
)
