/**
 * IapMethodRouter.mm — OpenIAP iOS method dispatcher
 *
 * Routes the wire method name to the corresponding OpenIapModule ObjC selector.
 * Each route method is kept short (≤ 40 lines) by extracting args helpers and
 * sharing the common success/error callback patterns.
 *
 * Availability guards:
 *   - All methods require @available(iOS 15.0, *).  On older OS the module
 *     was not instantiated and we respond with E_NOT_SUPPORTED.
 *   - iOS 16+ methods (getAppTransactionIOS) add a nested @available(iOS 16, *).
 *   - iOS 17.4+ methods add @available(iOS 17.4, *).
 *   - iOS 18.1+ methods add @available(iOS 18.1, *).
 *   - Android-only methods always return E_NOT_SUPPORTED.
 *
 * Selector mapping table — see bottom of file for the cross-reference.
 */

#import "IapMethodRouter.h"
#import "IapServiceHub.h"

#import <OpenIAP/OpenIAP-Swift.h>

// ---------------------------------------------------------------------------
// Error codes (matching react-native-iap convention used by OpenIAP)
// ---------------------------------------------------------------------------

static NSString *const kENotSupported = @"E_NOT_SUPPORTED";
static NSString *const kEUnknown      = @"E_UNKNOWN";
static NSString *const kEUserError    = @"E_USER_ERROR";

// ---------------------------------------------------------------------------
// Convenience macros / helpers
// ---------------------------------------------------------------------------

#define SEND_SUCCESS(data) sendBlock([IapServiceHub responseSuccess:callId data:(data)])
#define SEND_ERROR(code, msg) sendBlock([IapServiceHub responseError:callId code:(code) message:(msg)])
#define SEND_NSERROR(err) sendBlock([IapServiceHub responseNSError:callId error:(err)])

/// Return E_NOT_SUPPORTED immediately (used for Android-only and OS-gated methods).
#define RETURN_NOT_SUPPORTED(msg) do { SEND_ERROR(kENotSupported, (msg)); return; } while(0)

/// Coerce id to NSDictionary? safely.
static NSDictionary * _Nullable asDictionary(id _Nullable obj) {
    return [obj isKindOfClass:[NSDictionary class]] ? obj : nil;
}

/// Coerce id to NSString? safely.
static NSString * _Nullable asString(id _Nullable obj) {
    return [obj isKindOfClass:[NSString class]] ? obj : nil;
}

