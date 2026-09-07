# Cocos OpenIAP — Android Requirements (中文)

## 权限 / 能力

- `com.android.vending.BILLING`——由扩展的 `AndroidManifest.xml` 自动声明，
  无需手动配置。
- 会注册一个 `initOrder="99"` 的 `IapInitProvider` 内容提供者，确保
  JS↔原生桥接监听器在第一帧 JS 运行之前就绪。它是一个空操作的
  ContentProvider（不实际查询任何数据）——其存在纯粹是为了挂载到应用初始化
  的早期生命周期上。

## 构建配置

- 当构建面板中勾选 `enableIAP` 时，扩展会：
  - 向应用的 `build.gradle` 注入 `implementation project(':libiap')`，
    向 `settings.gradle` 注入 `include ':libiap'`（幂等操作，可安全应对
    重复/增量构建）。
  - 将 `libiap` 原生模块（Kotlin 桥接代码 + `openiap-google` Gradle 依赖
    声明）拷贝到构建工程中，由 `overwriteLibrary` 控制是否覆盖。
- `libiap` 自身的 `build.gradle` 锁定了以下版本：
  ```
  implementation 'io.github.hyochan.openiap:openiap-google:2.2.1'
  implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0'
  ```
  Kotlin 插件版本为 `2.2.0`。`compileSdkVersion` / `minSdkVersion` /
  `targetSdkPreview` 继承自项目全局 Gradle 属性
  （`PROP_COMPILE_SDK_VERSION`、`PROP_MIN_SDK_VERSION`、
  `PROP_TARGET_SDK_VERSION`）——即整个 Cocos Android 构建已经在使用的值，
  并非本扩展单独强制的最低版本。
- 版本升级方法见
  [openiap-google 版本锁定](../index.md#升级-openiap-google-版本)。

## 已知限制

- 需要设备/模拟器已安装 Google Play 商店，并登录了对该应用 Play 管理中心
  有访问权限的账号（内部测试渠道或更高）才能真正完成一笔购买——这是 Play
  Billing 库本身的限制，并非本扩展引入。
- 已废弃的替代计费辅助方法
  （`checkAlternativeBillingAvailabilityAndroid`、
  `showAlternativeBillingDialogAndroid`、
  `createAlternativeBillingTokenAndroid`）仅为兼容保留；请优先使用
  `isBillingProgramAvailableAndroid`。
