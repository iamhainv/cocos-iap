package com.cocos.iap

import com.cocos.lib.GlobalObject
import dev.hyo.openiap.listener.OpenIapDeveloperProvidedBillingListener
import dev.hyo.openiap.listener.OpenIapPurchaseErrorListener
import dev.hyo.openiap.listener.OpenIapPurchaseUpdateListener
import dev.hyo.openiap.listener.OpenIapSubscriptionBillingIssueListener
import dev.hyo.openiap.listener.OpenIapUserChoiceBillingListener
import dev.hyo.openiap.store.OpenIapStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

/**
 * Singleton that owns the [OpenIapStore] instance and routes wire-protocol
 * method calls from [IapBridge] to the appropriate store API.
 *
 * All suspend work runs on [scope], which is [Dispatchers.Main.immediate]
 * (the Cocos game-thread dispatcher). No blocking calls are permitted.
 */
internal object IapServiceHub {

    /** Coroutine scope for all IAP work. SupervisorJob prevents one failure
     *  from cancelling sibling coroutines. */
    val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    private var _store: OpenIapStore? = null

    /** Lazily created store. [GlobalObject.getActivity()] provides the Context. */
    private val store: OpenIapStore
        get() {
            return _store ?: run {
                val activity = GlobalObject.getActivity()
                    ?: error("IapServiceHub: activity is null — cannot create OpenIapStore")
                OpenIapStore(activity).also { s ->
                    s.setActivity(activity)
                    registerListeners(s)
                    _store = s
                }
            }
        }

    // -------------------------------------------------------------------------
    // Listener registration
    // -------------------------------------------------------------------------

    private fun registerListeners(s: OpenIapStore) {
        s.addPurchaseUpdateListener(OpenIapPurchaseUpdateListener { purchase ->
            IapBridge.emitEvent("purchaseUpdated", purchaseToJson(purchase))
        })

        s.addPurchaseErrorListener(OpenIapPurchaseErrorListener { error ->
            val payload = JSONObject().apply {
                put("code", error.code ?: "E_UNKNOWN")
                put("message", error.message ?: "Unknown IAP error")
            }
            IapBridge.emitEvent("purchaseError", payload)
        })

        s.addUserChoiceBillingListener(OpenIapUserChoiceBillingListener { details ->
            IapBridge.emitEvent("userChoiceBillingAndroid", mapToJson(details.toJson()))
        })

        s.addDeveloperProvidedBillingListener(OpenIapDeveloperProvidedBillingListener { details ->
            IapBridge.emitEvent("developerProvidedBillingAndroid", mapToJson(details.toJson()))
        })

        s.addSubscriptionBillingIssueListener(OpenIapSubscriptionBillingIssueListener { purchase ->
            IapBridge.emitEvent("subscriptionBillingIssue", purchaseToJson(purchase))
        })

        // Connected / disconnected are driven by the isConnected StateFlow.
        // Observe it in a fire-and-forget coroutine so we can emit events.
        scope.launch {
            s.isConnected.collect { connected ->
                if (connected) {
                    IapBridge.emitEvent("connected", null)
                } else {
                    IapBridge.emitEvent("disconnected", null)
                }
            }
        }
    }

    // -------------------------------------------------------------------------
    // Dispatch table
    // -------------------------------------------------------------------------

    /** Route a wire-protocol call to the appropriate [OpenIapStore] method. */
    suspend fun dispatch(id: Int, method: String, args: JSONObject) {
        when (method) {
            "initConnection"       -> handleInitConnection(id)
            "endConnection"        -> handleEndConnection(id)
            "fetchProducts"        -> handleFetchProducts(id, args)
            "requestPurchase"      -> handleRequestPurchase(id, args)
            "finishTransaction"    -> handleFinishTransaction(id, args)
            "restorePurchases"     -> handleRestorePurchases(id)
            "getAvailablePurchases" -> handleGetAvailablePurchases(id, args)
            "getActiveSubscriptions" -> handleGetActiveSubscriptions(id, args)
            "hasActiveSubscriptions" -> handleHasActiveSubscriptions(id, args)
            "getStorefront"        -> handleGetStorefront(id)
            "deepLinkToSubscriptions" -> handleDeepLinkToSubscriptions(id, args)
            "acknowledgePurchaseAndroid" -> handleAcknowledgePurchaseAndroid(id, args)
            "consumePurchaseAndroid" -> handleConsumePurchaseAndroid(id, args)
            "checkAlternativeBillingAvailabilityAndroid" ->
                handleCheckAlternativeBillingAvailability(id)
            "showAlternativeBillingDialogAndroid" ->
                handleShowAlternativeBillingDialog(id)
            "createAlternativeBillingTokenAndroid" ->
                handleCreateAlternativeBillingToken(id)
            "isBillingProgramAvailableAndroid" ->
                handleIsBillingProgramAvailable(id, args)
            "launchExternalLinkAndroid" -> handleLaunchExternalLink(id, args)
            "getPackageNameAndroid" -> handleGetPackageName(id)
            else -> {
                IapLog.w("IapServiceHub: unsupported method '$method'")
                IapBridge.respondErr(
                    id, "E_NOT_SUPPORTED",
                    "Method '$method' is not supported on Android."
                )
            }
        }
    }

