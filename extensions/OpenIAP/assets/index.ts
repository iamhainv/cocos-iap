/**
 * OpenIAP — Cocos Creator 3.8.8 barrel export
 *
 * Import via `db://openiap/index` in the game project after the
 * OpenIAP extension is enabled in the Cocos Creator project settings.
 *
 * Quick start:
 *   import { iap } from 'db://openiap/index';
 *
 * Or import specific types:
 *   import { iap, Product, Purchase, ErrorCode } from 'db://openiap/index';
 */

// Public singleton client
export { iap, IapClient } from './IapClient';

// Internal bridge (advanced use — prefer iap for all game code)
export { iapBridge, Bridge } from './core/Bridge';

// All type definitions
export type {
    ActiveSubscription,
    AppTransaction,
    AvailablePurchasesOptions,
    BillingProgramAvailabilityResultAndroid,
    BillingProgramReportingDetailsAndroid,
    DeepLinkOptions,
    DeveloperProvidedBillingDetailsAndroid,
    ExternalPurchaseCustomLinkNoticeResultIOS,
    ExternalPurchaseCustomLinkTokenResultIOS,
    ExternalPurchaseNoticeResultIOS,
    LaunchExternalLinkParamsAndroid,
    Product,
    ProductAndroid,
    ProductCommon,
    ProductIOS,
    ProductRequest,
    PricingPhaseAndroid,
    Purchase,
    PurchaseAndroid,
    PurchaseCommon,
    PurchaseError,
    PurchaseIOS,
    RefundResultIOS,
    RenewalInfoIOS,
    RequestPurchaseProps,
    RequestPurchaseResult,
    SubscriptionOffer,
    SubscriptionOfferSelection,
    SubscriptionStatusIOS,
    UserChoiceBillingDetails,
    VoidResult,
} from './Types';

// All enums and the ProductQueryType union
export {
    AlternativeBillingModeAndroid,
    BillingProgramAndroid,
    DeveloperBillingLaunchModeAndroid,
    DiscountOfferType,
    ErrorCode,
    ExternalLinkLaunchModeAndroid,
    ExternalLinkTypeAndroid,
    ExternalPurchaseCustomLinkNoticeTypeIOS,
    ExternalPurchaseCustomLinkTokenTypeIOS,
    ExternalPurchaseNoticeAction,
    IapEvent,
    IapkitPurchaseState,
    IapPlatform,
    IapStore,
    PaymentMode,
    PaymentModeIOS,
    ProductStatusAndroid,
    ProductType,
    ProductTypeIOS,
    PurchaseState,
    SubResponseCodeAndroid,
    SubscriptionOfferTypeIOS,
    SubscriptionPeriodIOS,
    SubscriptionPeriodUnit,
    SubscriptionReplacementModeAndroid,
    SubscriptionState,
} from './Types';

export type { ProductQueryType } from './Types';
