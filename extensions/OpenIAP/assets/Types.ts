/**
 * OpenIAP — TypeScript type definitions for Cocos Creator 3.8.8
 *
 * Ported from the OpenIAP GDScript types (types.gd), Swift Types.swift, and
 * Kotlin Types.kt. JSON field names match the camelCase keys serialised by the
 * native iOS/Android libraries exactly.
 *
 * Auto-generated source: openiap-main/packages/gql (GraphQL schema)
 * Do NOT alter field names — they must match the wire protocol.
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Wire-format string values for AlternativeBillingModeAndroid.
 * @deprecated Use BillingProgramAndroid with enableBillingProgramAndroid instead.
 */
export enum AlternativeBillingModeAndroid {
    NONE             = 'none',
    USER_CHOICE      = 'user-choice',
    ALTERNATIVE_ONLY = 'alternative-only',
}

/**
 * Billing program types for external content links, external offers, and
 * external payments (Android). Available in Google Play Billing Library 8.2.0+.
 */
export enum BillingProgramAndroid {
    UNSPECIFIED           = 'unspecified',
    USER_CHOICE_BILLING   = 'user-choice-billing',
    EXTERNAL_CONTENT_LINK = 'external-content-link',
    EXTERNAL_OFFER        = 'external-offer',
    EXTERNAL_PAYMENTS     = 'external-payments',
}

/**
 * Launch mode for developer billing option (Android).
 * Available in Google Play Billing Library 8.3.0+.
 */
export enum DeveloperBillingLaunchModeAndroid {
    UNSPECIFIED                        = 'unspecified',
    LAUNCH_IN_EXTERNAL_BROWSER_OR_APP  = 'launch-in-external-browser-or-app',
    CALLER_WILL_LAUNCH_LINK            = 'caller-will-launch-link',
}

/** Discount offer type enumeration. */
export enum DiscountOfferType {
    INTRODUCTORY = 'introductory',
    PROMOTIONAL  = 'promotional',
    ONE_TIME     = 'one-time',
}

/**
 * Full set of IAP error codes, matching the wire-format kebab-case strings
 * returned by the native libraries.
 */
export enum ErrorCode {
    UNKNOWN                             = 'unknown',
    USER_CANCELLED                      = 'user-cancelled',
    USER_ERROR                          = 'user-error',
    ITEM_UNAVAILABLE                    = 'item-unavailable',
    REMOTE_ERROR                        = 'remote-error',
    NETWORK_ERROR                       = 'network-error',
    SERVICE_ERROR                       = 'service-error',
    RECEIPT_FAILED                      = 'receipt-failed',
    RECEIPT_FINISHED                    = 'receipt-finished',
    RECEIPT_FINISHED_FAILED             = 'receipt-finished-failed',
    PURCHASE_VERIFICATION_FAILED        = 'purchase-verification-failed',
    PURCHASE_VERIFICATION_FINISHED      = 'purchase-verification-finished',
    PURCHASE_VERIFICATION_FINISH_FAILED = 'purchase-verification-finish-failed',
    NOT_PREPARED                        = 'not-prepared',
    NOT_ENDED                           = 'not-ended',
    ALREADY_OWNED                       = 'already-owned',
    DEVELOPER_ERROR                     = 'developer-error',
    BILLING_RESPONSE_JSON_PARSE_ERROR   = 'billing-response-json-parse-error',
    DEFERRED_PAYMENT                    = 'deferred-payment',
    INTERRUPTED                         = 'interrupted',
    IAP_NOT_AVAILABLE                   = 'iap-not-available',
    PURCHASE_ERROR                      = 'purchase-error',
    SYNC_ERROR                          = 'sync-error',
    TRANSACTION_VALIDATION_FAILED       = 'transaction-validation-failed',
    ACTIVITY_UNAVAILABLE                = 'activity-unavailable',
    ALREADY_PREPARED                    = 'already-prepared',
    PENDING                             = 'pending',
    CONNECTION_CLOSED                   = 'connection-closed',
    INIT_CONNECTION                     = 'init-connection',
    SERVICE_DISCONNECTED                = 'service-disconnected',
    SERVICE_TIMEOUT                     = 'service-timeout',
    QUERY_PRODUCT                       = 'query-product',
    SKU_NOT_FOUND                       = 'sku-not-found',
    SKU_OFFER_MISMATCH                  = 'sku-offer-mismatch',
    ITEM_NOT_OWNED                      = 'item-not-owned',
    BILLING_UNAVAILABLE                 = 'billing-unavailable',
    FEATURE_NOT_SUPPORTED               = 'feature-not-supported',
    EMPTY_SKU_LIST                      = 'empty-sku-list',
    DUPLICATE_PURCHASE                  = 'duplicate-purchase',
    /** Non-native guard — emitted by the Bridge when the platform is not iOS/Android. */
    E_NOT_SUPPORTED                     = 'E_NOT_SUPPORTED',
    /** Emitted by the Bridge when a native response never arrives within the timeout. */
    E_TIMEOUT                           = 'E_TIMEOUT',
}