    // -------------------------------------------------------------------------
    // Handlers
    // -------------------------------------------------------------------------

    private suspend fun handleInitConnection(id: Int) {
        val ok = store.initConnection()
        IapBridge.respondOk(id, JSONObject().put("connected", ok))
    }

    private fun handleEndConnection(id: Int) {
        // endConnection is a lambda property, not a suspend fun — call directly.
        scope.launch {
            try {
                store.endConnection()
                IapBridge.respondOk(id, null)
            } catch (e: Exception) {
                IapLog.e("endConnection failed", e)
                IapBridge.respondErr(id, "E_IAP_NOT_AVAILABLE", e.message ?: "endConnection failed")
            }
        }
    }

    private suspend fun handleFetchProducts(id: Int, args: JSONObject) {
        val skusArray = args.optJSONArray("skus")
        if (skusArray == null) {
            IapBridge.respondErr(id, "E_DEVELOPER_ERROR", "fetchProducts: 'skus' array is required")
            return
        }
        val skus = (0 until skusArray.length()).map { skusArray.getString(it) }
        val typeStr = args.optString("type", "in-app")

        val request = dev.hyo.openiap.ProductRequest(
            skus = skus,
            type = dev.hyo.openiap.ProductQueryType.fromJson(typeStr)
        )

        try {
            val result = store.fetchProducts(request)
            val productsArray = JSONArray()
            val subsArray = JSONArray()
            when (result) {
                is dev.hyo.openiap.FetchProductsResultProducts -> {
                    result.value?.forEach { p -> productsArray.put(mapToJson(p.toJson())) }
                }
                is dev.hyo.openiap.FetchProductsResultSubscriptions -> {
                    result.value?.forEach { s -> subsArray.put(mapToJson(s.toJson())) }
                }
                is dev.hyo.openiap.FetchProductsResultAll -> {
                    result.value?.forEach { item ->
                        when (item) {
                            is dev.hyo.openiap.ProductOrSubscription.ProductItem ->
                                productsArray.put(mapToJson(item.value.toJson()))
                            is dev.hyo.openiap.ProductOrSubscription.ProductSubscriptionItem ->
                                subsArray.put(mapToJson(item.value.toJson()))
                        }
                    }
                }
            }
            val data = JSONObject()
                .put("products", productsArray)
                .put("subscriptions", subsArray)
            IapBridge.respondOk(id, data)
        } catch (e: Exception) {
            IapLog.e("fetchProducts failed", e)
            IapBridge.respondErr(id, "E_IAP_NOT_AVAILABLE", e.message ?: "fetchProducts failed")
        }
    }

    private fun handleRequestPurchase(id: Int, args: JSONObject) {
        // requestPurchase is event-driven — the result comes via purchaseUpdated listener.
        // Respond with {pending:true} immediately after launching the purchase flow.
        scope.launch {
            try {
                val activity = GlobalObject.getActivity()
                    ?: run {
                        IapBridge.respondErr(id, "E_IAP_NOT_AVAILABLE", "Activity not available")
                        return@launch
                    }
                store.setActivity(activity)

                val argsMap = jsonObjectToMap(args)
                val props = dev.hyo.openiap.RequestPurchaseProps.fromJson(argsMap)

                store.requestPurchase(props)
                IapBridge.respondOk(id, JSONObject().put("pending", true))
            } catch (e: IllegalArgumentException) {
                IapLog.e("requestPurchase bad args", e)
                IapBridge.respondErr(id, "E_DEVELOPER_ERROR", e.message ?: "requestPurchase: invalid props")
            } catch (e: Exception) {
                IapLog.e("requestPurchase failed", e)
                IapBridge.respondErr(id, "E_PURCHASE_ERROR", e.message ?: "requestPurchase failed")
            }
        }
    }

