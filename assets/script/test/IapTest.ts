/**
 * IapTest — runtime demo for the Cocos OpenIAP extension.
 *
 * Builds its whole UI in code (no scene-baked buttons) so the example is
 * fully readable in a single file. Attach this component to any Node in a
 * scene with a UI camera (see assets/scene/main.scene) and it will lay out
 * four buttons plus a scrolling log area:
 *
 *   - List Products      — iap.fetchProducts()
 *   - Buy Consumable     — iap.requestPurchase() for a consumable SKU, then
 *                          iap.finishTransaction(purchase, true) once the
 *                          purchaseUpdated event fires
 *   - Buy Non-Consumable — same flow for a non-consumable SKU
 *   - Restore Purchases  — iap.restorePurchases() + iap.getAvailablePurchases()
 *
 * IMPORTANT (see doc/en/index.md#server-side-verification): this demo does
 * NOT perform server-side receipt verification. It calls finishTransaction()
 * immediately after a purchaseUpdated event for demo purposes only. A real
 * game must verify the purchase with its backend BEFORE calling
 * finishTransaction() / granting the entitlement.
 *
 * On web preview / editor (non-native), the extension's bridge already
 * rejects every call with { code: 'E_NOT_SUPPORTED' } — this component just
 * catches that and shows a friendly status message instead of crashing.
 *
 * Replace CONSUMABLE_SKU / NON_CONSUMABLE_SKU below with SKUs configured in
 * your own Google Play Console / App Store Connect listing before testing
 * on a device.
 */

import { _decorator, Component, Node, Label, Graphics, Color, UITransform, Vec3, sys } from 'cc';
import { iap } from 'db://openiap/index';
import type { Product, Purchase, PurchaseError } from 'db://openiap/index';

const { ccclass } = _decorator;

const TAG = '[IapTest]';

// Replace these with real SKUs from your own store listing.
const CONSUMABLE_SKU = 'com.example.app.coins_100';
const NON_CONSUMABLE_SKU = 'com.example.app.remove_ads';

const MAX_LOG_LINES = 12;

@ccclass('IapTest')
export class IapTest extends Component {

    private _statusLabel: Label | null = null;
    private _logLabel: Label | null = null;
    private _logLines: string[] = [];
    private _connected = false;

    async onLoad() {
        this._buildUI();
        await this._connect();
    }

    onDestroy() {
        iap.offPurchaseUpdated(this._onPurchaseUpdated);
        iap.offPurchaseError(this._onPurchaseError);
        if (this._connected) {
            iap.endConnection().catch(() => { /* best-effort on teardown */ });
        }
    }

    // -----------------------------------------------------------------
    // UI construction (no scene-baked prefabs — everything built in code)
    // -----------------------------------------------------------------

    private _buildUI(): void {
        const root = this.node;
        const rootUi = root.getComponent(UITransform) ?? root.addComponent(UITransform);
        rootUi.setContentSize(640, 720);

        this._addLabel(root, 'Cocos OpenIAP Demo', 0, 320, 26, true);

        this._statusLabel = this._addLabel(
            root,
            sys.isNative
                ? 'Connecting to the store...'
                : 'Web/editor preview — native IAP is disabled here.\nBuild to Android/iOS to test.',
            0, 260, 18, false,
        );

        this._addButton(root, 'List Products', 180, () => this._onListProducts());
        this._addButton(root, 'Buy Consumable', 105, () => this._onBuy(CONSUMABLE_SKU, true));
        this._addButton(root, 'Buy Non-Consumable', 30, () => this._onBuy(NON_CONSUMABLE_SKU, false));
        this._addButton(root, 'Restore Purchases', -45, () => this._onRestore());

        this._logLabel = this._addLabel(root, '', 0, -230, 15, false);
        const logUi = this._logLabel.node.getComponent(UITransform)!;
        logUi.setContentSize(600, 280);
        this._logLabel.overflow = Label.Overflow.CLAMP;
        this._logLabel.verticalAlign = Label.VerticalAlign.TOP;
        this._logLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
    }

    private _addLabel(parent: Node, text: string, x: number, y: number, fontSize: number, bold: boolean): Label {
        const node = new Node('Label');
        parent.addChild(node);
        node.setPosition(new Vec3(x, y, 0));
        const ui = node.addComponent(UITransform);
        ui.setContentSize(600, 80);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
        label.isBold = bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.RESIZE_HEIGHT;
        label.color = new Color(255, 255, 255, 255);
        return label;
    }

    private _addButton(parent: Node, text: string, y: number, onClick: () => void): Node {
        const node = new Node(`Button_${text.replace(/\s+/g, '')}`);
        parent.addChild(node);
        node.setPosition(new Vec3(0, y, 0));

        const ui = node.addComponent(UITransform);
        ui.setContentSize(360, 56);

        const graphics = node.addComponent(Graphics);
        graphics.fillColor = new Color(43, 108, 176, 255);
        graphics.roundRect(-180, -28, 360, 56, 12);
        graphics.fill();

        const labelNode = new Node('Label');
        node.addChild(labelNode);
        const labelUi = labelNode.addComponent(UITransform);
        labelUi.setContentSize(360, 56);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 20;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.color = new Color(255, 255, 255, 255);

        node.on(Node.EventType.TOUCH_END, () => onClick(), this);

        return node;
    }

