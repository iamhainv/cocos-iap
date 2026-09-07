/**
 * OpenIAP Bridge — Cocos Creator 3.8.8
 *
 * Registers a native event listener on the "iap" channel using
 * native.jsbBridgeWrapper, multiplexes incoming JSON messages into:
 *   - Pending promise resolutions (request/response by numeric id).
 *   - Named event callbacks (purchaseUpdated, connected, etc.).
 *
 * Wire protocol (fixed — both JS and native sides must agree):
 *
 *   JS → native:
 *     dispatchEventToNative("iap", JSON.stringify({ id, method, args }))
 *
 *   native → JS (single string argument):
 *     Response: { "kind": "response", "id": <int>, "success": true|false,
 *                 "data"?: <any>, "error"?: { "code", "message", "debugMessage"?, "responseCode"? } }
 *     Event:    { "kind": "event", "name": "<eventName>", "payload": <any> }
 *
 * Guard: on non-native platforms call() rejects immediately with E_NOT_SUPPORTED.
 */

import { log } from 'cc';
import { native } from 'cc';
import { NATIVE } from 'cc/env';
import { ErrorCode, PurchaseError } from '../Types';

const _TAG = '[OpenIAP/Bridge]';

/** Default timeout in milliseconds for a pending native call. */
const DEFAULT_CALL_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Internal wire-protocol types
// ---------------------------------------------------------------------------

interface _WireResponse {
    kind: 'response';
    id: number;
    success: true;
    data: unknown;
}

interface _WireError {
    kind: 'response';
    id: number;
    success: false;
    error: PurchaseError;
}

interface _WireEvent {
    kind: 'event';
    name: string;
    payload: unknown;
}

type _WireMessage = _WireResponse | _WireError | _WireEvent;

// ---------------------------------------------------------------------------
// Internal pending-call entry
// ---------------------------------------------------------------------------

interface _PendingCall {
    resolve: (data: unknown) => void;
    reject: (err: PurchaseError) => void;
    timer: ReturnType<typeof setTimeout>;
}

// ---------------------------------------------------------------------------
// Bridge singleton
// ---------------------------------------------------------------------------

/**
 * Internal bridge between TypeScript and the native IAP layer.
 *
 * Only one instance is created (exported as `iapBridge`). Game code should
 * use IapClient rather than interacting with the bridge directly.
 */
export class Bridge {

    /** Milliseconds before an unanswered call is rejected with E_TIMEOUT. */
    public callTimeoutMs: number = DEFAULT_CALL_TIMEOUT_MS;

    private _nextId: number = 1;
    private _pending: Map<number, _PendingCall> = new Map();
    private _eventHandlers: Map<string, Set<(payload: unknown) => void>> = new Map();
    private _registered: boolean = false;

    // ------------------------------------------------------------------
    // Lifecycle
    // ------------------------------------------------------------------

    /**
     * Initialise the bridge: registers the jsbBridgeWrapper listener once.
     * Safe to call on non-native platforms — the listener registration is
     * guarded by the NATIVE constant.
     */
    public init(): this {
        if (this._registered) {
            return this;
        }
        this._registered = true;

        if (NATIVE) {
            (native as any).jsbBridgeWrapper.addNativeEventListener('iap', (payload: string) => {
                this._onNativeMessage(payload);
            });
            log(_TAG, 'native listener registered on channel "iap"');
        } else {
            log(_TAG, 'non-native platform — listener registration skipped');
        }

        return this;
    }

    // ------------------------------------------------------------------
    // Public call API
    // ------------------------------------------------------------------

    /**
     * Send a request to the native IAP layer and return a Promise that
     * resolves with the response data or rejects with a PurchaseError.
     *
     * @param method  camelCase method name matching the native implementation.
     * @param args    Optional argument object; serialised as JSON.
     *
     * @throws PurchaseError with code E_NOT_SUPPORTED on non-native platforms.
     * @throws PurchaseError with code E_TIMEOUT if no response arrives within
     *         `callTimeoutMs` milliseconds.
     */
    public call<T>(method: string, args: object = {}): Promise<T> {
        if (!NATIVE || !(native as any).jsbBridgeWrapper) {
            return Promise.reject<T>({
                code: ErrorCode.E_NOT_SUPPORTED,
                message: 'IAP is only available on native iOS/Android',
            } as PurchaseError);
        }

        const id = this._nextId++;
        const payload = JSON.stringify({ id, method, args });

        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                this._pending.delete(id);
                reject({
                    code: ErrorCode.E_TIMEOUT,
                    message: `Native call "${method}" timed out after ${this.callTimeoutMs}ms`,
                } as PurchaseError);
            }, this.callTimeoutMs);

            this._pending.set(id, {
                resolve: (data) => resolve(data as T),
                reject,
                timer,
            });

            log(_TAG, `call id=${id} method=${method}`);
            (native as any).jsbBridgeWrapper.dispatchEventToNative('iap', payload);
        });
    }

    // ------------------------------------------------------------------
    // Event API (used internally by IapClient)
    // ------------------------------------------------------------------

    /**
     * Subscribe to a named event emitted by the native side.
     *
     * @param name     Event name (e.g., 'purchaseUpdated').
     * @param handler  Callback receiving the typed payload.
     */
    public on(name: string, handler: (payload: unknown) => void): void {
        let set = this._eventHandlers.get(name);
        if (!set) {
            set = new Set();
            this._eventHandlers.set(name, set);
        }
        set.add(handler);
    }

    /**
     * Unsubscribe a previously registered event handler.
     *
     * @param name     Event name.
     * @param handler  The exact handler reference passed to `on()`.
     */
    public off(name: string, handler: (payload: unknown) => void): void {
        const set = this._eventHandlers.get(name);
        if (set) {
            set.delete(handler);
        }
    }

    // ------------------------------------------------------------------
    // Private message routing
    // ------------------------------------------------------------------

    private _onNativeMessage(raw: string): void {
        let msg: _WireMessage;
        try {
            msg = JSON.parse(raw) as _WireMessage;
        } catch (e) {
            log(_TAG, 'failed to parse native message:', raw);
            return;
        }

        if (msg.kind === 'response') {
            this._handleResponse(msg as _WireResponse | _WireError);
        } else if (msg.kind === 'event') {
            this._handleEvent(msg as _WireEvent);
        } else {
            log(_TAG, 'unknown message kind:', (msg as any).kind);
        }
    }

    private _handleResponse(msg: _WireResponse | _WireError): void {
        const entry = this._pending.get(msg.id);
        if (!entry) {
            log(_TAG, `no pending call for id=${msg.id}`);
            return;
        }
        clearTimeout(entry.timer);
        this._pending.delete(msg.id);

        if (msg.success) {
            entry.resolve((msg as _WireResponse).data);
        } else {
            entry.reject((msg as _WireError).error);
        }
    }

    private _handleEvent(msg: _WireEvent): void {
        log(_TAG, `event "${msg.name}"`);
        const handlers = this._eventHandlers.get(msg.name);
        if (handlers) {
            handlers.forEach((h) => {
                try {
                    h(msg.payload);
                } catch (err) {
                    log(_TAG, `error in handler for event "${msg.name}":`, err);
                }
            });
        }
    }
}

/** Singleton bridge instance. Initialised on module load. */
export const iapBridge = new Bridge().init();
