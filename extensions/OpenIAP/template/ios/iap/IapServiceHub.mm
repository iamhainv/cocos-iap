/**
 * IapServiceHub.mm — OpenIAP iOS bridge singleton implementation
 *
 * Bootstrap pattern mirrors AdServiceHub.m exactly:
 *   - Singleton via dispatch_once.
 *   - initIapService called from AppDelegate.mm.
 *   - JsbBridgeWrapper "iap" channel listener registered once.
 *   - Module-level event listeners (purchaseUpdated, purchaseError,
 *     promotedProduct, subscriptionBillingIssue) installed here; they fire
 *     independent of any pending call id.
 *
 * Wire protocol (must match assets/core/Bridge.ts):
 *   JS → native : single JSON string {"id":int,"method":"camelCase","args":{}}
 *   native → JS : {"kind":"response","id":N,"success":true,"data":...}
 *                 {"kind":"response","id":N,"success":false,"error":{"code","message"}}
 *                 {"kind":"event","name":"...","payload":...}
 *
 * Threading: OpenIapModule completions arrive on arbitrary queues.
 * All -sendJson: calls are dispatched to the main queue (game thread) before
 * forwarding to JsbBridgeWrapper, mirroring the AdMob pattern.
 */

#import "IapServiceHub.h"
#import "IapMethodRouter.h"

#import <OpenIAP/OpenIAP-Swift.h>

// Cocos JSB bridge — same header path used by Bridge.m in AdMob.
#import "platform/apple/JsbBridgeWrapper.h"

// ---------------------------------------------------------------------------
// Channel name (must match Bridge.ts: channel "iap")
// ---------------------------------------------------------------------------
static NSString *const kIapChannel = @"iap";

// ---------------------------------------------------------------------------
// Wire-protocol helper: build a JSON response string.
// ---------------------------------------------------------------------------

/// Build a success-response JSON string for the given call id.
static NSString *IapResponseSuccess(NSInteger callId, id _Nullable data) {
    NSError *jsonErr = nil;
    id safeData = data ?: [NSNull null];
    NSData *bodyData = [NSJSONSerialization dataWithJSONObject:@{
        @"kind"    : @"response",
        @"id"      : @(callId),
        @"success" : @YES,
        @"data"    : safeData,
    } options:0 error:&jsonErr];
    if (jsonErr || !bodyData) {
        // Fallback: omit data field rather than crash.
        bodyData = [NSJSONSerialization dataWithJSONObject:@{
            @"kind"    : @"response",
            @"id"      : @(callId),
            @"success" : @YES,
            @"data"    : [NSNull null],
        } options:0 error:nil];
    }
    return [[NSString alloc] initWithData:bodyData encoding:NSUTF8StringEncoding];
}

/// Build an error-response JSON string for the given call id.
static NSString *IapResponseError(NSInteger callId, NSString *code, NSString *message) {
    NSData *bodyData = [NSJSONSerialization dataWithJSONObject:@{
        @"kind"    : @"response",
        @"id"      : @(callId),
        @"success" : @NO,
        @"error"   : @{
            @"code"    : code,
            @"message" : message,
        },
    } options:0 error:nil];
    return [[NSString alloc] initWithData:bodyData encoding:NSUTF8StringEncoding];
}

/// Build an event JSON string (no call id).
static NSString *IapEvent(NSString *name, id _Nullable payload) {
    NSError *jsonErr = nil;
    id safePayload = payload ?: [NSNull null];
    NSData *bodyData = [NSJSONSerialization dataWithJSONObject:@{
        @"kind"    : @"event",
        @"name"    : name,
        @"payload" : safePayload,
    } options:0 error:&jsonErr];
    if (jsonErr || !bodyData) {
        bodyData = [NSJSONSerialization dataWithJSONObject:@{
            @"kind"    : @"event",
            @"name"    : name,
            @"payload" : [NSNull null],
        } options:0 error:nil];
    }
    return [[NSString alloc] initWithData:bodyData encoding:NSUTF8StringEncoding];
}