/// Coerce id to NSArray? safely.
static NSArray * _Nullable asArray(id _Nullable obj) {
    return [obj isKindOfClass:[NSArray class]] ? obj : nil;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

@implementation IapMethodRouter

/**
 * Central dispatch: look up method name and invoke the appropriate route.
 * Split into sub-methods by category to keep each branch ≤ 40 lines.
 */
- (void)routeMethod:(NSString *)method
               args:(NSDictionary *)args
             callId:(NSInteger)callId
          sendBlock:(void (^)(NSString *json))sendBlock {

    // iOS 15 availability guard — entire module requires 15+.
    if (@available(iOS 15.0, *)) {
        OpenIapModule *mod = [OpenIapModule sharedInstance];
        if ([self routeConnection:method args:args callId:callId sendBlock:sendBlock module:mod]) { return; }
        if ([self routeProducts:method args:args callId:callId sendBlock:sendBlock module:mod])   { return; }
        if ([self routePurchase:method args:args callId:callId sendBlock:sendBlock module:mod])   { return; }
        if ([self routeSubscriptions:method args:args callId:callId sendBlock:sendBlock module:mod]) { return; }
        if ([self routeStorefront:method args:args callId:callId sendBlock:sendBlock module:mod]) { return; }
        if ([self routeTransactionsIOS:method args:args callId:callId sendBlock:sendBlock module:mod]) { return; }
        if ([self routeOffersIOS:method args:args callId:callId sendBlock:sendBlock module:mod])  { return; }
        if ([self routeExternalIOS:method args:args callId:callId sendBlock:sendBlock module:mod]) { return; }
        if ([self routeAndroidNotSupported:method callId:callId sendBlock:sendBlock])             { return; }
    } else {
        SEND_ERROR(kENotSupported, @"IAP requires iOS 15.0 or later");
        return;
    }

    // Unknown method name.
    SEND_ERROR(kEUnknown, ([NSString stringWithFormat:@"Unknown IAP method: %@", method]));
}

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

- (BOOL)routeConnection:(NSString *)method args:(NSDictionary *)args callId:(NSInteger)callId
              sendBlock:(void (^)(NSString *))sendBlock module:(OpenIapModule *)mod
    API_AVAILABLE(ios(15.0)) {

    if ([method isEqualToString:@"initConnection"]) {
        [mod initConnectionWithCompletion:^(BOOL success, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(@(success)); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"endConnection"]) {
        [mod endConnectionWithCompletion:^(BOOL success, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(@(success)); }
        }];
        return YES;
    }
    return NO;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

- (BOOL)routeProducts:(NSString *)method args:(NSDictionary *)args callId:(NSInteger)callId
            sendBlock:(void (^)(NSString *))sendBlock module:(OpenIapModule *)mod
    API_AVAILABLE(ios(15.0)) {

    if (![method isEqualToString:@"fetchProducts"]) { return NO; }

    // args: { skus: string[], type?: 'inapp'|'subs'|'all' }
    NSArray *skus = asArray(args[@"skus"]) ?: @[];
    NSString *type = asString(args[@"type"]);   // nullable — module accepts nil
    [mod fetchProductsWithSkus:skus type:type completion:^(NSArray *products, NSError *err) {
        if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(products ?: @[]); }
    }];
    return YES;
}

// ---------------------------------------------------------------------------
// Purchases
// ---------------------------------------------------------------------------

- (BOOL)routePurchase:(NSString *)method args:(NSDictionary *)args callId:(NSInteger)callId
           sendBlock:(void (^)(NSString *))sendBlock module:(OpenIapModule *)mod
    API_AVAILABLE(ios(15.0)) {

    if ([method isEqualToString:@"requestPurchase"]) {
        // Pass the full args payload through as the "payload" overload so we
        // preserve every field the JS side sends without hand-mapping.
        [mod requestPurchaseWithPayload:args completion:^(id result, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(result); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"finishTransaction"]) {
        // args: { purchase: {...}, isConsumable: bool }
        NSDictionary *purchase   = asDictionary(args[@"purchase"]) ?: @{};
        NSString *purchaseId     = asString(purchase[@"purchaseToken"])
                                   ?: asString(purchase[@"transactionId"])
                                   ?: @"";
        NSString *productId      = asString(purchase[@"productId"])
                                   ?: asString(purchase[@"sku"])
                                   ?: @"";
        BOOL isConsumable        = [args[@"isConsumable"] boolValue];
        [mod finishTransactionWithPurchaseId:purchaseId
                                   productId:productId
                               isConsumable:isConsumable
                                  completion:^(NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS([NSNull null]); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"restorePurchases"]) {
        [mod restorePurchasesWithCompletion:^(NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS([NSNull null]); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"getAvailablePurchases"]) {
        // args may carry options dict; pass through if present.
        NSDictionary *options = asDictionary(args);
        if (options.count > 0) {
            [mod getAvailablePurchasesWithOptions:options
                                       completion:^(NSArray *purchases, NSError *err) {
                if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(purchases ?: @[]); }
            }];
        } else {
            [mod getAvailablePurchasesWithCompletion:^(NSArray *purchases, NSError *err) {
                if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(purchases ?: @[]); }
            }];
        }
        return YES;
    }
    return NO;
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

- (BOOL)routeSubscriptions:(NSString *)method args:(NSDictionary *)args callId:(NSInteger)callId
                 sendBlock:(void (^)(NSString *))sendBlock module:(OpenIapModule *)mod
    API_AVAILABLE(ios(15.0)) {

    if ([method isEqualToString:@"getActiveSubscriptions"]) {
        // The Swift module doesn't filter by ids natively — it returns all active;
        // pass through and let JS filter if needed (matches react-native-iap behaviour).
        [mod getActiveSubscriptionsWithCompletion:^(NSArray *subs, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(subs ?: @[]); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"hasActiveSubscriptions"]) {
        [mod hasActiveSubscriptionsWithCompletion:^(BOOL has, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(@(has)); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"deepLinkToSubscriptions"]) {
        [mod deepLinkToSubscriptionsWithCompletion:^(NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS([NSNull null]); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"subscriptionStatusIOS"]) {
        NSString *sku = asString(args[@"sku"]) ?: @"";
        [mod subscriptionStatusIOSWithSku:sku completion:^(NSArray *statuses, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(statuses ?: @[]); }
        }];
        return YES;
    }
    return NO;
}

// ---------------------------------------------------------------------------
// Storefront
// ---------------------------------------------------------------------------

- (BOOL)routeStorefront:(NSString *)method args:(NSDictionary *)args callId:(NSInteger)callId
              sendBlock:(void (^)(NSString *))sendBlock module:(OpenIapModule *)mod
    API_AVAILABLE(ios(15.0)) {

    if ([method isEqualToString:@"getStorefront"]) {
        [mod getStorefrontWithCompletion:^(NSString *storefront, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(storefront ?: [NSNull null]); }
        }];
        return YES;
    }
    return NO;
}

// ---------------------------------------------------------------------------
// iOS transaction / receipt / refund methods
// ---------------------------------------------------------------------------

- (BOOL)routeTransactionsIOS:(NSString *)method args:(NSDictionary *)args callId:(NSInteger)callId
                   sendBlock:(void (^)(NSString *))sendBlock module:(OpenIapModule *)mod
    API_AVAILABLE(ios(15.0)) {

    if ([method isEqualToString:@"syncIOS"]) {
        [mod syncIOSWithCompletion:^(BOOL success, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(@(success)); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"clearTransactionIOS"]) {
        [mod clearTransactionIOSWithCompletion:^(BOOL success, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(@(success)); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"getPendingTransactionsIOS"]) {
        [mod getPendingTransactionsIOSWithCompletion:^(NSArray *txns, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(txns ?: @[]); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"getReceiptDataIOS"]) {
        [mod getReceiptDataIOSWithCompletion:^(NSString *receipt, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(receipt ?: [NSNull null]); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"isTransactionVerifiedIOS"]) {
        NSString *sku = asString(args[@"sku"]) ?: @"";
        [mod isTransactionVerifiedIOSWithSku:sku completion:^(BOOL verified, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(@(verified)); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"getTransactionJwsIOS"]) {
        NSString *sku = asString(args[@"sku"]) ?: @"";
        [mod getTransactionJwsIOSWithSku:sku completion:^(NSString *jws, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(jws ?: [NSNull null]); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"beginRefundRequestIOS"]) {
        NSString *sku = asString(args[@"sku"]) ?: @"";
        [mod beginRefundRequestIOSWithSku:sku completion:^(NSString *result, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(result ?: [NSNull null]); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"currentEntitlementIOS"]) {
        NSString *sku = asString(args[@"sku"]) ?: @"";
        [mod currentEntitlementIOSWithSku:sku completion:^(id entitlement, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(entitlement ?: [NSNull null]); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"getAppTransactionIOS"]) {
        if (@available(iOS 16.0, *)) {
            [mod getAppTransactionIOSWithCompletion:^(id txn, NSError *err) {
                if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(txn ?: [NSNull null]); }
            }];
        } else {
            RETURN_NOT_SUPPORTED(@"getAppTransactionIOS requires iOS 16.0");
        }
        return YES;
    }
    if ([method isEqualToString:@"getPromotedProductIOS"]) {
        [mod getPromotedProductIOSWithCompletion:^(id product, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(product ?: [NSNull null]); }
        }];
        return YES;
    }
    return NO;
}

// ---------------------------------------------------------------------------
// iOS offer / sheet / code-redemption methods
// ---------------------------------------------------------------------------

- (BOOL)routeOffersIOS:(NSString *)method args:(NSDictionary *)args callId:(NSInteger)callId
             sendBlock:(void (^)(NSString *))sendBlock module:(OpenIapModule *)mod
    API_AVAILABLE(ios(15.0)) {

    if ([method isEqualToString:@"isEligibleForIntroOfferIOS"]) {
        NSString *groupId = asString(args[@"groupId"]) ?: @"";
        [mod isEligibleForIntroOfferIOSWithGroupID:groupId completion:^(BOOL eligible, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(@(eligible)); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"presentCodeRedemptionSheetIOS"]) {
        [mod presentCodeRedemptionSheetIOSWithCompletion:^(BOOL success, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(@(success)); }
        }];
        return YES;
    }
    if ([method isEqualToString:@"showManageSubscriptionsIOS"]) {
        [mod showManageSubscriptionsIOSWithCompletion:^(NSArray *result, NSError *err) {
            if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(result ?: @[]); }
        }];
        return YES;
    }
    return NO;
}

// ---------------------------------------------------------------------------
// iOS external purchase sheet methods (OS-gated)
// ---------------------------------------------------------------------------

- (BOOL)routeExternalIOS:(NSString *)method args:(NSDictionary *)args callId:(NSInteger)callId
               sendBlock:(void (^)(NSString *))sendBlock module:(OpenIapModule *)mod
    API_AVAILABLE(ios(15.0)) {

    if ([method isEqualToString:@"canPresentExternalPurchaseNoticeIOS"]) {
        if (@available(iOS 17.4, *)) {
            [mod canPresentExternalPurchaseNoticeIOSWithCompletion:^(BOOL can, NSError *err) {
                if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(@(can)); }
            }];
        } else {
            RETURN_NOT_SUPPORTED(@"canPresentExternalPurchaseNoticeIOS requires iOS 17.4");
        }
        return YES;
    }
    if ([method isEqualToString:@"presentExternalPurchaseNoticeSheetIOS"]) {
        if (@available(iOS 17.4, *)) {
            [mod presentExternalPurchaseNoticeSheetIOSWithCompletion:^(id result, NSError *err) {
                if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(result ?: [NSNull null]); }
            }];
        } else {
            RETURN_NOT_SUPPORTED(@"presentExternalPurchaseNoticeSheetIOS requires iOS 17.4");
        }
        return YES;
    }
    if ([method isEqualToString:@"isEligibleForExternalPurchaseCustomLinkIOS"]) {
        if (@available(iOS 18.1, *)) {
            [mod isEligibleForExternalPurchaseCustomLinkIOSWithCompletion:^(BOOL eligible, NSError *err) {
                if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(@(eligible)); }
            }];
        } else {
            RETURN_NOT_SUPPORTED(@"isEligibleForExternalPurchaseCustomLinkIOS requires iOS 18.1");
        }
        return YES;
    }
    if ([method isEqualToString:@"getExternalPurchaseCustomLinkTokenIOS"]) {
        if (@available(iOS 18.1, *)) {
            NSString *tokenType = asString(args[@"tokenType"]) ?: @"";
            [mod getExternalPurchaseCustomLinkTokenIOSWithTokenType:tokenType
                                                         completion:^(id result, NSError *err) {
                if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(result ?: [NSNull null]); }
            }];
        } else {
            RETURN_NOT_SUPPORTED(@"getExternalPurchaseCustomLinkTokenIOS requires iOS 18.1");
        }
        return YES;
    }
    if ([method isEqualToString:@"showExternalPurchaseCustomLinkNoticeIOS"]) {
        if (@available(iOS 18.1, *)) {
            NSString *noticeType = asString(args[@"noticeType"]) ?: @"";
            [mod showExternalPurchaseCustomLinkNoticeIOSWithNoticeType:noticeType
                                                            completion:^(id result, NSError *err) {
                if (err) { SEND_NSERROR(err); } else { SEND_SUCCESS(result ?: [NSNull null]); }
            }];
        } else {
            RETURN_NOT_SUPPORTED(@"showExternalPurchaseCustomLinkNoticeIOS requires iOS 18.1");
        }
        return YES;
    }
    return NO;
}

// ---------------------------------------------------------------------------
// Android-only methods — always E_NOT_SUPPORTED on iOS
// ---------------------------------------------------------------------------

- (BOOL)routeAndroidNotSupported:(NSString *)method callId:(NSInteger)callId
                       sendBlock:(void (^)(NSString *))sendBlock {
    static NSSet *sAndroidMethods = nil;
    static dispatch_once_t sOnce;
    dispatch_once(&sOnce, ^{
        sAndroidMethods = [NSSet setWithArray:@[
            @"acknowledgePurchaseAndroid",
            @"consumePurchaseAndroid",
            @"checkAlternativeBillingAvailabilityAndroid",
            @"showAlternativeBillingDialogAndroid",
            @"createAlternativeBillingTokenAndroid",
            @"isBillingProgramAvailableAndroid",
            @"launchExternalLinkAndroid",
            @"getPackageNameAndroid",
        ]];
    });
    if (![sAndroidMethods containsObject:method]) { return NO; }
    SEND_ERROR(kENotSupported,
        ([NSString stringWithFormat:@"%@ is Android-only and not supported on iOS", method]));
    return YES;
}

@end

// =============================================================================
// SELECTOR MAPPING TABLE (for review — not compiled code)
// =============================================================================
//
// Wire method                      ObjC selector (OpenIAP-Swift.h line)
// ─────────────────────────────────────────────────────────────────────────────
// initConnection                   -initConnectionWithCompletion:          (line 335)
// endConnection                    -endConnectionWithCompletion:           (line 336)
// fetchProducts                    -fetchProductsWithSkus:type:completion: (line 337)
// requestPurchase                  -requestPurchaseWithPayload:completion: (line 341)
// finishTransaction                -finishTransactionWithPurchaseId:productId:isConsumable:completion: (line 363)
// restorePurchases                 -restorePurchasesWithCompletion:        (line 356)
// getAvailablePurchases            -getAvailablePurchasesWithOptions:completion: (line 358)
//                                  -getAvailablePurchasesWithCompletion:  (line 357)
// getActiveSubscriptions           -getActiveSubscriptionsWithCompletion:  (line 380)
// hasActiveSubscriptions           -hasActiveSubscriptionsWithCompletion:  (line 381)
// deepLinkToSubscriptions          -deepLinkToSubscriptionsWithCompletion: (line 362)
// getStorefront                    -getStorefrontWithCompletion:           (line 378)
// syncIOS                          -syncIOSWithCompletion:                 (line 360)
// clearTransactionIOS              -clearTransactionIOSWithCompletion:     (line 365)
// getPendingTransactionsIOS        -getPendingTransactionsIOSWithCompletion: (line 364)
// getReceiptDataIOS                -getReceiptDataIOSWithCompletion:       (line 366)
// isTransactionVerifiedIOS         -isTransactionVerifiedIOSWithSku:completion: (line 387)
// getTransactionJwsIOS             -getTransactionJwsIOSWithSku:completion: (line 388)
// beginRefundRequestIOS            -beginRefundRequestIOSWithSku:completion: (line 385)
// currentEntitlementIOS            -currentEntitlementIOSWithSku:completion: (line 383)
// getAppTransactionIOS             -getAppTransactionIOSWithCompletion:    (line 389) [iOS 16+]
// getPromotedProductIOS            -getPromotedProductIOSWithCompletion:   (line 338)
// subscriptionStatusIOS            -subscriptionStatusIOSWithSku:completion: (line 382)
// isEligibleForIntroOfferIOS       -isEligibleForIntroOfferIOSWithGroupID:completion: (line 386)
// presentCodeRedemptionSheetIOS    -presentCodeRedemptionSheetIOSWithCompletion: (line 390)
// showManageSubscriptionsIOS       -showManageSubscriptionsIOSWithCompletion: (line 391)
// canPresentExternalPurchaseNoticeIOS  -canPresentExternalPurchaseNoticeIOSWithCompletion: (line 394) [iOS 17.4+]
// presentExternalPurchaseNoticeSheetIOS -presentExternalPurchaseNoticeSheetIOSWithCompletion: (line 393) [iOS 17.4+]
// isEligibleForExternalPurchaseCustomLinkIOS -isEligibleForExternalPurchaseCustomLinkIOSWithCompletion: (line 395) [iOS 18.1+]
// getExternalPurchaseCustomLinkTokenIOS -getExternalPurchaseCustomLinkTokenIOSWithTokenType:completion: (line 396) [iOS 18.1+]
// showExternalPurchaseCustomLinkNoticeIOS -showExternalPurchaseCustomLinkNoticeIOSWithNoticeType:completion: (line 397) [iOS 18.1+]
//
// EVENT LISTENERS (module-level, no call id)
// purchaseUpdated (event)          -addPurchaseUpdatedListener:            (line 398)
// purchaseError (event)            -addPurchaseErrorListener:              (line 400)
// promotedProductIOS (event)       -addPromotedProductListener:            (line 401)
// subscriptionBillingIssue (event) -addSubscriptionBillingIssueListener:   (line 402)
//
// WIRE METHODS WITH NO MATCHING SELECTOR (responded E_NOT_SUPPORTED):
//   acknowledgePurchaseAndroid, consumePurchaseAndroid,
//   checkAlternativeBillingAvailabilityAndroid, showAlternativeBillingDialogAndroid,
//   createAlternativeBillingTokenAndroid, isBillingProgramAvailableAndroid,
//   launchExternalLinkAndroid, getPackageNameAndroid — Android-only, by design.
//
//   verifyPurchase / verifyPurchaseWithProvider — excluded per spec
//     (IAPKit SaaS, not implemented).
//   getAllTransactionsIOS — available selector exists (-getAllTransactionsIOSWithCompletion:
//     line 359) but wire method not listed in spec; not routed, falls through to
//     "unknown method" error.
//   requestSubscription — selector exists (-requestSubscriptionWithSku:offer:completion:
//     line 341) but the TS IapClient routes everything through requestPurchase; not
//     separately wired.
//   connected / disconnected — pure events emitted by initConnection completion
//     and by StoreKit session changes; not separately wired as command methods.
// =============================================================================