/** Launch mode for external link flow (Android). Available in Google Play Billing Library 8.2.0+. */
export enum ExternalLinkLaunchModeAndroid {
    UNSPECIFIED                       = 'unspecified',
    LAUNCH_IN_EXTERNAL_BROWSER_OR_APP = 'launch-in-external-browser-or-app',
    CALLER_WILL_LAUNCH_LINK           = 'caller-will-launch-link',
}

/** Link type for external link flow (Android). Available in Google Play Billing Library 8.2.0+. */
export enum ExternalLinkTypeAndroid {
    UNSPECIFIED                 = 'unspecified',
    LINK_TO_DIGITAL_CONTENT_OFFER = 'link-to-digital-content-offer',
    LINK_TO_APP_DOWNLOAD          = 'link-to-app-download',
}

/**
 * Notice types for ExternalPurchaseCustomLink (iOS 18.1+).
 * Reference: https://developer.apple.com/documentation/storekit/externalpurchasecustomlink/noticetype
 */
export enum ExternalPurchaseCustomLinkNoticeTypeIOS {
    BROWSER = 'browser',
}

/**
 * Token types for ExternalPurchaseCustomLink (iOS 18.1+).
 * Reference: https://developer.apple.com/documentation/storekit/externalpurchasecustomlink/token(for:)
 */
export enum ExternalPurchaseCustomLinkTokenTypeIOS {
    ACQUISITION = 'acquisition',
    SERVICES    = 'services',
}

/** User actions on external purchase notice sheet (iOS 17.4+). */
export enum ExternalPurchaseNoticeAction {
    CONTINUE  = 'continue',
    DISMISSED = 'dismissed',
}

/** IAP event names emitted from the native side. */
export enum IapEvent {
    PURCHASE_UPDATED                 = 'purchaseUpdated',
    PURCHASE_ERROR                   = 'purchaseError',
    PROMOTED_PRODUCT_IOS             = 'promotedProductIOS',
    USER_CHOICE_BILLING_ANDROID      = 'userChoiceBillingAndroid',
    DEVELOPER_PROVIDED_BILLING_ANDROID = 'developerProvidedBillingAndroid',
    SUBSCRIPTION_BILLING_ISSUE       = 'subscriptionBillingIssue',
    CONNECTED                        = 'connected',
    DISCONNECTED                     = 'disconnected',
}

/** Unified purchase states from IAPKit verification response. */
export enum IapkitPurchaseState {
    ENTITLED              = 'entitled',
    PENDING_ACKNOWLEDGMENT = 'pending-acknowledgment',
    PENDING               = 'pending',
    CANCELED              = 'canceled',
    EXPIRED               = 'expired',
    READY_TO_CONSUME      = 'ready-to-consume',
    CONSUMED              = 'consumed',
    UNKNOWN               = 'unknown',
    INAUTHENTIC           = 'inauthentic',
}

/** IAP platform identifier. */
export enum IapPlatform {
    IOS     = 'ios',
    ANDROID = 'android',
}

/** IAP store identifier. */
export enum IapStore {
    UNKNOWN = 'unknown',
    APPLE   = 'apple',
    GOOGLE  = 'google',
    HORIZON = 'horizon',
}

/** Payment mode for subscription offers. */
export enum PaymentMode {
    FREE_TRIAL   = 'free-trial',
    PAY_AS_YOU_GO = 'pay-as-you-go',
    PAY_UP_FRONT  = 'pay-up-front',
    UNKNOWN       = 'unknown',
}

