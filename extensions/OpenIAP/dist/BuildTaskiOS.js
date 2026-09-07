"use strict";
/*
 OpenIAP — In-App Purchase extension for Cocos Creator 3.8.8
 Ported from hyodotdev/openiap

 MIT License
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTaskiOS = exports.BuildTaskiOS = void 0;
const builder_1 = require("./builder");
const fse = __importStar(require("fs-extra"));
const TAG = '[BuildTaskiOS]';
/**
 * @en
 * Handles all iOS post-build tasks for the OpenIAP extension.
 *
 * Responsibilities:
 *  - Copy Pre-iap.cmake / Post-iap.cmake into native/engine/ios so Cocos'
 *    CMake include chain picks them up.
 *  - Copy the iap bridge directory into the built Xcode project's proj/iap
 *    folder so the CMake integration can reference it.
 *  - Honour the `enableIAP` flag: when false, remove the cmake files from
 *    native/engine/ios instead of copying them.
 */
class BuildTaskiOS {
    /**
     * @en
     * Copy Pre-iap.cmake and Post-iap.cmake into native/engine/ios,
     * and copy the iap bridge directory into the built Xcode project.
     *
     * @param option       Typed build-task options from the build panel.
     * @param buildResult  Build result carrying the destination path.
     */
    copyIapResources(option, buildResult) {
        console.log(TAG, 'copyIapResources', 'start');
        const iapOption = option.packages[builder_1.PACKAGE_NAME];
        const overwrite = iapOption.overwriteLibrary;
        // --- CMake integration files → native/engine/ios ---
        const preCmakeSrc = `${BuildTaskiOS.IapTemplatePath}/Pre-iap.cmake`;
        const postCmakeSrc = `${BuildTaskiOS.IapTemplatePath}/Post-iap.cmake`;
        const preCmakeDest = `${BuildTaskiOS.NativePath}/Pre-iap.cmake`;
        const postCmakeDest = `${BuildTaskiOS.NativePath}/Post-iap.cmake`;
        fse.copySync(preCmakeSrc, preCmakeDest, { overwrite });
        fse.copySync(postCmakeSrc, postCmakeDest, { overwrite });
        // --- iap bridge directory → <buildDest>/proj/iap ---
        const iapSrc = `${BuildTaskiOS.IapTemplatePath}/iap`;
        const iapDest = `${buildResult.dest}/proj/iap`;
        fse.copySync(iapSrc, iapDest, { recursive: true, overwrite });
        console.log(TAG, 'copyIapResources', 'end');
    }
    /**
     * @en
     * Remove the CMake integration files from native/engine/ios.
     *
     * Called when enableIAP is false so that a previously-enabled build does
     * not leave stale cmake includes in the shared native directory.
     */
    removeIapCmakeFiles() {
        console.log(TAG, 'removeIapCmakeFiles', 'start');
        const preCmakeDest = `${BuildTaskiOS.NativePath}/Pre-iap.cmake`;
        const postCmakeDest = `${BuildTaskiOS.NativePath}/Post-iap.cmake`;
        fse.removeSync(preCmakeDest);
        fse.removeSync(postCmakeDest);
        console.log(TAG, 'removeIapCmakeFiles', 'end');
    }
    /**
     * @en
     * Entry point called by the build hook for iOS post-build tasks.
     *
     * @param options      Typed build-task options from the build panel.
     * @param buildResult  Build result carrying the destination path.
     */
    executePostBuildTasks(options, buildResult) {
        console.log(TAG, 'executePostBuildTasks', 'start');
        const iapOption = options.packages[builder_1.PACKAGE_NAME];
        const enableIAP = iapOption.enableIAP;
        if (enableIAP) {
            this.copyIapResources(options, buildResult);
        }
        else {
            console.log(TAG, 'executePostBuildTasks', 'enableIAP is false — removing cmake files');
            this.removeIapCmakeFiles();
        }
        console.log(TAG, 'executePostBuildTasks', 'all tasks done.');
    }
}
exports.BuildTaskiOS = BuildTaskiOS;
/** Absolute path to the extension's iOS template directory. */
BuildTaskiOS.IapTemplatePath = `${__dirname}/../template/ios`;
/** Absolute path to the engine's native iOS directory (shared across builds). */
BuildTaskiOS.NativePath = `${Editor.Project.path}/native/engine/ios`;
/**
 * @en
 * The global instance of the iOS build task.
 * Exported as `buildTaskiOS.ios` to match the shape hooks.ts expects.
 */
exports.buildTaskiOS = {
    ios: new BuildTaskiOS(),
};
