package com.cocos.iap

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.net.Uri

/**
 * ContentProvider that auto-initialises the IAP bridge before the first JS frame.
 *
 * ContentProviders with a high [android:initOrder] run immediately after
 * [android.app.Application.attachBaseContext], which is before [Application.onCreate]
 * and well before the Cocos JS engine boots. This guarantees that the
 * JsbBridgeWrapper listener on channel "iap" is registered and ready before
 * any JS code can call `dispatchEventToNative("iap", ...)`.
 *
 * Declared in AndroidManifest.xml with:
 *   android:authorities="${applicationId}.iapinit"
 *   android:exported="false"
 *   android:initOrder="99"
 */
class IapInitProvider : ContentProvider() {

    override fun onCreate(): Boolean {
        IapLog.d("IapInitProvider.onCreate — registering bridge")
        IapBridge.register()
        return true
    }

    // -------------------------------------------------------------------------
    // ContentProvider stubs — not a real content provider.
    // -------------------------------------------------------------------------

    override fun query(
        uri: Uri,
        projection: Array<out String>?,
        selection: String?,
        selectionArgs: Array<out String>?,
        sortOrder: String?
    ): Cursor? = null

    override fun getType(uri: Uri): String? = null

    override fun insert(uri: Uri, values: ContentValues?): Uri? = null

    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int = 0

    override fun update(
        uri: Uri,
        values: ContentValues?,
        selection: String?,
        selectionArgs: Array<out String>?
    ): Int = 0
}