/** iOS-specific payment mode. */
export enum PaymentModeIOS {
    EMPTY        = 'empty',
    FREE_TRIAL   = 'free-trial',
    PAY_AS_YOU_GO = 'pay-as-you-go',
    PAY_UP_FRONT  = 'pay-up-front',
}

/** Product query filter type. */
export type ProductQueryType = 'in-app' | 'subs' | 'all';

/**
 * Status code for individual products returned from queryProductDetailsAsync (Android).
 * Available in Google Play Billing Library 8.0.0+.
 */
export enum ProductStatusAndroid {
    OK                = 'ok',
    NOT_FOUND         = 'not-found',
    NO_OFFERS_AVAILABLE = 'no-offers-available',
    UNKNOWN           = 'unknown',
}

/** Product type identifier. */
export enum ProductType {
    IN_APP = 'in-app',
    SUBS   = 'subs',
}

/** iOS product type identifier. */
export enum ProductTypeIOS {
    CONSUMABLE               = 'consumable',
    NON_CONSUMABLE           = 'non-consumable',
    AUTO_RENEWABLE_SUBSCRIPTION = 'auto-renewable-subscription',
    NON_RENEWING_SUBSCRIPTION   = 'non-renewing-subscription',
}

/** Purchase state values. */
export enum PurchaseState {
    PENDING   = 'pending',
    PURCHASED = 'purchased',
    UNKNOWN   = 'unknown',
}

/** Sub-response codes for more granular purchase error information (Android). Available in 8.0.0+. */
export enum SubResponseCodeAndroid {
    NO_APPLICABLE_SUB_RESPONSE_CODE                   = 'no-applicable-sub-response-code',
    PAYMENT_DECLINED_DUE_TO_INSUFFICIENT_FUNDS        = 'payment-declined-due-to-insufficient-funds',
    USER_INELIGIBLE                                   = 'user-ineligible',
}

/** iOS subscription offer types. */
export enum SubscriptionOfferTypeIOS {
    INTRODUCTORY = 'introductory',
    PROMOTIONAL  = 'promotional',
    WIN_BACK     = 'win-back',
}

/** iOS subscription period units. */
export enum SubscriptionPeriodIOS {
    DAY   = 'day',
    WEEK  = 'week',
    MONTH = 'month',
    YEAR  = 'year',
    EMPTY = 'empty',
}

/** Cross-platform subscription period unit. */
export enum SubscriptionPeriodUnit {
    DAY     = 'day',
    WEEK    = 'week',
    MONTH   = 'month',
    YEAR    = 'year',
    UNKNOWN = 'unknown',
}

/** Replacement mode for subscription changes (Android). Available in 8.1.0+. */
export enum SubscriptionReplacementModeAndroid {
    UNKNOWN_REPLACEMENT_MODE = 'unknown-replacement-mode',
    WITH_TIME_PRORATION       = 'with-time-proration',
    CHARGE_PRORATED_PRICE     = 'charge-prorated-price',
    CHARGE_FULL_PRICE         = 'charge-full-price',
    WITHOUT_PRORATION         = 'without-proration',
    DEFERRED                  = 'deferred',
    KEEP_EXISTING             = 'keep-existing',
}

/** Subscription state values. */
export enum SubscriptionState {
    ACTIVE           = 'active',
    IN_GRACE_PERIOD  = 'in-grace-period',
    IN_BILLING_RETRY = 'in-billing-retry',
    EXPIRED          = 'expired',
    REVOKED          = 'revoked',
    REFUNDED         = 'refunded',
    PAUSED           = 'paused',
    UNKNOWN          = 'unknown',
}

// ============================================================================
// Shared result / error types
// ============================================================================

/** Represents a purchase error payload as received from the native side. */
export interface PurchaseError {
    /** Kebab-case error code string matching the ErrorCode enum. */
    code: string;
    /** Human-readable error message. */
    message: string;
    /** Optional developer-facing debug detail (Android BillingResult.debugMessage). */
    debugMessage?: string;
    /** Raw integer response code from the platform billing library. */
    responseCode?: number;
    /** Product ID associated with the error, if available. */
    productId?: string;
}

/** Generic void result for operations that succeed or fail without a data payload. */
export interface VoidResult {
    success: boolean;
    error?: string;
}

