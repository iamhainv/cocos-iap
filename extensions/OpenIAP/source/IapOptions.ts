/*
 OpenIAP — In-App Purchase extension for Cocos Creator 3.8.8
 Ported from hyodotdev/openiap

 MIT License
*/

/**
 * @en
 * IapOption holds the build-panel configurations for the OpenIAP extension.
 * After the build process completes the custom options are passed via
 * `onAfterBuild` / `onAfterCompressSettings` in `hooks.ts`.
 * Fetch them with `options.packages[PACKAGE_NAME]`.
 */
export interface IapOption {
    /**
     * @en
     * Enable or disable the IAP extension.
     * When true, native library files are copied and Gradle/CMake snippets are
     * injected into the built project.  When false, all injected content is
     * cleanly removed.
     */
    enableIAP?: boolean;

    /**
     * @en
     * Force-overwrite the native library directory in the built project on every
     * build, even when it already exists.  Disable to preserve manual edits.
     */
    overwriteLibrary?: boolean;
}
