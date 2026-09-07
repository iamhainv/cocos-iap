/**
 * OpenIAP IapClient — Cocos Creator 3.8.8
 *
 * Public API for In-App Purchases on iOS (StoreKit 2) and Android
 * (Google Play Billing Library). All methods are async and delegate to the
 * native side via iapBridge.call().
 *
 * IMPORTANT — Purchase outcome is event-based, not return-value-based.
 * Call requestPurchase() to launch the purchase UI, then listen to:
 *   iap.onPurchaseUpdated(cb)  — called on successful purchase
 *   iap.onPurchaseError(cb)    — called on failure or cancellation
 * The return value of requestPurchase() only indicates that the purchase
 * dialog was launched; it does NOT carry the purchase outcome.
 *
 * Usage:
 *   import { iap } from 'db://openiap/IapClient';
 *   await iap.initConnection();
 *   const products = await iap.fetchProducts({ skus: ['com.app.coins'] });
 *   iap.onPurchaseUpdated((p) => { ... });
 *   await iap.requestPurchase({ sku: 'com.app.coins' });
 *
 * See: https://openiap.dev/docs/apis
 */

import { sys } from 'cc';
import { iapBridge } from './core/Bridge';
import {
    ActiveSubscription,
    AppTransaction,
    AvailablePurchasesOptions,
    BillingProgramAndroid,
    BillingProgramAvailabilityResultAndroid,
    BillingProgramReportingDetailsAndroid,
    DeepLinkOptions,
    DeveloperProvidedBillingDetailsAndroid,
    ExternalPurchaseCustomLinkNoticeResultIOS,
    ExternalPurchaseCustomLinkNoticeTypeIOS,
    ExternalPurchaseCustomLinkTokenResultIOS,
    ExternalPurchaseCustomLinkTokenTypeIOS,
    ExternalPurchaseNoticeResultIOS,
    IapEvent,
    LaunchExternalLinkParamsAndroid,
    Product,
    ProductRequest,
    Purchase,
    PurchaseError,
    RefundResultIOS,
    RequestPurchaseProps,
    RequestPurchaseResult,
    SubscriptionStatusIOS,
    UserChoiceBillingDetails,
    VoidResult,
} from './Types';

// ---------------------------------------------------------------------------
// Helper — typed event callback
// ---------------------------------------------------------------------------

type _EventCallback<T> = (payload: T) => void;

// ---------------------------------------------------------------------------
// IapClient
// ---------------------------------------------------------------------------

/**
 * Cross-platform IAP client.
 *
 * Obtain the singleton via the exported `iap` constant. Do not instantiate
 * directly.
 */
export class IapClient {

    // ------------------------------------------------------------------
    // Internal event subscription helpers
    // ------------------------------------------------------------------

    private _subscribe<T>(event: IapEvent, cb: _EventCallback<T>): void {
        iapBridge.on(event, cb as (p: unknown) => void);
    }

    private _unsubscribe<T>(event: IapEvent, cb: _EventCallback<T>): void {
        iapBridge.off(event, cb as (p: unknown) => void);
    }

    // ==================================================================
    // Connection
    // ==================================================================

    /**
     * Initialise the store billing client.
     *
     * Must be called once before any other IAP API. Resolves true when the
     * billing client is connected and ready.
     *
     * See: https://openiap.dev/docs/apis/init-connection
     */
    public initConnection(): Promise<boolean> {
        return iapBridge.call<boolean>('initConnection', {});
    }

    /**
     * Disconnect from the billing client and release resources.
     *
     * See: https://openiap.dev/docs/apis/end-connection
     */
    public endConnection(): Promise<boolean> {
        return iapBridge.call<boolean>('endConnection', {});
    }

    // ==================================================================
    // Products
    // ==================================================================

    /**
     * Fetch product details for a list of SKUs.
     *
     * Returns a platform-typed Product array. On Android the elements are
     * ProductAndroid; on iOS they are ProductIOS.
     *
     * @param request  SKU list and optional type filter.
     *
     * See: https://openiap.dev/docs/apis/fetch-products
     */
    public fetchProducts(request: ProductRequest): Promise<Product[]> {
        return iapBridge.call<Product[]>('fetchProducts', request);
    }