    private _setStatus(text: string): void {
        if (this._statusLabel) {
            this._statusLabel.string = text;
        }
    }

    private _log(text: string): void {
        console.log(TAG, text);
        this._logLines.push(text);
        if (this._logLines.length > MAX_LOG_LINES) {
            this._logLines.shift();
        }
        if (this._logLabel) {
            this._logLabel.string = this._logLines.join('\n');
        }
    }

    // -----------------------------------------------------------------
    // Connection
    // -----------------------------------------------------------------

    private async _connect(): Promise<void> {
        // Register purchase event handlers BEFORE calling requestPurchase().
        // Purchase outcome always arrives via these events, never as the
        // direct return value of requestPurchase() — see doc/en/index.md.
        iap.onPurchaseUpdated(this._onPurchaseUpdated);
        iap.onPurchaseError(this._onPurchaseError);

        try {
            await iap.initConnection();
            this._connected = true;
            this._setStatus(`Connected (${iap.getPlatform()}). Tap a button to test.`);
            this._log('initConnection() OK');
        } catch (e) {
            this._reportError('initConnection', e as PurchaseError);
        }
    }

    private _onPurchaseUpdated = async (purchase: Purchase): Promise<void> => {
        this._log(`purchaseUpdated: ${purchase.productId} (txn ${purchase.transactionId})`);
        this._setStatus(`Purchase received for ${purchase.productId}.`);

        // --------------------------------------------------------------
        // DEMO ONLY: in a real game, send `purchase` to your backend and
        // verify it with Google Play Developer API / Apple App Store
        // Server API BEFORE calling finishTransaction() or granting any
        // entitlement. This demo skips that step for brevity.
        // --------------------------------------------------------------
        const isConsumable = purchase.productId === CONSUMABLE_SKU;
        try {
            await iap.finishTransaction(purchase, isConsumable);
            this._log(`finishTransaction() OK for ${purchase.productId}`);
        } catch (e) {
            this._reportError('finishTransaction', e as PurchaseError);
        }
    };

    private _onPurchaseError = (err: PurchaseError): void => {
        this._reportError('purchaseError event', err);
    };

    // -----------------------------------------------------------------
    // Button handlers
    // -----------------------------------------------------------------

    private async _onListProducts(): Promise<void> {
        this._setStatus('Fetching products...');
        try {
            const products: Product[] = await iap.fetchProducts({
                skus: [CONSUMABLE_SKU, NON_CONSUMABLE_SKU],
                type: 'in-app',
            });
            if (products.length === 0) {
                this._log('fetchProducts(): no products returned (check SKUs/store setup)');
            }
            for (const p of products) {
                this._log(`Product: ${p.productId} — ${p.title} — ${p.price}`);
            }
            this._setStatus(`Fetched ${products.length} product(s).`);
        } catch (e) {
            this._reportError('fetchProducts', e as PurchaseError);
        }
    }

    private async _onBuy(sku: string, isConsumable: boolean): Promise<void> {
        this._setStatus(`Launching purchase UI for ${sku}...`);
        try {
            // sku (iOS) and skus (Android) are both set so this works cross-platform.
            await iap.requestPurchase({ sku, skus: [sku] });
            this._log(`requestPurchase(${sku}) dialog launched — awaiting purchaseUpdated/Error event.`);
            // NOTE: the resolved value here only confirms the dialog was shown;
            // it does NOT carry the purchase result. See _onPurchaseUpdated /
            // _onPurchaseError above for the actual outcome.
        } catch (e) {
            this._reportError(`requestPurchase(${sku})`, e as PurchaseError);
        }
    }

    private async _onRestore(): Promise<void> {
        this._setStatus('Restoring purchases...');
        try {
            await iap.restorePurchases();
            const owned = await iap.getAvailablePurchases();
            this._log(`restorePurchases(): ${owned.length} purchase(s) available.`);
            for (const p of owned) {
                this._log(`Owned: ${p.productId} (txn ${p.transactionId})`);
            }
            this._setStatus(`Restore complete: ${owned.length} purchase(s).`);
        } catch (e) {
            this._reportError('restorePurchases', e as PurchaseError);
        }
    }

    private _reportError(what: string, err: PurchaseError): void {
        if (err && err.code === 'E_NOT_SUPPORTED') {
            this._setStatus(`${what}: native only — build to Android/iOS to try this.`);
            this._log(`${what}: E_NOT_SUPPORTED (native only)`);
            return;
        }
        const message = (err && err.message) || String(err);
        const code = (err && err.code) || 'E_UNKNOWN';
        this._setStatus(`${what} failed [${code}]: ${message}`);
        this._log(`${what} failed [${code}]: ${message}`);
    }
}
