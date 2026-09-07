# Cocos OpenIAP (中文)

为 Cocos Creator 3.8.x 原生构建提供应用内购买能力，底层基于
[OpenIAP](https://openiap.dev)：Android 使用 Google Play Billing
（`openiap-google`），iOS 使用 StoreKit 2（`OpenIAP.xcframework`）。

## 兼容性

| | 要求 |
| --- | --- |
| Cocos Creator | >= 3.8.0（基于 3.8.8 构建） |
| Android | minSdk 继承自项目的构建设置；需要 Google Play Billing（设备/模拟器需安装 Play 商店） |
| iOS | 部署目标 >= 15.0（StoreKit 2 需要 iOS 15+） |
| Web / 编辑器预览 | 不支持——所有 API 调用都会以 `E_NOT_SUPPORTED` 拒绝 |

## 服务器端验证

> **⚠️ 本扩展不会验证购买凭证。** 它只负责客户端购买流程（弹出商店购买界面，
> 并通过 `onPurchaseUpdated` / `onPurchaseError` 把平台的响应回传给游戏）。
> 恶意或被篡改的客户端可以伪造一个虚假的"购买成功"事件。**在发放任何付费
> 权益之前，你的游戏服务器必须独立验证该笔购买**：
>
> - **Android**：通过
>   [Google Play Developer API](https://developer.android.com/google/play/billing/security#verify)
>   （`purchases.products.get` / `purchases.subscriptions.get`）验证购买令牌。
> - **iOS**：通过 Apple 的
>   [App Store Server API](https://developer.apple.com/documentation/appstoreserverapi)
>   验证交易/JWS，或使用 Apple 的公钥在本地验证签名交易。
>
> 只有在后端确认购买真实有效**之后**，才能调用 `finishTransaction()`（用于
> 客户端解锁商品/避免重放）。把客户端上报的结果当作最终依据是应用内购买中
> 常见且严重的安全隐患。

## 安装

1. 将 `extensions/OpenIAP` 复制到项目的 `extensions/` 目录下（或克隆整个
   仓库后只复制该子目录）。
2. 重启 Cocos Creator，或打开 **扩展 → 扩展管理器** 确认"Cocos OpenIAP"
   已启用。
3. 如果你是从源码而非已提交的 `dist/` 构建：
   ```
   cd extensions/OpenIAP
   npm install
   npm run build
   ```
4. 在游戏脚本中导入 API：
   ```ts
   import { iap } from 'db://openiap/IapClient';
   ```

## 构建面板选项

打开 **项目 → 构建发布**，选择 Android 和/或 iOS 平台，找到 **openiap**
包的设置区域。两个平台暴露相同的两个选项：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `enableIAP` | `true` | 为本次构建启用 IAP 原生模块。关闭后，所有原生 IAP 代码/依赖都会从输出工程中排除（增量构建时会被移除）。 |
| `overwriteLibrary` | `true` | 重新构建时是否覆盖之前拷贝的原生库目录。仅当你有意手动修改了已拷贝到构建工程内的原生文件、并希望在重新构建时保留这些修改时，才应关闭此项。 |

两个选项在各平台下独立生效——例如你可以只关闭 Android 分区下的
`enableIAP`，仅在 iOS 上提供内购功能。

## 升级 openiap-google 版本

Android 端在 Maven Central 上锁定了一个精确版本：

```
// extensions/OpenIAP/template/android/libiap/build.gradle
implementation 'io.github.hyochan.openiap:openiap-google:2.2.1'
```

升级步骤：

1. 在 [Maven Central](https://central.sonatype.com/artifact/io.github.hyochan.openiap/openiap-google)
   查看新版本，并核实其许可证（2.2.1 版本的核实方法见
   [THIRD_PARTY_NOTICES.md](../../../THIRD_PARTY_NOTICES.md)）。
2. 修改上面 `build.gradle` 中的版本号。
3. 重新构建 Android 工程（需保持 `overwriteLibrary` 为 `true`，或手动重新
   拷贝 `libiap` 目录），让 Gradle 重新解析该依赖。
4. 重新测试 `fetchProducts` / `requestPurchase`——Play Billing 库的大版本
   升级有时会改变一些边缘情况下的返回结构。

iOS 端是**预编译并已提交到仓库**的 `OpenIAP.xcframework`（版本 2.2.1）——
没有单独的"版本号"可修改；升级 iOS 端意味着用
[hyodotdev/openiap](https://github.com/hyodotdev/openiap) 项目构建出的新版本
替换 `extensions/OpenIAP/template/ios/iap/OpenIAP.xcframework`，并在提交前
重新核实其许可证/版本元数据。

## API 参考

完整的 JSDoc 见
[`assets/IapClient.ts`](../../assets/IapClient.ts)——本节是公开 API 的摘要。
导入单例：

```ts
import { iap } from 'db://openiap/IapClient';
```

### 连接

| 方法 | 说明 |
| --- | --- |
| `initConnection(): Promise<boolean>` | 必须在调用其他任何 API 之前调用一次。 |
| `endConnection(): Promise<boolean>` | 断开连接并释放资源。 |

### 商品与购买

| 方法 | 说明 |
| --- | --- |
| `fetchProducts(request): Promise<Product[]>` | 获取一组 SKU 的商品详情。 |
| `requestPurchase(props): Promise<RequestPurchaseResult>` | 弹出平台购买界面。**返回值不包含购买结果**——见下文说明。 |
| `finishTransaction(purchase, isConsumable?): Promise<VoidResult>` | 在服务器验证通过后，完成一笔交易。 |
| `restorePurchases(): Promise<void>` | 恢复之前已完成的交易。 |
| `getAvailablePurchases(options?): Promise<Purchase[]>` | 返回当前未完结的购买记录。 |
| `getActiveSubscriptions(subscriptionIds?): Promise<ActiveSubscription[]>` | 返回当前有效订阅。 |
| `hasActiveSubscriptions(subscriptionIds?): Promise<boolean>` | 用户是否拥有任意有效订阅。 |
| `getStorefront(): Promise<string>` | ISO 3166-1 alpha-2 商店所在国家/地区代码。 |
| `getPlatform(): 'ios' \| 'android' \| 'unknown'` | 同步方法——不经过原生桥接。 |
| `deepLinkToSubscriptions(options?): Promise<void>` | 打开平台的订阅管理界面。 |

> **重要——购买结果通过事件返回，而非方法返回值。**
> `requestPurchase()` 只表示购买界面已弹出。请在调用 `requestPurchase()`
> **之前**注册 `onPurchaseUpdated` / `onPurchaseError`——无论 Android 还是
> iOS，真正的购买结果都只通过这两个事件到达。

### 事件

| 事件 | 触发时机 |
| --- | --- |
| `onPurchaseUpdated(cb)` / `offPurchaseUpdated(cb)` | 购买成功完成。 |
| `onPurchaseError(cb)` / `offPurchaseError(cb)` | 购买失败或被取消。 |
| `onConnected(cb)` / `offConnected(cb)` | 计费客户端已连接。 |
| `onDisconnected(cb)` / `offDisconnected(cb)` | 计费客户端已断开。 |
| `onPromotedProductIOS(cb)` / `off...` | （iOS）用户点击了 App Store 中的促销内购项目。 |
| `onUserChoiceBillingAndroid(cb)` / `off...` | （Android）用户在"用户选择计费"对话框中做出选择。 |
| `onDeveloperProvidedBillingAndroid(cb)` / `off...` | （Android 8.3.0+）用户选择了开发者自建计费方案。 |
| `onSubscriptionBillingIssue(cb)` / `off...` | 有效订阅进入付款异常状态。 |

### 仅 Android

`acknowledgePurchaseAndroid`、`consumePurchaseAndroid`、
`isBillingProgramAvailableAndroid`、`launchExternalLinkAndroid`、
`getPackageNameAndroid`，以及已废弃的替代计费辅助方法
（`checkAlternativeBillingAvailabilityAndroid`、
`showAlternativeBillingDialogAndroid`、
`createAlternativeBillingTokenAndroid`——已被
`isBillingProgramAvailableAndroid` 取代）。完整签名与 JSDoc 见
`assets/IapClient.ts`。

### 仅 iOS

`syncIOS`、`clearTransactionIOS`、`getPendingTransactionsIOS`、
`getReceiptDataIOS`、`isTransactionVerifiedIOS`、`getTransactionJwsIOS`、
`beginRefundRequestIOS`、`subscriptionStatusIOS`、`currentEntitlementIOS`、
`isEligibleForIntroOfferIOS`、`presentCodeRedemptionSheetIOS`、
`showManageSubscriptionsIOS`、`getAppTransactionIOS`、
`getPromotedProductIOS`，以及外部购买通知/自定义链接相关方法
（`canPresentExternalPurchaseNoticeIOS`、
`presentExternalPurchaseNoticeSheetIOS`、
`isEligibleForExternalPurchaseCustomLinkIOS`、
`getExternalPurchaseCustomLinkTokenIOS`、
`showExternalPurchaseCustomLinkNoticeIOS`）。完整签名与 JSDoc 见
`assets/IapClient.ts`。

平台相关的错误码、商品/购买字段结构与枚举定义见
[`assets/Types.ts`](../../assets/Types.ts)。

## 示例

### 获取商品并购买一个消耗型商品

```ts
import { iap } from 'db://openiap/IapClient';

async function setup() {
    await iap.initConnection();

    iap.onPurchaseUpdated(async (purchase) => {
        // 1. 将 purchase 发送到你的后端进行服务器端验证。
        // 2. 仅在验证通过后：
        await iap.finishTransaction(purchase, /* isConsumable */ true);
        // 3. 在本地发放对应权益（例如增加金币）。
    });

    iap.onPurchaseError((err) => {
        console.warn('购买失败/取消：', err.code, err.message);
    });

    const products = await iap.fetchProducts({ skus: ['com.example.app.coins_100'] });
    console.log(products);
}

async function buyCoins() {
    // 购买结果通过 onPurchaseUpdated/onPurchaseError 返回，而不是这里。
    await iap.requestPurchase({ sku: 'com.example.app.coins_100' });
}
```

### 恢复购买（非消耗型商品/订阅）

```ts
await iap.restorePurchases();
const owned = await iap.getAvailablePurchases();
for (const purchase of owned) {
    // 重新发放权益前，请先在服务器端再次验证。
}
```

完整可运行示例见演示场景
[`assets/scene/main.scene`](../../assets/scene/main.scene) /
[`assets/script/test/IapTest.ts`](../../assets/script/test/IapTest.ts)
（获取商品列表、购买消耗型商品、购买非消耗型商品、恢复购买、屏幕日志）。

## 疑难排解

- **所有调用都返回 `E_NOT_SUPPORTED`**：说明你正在编辑器或 Web 预览环境下
  运行。内购功能仅在原生 Android/iOS 构建中可用。
- **`E_TIMEOUT` 错误**：原生桥接在 30 秒内没有响应——检查生成该构建产物时
  是否开启了 `enableIAP`，并检查原生模块是否真正编译/链接成功（查看
  Xcode/Gradle 构建日志中与 `libiap` / `OpenIAP.xcframework` 相关的错误）。
- **商品加载为空数组**：确认对应 SKU 已在 Google Play 管理中心 / App Store
  Connect 中配置并处于激活状态，应用的 bundle id / 包名是否匹配；Android
  需使用与 Play 管理中心某个测试渠道匹配的正式签名，iOS 需登录 Sandbox
  测试账号。
- **购买成功但商品未解锁**：确保在服务器验证购买后调用了
  `finishTransaction()`——未完结的交易会在 iOS 上不断重放
  `onPurchaseUpdated`，或在 Android 上因超过 3 天未确认而自动退款。
- **演示场景出现一次性"脚本丢失"警告**：见根目录
  [README](../../../README.md#演示) 中的说明。

## 已知限制

- 本扩展不执行任何收据/令牌验证——见上文[服务器端验证](#服务器端验证)。
- Web 与编辑器预览不支持内购；所有相关调用会以 `E_NOT_SUPPORTED` 拒绝或
  返回不可用结果。
- 已废弃的 Android 替代计费方法
  （`checkAlternativeBillingAvailabilityAndroid`、
  `showAlternativeBillingDialogAndroid`、
  `createAlternativeBillingTokenAndroid`）仅为兼容保留，新代码请改用
  `isBillingProgramAvailableAndroid`。
- `OpenIAP.xcframework` 中包含 Mac Catalyst 切片，但本扩展的 Cocos 构建
  钩子并未将其作为构建目标使用（仅链接 iOS 真机与模拟器切片）。