    // ==================================================================
    // Purchases
    // ==================================================================

    /**
     * Launch the platform purchase UI.
     *
     * The purchase OUTCOME is delivered asynchronously via the
     * `purchaseUpdated` / `purchaseError` events. Register handlers with
     * `onPurchaseUpdated` / `onPurchaseError` BEFORE calling this method.
     *
     * On Android the dialog is launched asynchronously; the returned
     * RequestPurchaseResult.pending will be true.
     * On iOS the call resolves once the UI is dismissed.
     *
     * @param props  Purchase request properties including SKU(s) and
     *               platform-specific options.
     *
     * See: https://openiap.dev/docs/apis/request-purchase
     */
    public requestPurchase(props: RequestPurchaseProps): Promise<RequestPurchaseResult> {
        return iapBridge.call<RequestPurchaseResult>('requestPurchase', props);
    }

    /**
     * Finalise a completed transaction.
     *
     * Must be called after a successful purchase (from the purchaseUpdated
     * event) to unlock the product and avoid auto-refund (Android requires
     * acknowledgement within 3 days; iOS unfinished transactions replay on
     * every launch).
     *
     * @param purchase      The Purchase received from onPurchaseUpdated.
     * @param isConsumable  Pass true for consumable items (coins, lives, etc.).
     *
     * See: https://openiap.dev/docs/apis/finish-transaction
     */
    public finishTransaction(purchase: Purchase, isConsumable: boolean = false): Promise<VoidResult> {
        return iapBridge.call<VoidResult>('finishTransaction', { purchase, isConsumable });
    }

    /**
     * Restore previously completed transactions.
     *
     * iOS performs a lightweight sync then returns available purchases.
     * Android returns currently owned purchases.
     *
     * See: https://openiap.dev/docs/apis/restore-purchases
     */
    public restorePurchases(): Promise<void> {
        return iapBridge.call<void>('restorePurchases', {});
    }

    /**
     * Return all current unfinished purchases (non-consumables, active
     * subscriptions, unacknowledged transactions).
     *
     * @param options  Optional iOS-specific flags.
     *
     * See: https://openiap.dev/docs/apis/get-available-purchases
     */
    public getAvailablePurchases(options?: AvailablePurchasesOptions): Promise<Purchase[]> {
        return iapBridge.call<Purchase[]>('getAvailablePurchases', options ?? {});
    }

    // ==================================================================
    // Subscriptions
    // ==================================================================

    /**
     * Return active subscriptions, optionally filtered by subscription IDs.
     *
     * @param subscriptionIds  SKU list to filter; pass an empty array for all.
     *
     * See: https://openiap.dev/docs/apis/get-active-subscriptions
     */
    public getActiveSubscriptions(subscriptionIds: string[] = []): Promise<ActiveSubscription[]> {
        return iapBridge.call<ActiveSubscription[]>('getActiveSubscriptions', { subscriptionIds });
    }

    /**
     * Check whether the user has at least one active subscription.
     *
     * @param subscriptionIds  Optional SKU list to filter.
     *
     * See: https://openiap.dev/docs/apis/has-active-subscriptions
     */
    public hasActiveSubscriptions(subscriptionIds: string[] = []): Promise<boolean> {
        return iapBridge.call<boolean>('hasActiveSubscriptions', { subscriptionIds });
    }

    // ==================================================================
    // Storefront & Platform
    // ==================================================================

    /**
     * Return the ISO 3166-1 alpha-2 storefront country code (e.g., "US").
     *
     * See: https://openiap.dev/docs/apis/get-storefront
     */
    public getStorefront(): Promise<string> {
        return iapBridge.call<string>('getStorefront', {});
    }

    /**
     * Return the current platform as a string.
     *
     * Uses Cocos `sys.platform` — does not require a native bridge call.
     *
     * @returns 'ios' | 'android' | 'unknown'
     */
    public getPlatform(): 'ios' | 'android' | 'unknown' {
        if (sys.os === sys.OS.IOS) { return 'ios'; }
        if (sys.os === sys.OS.ANDROID) { return 'android'; }
        return 'unknown';
    }

