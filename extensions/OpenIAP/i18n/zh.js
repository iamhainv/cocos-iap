module.exports = {
    title: 'OpenIAP — 应用内购扩展',
    description: 'OpenIAP — 应用内购（StoreKit 2 / Google Play Billing 8），支持 iOS 与 Android',

    enableIAP: {
        title: '启用 IAP',
        tip: '启用或禁用 IAP 模块。启用后，CMake 集成文件将复制到 native/engine/ios，iap 桥接目录将复制到构建项目中。',
    },

    overwriteLibrary: {
        title: '强制覆盖 IAP 库文件',
        tip: '强制将扩展模板中的文件覆盖到构建输出的 proj/iap 目录。',
    },
};
