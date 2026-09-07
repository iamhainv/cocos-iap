package com.cocos.iap

import com.cocos.lib.CocosHelper
import com.cocos.lib.JsbBridgeWrapper
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * Wire-protocol bridge between the Cocos JS layer and [IapServiceHub].
 *
 * Registers a JsbBridgeWrapper script-event listener on channel "iap".
 * All JS→native messages arrive as a JSON string matching:
 *   { "id": <int>, "method": <string>, "args": <object> }
 *
 * All native→JS messages are dispatched as JSON strings on channel "iap":
 *   Response: { "kind": "response", "id": <int>, "success": true,  "data": <any> }
 *   Error:    { "kind": "response", "id": <int>, "success": false,
 *               "error": { "code": <string>, "message": <string>,
 *                          "debugMessage"?: <string>, "responseCode"?: <int> } }
 *   Event:    { "kind": "event", "name": <string>, "payload": <any> }
 *
 * Thread safety: listener fires on the Cocos game thread (Cocos pumps
 * JsbBridgeWrapper there). Responses are dispatched back via
 * [CocosHelper.runOnGameThread] so they always arrive on the game thread.
 */
internal object IapBridge {

    private const val CHANNEL = "iap"

    /** Register the JsbBridgeWrapper listener. Called once by [IapInitProvider]. */
    fun register() {
        IapLog.d("IapBridge.register()")
        // JsbBridgeWrapper.getInstance().addScriptEventListener(channel, listener) and
        // CocosHelper.runOnGameThread(Runnable) are both part of the standard libcocos
        // native-bridge API shipped with Cocos Creator 3.8.8, and follow the same pattern
        // used by this extension family's other native bridges (e.g. libadmob's Bridge.java).
        JsbBridgeWrapper.getInstance().addScriptEventListener(CHANNEL) { arg ->
            handleIncoming(arg ?: "")
        }
        IapLog.d("IapBridge: listener registered on channel \"$CHANNEL\"")
    }

    // -------------------------------------------------------------------------
    // Incoming dispatch
    // -------------------------------------------------------------------------

    private fun handleIncoming(raw: String) {
        val id: Int
        val method: String
        val args: JSONObject

        // Defensive parse — malformed JSON is a developer error.
        try {
            val envelope = JSONObject(raw)
            id = envelope.getInt("id")
            method = envelope.getString("method")
            args = envelope.optJSONObject("args") ?: JSONObject()
        } catch (e: Exception) {
            IapLog.e("IapBridge: parse error on incoming message: $raw", e)
            // We have no id to respond to — send a generic error on id=0.
            respondErr(0, "E_DEVELOPER_ERROR", "Malformed envelope: ${e.message}")
            return
        }

        IapLog.d("IapBridge: dispatch id=$id method=$method")

        IapServiceHub.scope.launch {
            try {
                IapServiceHub.dispatch(id, method, args)
            } catch (e: Exception) {
                IapLog.e("IapBridge: unhandled exception in dispatch id=$id method=$method", e)
                respondErr(id, "E_UNKNOWN", e.message ?: "Unknown error")
            }
        }
    }

    // -------------------------------------------------------------------------
    // Outbound helpers
    // -------------------------------------------------------------------------

    /**
     * Send a successful response for request [id].
     *
     * @param data Any JSON-serialisable value: [JSONObject], [org.json.JSONArray],
     *             [String], [Number], [Boolean], or null.
     */
    fun respondOk(id: Int, data: Any? = null) {
        val payload = JSONObject().apply {
            put("kind", "response")
            put("id", id)
            put("success", true)
            put("data", data ?: JSONObject.NULL)
        }
        sendToScript(payload.toString())
    }

    /**
     * Send an error response for request [id].
     *
     * @param code        Error code string (e.g. "E_NOT_SUPPORTED", "E_IAP_NOT_AVAILABLE").
     * @param message     Human-readable message.
     * @param debugMessage Optional longer debug info.
     * @param responseCode Optional numeric billing response code.
     */
    fun respondErr(
        id: Int,
        code: String,
        message: String,
        debugMessage: String? = null,
        responseCode: Int? = null
    ) {
        val error = JSONObject().apply {
            put("code", code)
            put("message", message)
            if (debugMessage != null) put("debugMessage", debugMessage)
            if (responseCode != null) put("responseCode", responseCode)
        }
        val payload = JSONObject().apply {
            put("kind", "response")
            put("id", id)
            put("success", false)
            put("error", error)
        }
        sendToScript(payload.toString())
    }

    /**
     * Fire a push event toward JS (not tied to a request/response cycle).
     *
     * @param name    Event name (e.g. "purchaseUpdated", "connected").
     * @param payload Any JSON-serialisable value or null.
     */
    fun emitEvent(name: String, payload: Any? = null) {
        val msg = JSONObject().apply {
            put("kind", "event")
            put("name", name)
            put("payload", payload ?: JSONObject.NULL)
        }
        sendToScript(msg.toString())
    }

    // -------------------------------------------------------------------------
    // Transport
    // -------------------------------------------------------------------------

    private fun sendToScript(json: String) {
        // CocosHelper.runOnGameThread ensures the callback reaches the JS engine
        // on the correct thread, matching the pattern used by libadmob's Bridge.java.
        CocosHelper.runOnGameThread {
            JsbBridgeWrapper.getInstance().dispatchEventToScript(CHANNEL, json)
        }
    }
}