// ============================================================================
// Pricing & Subscription Offer types
// ============================================================================

/** A single billing phase within an Android subscription offer. */
export interface PricingPhaseAndroid {
    /** Price in micro-units (1,000,000 = 1 unit of currency). String to avoid integer overflow. */
    priceAmountMicros: string;
    /** ISO 4217 currency code (e.g., "USD"). */
    priceCurrencyCode: string;
    /** Formatted price string with currency sign (e.g., "$9.99"). */
    formattedPrice: string;
    /** ISO 8601 billing period (e.g., "P1M" = 1 month). */
    billingPeriod: string;
    /** Number of billing cycles this phase lasts; 0 = infinite. */
    billingCycleCount: number;
    /** Payment mode for this phase. */
    recurrenceMode: number;
}

/** An Android subscription offer token + set of pricing phases. */
export interface SubscriptionOffer {
    /** Offer token required when requesting a subscription purchase. */
    offerToken: string;
    /** Base plan ID this offer belongs to. */
    basePlanId: string;
    /** Optional offer ID for promotional/introductory offers. */
    offerId?: string;
    /** Tags associated with this offer. */
    offerTags: string[];
    /** Ordered list of pricing phases that make up this offer. */
    pricingPhases: PricingPhaseAndroid[];
}

// ============================================================================
// Product types
// ============================================================================

/** Fields common to all platforms for a fetchable product. */
export interface ProductCommon {
    /** Product identifier (SKU). */
    productId: string;
    /** Localised display title. */
    title: string;
    /** Localised product description. */
    description: string;
    /** Formatted price string including currency symbol (e.g., "$9.99"). */
    price: string;
    /** Price in micro-units as a string to avoid integer overflow. */
    priceAmountMicros?: string;
    /** ISO 4217 currency code. */
    currency: string;
    /** Product type ('in-app' or 'subs'). */
    type: string;
    /** Store platform the product came from. */
    platform: IapPlatform;
}

/** Android-specific product fields from the Google Play Billing Library. */
export interface ProductAndroid extends ProductCommon {
    /** Subscription offer details. Only present for subscription products. */
    subscriptionOfferDetails?: SubscriptionOffer[];
    /** One-time purchase offer token (for consumables / non-consumables). */
    oneTimePurchaseOfferDetails?: {
        priceAmountMicros: string;
        priceCurrencyCode: string;
        formattedPrice: string;
        offerIdToken?: string;
    };
    /** Product status code (Google Play Billing 8.0+). */
    productStatus?: ProductStatusAndroid;
}

/** iOS-specific product fields from StoreKit 2. */
export interface ProductIOS extends ProductCommon {
    /** iOS product type (consumable, non-consumable, subscription). */
    productType?: ProductTypeIOS;
    /** Subscription period string (e.g., "P1M"). */
    subscriptionPeriod?: string;
    /** Introductory offer details, if available. */
    introductoryPrice?: {
        price: string;
        priceAmountMicros: string;
        subscriptionPeriod: string;
        numberOfPeriods: number;
        paymentMode: PaymentModeIOS;
    };
    /** Subscription group identifier. */
    subscriptionGroupIdentifier?: string;
    /** JSON representation of the StoreKit 2 product for advanced use. */
    jsonRepresentation?: string;
}

/** Union of Android and iOS product types, discriminated by `platform`. */
export type Product = ProductAndroid | ProductIOS;

// ============================================================================
// Purchase types
// ============================================================================

/** Fields common to all platforms for a purchase record. */
export interface PurchaseCommon {
    /** Product identifier (SKU). */
    productId: string;
    /** Transaction identifier. */
    transactionId: string;
    /** Transaction date in milliseconds since epoch. */
    transactionDate: number;
    /** Platform this purchase came from. */
    platform: IapPlatform;
}

/** Android-specific purchase fields from the Google Play Billing Library. */
export interface PurchaseAndroid extends PurchaseCommon {
    /** Google Play purchase token used for acknowledgement and consumption. */
    purchaseToken: string;
    /** Raw JSON order data from the Play Store. */
    dataAndroid?: string;
    /** Signature for the order data. */
    signatureAndroid?: string;
    /** Whether the purchase has been acknowledged. */
    isAcknowledgedAndroid?: boolean;
    /** Whether auto-renewing (for subscriptions). */
    autoRenewingAndroid?: boolean;
    /** Purchase state. */
    purchaseState?: PurchaseState;
    /** Account identifiers for fraud detection. */
    obfuscatedAccountIdAndroid?: string;
    /** Profile identifiers for fraud detection. */
    obfuscatedProfileIdAndroid?: string;
    /** Quantity purchased. */
    quantity?: number;
}