// ---------------------------------------------------------------------------
// IapServiceHub implementation
// ---------------------------------------------------------------------------

@interface IapServiceHub ()

/** Router that owns the per-method dispatch table. */
@property (nonatomic, strong) IapMethodRouter *router;

/** Opaque listener tokens returned by addPurchaseUpdatedListener: etc. */
@property (nonatomic, strong) NSObject *purchaseUpdatedToken;
@property (nonatomic, strong) NSObject *purchaseErrorToken;
@property (nonatomic, strong) NSObject *promotedProductToken;
@property (nonatomic, strong) NSObject *billingIssueToken;

/** Guard against double-initialisation. */
@property (nonatomic, assign) BOOL initialised;

@end

@implementation IapServiceHub

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

+ (instancetype)sharedInstance {
    static IapServiceHub *sInstance = nil;
    static dispatch_once_t sOnce;
    dispatch_once(&sOnce, ^{
        sInstance = [[super allocWithZone:NULL] init];
    });
    return sInstance;
}

+ (id)allocWithZone:(struct _NSZone *)zone { return [IapServiceHub sharedInstance]; }
+ (id)copyWithZone:(struct _NSZone *)zone  { return [IapServiceHub sharedInstance]; }

// ---------------------------------------------------------------------------
// Initialise
// ---------------------------------------------------------------------------

- (void)initIapService {
    if (self.initialised) { return; }
    self.initialised = YES;

    self.router = [[IapMethodRouter alloc] init];

    // Register the "iap" script event listener.
    // IMPORTANT: same MRC/block-lifetime caveat as AdMob's Bridge.m:
    // a capturing block is a malloc block; JsbBridgeWrapper does [listener release]
    // on it → use-after-free unless we keep a strong reference.
    __weak __typeof__(self) wself = self;
    static OnScriptEventListener sIapListener = nil;
    sIapListener = ^(NSString *payload) {
        IapServiceHub *hub = wself;
        if (!hub) { return; }
        [hub handleIncomingMessage:payload];
    };
    [[JsbBridgeWrapper sharedInstance] addScriptEventListener:kIapChannel listener:sIapListener];

    // Install module-level event listeners (fire independently of call ids).
    [self installModuleListeners];

    NSLog(@"[IapServiceHub] initIapService — channel %@ registered", kIapChannel);
}

// ---------------------------------------------------------------------------
// Module-level event listeners
// ---------------------------------------------------------------------------

- (void)installModuleListeners {
    if (@available(iOS 15.0, *)) {
        __weak __typeof__(self) wself = self;

        // purchaseUpdated → event "purchaseUpdated"
        self.purchaseUpdatedToken =
            [[OpenIapModule sharedInstance] addPurchaseUpdatedListener:^(NSDictionary *purchase) {
                IapServiceHub *hub = wself;
                if (!hub) { return; }
                NSString *json = IapEvent(@"purchaseUpdated", purchase);
                [hub sendJson:json];
            }];

        // purchaseError → event "purchaseError"
        self.purchaseErrorToken =
            [[OpenIapModule sharedInstance] addPurchaseErrorListener:^(NSDictionary *errorDict) {
                IapServiceHub *hub = wself;
                if (!hub) { return; }
                NSString *json = IapEvent(@"purchaseError", errorDict);
                [hub sendJson:json];
            }];

        // promotedProduct → event "promotedProductIOS" (payload = productId string or null)
        self.promotedProductToken =
            [[OpenIapModule sharedInstance] addPromotedProductListener:^(NSString * _Nullable productId) {
                IapServiceHub *hub = wself;
                if (!hub) { return; }
                id payload = productId ?: [NSNull null];
                NSString *json = IapEvent(@"promotedProductIOS", payload);
                [hub sendJson:json];
            }];

        // subscriptionBillingIssue → event "subscriptionBillingIssue"
        self.billingIssueToken =
            [[OpenIapModule sharedInstance] addSubscriptionBillingIssueListener:^(NSDictionary *info) {
                IapServiceHub *hub = wself;
                if (!hub) { return; }
                NSString *json = IapEvent(@"subscriptionBillingIssue", info);
                [hub sendJson:json];
            }];
    }
    // Below iOS 15 we simply don't register listeners — the xcframework will
    // not be callable at all, and initConnection will return E_NOT_SUPPORTED.
}

