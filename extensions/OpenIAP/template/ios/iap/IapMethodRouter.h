/**
 * IapMethodRouter.h — OpenIAP iOS method dispatcher
 *
 * Receives a parsed JSON envelope { id, method, args } and routes it to the
 * appropriate OpenIapModule ObjC selector.  All completions are marshalled
 * back to the JS layer via IapServiceHub's -sendEvent:payload: helper.
 *
 * Separation rationale: IapServiceHub stays small (bootstrap + listener glue);
 * IapMethodRouter owns the entire dispatch table and keeps method count out of
 * the hub, preserving a cyclomatic complexity ≤ 10 per method.
 */

#pragma once

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Stateless dispatcher — every route method is called with the parsed args
 * dictionary and the request id.  The sendBlock is called with the serialised
 * JSON string that must be forwarded to JS.
 */
@interface IapMethodRouter : NSObject

/**
 * Route an incoming request to the correct OpenIapModule selector.
 *
 * @param method    camelCase method name from the wire envelope.
 * @param args      Parsed args dictionary (may be empty, never nil).
 * @param callId    Numeric request id used to correlate the response.
 * @param sendBlock Called on the game thread with the JSON response/event string.
 */
- (void)routeMethod:(NSString *)method
               args:(NSDictionary *)args
             callId:(NSInteger)callId
          sendBlock:(void (^)(NSString *json))sendBlock;

@end

NS_ASSUME_NONNULL_END