/** iOS-specific purchase fields from StoreKit 2. */
export interface PurchaseIOS extends PurchaseCommon {
    /** App-provided UUID linking the purchase to an account. */
    appAccountToken?: string;
    /** JWS transaction string for server-side verification. */
    transactionReceipt?: string;
    /** Original transaction identifier (for subscriptions). */
    originalTransactionDateIOS?: number;
    /** Original transaction date in milliseconds. */
    originalTransactionIdentifierIOS?: string;
    /** Whether the transaction has been verified by StoreKit 2. */
    verifiedIOS?: boolean;
    /** JSON representation of the StoreKit 2 transaction. */
    jsonRepresentation?: string;
    /** Quantity purchased (default 1). */
    quantity?: number;
}

/** Union of Android and iOS purchase types, discriminated by `platform`. */
export type Purchase = PurchaseAndroid | PurchaseIOS;

// ============================================================================
// Active subscription
// ============================================================================

/** iOS renewal info from StoreKit 2. */
export interface RenewalInfoIOS {
    autoRenewProductId?: string;
    autoRenewStatus?: number;
    expirationReason?: string;
    gracePeriodExpiresDate?: number;
    isInBillingRetryPeriod?: boolean;
    offerIdentifier?: string;
    offerType?: number;
    originalTransactionId?: string;
    priceIncreaseStatus?: number;
    productId?: string;
    recentSubscriptionStartDate?: number;
    renewalDate?: number;
    environment?: string;
    jsonRepresentation?: string;
}

/**
 * Represents an active subscription returned by getActiveSubscriptions.
 * Both platform-specific and unified fields are included.
 */
export interface ActiveSubscription {
    /** Product identifier (SKU). */
    productId: string;
    /** Whether the subscription is currently active. */
    isActive: boolean;
    /** [iOS] Expiration date in milliseconds since epoch, if available. */
    expirationDateIOS?: number;
    /** [Android] Whether the subscription is set to auto-renew. */
    autoRenewingAndroid?: boolean;
    /** [iOS] Environment ("Production" or "Sandbox"). */
    environmentIOS?: string;
    /** @deprecated iOS only — use daysUntilExpirationIOS instead. */
    willExpireSoon?: boolean;
    /** [iOS] Days until the subscription expires. */
    daysUntilExpirationIOS?: number;
    /** Transaction identifier. */
    transactionId: string;
    /** [Android] Purchase token for upgrade/downgrade flows. */
    purchaseToken?: string;
    /** Transaction date in milliseconds since epoch. */
    transactionDate: number;
    /** [Android] Base plan identifier. */
    basePlanIdAndroid?: string;
    /** [Android] Purchase token — required for subscription upgrade/downgrade. */
    purchaseTokenAndroid?: string;
    /** Current plan identifier (cross-platform). */
    currentPlanId?: string;
    /** [iOS] StoreKit 2 renewal info. */
    renewalInfoIOS?: RenewalInfoIOS;
}

// ============================================================================
// Request types
// ============================================================================

/** Product fetch request sent to fetchProducts. */
export interface ProductRequest {
    /** List of product SKUs to fetch. */
    skus: string[];
    /** Filter by product type. Defaults to 'in-app'. */
    type?: ProductQueryType;
}

/** Android subscription offer selection for a purchase. */
export interface SubscriptionOfferSelection {
    /** SKU of the base plan. */
    sku: string;
    /** Offer token from SubscriptionOffer.offerToken. */
    offerToken: string;
}