    /**
     * Open the platform subscription management screen.
     *
     * @param options  Optional deep-link configuration (Android package name /
     *                 SKU; iOS URL fallback).
     *
     * See: https://openiap.dev/docs/apis/deep-link-to-subscriptions
     */
    public deepLinkToSubscriptions(options?: DeepLinkOptions): Promise<void> {
        return iapBridge.call<void>('deepLinkToSubscriptions', options ?? {});
    }

    // ==================================================================
    // Android-specific
    // ==================================================================

    /**
     * Acknowledge a non-consumable purchase (Android only).
     *
     * Use `finishTransaction` for cross-platform acknowledgement; this method
     * is provided for cases where you need explicit control.
     *
     * @param purchaseToken  Google Play purchase token.
     *
     * See: https://openiap.dev/docs/apis/android/acknowledge-purchase-android
     */
    public acknowledgePurchaseAndroid(purchaseToken: string): Promise<VoidResult> {
        return iapBridge.call<VoidResult>('acknowledgePurchaseAndroid', { purchaseToken });
    }

    /**
     * Consume a consumable purchase (Android only).
     *
     * @param purchaseToken  Google Play purchase token.
     *
     * See: https://openiap.dev/docs/apis/android/consume-purchase-android
     */
    public consumePurchaseAndroid(purchaseToken: string): Promise<VoidResult> {
        return iapBridge.call<VoidResult>('consumePurchaseAndroid', { purchaseToken });
    }

    /**
     * Check alternative billing availability (Android 8.2.0+).
     *
     * @deprecated Use isBillingProgramAvailableAndroid with
     *   BillingProgramAndroid.USER_CHOICE_BILLING instead.
     *
     * See: https://openiap.dev/docs/apis/android/check-alternative-billing-availability-android
     */
    public checkAlternativeBillingAvailabilityAndroid(): Promise<BillingProgramAvailabilityResultAndroid> {
        return iapBridge.call<BillingProgramAvailabilityResultAndroid>(
            'checkAlternativeBillingAvailabilityAndroid', {});
    }

    /**
     * Show the alternative billing choice dialog (Android).
     *
     * @deprecated Use the BillingProgramAndroid APIs instead.
     *
     * See: https://openiap.dev/docs/apis/android/show-alternative-billing-dialog-android
     */
    public showAlternativeBillingDialogAndroid(): Promise<UserChoiceBillingDetails> {
        return iapBridge.call<UserChoiceBillingDetails>('showAlternativeBillingDialogAndroid', {});
    }

    /**
     * Create an alternative billing reporting token (Android).
     *
     * @deprecated Use createBillingProgramReportingDetailsAndroid instead.
     *
     * See: https://openiap.dev/docs/apis/android/create-alternative-billing-token-android
     */
    public createAlternativeBillingTokenAndroid(): Promise<BillingProgramReportingDetailsAndroid> {
        return iapBridge.call<BillingProgramReportingDetailsAndroid>(
            'createAlternativeBillingTokenAndroid', {});
    }

    /**
     * Check whether a specific billing program is available (Android 8.2.0+).
     *
     * @param program  The billing program to check.
     *
     * See: https://openiap.dev/docs/apis/android/is-billing-program-available-android
     */
    public isBillingProgramAvailableAndroid(
        program: BillingProgramAndroid,
    ): Promise<BillingProgramAvailabilityResultAndroid> {
        return iapBridge.call<BillingProgramAvailabilityResultAndroid>(
            'isBillingProgramAvailableAndroid', { billingProgram: program });
    }

    /**
     * Launch an external link via Google Play (Android 8.2.0+).
     *
     * @param params  URL, link type, and launch mode.
     *
     * See: https://openiap.dev/docs/apis/android/launch-external-link-android
     */
    public launchExternalLinkAndroid(params: LaunchExternalLinkParamsAndroid): Promise<VoidResult> {
        return iapBridge.call<VoidResult>('launchExternalLinkAndroid', params);
    }

    /**
     * Return the Android package name of the running app.
     *
     * See: https://openiap.dev/docs/apis/android/get-package-name-android
     */
    public getPackageNameAndroid(): Promise<string> {
        return iapBridge.call<string>('getPackageNameAndroid', {});
    }

