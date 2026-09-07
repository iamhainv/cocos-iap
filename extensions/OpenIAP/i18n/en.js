module.exports = {
    title: 'OpenIAP — In-App Purchase Extension',
    description: 'OpenIAP — In-app purchase (StoreKit 2 / Google Play Billing 8) for iOS and Android',

    enableIAP: {
        title: 'Enable IAP',
        tip: 'Enable or disable the IAP module. When enabled, CMake integration files are copied into native/engine/ios and the iap bridge directory is copied into the built project.',
    },

    overwriteLibrary: {
        title: 'Force overwrite the IAP library',
        tip: 'Force overwrite the files in the built proj/iap from the extension\'s template.',
    },
};
