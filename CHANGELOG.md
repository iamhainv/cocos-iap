# Changelog

All notable changes to this extension will be documented in this file.

## 1.0.0 — Initial release

- Initial open-source release of Cocos OpenIAP.
- In-app purchase bridge for Android (Google Play Billing via `openiap-google` 2.2.1)
  and iOS (StoreKit 2 via `OpenIAP.xcframework` 2.2.1).
- `iap.fetchProducts()`, `iap.requestPurchase()`, `iap.finishTransaction()`,
  `iap.restorePurchases()`, `iap.getAvailablePurchases()`,
  `iap.getActiveSubscriptions()` and the full event API
  (`onPurchaseUpdated`, `onPurchaseError`, `onConnected`, `onDisconnected`, etc.).
- Graceful degradation on web/editor preview (`E_NOT_SUPPORTED` rejection instead of a crash).
- Demo scene and runtime-built test UI at `assets/scene/main.scene` / `assets/script/test/IapTest.ts`.
- Build panel options: `enableIAP`, `overwriteLibrary` (Android + iOS).