    // ==================================================================
    // iOS-specific
    // ==================================================================

    /**
     * Sync pending App Store transactions (iOS only).
     *
     * See: https://openiap.dev/docs/apis/ios/sync-ios
     */
    public syncIOS(): Promise<VoidResult> {
        return iapBridge.call<VoidResult>('syncIOS', {});
    }

    /**
     * Clear pending transactions from the StoreKit payment queue (iOS only).
     *
     * See: https://openiap.dev/docs/apis/ios/clear-transaction-ios
     */
    public clearTransactionIOS(): Promise<VoidResult> {
        return iapBridge.call<VoidResult>('clearTransactionIOS', {});
    }

    /**
     * Return pending (unfinished) transactions (iOS only).
     *
     * See: https://openiap.dev/docs/apis/ios/get-pending-transactions-ios
     */
    public getPendingTransactionsIOS(): Promise<Purchase[]> {
        return iapBridge.call<Purchase[]>('getPendingTransactionsIOS', {});
    }

    /**
     * Return the App Store receipt data as a base64-encoded string (iOS only).
     *
     * See: https://openiap.dev/docs/apis/ios/get-receipt-data-ios
     */
    public getReceiptDataIOS(): Promise<string> {
        return iapBridge.call<string>('getReceiptDataIOS', {});
    }

    /**
     * Check whether the StoreKit 2 transaction for a SKU is verified (iOS only).
     *
     * @param sku  Product identifier.
     *
     * See: https://openiap.dev/docs/apis/ios/is-transaction-verified-ios
     */
    public isTransactionVerifiedIOS(sku: string): Promise<boolean> {
        return iapBridge.call<boolean>('isTransactionVerifiedIOS', { sku });
    }

    /**
     * Return the JWS representation of a StoreKit 2 transaction (iOS only).
     *
     * @param sku  Product identifier.
     *
     * See: https://openiap.dev/docs/apis/ios/get-transaction-jws-ios
     */
    public getTransactionJwsIOS(sku: string): Promise<string> {
        return iapBridge.call<string>('getTransactionJwsIOS', { sku });
    }

    /**
     * Request a refund for a purchase (iOS only).
     *
     * @param sku  Product identifier to request refund for.
     *
     * See: https://openiap.dev/docs/apis/ios/begin-refund-request-ios
     */
    public beginRefundRequestIOS(sku: string): Promise<RefundResultIOS> {
        return iapBridge.call<RefundResultIOS>('beginRefundRequestIOS', { sku });
    }

    /**
     * Return the subscription status entries for a product (iOS only).
     *
     * @param sku  Product identifier.
     *
     * See: https://openiap.dev/docs/apis/ios/subscription-status-ios
     */
    public subscriptionStatusIOS(sku: string): Promise<SubscriptionStatusIOS[]> {
        return iapBridge.call<SubscriptionStatusIOS[]>('subscriptionStatusIOS', { sku });
    }

    /**
     * Return the current entitlement transaction for a product (iOS only).
     *
     * @param sku  Product identifier.
     *
     * See: https://openiap.dev/docs/apis/ios/current-entitlement-ios
     */
    public currentEntitlementIOS(sku: string): Promise<Purchase | null> {
        return iapBridge.call<Purchase | null>('currentEntitlementIOS', { sku });
    }

    /**
     * Check whether the user is eligible for an introductory offer (iOS only).
     *
     * @param groupId  Subscription group identifier.
     *
     * See: https://openiap.dev/docs/apis/ios/is-eligible-for-intro-offer-ios
     */
    public isEligibleForIntroOfferIOS(groupId: string): Promise<boolean> {
        return iapBridge.call<boolean>('isEligibleForIntroOfferIOS', { groupId });
    }

    /**
     * Show the code redemption sheet (iOS only).
     *
     * See: https://openiap.dev/docs/apis/ios/present-code-redemption-sheet-ios
     */
    public presentCodeRedemptionSheetIOS(): Promise<VoidResult> {
        return iapBridge.call<VoidResult>('presentCodeRedemptionSheetIOS', {});
    }

