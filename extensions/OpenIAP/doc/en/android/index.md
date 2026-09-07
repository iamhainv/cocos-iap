# Cocos OpenIAP — Android Requirements (English)

## Permissions / Capabilities

- `com.android.vending.BILLING` — declared automatically by the extension's
  `AndroidManifest.xml`; no manual setup required.
- A `IapInitProvider` content provider is registered with `initOrder="99"`
  so the native JS↔native bridge listener is ready before the first JS
  frame runs. It is a no-op ContentProvider (no actual data is queried) —
  it exists purely to hook into the early application-init lifecycle.

## Build Configuration

- When `enableIAP` is checked in the build panel, the extension:
  - Injects `implementation project(':libiap')` into the app's
    `build.gradle` and `include ':libiap'` into `settings.gradle`
    (idempotently — safe across repeated/incremental builds).
  - Copies the `libiap` native module (Kotlin bridge + the
    `openiap-google` Gradle dependency declaration) into the built
    project, controlled by `overwriteLibrary`.
- `libiap`'s own `build.gradle` pins:
  ```
  implementation 'io.github.hyochan.openiap:openiap-google:2.2.1'
  implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0'
  ```
  Kotlin plugin version `2.2.0`. `compileSdkVersion` / `minSdkVersion` /
  `targetSdkPreview` are inherited from your project's global Gradle
  properties (`PROP_COMPILE_SDK_VERSION`, `PROP_MIN_SDK_VERSION`,
  `PROP_TARGET_SDK_VERSION`) — the same values your whole Cocos Android
  build already uses, not a separate minimum enforced by this extension.
- See [openiap-google version pin](../index.md#upgrading-the-openiap-google-version)
  for how to change the pinned version.

## Known Limitations

- Requires a device/emulator with Google Play Store installed and signed
  into an account with access to the app's Play Console listing (internal
  testing track or later) to actually complete a purchase — the Play
  Billing library itself, not this extension, enforces this.
- The deprecated alternative-billing helpers
  (`checkAlternativeBillingAvailabilityAndroid`,
  `showAlternativeBillingDialogAndroid`,
  `createAlternativeBillingTokenAndroid`) are exposed for compatibility
  only; prefer `isBillingProgramAvailableAndroid`.
