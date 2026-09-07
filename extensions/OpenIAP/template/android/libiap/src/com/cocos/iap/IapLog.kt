package com.cocos.iap

import android.util.Log

/**
 * Thin logging wrapper for the OpenIAP native module.
 *
 * All log output uses the "OpenIAP" tag so it can be filtered easily with
 * `adb logcat -s OpenIAP`.
 */
internal object IapLog {

    private const val TAG = "OpenIAP"

    /** Log a debug message. */
    fun d(msg: String) {
        Log.d(TAG, msg)
    }

    /** Log an informational message. */
    fun i(msg: String) {
        Log.i(TAG, msg)
    }

    /** Log a warning. */
    fun w(msg: String) {
        Log.w(TAG, msg)
    }

    /** Log an error, optionally with a [Throwable]. */
    fun e(msg: String, throwable: Throwable? = null) {
        if (throwable != null) {
            Log.e(TAG, msg, throwable)
        } else {
            Log.e(TAG, msg)
        }
    }
}
