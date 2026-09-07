# Cocos OpenIAP

[![CI](https://github.com/iamhainv/cocos-iap/actions/workflows/ci.yml/badge.svg)](https://github.com/iamhainv/cocos-iap/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](#english) | [中文](#中文)

---

<a id="english"></a>
## English

A Cocos Creator 3.8.x extension that adds in-app purchases to your native
Android and iOS builds, backed by [OpenIAP](https://openiap.dev): Google Play
Billing on Android (`openiap-google`) and StoreKit 2 on iOS
(`OpenIAP.xcframework`).

> **⚠️ Server-side receipt verification is required and NOT done by this
> extension.** This extension only handles the client-side purchase flow
> (showing the platform purchase sheet and reporting the result back to your
> game). It does **not** verify receipts/tokens against Apple's or Google's
> servers. Before granting any paid entitlement to a player, your backend
> **must** independently verify the purchase with Apple (App Store Server
> API / receipt validation) and Google (Play Developer API), and only then
> mark the purchase as fulfilled. Trusting the client-reported purchase
> result alone is not secure and is vulnerable to fraud. See
> [extensions/OpenIAP/doc/en/index.md](./extensions/OpenIAP/doc/en/index.md#server-side-verification)
> for details.

### Features

- Unified Promise-based API for fetching products, requesting purchases,
  restoring purchases and querying active subscriptions.
- Event-based purchase outcome (`onPurchaseUpdated` / `onPurchaseError`) —
  matches the underlying platform SDKs, which report purchase results
  asynchronously rather than as a direct return value.
- Android: consumable/non-consumable/subscription purchases via Google Play
  Billing, acknowledgment & consumption helpers, alternative billing support.
- iOS: StoreKit 2 purchases, transaction sync, refund requests, subscription
  management sheet, promoted in-app purchases, and more.
- Graceful degradation in the Editor/Web preview — API calls reject with
  `E_NOT_SUPPORTED` instead of crashing, so your game logic can detect and
  skip IAP UI outside of native builds.
- Demo scene with buttons for listing products, buying a consumable, buying
  a non-consumable, and restoring purchases, plus an on-screen log.

### Compatibility

| Cocos Creator | Android | iOS | Web |
| --- | --- | --- | --- |
| >= 3.8.0 | Yes (Google Play Billing) | Yes (StoreKit 2, iOS >= 15.0) | Preview only (native features degrade gracefully) |

The vendored native dependencies are pinned as of this release:

- Android: `io.github.hyochan.openiap:openiap-google:2.2.1` (MIT)
- iOS: `OpenIAP.xcframework` 2.2.1 (MIT)

See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for the full license
verification evidence, and
[extensions/OpenIAP/doc/en/index.md](./extensions/OpenIAP/doc/en/index.md#upgrading-the-openiap-google-version)
for how to change the pinned version.

### Demo

- Scene: [`extensions/OpenIAP/assets/scene/main.scene`](./extensions/OpenIAP/assets/scene/main.scene)
- Script: [`extensions/OpenIAP/assets/script/test/IapTest.ts`](./extensions/OpenIAP/assets/script/test/IapTest.ts)

Open the scene in Cocos Creator, build to Android or iOS, and run it on a
device signed into a real (or sandbox/test-track) store account. In-app
purchase APIs only work in native builds — the Editor/Web preview will show
"native only" messages for every button.

> Note: after first opening this project, Creator may show a one-time
> "script lost" warning on the demo scene's `Content` node. This is a known
> Creator caveat with hand-authored scene files — re-drag `IapTest.ts` onto
> the node and re-save the scene to clear it permanently (only needs doing
> once, by whoever owns the repo).

### Installation

1. Copy `extensions/OpenIAP` into your project's `extensions/` folder.
2. Restart Cocos Creator, or use **Extension → Extension Manager** to enable it.
3. In **Project → Build**, select the `openiap` package for the Android
   and/or iOS platform and configure `enableIAP` / `overwriteLibrary`.
4. In your script code:
   ```ts
   import { iap } from 'db://openiap/index';

   await iap.initConnection();
   const products = await iap.fetchProducts({ skus: ['my_consumable_sku'] });
   ```
5. See the full documentation: [doc/en](./extensions/OpenIAP/doc/en/index.md)

### Documentation

- English: [extensions/OpenIAP/doc/en/index.md](./extensions/OpenIAP/doc/en/index.md)
- 中文: [extensions/OpenIAP/doc/zh/index.md](./extensions/OpenIAP/doc/zh/index.md)
- Third-party licenses: [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)

### License

MIT — see [LICENSE](./LICENSE). Vendored third-party components keep their
own licenses; see [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

### Trademarks

This project is an independent, community-maintained wrapper and is **not
affiliated with, endorsed by, or sponsored by** Cocos, Google, or Apple.
"Cocos Creator", "AdMob", "Firebase", "Google Play" and "App Store" are
trademarks of their respective owners.

---

<a id="中文"></a>
## 中文

一个 Cocos Creator 3.8.x 扩展，为原生 Android 与 iOS 构建添加应用内购买功能，
底层基于 [OpenIAP](https://openiap.dev)：Android 使用 Google Play Billing
（`openiap-google`），iOS 使用 StoreKit 2（`OpenIAP.xcframework`）。

> **⚠️ 必须在服务器端验证购买凭证，本扩展不会替你完成这一步。** 本扩展仅处理
> 客户端购买流程（弹出平台购买界面并把结果回传给游戏），**不会**向 Apple 或
> Google 的服务器验证收据/令牌。在向玩家发放任何付费权益之前，你的后端
> **必须**独立地通过 Apple（App Store Server API / 收据验证）和 Google
> （Play Developer API）验证该笔购买，验证通过后才能发放。仅信任客户端上报
> 的购买结果是不安全的，容易被伪造。详见
> [extensions/OpenIAP/doc/zh/index.md](./extensions/OpenIAP/doc/zh/index.md#服务器端验证)。

### 功能特性

- 统一的基于 Promise 的 API：获取商品列表、发起购买、恢复购买、查询当前订阅状态。
- 购买结果通过事件返回（`onPurchaseUpdated` / `onPurchaseError`）——与底层平台
  SDK 的行为一致，购买结果是异步通知的，而非直接作为返回值。
- Android：通过 Google Play Billing 支持消耗型/非消耗型/订阅型购买，提供确认
  与消耗辅助方法，支持替代计费方案。
- iOS：基于 StoreKit 2 的购买、交易同步、退款请求、订阅管理面板、促销内购等。
- 在编辑器/Web 预览环境下优雅降级——API 调用会以 `E_NOT_SUPPORTED` 拒绝而不是
  崩溃，方便游戏逻辑在非原生构建下跳过内购相关 UI。
- 演示场景提供获取商品列表、购买消耗型商品、购买非消耗型商品、恢复购买的按钮，
  以及屏幕日志区域。

### 兼容性

| Cocos Creator | Android | iOS | Web |
| --- | --- | --- | --- |
| >= 3.8.0 | 支持（Google Play Billing） | 支持（StoreKit 2，iOS >= 15.0） | 仅预览（原生功能会优雅降级） |

本版本锁定的原生依赖版本：

- Android：`io.github.hyochan.openiap:openiap-google:2.2.1`（MIT）
- iOS：`OpenIAP.xcframework` 2.2.1（MIT）

完整的许可证核实证据见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)，
如何修改锁定版本见
[extensions/OpenIAP/doc/zh/index.md](./extensions/OpenIAP/doc/zh/index.md#升级-openiap-google-版本)。

### 演示

- 场景：[`extensions/OpenIAP/assets/scene/main.scene`](./extensions/OpenIAP/assets/scene/main.scene)
- 脚本：[`extensions/OpenIAP/assets/script/test/IapTest.ts`](./extensions/OpenIAP/assets/script/test/IapTest.ts)

在 Cocos Creator 中打开该场景，构建到 Android 或 iOS，并在登录了真实（或
sandbox/test-track）商店账号的设备上运行。内购 API 仅在原生构建下可用——
编辑器/Web 预览下每个按钮都会显示"仅原生支持"的提示。

> 提示：首次打开本项目时，Creator 可能会在演示场景的 `Content` 节点上显示一次
> 性的"脚本丢失"警告。这是 Creator 对手写场景文件的已知限制——只需将
> `IapTest.ts` 重新拖拽到该节点上并保存场景即可永久解决（仅需由仓库维护者
> 操作一次）。

### 安装

1. 将 `extensions/OpenIAP` 复制到项目的 `extensions/` 目录下。
2. 重启 Cocos Creator，或通过 **扩展 → 扩展管理器** 启用该扩展。
3. 在 **项目 → 构建发布** 中，为 Android 和/或 iOS 平台选择 `openiap` 包，
   并配置 `enableIAP` / `overwriteLibrary`。
4. 在脚本代码中：
   ```ts
   import { iap } from 'db://openiap/index';

   await iap.initConnection();
   const products = await iap.fetchProducts({ skus: ['my_consumable_sku'] });
   ```
5. 查看完整文档：[doc/zh](./extensions/OpenIAP/doc/zh/index.md)

### 文档

- English: [extensions/OpenIAP/doc/en/index.md](./extensions/OpenIAP/doc/en/index.md)
- 中文: [extensions/OpenIAP/doc/zh/index.md](./extensions/OpenIAP/doc/zh/index.md)
- 第三方许可证：[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)

### 许可证

MIT — 详见 [LICENSE](./LICENSE)。所捆绑的第三方组件保留其各自的许可证，详见
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

### 商标声明

本项目为独立的社区维护封装库，**与 Cocos、Google、Apple 均无关联，未获得其
认可或赞助**。"Cocos Creator"、"AdMob"、"Firebase"、"Google Play" 与
"App Store" 均为其各自所有者的商标。