    private fun handleFinishTransaction(id: Int, args: JSONObject) {
        scope.launch {
            try {
                val isConsumable = if (args.has("isConsumable")) args.getBoolean("isConsumable") else null
                val purchaseJson = args.optJSONObject("purchase")
                    ?: run {
                        IapBridge.respondErr(id, "E_DEVELOPER_ERROR", "finishTransaction: 'purchase' is required")
                        return@launch
                    }
                // Purchase.fromJson dispatches on __typename ("PurchaseAndroid" / "PurchaseIOS").
                // The purchase map must round-trip from a purchaseUpdated event (toJson() includes __typename).
                val purchase = dev.hyo.openiap.Purchase.fromJson(jsonObjectToMap(purchaseJson))
                store.finishTransaction(purchase, isConsumable)
                IapBridge.respondOk(id, null)
            } catch (e: IllegalArgumentException) {
                IapLog.e("finishTransaction bad purchase", e)
                IapBridge.respondErr(id, "E_DEVELOPER_ERROR",
                    "${e.message} — purchase JSON must round-trip from a purchaseUpdated event")
            } catch (e: Exception) {
                IapLog.e("finishTransaction failed", e)
                IapBridge.respondErr(id, "E_PURCHASE_ERROR", e.message ?: "finishTransaction failed")
            }
        }
    }

    private suspend fun handleRestorePurchases(id: Int) {
        try {
            val purchases = store.getAvailablePurchases(null)
            val arr = JSONArray()
            purchases.forEach { p -> arr.put(purchaseToJson(p)) }
            IapBridge.respondOk(id, arr)
        } catch (e: Exception) {
            IapLog.e("restorePurchases failed", e)
            IapBridge.respondErr(id, "E_IAP_NOT_AVAILABLE", e.message ?: "restorePurchases failed")
        }
    }

    private suspend fun handleGetAvailablePurchases(id: Int, args: JSONObject) {
        try {
            val purchases = store.getAvailablePurchases(null)
            val arr = JSONArray()
            purchases.forEach { p -> arr.put(purchaseToJson(p)) }
            IapBridge.respondOk(id, arr)
        } catch (e: Exception) {
            IapLog.e("getAvailablePurchases failed", e)
            IapBridge.respondErr(id, "E_IAP_NOT_AVAILABLE", e.message ?: "getAvailablePurchases failed")
        }
    }

    private suspend fun handleGetActiveSubscriptions(id: Int, args: JSONObject) {
        try {
            val idsArray = args.optJSONArray("subscriptionIds")
            val ids: List<String>? = if (idsArray != null)
                (0 until idsArray.length()).map { idsArray.getString(it) }
            else null
            val subs = store.getActiveSubscriptions(ids)
            val arr = JSONArray()
            subs.forEach { sub -> arr.put(mapToJson(sub.toJson())) }
            IapBridge.respondOk(id, arr)
        } catch (e: Exception) {
            IapLog.e("getActiveSubscriptions failed", e)
            IapBridge.respondErr(id, "E_IAP_NOT_AVAILABLE", e.message ?: "getActiveSubscriptions failed")
        }
    }

    private suspend fun handleHasActiveSubscriptions(id: Int, args: JSONObject) {
        try {
            val idsArray = args.optJSONArray("subscriptionIds")
            val ids: List<String>? = if (idsArray != null)
                (0 until idsArray.length()).map { idsArray.getString(it) }
            else null
            val has = store.hasActiveSubscriptions(ids)
            IapBridge.respondOk(id, JSONObject().put("hasActiveSubscriptions", has))
        } catch (e: Exception) {
            IapLog.e("hasActiveSubscriptions failed", e)
            IapBridge.respondErr(id, "E_IAP_NOT_AVAILABLE", e.message ?: "hasActiveSubscriptions failed")
        }
    }

