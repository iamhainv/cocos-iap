/**
 * IapServiceHub.h — OpenIAP iOS bridge singleton
 *
 * Mirrors AdServiceHub.h exactly: a singleton that owns the OpenIAP module
 * reference and the JsbBridgeWrapper listener for the "iap" channel.
 *
 * Bootstrap: call [[IapServiceHub sharedInstance] initIapService] from
 * AppDelegate.mm -application:didFinishLaunchingWithOptions:, alongside the
 * existing [[AdServiceHub sharedInstance] initAdService] call.
 *
 * Requires iOS 15.0+  (OpenIAP / StoreKit 2 hard requirement).
 */

#pragma once

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** Singleton gateway that wires the JS "iap" channel to OpenIapModule. */
@interface IapServiceHub : NSObject

/** Returns the shared singleton. */
+ (instancetype)sharedInstance;

/**
 * Initialise the IAP bridge.
 *
 * Registers the JsbBridgeWrapper listener on channel "iap", installs
 * purchaseUpdated / purchaseError / promotedProduct module listeners, and
 * connects the request-dispatcher in IapMethodRouter.
 *
 * Safe to call multiple times (idempotent after the first call).
 */
- (void)initIapService;

@end

NS_ASSUME_NONNULL_END