    /**
     * Open the manage-subscriptions UI (iOS only).
     *
     * See: https://openiap.dev/docs/apis/ios/show-manage-subscriptions-ios
     */
    public showManageSubscriptionsIOS(): Promise<Purchase[]> {
        return iapBridge.call<Purchase[]>('showManageSubscriptionsIOS', {});
    }

    /**
     * Return the verified App Transaction for the running app (iOS 16+).
     *
     * See: https://openiap.dev/docs/apis/ios/get-app-transaction-ios
     */
    public getAppTransactionIOS(): Promise<AppTransaction | null> {
        return iapBridge.call<AppTransaction | null>('getAppTransactionIOS', {});
    }

    /**
     * Return the promoted product currently queued by the App Store (iOS only).
     *
     * The promoted product flow is initiated by the App Store, not the app.
     * When the `promotedProductIOS` event fires, call this to get the product,
     * then decide whether to proceed with the purchase.
     *
     * See: https://openiap.dev/docs/apis/ios/get-promoted-product-ios
     */
    public getPromotedProductIOS(): Promise<Product | null> {
        return iapBridge.call<Product | null>('getPromotedProductIOS', {});
    }

    /**
     * Check whether an external purchase custom link can be shown (iOS 18.1+).
     *
     * See: https://openiap.dev/docs/apis/ios/is-eligible-for-external-purchase-custom-link-ios
     */
    public canPresentExternalPurchaseNoticeIOS(): Promise<boolean> {
        return iapBridge.call<boolean>('canPresentExternalPurchaseNoticeIOS', {});
    }

    /**
     * Present the external purchase notice sheet (iOS 18.2+).
     *
     * See: https://openiap.dev/docs/apis/ios/present-external-purchase-notice-sheet-ios
     */
    public presentExternalPurchaseNoticeSheetIOS(): Promise<ExternalPurchaseNoticeResultIOS> {
        return iapBridge.call<ExternalPurchaseNoticeResultIOS>(
            'presentExternalPurchaseNoticeSheetIOS', {});
    }

    /**
     * Check ExternalPurchaseCustomLink eligibility (iOS 18.1+).
     *
     * See: https://openiap.dev/docs/apis/ios/is-eligible-for-external-purchase-custom-link-ios
     */
    public isEligibleForExternalPurchaseCustomLinkIOS(): Promise<boolean> {
        return iapBridge.call<boolean>('isEligibleForExternalPurchaseCustomLinkIOS', {});
    }

    /**
     * Request an external purchase reporting token (iOS 18.1+).
     *
     * @param tokenType  'acquisition' or 'services'.
     *
     * See: https://openiap.dev/docs/apis/ios/get-external-purchase-custom-link-token-ios
     */
    public getExternalPurchaseCustomLinkTokenIOS(
        tokenType: ExternalPurchaseCustomLinkTokenTypeIOS,
    ): Promise<ExternalPurchaseCustomLinkTokenResultIOS> {
        return iapBridge.call<ExternalPurchaseCustomLinkTokenResultIOS>(
            'getExternalPurchaseCustomLinkTokenIOS', { tokenType });
    }

    /**
     * Show the external purchase custom link disclosure notice (iOS 18.1+).
     *
     * @param noticeType  The notice type to display (e.g., 'browser').
     *
     * See: https://openiap.dev/docs/apis/ios/show-external-purchase-custom-link-notice-ios
     */
    public showExternalPurchaseCustomLinkNoticeIOS(
        noticeType: ExternalPurchaseCustomLinkNoticeTypeIOS,
    ): Promise<ExternalPurchaseCustomLinkNoticeResultIOS> {
        return iapBridge.call<ExternalPurchaseCustomLinkNoticeResultIOS>(
            'showExternalPurchaseCustomLinkNoticeIOS', { noticeType });
    }

    // ==================================================================
    // Events API
    // ==================================================================

    /** Subscribe to purchase success events. */
    public onPurchaseUpdated(cb: _EventCallback<Purchase>): void {
        this._subscribe(IapEvent.PURCHASE_UPDATED, cb);
    }
    /** Remove a purchaseUpdated subscription. */
    public offPurchaseUpdated(cb: _EventCallback<Purchase>): void {
        this._unsubscribe(IapEvent.PURCHASE_UPDATED, cb);
    }