    private fun handleGetStorefront(id: Int) {
        // Android does not expose a storefront country API equivalent to iOS.
        // Return the device locale as the closest approximation.
        val locale = java.util.Locale.getDefault()
        val data = JSONObject()
            .put("countryCode", locale.country)
            .put("identifier", "GooglePlay")
        IapBridge.respondOk(id, data)
    }

    private suspend fun handleDeepLinkToSubscriptions(id: Int, args: JSONObject) {
        try {
            val options = dev.hyo.openiap.DeepLinkOptions(
                packageNameAndroid = args.optString("packageNameAndroid", null as String?),
                skuAndroid = args.optString("skuAndroid", null as String?)
            )
            store.deepLinkToSubscriptions(options)
            IapBridge.respondOk(id, null)
        } catch (e: Exception) {
            IapLog.e("deepLinkToSubscriptions failed", e)
            IapBridge.respondErr(id, "E_PURCHASE_ERROR", e.message ?: "deepLinkToSubscriptions failed")
        }
    }

    private fun handleAcknowledgePurchaseAndroid(id: Int, args: JSONObject) {
        // finishTransaction with isConsumable=false is the OpenIAP way to acknowledge.
        val token = args.optString("purchaseToken", null as String?)
        if (token == null) {
            IapBridge.respondErr(id, "E_DEVELOPER_ERROR", "acknowledgePurchaseAndroid: 'purchaseToken' required")
            return
        }
        scope.launch {
            try {
                // Purchase.fromJson dispatches on __typename — must supply "PurchaseAndroid".
                val purchaseMap = mapOf(
                    "__typename" to "PurchaseAndroid",
                    "purchaseToken" to token,
                    "productIds" to emptyList<String>()
                )
                val purchase = dev.hyo.openiap.Purchase.fromJson(purchaseMap)
                store.finishTransaction(purchase, false)
                IapBridge.respondOk(id, null)
            } catch (e: Exception) {
                IapLog.e("acknowledgePurchaseAndroid failed", e)
                IapBridge.respondErr(id, "E_PURCHASE_ERROR", e.message ?: "acknowledgePurchaseAndroid failed")
            }
        }
    }

    private fun handleConsumePurchaseAndroid(id: Int, args: JSONObject) {
        val token = args.optString("purchaseToken", null as String?)
        if (token == null) {
            IapBridge.respondErr(id, "E_DEVELOPER_ERROR", "consumePurchaseAndroid: 'purchaseToken' required")
            return
        }
        scope.launch {
            try {
                // Purchase.fromJson dispatches on __typename — must supply "PurchaseAndroid".
                val purchaseMap = mapOf(
                    "__typename" to "PurchaseAndroid",
                    "purchaseToken" to token,
                    "productIds" to emptyList<String>()
                )
                val purchase = dev.hyo.openiap.Purchase.fromJson(purchaseMap)
                store.finishTransaction(purchase, true)
                IapBridge.respondOk(id, null)
            } catch (e: Exception) {
                IapLog.e("consumePurchaseAndroid failed", e)
                IapBridge.respondErr(id, "E_PURCHASE_ERROR", e.message ?: "consumePurchaseAndroid failed")
            }
        }
    }

    private suspend fun handleCheckAlternativeBillingAvailability(id: Int) {
        try {
            val available = store.checkAlternativeBillingAvailability()
            IapBridge.respondOk(id, JSONObject().put("available", available))
        } catch (e: Exception) {
            IapLog.e("checkAlternativeBillingAvailability failed", e)
            IapBridge.respondErr(id, "E_IAP_NOT_AVAILABLE", e.message ?: "checkAlternativeBillingAvailability failed")
        }
    }

    private suspend fun handleShowAlternativeBillingDialog(id: Int) {
        try {
            val activity = GlobalObject.getActivity()
                ?: run {
                    IapBridge.respondErr(id, "E_IAP_NOT_AVAILABLE", "Activity not available")
                    return
                }
            val shown = store.showAlternativeBillingInformationDialog(activity)
            IapBridge.respondOk(id, JSONObject().put("shown", shown))
        } catch (e: Exception) {
            IapLog.e("showAlternativeBillingDialog failed", e)
            IapBridge.respondErr(id, "E_IAP_NOT_AVAILABLE", e.message ?: "showAlternativeBillingDialog failed")
        }
    }