/** Props for requestPurchase. */
export interface RequestPurchaseProps {
    /** [iOS] Product SKU to purchase. */
    sku?: string;
    /** [iOS] App-provided UUID to associate with the transaction. */
    appAccountToken?: string;
    /** [iOS] Quantity to purchase (default 1). */
    quantity?: number;
    /** [Android] List of SKUs to purchase. */
    skus?: string[];
    /** [Android] Subscription offers with offerToken, required for subscription purchases. */
    subscriptionOffers?: SubscriptionOfferSelection[];
    /** [Android] Obfuscated account ID for fraud prevention. */
    obfuscatedAccountIdAndroid?: string;
    /** [Android] Obfuscated profile ID for fraud prevention. */
    obfuscatedProfileIdAndroid?: string;
    /** [Android] Whether the price is personalised. */
    isOfferPersonalized?: boolean;
    /** [Android] Purchase token of an existing subscription to upgrade/downgrade. */
    purchaseTokenAndroid?: string;
    /** [Android] Replacement mode for subscription changes. */
    replacementModeAndroid?: SubscriptionReplacementModeAndroid;
}

/** Result payload returned by requestPurchase (not the actual purchase outcome). */
export interface RequestPurchaseResult {
    success: boolean;
    /** True if the purchase dialog was launched (Android async path). */
    pending?: boolean;
    error?: string;
}

/** Options for getAvailablePurchases. */
export interface AvailablePurchasesOptions {
    /** [iOS] Also deliver existing transactions to the purchaseUpdated listener. */
    alsoPublishToEventListenerIOS?: boolean;
    /** [iOS] Return only items that have not expired or been consumed. */
    onlyIncludeActiveItemsIOS?: boolean;
}

/** Deep link options for deepLinkToSubscriptions. */
export interface DeepLinkOptions {
    /** [Android] SKU to link to in the Play Store. */
    skuAndroid?: string;
    /** [Android] Package name for the Play Store deep link. */
    packageNameAndroid?: string;
    /** [iOS] URL to open if the system cannot deep-link automatically. */
    urlIOS?: string;
}

/** Parameters for launchExternalLinkAndroid (Google Play Billing 8.2.0+). */
export interface LaunchExternalLinkParamsAndroid {
    /** External URL to launch. */
    url: string;
    /** Type of external link destination. */
    linkType: ExternalLinkTypeAndroid;
    /** How to launch the link. */
    launchMode: ExternalLinkLaunchModeAndroid;
}

// ============================================================================
// iOS-specific result types
// ============================================================================

/** Result of beginRefundRequestIOS. */
export interface RefundResultIOS {
    success: boolean;
    status?: string;
    error?: string;
}

/** iOS subscription status entry. */
export interface SubscriptionStatusIOS {
    productId: string;
    subscriptionState: SubscriptionState;
    transactionId: string;
    renewalInfo?: RenewalInfoIOS;
    jsonRepresentation?: string;
}

/** Result of showExternalPurchaseCustomLinkNoticeIOS. */
export interface ExternalPurchaseCustomLinkNoticeResultIOS {
    continued: boolean;
    error?: string;
}

/** Result of getExternalPurchaseCustomLinkTokenIOS. */
export interface ExternalPurchaseCustomLinkTokenResultIOS {
    token?: string;
    error?: string;
}

/** Result of presentExternalPurchaseNoticeSheetIOS. */
export interface ExternalPurchaseNoticeResultIOS {
    result: ExternalPurchaseNoticeAction;
    error?: string;
    externalPurchaseToken?: string;
}

/** App transaction data (iOS 16+). */
export interface AppTransaction {
    bundleId: string;
    appVersion: string;
    originalAppVersion: string;
    originalPurchaseDate: number;
    deviceVerification: string;
    deviceVerificationNonce: string;
    environment: string;
    signedDate: number;
    appId: number;
    appVersionId: number;
    preorderDate?: number;
    appTransactionId?: string;
    originalPlatform?: string;
}

// ============================================================================
// Android-specific result types
// ============================================================================

/** Billing program availability result (Android 8.2.0+). */
export interface BillingProgramAvailabilityResultAndroid {
    isAvailable: boolean;
    billingProgram: BillingProgramAndroid;
}

/** Billing program reporting details (Android 8.2.0+). */
export interface BillingProgramReportingDetailsAndroid {
    billingProgram: BillingProgramAndroid;
    externalTransactionToken: string;
}

/** User-choice billing details returned to the event listener. */
export interface UserChoiceBillingDetails {
    externalTransactionToken: string;
}

/** Details provided when user selects the developer-provided billing option (Android 8.3.0+). */
export interface DeveloperProvidedBillingDetailsAndroid {
    externalTransactionToken: string;
}
