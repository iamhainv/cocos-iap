/*
 OpenIAP — In-App Purchase extension for Cocos Creator 3.8.8
 Ported from hyodotdev/openiap

 MIT License
*/

import { IBuildResult } from '../@types';
import { PACKAGE_NAME } from './builder';
import { IapOption } from './IapOptions';
import * as fse from 'fs-extra';
import { ITaskOptions } from './hooks';

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
export class BuildTaskiOS {

    /** Absolute path to the extension's iOS template directory. */
    static readonly IapTemplatePath = `${__dirname}/../template/ios`;

    /** Absolute path to the engine's native iOS directory (shared across builds). */
    static readonly NativePath = `${Editor.Project.path}/native/engine/ios`;

    /**
     * @en
     * Copy Pre-iap.cmake and Post-iap.cmake into native/engine/ios,
     * and copy the iap bridge directory into the built Xcode project.
     *
     * @param option       Typed build-task options from the build panel.
     * @param buildResult  Build result carrying the destination path.
     */
    copyIapResources(option: ITaskOptions, buildResult: IBuildResult): void {
        console.log(TAG, 'copyIapResources', 'start');

        const iapOption = option.packages[PACKAGE_NAME] as IapOption;
        const overwrite = iapOption.overwriteLibrary;

        // --- CMake integration files → native/engine/ios ---
        const preCmakeSrc  = `${BuildTaskiOS.IapTemplatePath}/Pre-iap.cmake`;
        const postCmakeSrc = `${BuildTaskiOS.IapTemplatePath}/Post-iap.cmake`;
        const preCmakeDest  = `${BuildTaskiOS.NativePath}/Pre-iap.cmake`;
        const postCmakeDest = `${BuildTaskiOS.NativePath}/Post-iap.cmake`;

        fse.copySync(preCmakeSrc,  preCmakeDest,  { overwrite });
        fse.copySync(postCmakeSrc, postCmakeDest, { overwrite });

        // --- iap bridge directory → <buildDest>/proj/iap ---
        const iapSrc  = `${BuildTaskiOS.IapTemplatePath}/iap`;
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
    removeIapCmakeFiles(): void {
        console.log(TAG, 'removeIapCmakeFiles', 'start');

        const preCmakeDest  = `${BuildTaskiOS.NativePath}/Pre-iap.cmake`;
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
    executePostBuildTasks(options: ITaskOptions, buildResult: IBuildResult): void {
        console.log(TAG, 'executePostBuildTasks', 'start');

        const iapOption = options.packages[PACKAGE_NAME] as IapOption;
        const enableIAP = iapOption.enableIAP;

        if (enableIAP) {
            this.copyIapResources(options, buildResult);
        } else {
            console.log(TAG, 'executePostBuildTasks', 'enableIAP is false — removing cmake files');
            this.removeIapCmakeFiles();
        }

        console.log(TAG, 'executePostBuildTasks', 'all tasks done.');
    }
}

/**
 * @en
 * The global instance of the iOS build task.
 * Exported as `buildTaskiOS.ios` to match the shape hooks.ts expects.
 */
export const buildTaskiOS = {
    ios: new BuildTaskiOS(),
};