    private suspend fun handleCreateAlternativeBillingToken(id: Int) {
        try {
            val token = store.createAlternativeBillingReportingToken()
            IapBridge.respondOk(id, JSONObject().put("token", token ?: JSONObject.NULL))
        } catch (e: Exception) {
            IapLog.e("createAlternativeBillingToken failed", e)
            IapBridge.respondErr(id, "E_IAP_NOT_AVAILABLE", e.message ?: "createAlternativeBillingToken failed")
        }
    }

    private suspend fun handleIsBillingProgramAvailable(id: Int, args: JSONObject) {
        try {
            val programStr = args.optString("billingProgram", "externalOffer")
            val program = dev.hyo.openiap.BillingProgramAndroid.fromJson(programStr)
            val result = store.isBillingProgramAvailable(program)
            IapBridge.respondOk(id, mapToJson(result.toJson()))
        } catch (e: Exception) {
            IapLog.e("isBillingProgramAvailable failed", e)
            IapBridge.respondErr(id, "E_IAP_NOT_AVAILABLE", e.message ?: "isBillingProgramAvailable failed")
        }
    }

    private suspend fun handleLaunchExternalLink(id: Int, args: JSONObject) {
        try {
            val activity = GlobalObject.getActivity()
                ?: run {
                    IapBridge.respondErr(id, "E_IAP_NOT_AVAILABLE", "Activity not available")
                    return
                }
            store.setActivity(activity)
            val params = dev.hyo.openiap.LaunchExternalLinkParamsAndroid.fromJson(jsonObjectToMap(args))
            val launched = store.launchExternalLink(activity, params)
            IapBridge.respondOk(id, JSONObject().put("launched", launched))
        } catch (e: IllegalArgumentException) {
            IapLog.e("launchExternalLink bad args", e)
            IapBridge.respondErr(id, "E_DEVELOPER_ERROR", e.message ?: "launchExternalLink: invalid params")
        } catch (e: Exception) {
            IapLog.e("launchExternalLink failed", e)
            IapBridge.respondErr(id, "E_IAP_NOT_AVAILABLE", e.message ?: "launchExternalLink failed")
        }
    }

    private fun handleGetPackageName(id: Int) {
        val activity = GlobalObject.getActivity()
        val packageName = activity?.packageName ?: ""
        IapBridge.respondOk(id, JSONObject().put("packageName", packageName))
    }

    // -------------------------------------------------------------------------
    // Serialization helpers
    // -------------------------------------------------------------------------

    /**
     * Convert a [dev.hyo.openiap.Purchase] to a [JSONObject] using the library's
     * own [dev.hyo.openiap.Purchase.toJson] method (returns Map<String, Any?>).
     */
    private fun purchaseToJson(purchase: dev.hyo.openiap.Purchase): JSONObject =
        mapToJson(purchase.toJson())

    /**
     * Recursively convert a [Map]<String, Any?> returned by any library `.toJson()` call
     * into a [JSONObject]. Handles nested Maps, Lists, null, and primitive values.
     */
    @Suppress("UNCHECKED_CAST")
    internal fun mapToJson(map: Map<String, Any?>): JSONObject {
        val obj = JSONObject()
        for ((k, v) in map) {
            obj.put(k, toJsonValue(v))
        }
        return obj
    }

    @Suppress("UNCHECKED_CAST")
    private fun toJsonValue(v: Any?): Any = when (v) {
        null            -> JSONObject.NULL
        is Map<*, *>    -> mapToJson(v as Map<String, Any?>)
        is List<*>      -> {
            val arr = JSONArray()
            v.forEach { arr.put(toJsonValue(it)) }
            arr
        }
        else            -> v
    }

    /**
     * Recursively convert a [JSONObject] received from JS into a [Map]<String, Any?>
     * suitable for passing to library companion `.fromJson(map)` methods.
     */
    internal fun jsonObjectToMap(json: JSONObject): Map<String, Any?> {
        val map = mutableMapOf<String, Any?>()
        val keys = json.keys()
        while (keys.hasNext()) {
            val k = keys.next()
            map[k] = fromJsonValue(json.get(k))
        }
        return map
    }

    @Suppress("UNCHECKED_CAST")
    private fun fromJsonValue(v: Any?): Any? = when (v) {
        null, JSONObject.NULL -> null
        is JSONObject         -> jsonObjectToMap(v)
        is JSONArray          -> (0 until v.length()).map { fromJsonValue(v.get(it)) }
        else                  -> v
    }
}
