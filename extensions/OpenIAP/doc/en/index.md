# Cocos OpenIAP (English)

In-app purchases for Cocos Creator 3.8.x native builds, backed by
[OpenIAP](https://openiap.dev): Google Play Billing on Android
(`openiap-google`) and StoreKit 2 on iOS (`OpenIAP.xcframework`).

## Compatibility

| | Requirement |
| --- | --- |
| Cocos Creator | >= 3.8.0 (built against 3.8.8) |
| Android | minSdk inherited from your project's build settings; requires Google Play Billing (device/emulator with Play Store) |
| iOS | Deployment target >= 15.0 (StoreKit 2 requires iOS 15+) |
| Web / Editor preview | Not supported — every API call rejects with `E_NOT_SUPPORTED` |

## Server-side verification

> **⚠️ This extension does not verify purchase receipts.** It only performs
> the client-side purchase flow (opening the store purchase sheet and
> relaying the platform's response back to your game via
> `onPurchaseUpdated` / `onPurchaseError`). A malicious or modified client
> could fabricate a fake "successful purchase" event. **Before granting any
> paid entitlement, your game server must independently verify the purchase**:
>
> - **Android**: verify the purchase token against the
>   [Google Play Developer API](https://developer.android.com/google/play/billing/security#verify)
>   (`purchases.products.get` / `purchases.subscriptions.get`).
> - **iOS**: verify the transaction/JWS against Apple's
>   [App Store Server API](https://developer.apple.com/documentation/appstoreserverapi)
>   or by validating the signed transaction locally with Apple's public keys.
>
> Only call `finishTransaction()` (to unlock the item client-side / avoid
> replay) **after** your backend has confirmed the purchase is genuine.
> Treating the client-reported result as authoritative is a common and
> serious IAP security mistake.

## Installation

1. Copy `extensions/OpenIAP` into your project's `extensions/` folder (or
   clone this whole repository and copy just that subfolder).
2. Restart Cocos Creator, or open **Extension → Extension Manager** and
   enable "Cocos OpenIAP" if it isn't already active.
3. If you are working from source rather than the committed `dist/`:
   ```
   cd extensions/OpenIAP
   npm install
   npm run build
   ```
4. Import the API in your game scripts:
   ```ts
   import { iap } from 'db://openiap/IapClient';
   ```

## Build Panel Options

Open **Project → Build**, select the Android and/or iOS platform, and find
the **openiap** package section. Both platforms expose the same two options:

| Option | Default | Description |
| --- | --- | --- |
| `enableIAP` | `true` | Enables the IAP native module for this build. When disabled, all native IAP code/dependencies are excluded (or removed, on incremental builds) from the output project. |
| `overwriteLibrary` | `true` | Whether the extension overwrites the previously-copied native library folder on rebuilds. Turn this off only if you intentionally hand-modified the copied native files inside the built project and want to preserve those edits across rebuilds. |

Both options apply independently per platform — you can, for example, ship
IAP on iOS only by disabling `enableIAP` under the Android section.

## Upgrading the openiap-google version

The Android side pins an exact Maven Central version:

```
// extensions/OpenIAP/template/android/libiap/build.gradle
implementation 'io.github.hyochan.openiap:openiap-google:2.2.1'
```

To upgrade:

1. Check the new version's listing on
   [Maven Central](https://central.sonatype.com/artifact/io.github.hyochan.openiap/openiap-google)
   and confirm its license (see [THIRD_PARTY_NOTICES.md](../../../THIRD_PARTY_NOTICES.md)
   for how this was verified for 2.2.1).
2. Bump the version string in `build.gradle` above.
3. Rebuild your Android project (`overwriteLibrary` must be `true`, or
   manually re-copy the `libiap` folder) so Gradle re-resolves the artifact.
4. Re-test `fetchProducts` / `requestPurchase` — Play Billing library major
   version bumps occasionally change response shapes for edge cases.

The iOS side is a **vendored, prebuilt** `OpenIAP.xcframework` (version
2.2.1) — there is no separate "pin" to edit; upgrading iOS means replacing
`extensions/OpenIAP/template/ios/iap/OpenIAP.xcframework` with a newer build
from the [hyodotdev/openiap](https://github.com/hyodotdev/openiap) project
and re-verifying its license/version metadata before committing it.

## API Reference

Full JSDoc lives in
[`assets/IapClient.ts`](../../assets/IapClient.ts) — this section summarizes
the public surface. Import the singleton:

```ts
import { iap } from 'db://openiap/IapClient';
```

### Connection

| Method | Description |
| --- | --- |
| `initConnection(): Promise<boolean>` | Must be called once before any other API. |
| `endConnection(): Promise<boolean>` | Disconnects and releases resources. |

### Products & purchases

| Method | Description |
| --- | --- |
| `fetchProducts(request): Promise<Product[]>` | Fetch product details for a list of SKUs. |
| `requestPurchase(props): Promise<RequestPurchaseResult>` | Launch the platform purchase UI. **Does not carry the purchase outcome** — see below. |
| `finishTransaction(purchase, isConsumable?): Promise<VoidResult>` | Finalize a completed transaction after your server has verified it. |
| `restorePurchases(): Promise<void>` | Restore previously completed transactions. |
| `getAvailablePurchases(options?): Promise<Purchase[]>` | Return current unfinished purchases. |
| `getActiveSubscriptions(subscriptionIds?): Promise<ActiveSubscription[]>` | Return active subscriptions. |
| `hasActiveSubscriptions(subscriptionIds?): Promise<boolean>` | Whether the user has any active subscription. |
| `getStorefront(): Promise<string>` | ISO 3166-1 alpha-2 storefront country code. |
| `getPlatform(): 'ios' \| 'android' \| 'unknown'` | Synchronous — no bridge call. |
| `deepLinkToSubscriptions(options?): Promise<void>` | Open the platform subscription-management screen. |

> **IMPORTANT — purchase outcome is event-based, not return-value-based.**
> `requestPurchase()` only confirms that the purchase dialog was launched.
> Register `onPurchaseUpdated` / `onPurchaseError` **before** calling
> `requestPurchase()` — the actual result always arrives through those
> events, on both Android and iOS.

### Events

| Event | Fires when |
| --- | --- |
| `onPurchaseUpdated(cb)` / `offPurchaseUpdated(cb)` | A purchase completes successfully. |
| `onPurchaseError(cb)` / `offPurchaseError(cb)` | A purchase fails or is cancelled. |
| `onConnected(cb)` / `offConnected(cb)` | The billing client connects. |
| `onDisconnected(cb)` / `offDisconnected(cb)` | The billing client disconnects. |
| `onPromotedProductIOS(cb)` / `off...` | (iOS) User taps a promoted App Store IAP. |
| `onUserChoiceBillingAndroid(cb)` / `off...` | (Android) User picks a billing option in the User Choice Billing dialog. |
| `onDeveloperProvidedBillingAndroid(cb)` / `off...` | (Android 8.3.0+) User picks the developer-provided billing option. |
| `onSubscriptionBillingIssue(cb)` / `off...` | An active subscription enters a payment-problem state. |

### Android-only

`acknowledgePurchaseAndroid`, `consumePurchaseAndroid`,
`isBillingProgramAvailableAndroid`, `launchExternalLinkAndroid`,
`getPackageNameAndroid`, plus deprecated alternative-billing helpers
(`checkAlternativeBillingAvailabilityAndroid`,
`showAlternativeBillingDialogAndroid`,
`createAlternativeBillingTokenAndroid` — superseded by
`isBillingProgramAvailableAndroid`). Full signatures and JSDoc in
`assets/IapClient.ts`.

### iOS-only

`syncIOS`, `clearTransactionIOS`, `getPendingTransactionsIOS`,
`getReceiptDataIOS`, `isTransactionVerifiedIOS`, `getTransactionJwsIOS`,
`beginRefundRequestIOS`, `subscriptionStatusIOS`, `currentEntitlementIOS`,
`isEligibleForIntroOfferIOS`, `presentCodeRedemptionSheetIOS`,
`showManageSubscriptionsIOS`, `getAppTransactionIOS`,
`getPromotedProductIOS`, and the External Purchase Notice / Custom Link
family (`canPresentExternalPurchaseNoticeIOS`,
`presentExternalPurchaseNoticeSheetIOS`,
`isEligibleForExternalPurchaseCustomLinkIOS`,
`getExternalPurchaseCustomLinkTokenIOS`,
`showExternalPurchaseCustomLinkNoticeIOS`). Full signatures and JSDoc in
`assets/IapClient.ts`.

Platform-specific error codes, product/purchase field shapes and enums are
defined in [`assets/Types.ts`](../../assets/Types.ts).

## Examples

### Fetch products and buy a consumable

```ts
import { iap } from 'db://openiap/IapClient';

async function setup() {
    await iap.initConnection();

    iap.onPurchaseUpdated(async (purchase) => {
        // 1. Send `purchase` to your backend and verify it server-side.
        // 2. Only after verification succeeds:
        await iap.finishTransaction(purchase, /* isConsumable */ true);
        // 3. Grant the entitlement locally (e.g. add coins).
    });

    iap.onPurchaseError((err) => {
        console.warn('Purchase failed/cancelled:', err.code, err.message);
    });

    const products = await iap.fetchProducts({ skus: ['com.example.app.coins_100'] });
    console.log(products);
}

async function buyCoins() {
    // Outcome arrives via onPurchaseUpdated/onPurchaseError, not here.
    await iap.requestPurchase({ sku: 'com.example.app.coins_100' });
}
```

### Restore purchases (non-consumables / subscriptions)

```ts
await iap.restorePurchases();
const owned = await iap.getAvailablePurchases();
for (const purchase of owned) {
    // Re-verify server-side before re-granting entitlements.
}
```

See the runnable demo at
[`assets/scene/main.scene`](../../assets/scene/main.scene) /
[`assets/script/test/IapTest.ts`](../../assets/script/test/IapTest.ts) for a
complete working example (list products, buy consumable, buy
non-consumable, restore purchases, on-screen log).

## Troubleshooting

- **Every call rejects with `E_NOT_SUPPORTED`**: you are running in the
  Editor or a Web preview. IAP only works in native Android/iOS builds.
- **`E_TIMEOUT` errors**: the native bridge did not respond within 30
  seconds — check that `enableIAP` was on for the build that produced the
  binary you're testing, and that the native module actually compiled/linked
  (check Xcode/Gradle build logs for `libiap` / `OpenIAP.xcframework`
  errors).
- **Products don't load (empty array)**: confirm the SKUs are configured
  and active in Google Play Console / App Store Connect, that the app's
  bundle id / package name matches, and (Android) that the app is signed
  with a release key matching a Play Console track, or (iOS) that you're
  signed into a Sandbox tester account.
- **Purchases succeed but the item never unlocks**: make sure you call
  `finishTransaction()` after your server verifies the purchase — an
  unfinished transaction will keep replaying `onPurchaseUpdated` on iOS, or
  auto-refund on Android after 3 days if never acknowledged.
- **One-time "script lost" warning on the demo scene**: see the note in the
  root [README](../../../README.md#demo).

## Known Limitations

- No receipt/token verification is performed by this extension — see
  [Server-side verification](#server-side-verification) above.
- Web and Editor preview do not support IAP; all calls resolve/reject with
  `E_NOT_SUPPORTED` where applicable.
- The deprecated Android alternative-billing methods
  (`checkAlternativeBillingAvailabilityAndroid`,
  `showAlternativeBillingDialogAndroid`,
  `createAlternativeBillingTokenAndroid`) are kept for compatibility but
  should not be used in new code — use `isBillingProgramAvailableAndroid`
  instead.
- Mac Catalyst is present as a slice inside `OpenIAP.xcframework` but is not
  a build target exercised by this extension's Cocos build hooks (iOS
  device + simulator only).