// ---------------------------------------------------------------------------
// Incoming message handler (called from JsbBridgeWrapper listener)
// ---------------------------------------------------------------------------

/**
 * Parse the incoming JSON envelope and dispatch to IapMethodRouter.
 * Malformed JSON → send an error response (never crash).
 */
- (void)handleIncomingMessage:(NSString *)payload {
    // Parse the envelope.
    NSData *data = [payload dataUsingEncoding:NSUTF8StringEncoding];
    if (!data) {
        NSLog(@"[IapServiceHub] empty or non-UTF8 payload, ignoring");
        return;
    }

    NSError *parseErr = nil;
    id parsed = [NSJSONSerialization JSONObjectWithData:data options:0 error:&parseErr];
    if (parseErr || ![parsed isKindOfClass:[NSDictionary class]]) {
        NSLog(@"[IapServiceHub] malformed JSON envelope: %@", payload);
        // We don't know the id, so we cannot send a correlated error response.
        return;
    }

    NSDictionary *envelope = (NSDictionary *)parsed;
    id rawId     = envelope[@"id"];
    NSString *method = envelope[@"method"];
    id rawArgs   = envelope[@"args"];

    if (![rawId isKindOfClass:[NSNumber class]] ||
        ![method isKindOfClass:[NSString class]]) {
        NSLog(@"[IapServiceHub] envelope missing id/method: %@", payload);
        return;
    }

    NSInteger callId = [rawId integerValue];
    NSDictionary *args = [rawArgs isKindOfClass:[NSDictionary class]] ? rawArgs : @{};

    // Dispatch to router; sendBlock is called on game thread.
    __weak __typeof__(self) wself = self;
    [self.router routeMethod:method
                        args:args
                      callId:callId
                   sendBlock:^(NSString *json) {
        [wself sendJson:json];
    }];
}

// ---------------------------------------------------------------------------
// Send JSON string to JS on the game (main) thread
// ---------------------------------------------------------------------------

/**
 * Marshal a JSON string to JS via JsbBridgeWrapper on the main queue.
 * All OpenIapModule completions arrive on arbitrary queues, so we always
 * hop to the main queue before calling dispatchEventToScript:arg: —
 * matching the threading model of the AdMob bridge.
 */
- (void)sendJson:(NSString *)json {
    if (!json) { return; }
    dispatch_async(dispatch_get_main_queue(), ^{
        [[JsbBridgeWrapper sharedInstance] dispatchEventToScript:kIapChannel arg:json];
    });
}

// ---------------------------------------------------------------------------
// Package-internal helpers used by IapMethodRouter
// ---------------------------------------------------------------------------

/**
 * Build and send a success response.  Called by IapMethodRouter completions.
 */
+ (NSString *)responseSuccess:(NSInteger)callId data:(id _Nullable)data {
    return IapResponseSuccess(callId, data);
}

/**
 * Build and send an error response.  Called by IapMethodRouter completions.
 */
+ (NSString *)responseError:(NSInteger)callId code:(NSString *)code message:(NSString *)message {
    return IapResponseError(callId, code, message);
}

/**
 * Build an error response from an NSError.
 */
+ (NSString *)responseNSError:(NSInteger)callId error:(NSError *)error {
    NSString *code = error.userInfo[@"code"] ?: [@(error.code) stringValue];
    NSString *msg  = error.localizedDescription ?: @"Unknown error";
    return IapResponseError(callId, code, msg);
}

@end