    /** Subscribe to purchase error events. */
    public onPurchaseError(cb: _EventCallback<PurchaseError>): void {
        this._subscribe(IapEvent.PURCHASE_ERROR, cb);
    }
    /** Remove a purchaseError subscription. */
    public offPurchaseError(cb: _EventCallback<PurchaseError>): void {
        this._unsubscribe(IapEvent.PURCHASE_ERROR, cb);
    }

    /** Subscribe to billing client connected events. */
    public onConnected(cb: _EventCallback<void>): void {
        this._subscribe(IapEvent.CONNECTED, cb as any);
    }
    /** Remove a connected subscription. */
    public offConnected(cb: _EventCallback<void>): void {
        this._unsubscribe(IapEvent.CONNECTED, cb as any);
    }

    /** Subscribe to billing client disconnected events. */
    public onDisconnected(cb: _EventCallback<void>): void {
        this._subscribe(IapEvent.DISCONNECTED, cb as any);
    }
    /** Remove a disconnected subscription. */
    public offDisconnected(cb: _EventCallback<void>): void {
        this._unsubscribe(IapEvent.DISCONNECTED, cb as any);
    }

    /**
     * Subscribe to App Store promoted-product events (iOS only).
     *
     * Fired when the user taps a promoted IAP in the App Store. Call
     * `getPromotedProductIOS()` to retrieve the product, then decide whether
     * to call `requestPurchase()`.
     */
    public onPromotedProductIOS(cb: _EventCallback<string>): void {
        this._subscribe(IapEvent.PROMOTED_PRODUCT_IOS, cb);
    }
    /** Remove a promotedProductIOS subscription. */
    public offPromotedProductIOS(cb: _EventCallback<string>): void {
        this._unsubscribe(IapEvent.PROMOTED_PRODUCT_IOS, cb);
    }

    /**
     * Subscribe to user-choice-billing events (Android).
     *
     * Fired when the user selects Google Play or alternative billing in the
     * User Choice Billing dialog.
     */
    public onUserChoiceBillingAndroid(cb: _EventCallback<UserChoiceBillingDetails>): void {
        this._subscribe(IapEvent.USER_CHOICE_BILLING_ANDROID, cb);
    }
    /** Remove a userChoiceBillingAndroid subscription. */
    public offUserChoiceBillingAndroid(cb: _EventCallback<UserChoiceBillingDetails>): void {
        this._unsubscribe(IapEvent.USER_CHOICE_BILLING_ANDROID, cb);
    }

    /**
     * Subscribe to developer-provided-billing events (Android 8.3.0+).
     *
     * Fired when the user selects the developer-provided billing option in
     * the External Payments dialog.
     */
    public onDeveloperProvidedBillingAndroid(
        cb: _EventCallback<DeveloperProvidedBillingDetailsAndroid>,
    ): void {
        this._subscribe(IapEvent.DEVELOPER_PROVIDED_BILLING_ANDROID, cb);
    }
    /** Remove a developerProvidedBillingAndroid subscription. */
    public offDeveloperProvidedBillingAndroid(
        cb: _EventCallback<DeveloperProvidedBillingDetailsAndroid>,
    ): void {
        this._unsubscribe(IapEvent.DEVELOPER_PROVIDED_BILLING_ANDROID, cb);
    }

    /**
     * Subscribe to subscription-billing-issue events.
     *
     * Fired when an active subscription enters a payment-problem state
     * requiring user attention. Unifies StoreKit 2 billingIssue (iOS 18+)
     * and Play Billing isSuspended (8.1+). Not emitted on Meta Horizon.
     */
    public onSubscriptionBillingIssue(cb: _EventCallback<Purchase>): void {
        this._subscribe(IapEvent.SUBSCRIPTION_BILLING_ISSUE, cb);
    }
    /** Remove a subscriptionBillingIssue subscription. */
    public offSubscriptionBillingIssue(cb: _EventCallback<Purchase>): void {
        this._unsubscribe(IapEvent.SUBSCRIPTION_BILLING_ISSUE, cb);
    }
}

/** Singleton IAP client instance. Import this in your game code. */
export const iap = new IapClient();
