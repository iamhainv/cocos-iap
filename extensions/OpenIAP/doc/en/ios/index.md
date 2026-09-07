# Cocos OpenIAP — iOS Requirements (English)

## Permissions / Capabilities

- No `Info.plist` capability entries are required for StoreKit purchases
  themselves; ensure your app target has the **In-App Purchase**
  capability enabled in Xcode / your Apple Developer account (standard for
  any app selling IAP, independent of this extension).
- `StoreKit.framework` is linked automatically by the extension's CMake
  rules — no manual linking needed.

## Build Configuration

- When `enableIAP` is checked in the build panel, the extension:
  - Copies `Pre-iap.cmake` / `Post-iap.cmake` into `native/engine/ios` (the
    pre-hook is currently a no-op; the post-hook includes the bridge's
    `iap.cmake` if present).
  - Copies the `template/ios/iap` bridge directory (Objective-C++ bridge
    sources + `OpenIAP.xcframework`) into `<buildDest>/proj/iap`, controlled
    by `overwriteLibrary`.
- `iap.cmake` links `OpenIAP.xcframework` (device + simulator slices,
  resolved at Xcode build time via `${CURRENT_ARCH}`) and
  `-framework StoreKit`, sets
  `ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES = YES` (required because the
  framework is Swift/async-await based), and adds the Swift runtime search
  paths.
- **Minimum deployment target: iOS 15.0.** The OpenIAP Swift library uses
  StoreKit 2's async/await API surface, which requires iOS 15+. If your
  project's `CMAKE_OSX_DEPLOYMENT_TARGET` is lower, the Xcode build may
  still succeed (the xcframework enforces its own limit via
  `SWIFT_DEPLOYMENT_TARGET`), but any StoreKit 2 call at runtime on a
  device below iOS 15 will crash. Set your project's deployment target to
  15.0 or higher.
- See [openiap.xcframework version](../index.md#upgrading-the-openiap-google-version)
  for how the vendored binary is versioned and how to replace it.

## Known Limitations

- Mac Catalyst is present as a slice inside `OpenIAP.xcframework` but is
  not wired up as a build target by this extension's CMake rules (only
  `ios-arm64` device and `ios-arm64_x86_64-simulator` are linked).
- Purchases must be tested with a Sandbox Apple ID (or TestFlight) — real
  App Store purchases cannot be tested in development builds.
