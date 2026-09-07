# Cocos OpenIAP — iOS Requirements (中文)

## 权限 / 能力

- StoreKit 购买本身不需要额外的 `Info.plist` 能力声明；请确保你的应用
  target 在 Xcode / Apple 开发者账号中已启用 **App 内购买**能力（这是任何
  销售内购的应用都需要的标准设置，与本扩展无关）。
- `StoreKit.framework` 由扩展的 CMake 规则自动链接，无需手动配置。

## 构建配置

- 当构建面板中勾选 `enableIAP` 时，扩展会：
  - 将 `Pre-iap.cmake` / `Post-iap.cmake` 拷贝到 `native/engine/ios`
    （前置钩子当前为空操作；后置钩子会在存在时 include 桥接的
    `iap.cmake`）。
  - 将 `template/ios/iap` 桥接目录（Objective-C++ 桥接源码 +
    `OpenIAP.xcframework`）拷贝到 `<buildDest>/proj/iap`，由
    `overwriteLibrary` 控制是否覆盖。
- `iap.cmake` 会链接 `OpenIAP.xcframework`（真机与模拟器切片，通过
  `${CURRENT_ARCH}` 在 Xcode 构建时解析）以及 `-framework StoreKit`，设置
  `ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES = YES`（因为该框架基于
  Swift/async-await 构建），并添加 Swift 运行时搜索路径。
- **最低部署目标：iOS 15.0。** OpenIAP 的 Swift 库使用了 StoreKit 2 的
  async/await API，需要 iOS 15 及以上。如果项目的
  `CMAKE_OSX_DEPLOYMENT_TARGET` 更低，Xcode 构建可能仍会成功（因为
  xcframework 自身通过 `SWIFT_DEPLOYMENT_TARGET` 强制限制），但在低于
  iOS 15 的设备上运行时调用 StoreKit 2 API 会崩溃。请将项目部署目标设置为
  15.0 或更高。
- 关于所捆绑二进制文件的版本信息与替换方法见
  [openiap.xcframework 版本说明](../index.md#升级-openiap-google-版本)。

## 已知限制

- `OpenIAP.xcframework` 中包含 Mac Catalyst 切片，但本扩展的 CMake 规则
  并未将其接入为构建目标（仅链接 `ios-arm64` 真机与
  `ios-arm64_x86_64-simulator` 模拟器切片）。
- 购买功能必须使用 Sandbox Apple ID（或 TestFlight）进行测试——开发版本
  无法测试真实的 App Store 购买。
