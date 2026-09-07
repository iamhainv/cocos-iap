# Third-Party Notices

Cocos OpenIAP bundles/depends on the third-party components listed below.
Only facts that could be **verified from local evidence and/or the
corresponding upstream source repository** are recorded here. Nothing in
this file is an assertion of license terms beyond what is documented.

| Component | Version (vendored) | License | Evidence |
| --- | --- | --- | --- |
| `io.github.hyochan.openiap:openiap-google` (Android, Maven artifact) | 2.2.1 | MIT | Maven Central POM metadata (see below) |
| OpenIAP.xcframework (iOS, `dev.hyo.openiap.OpenIAP`) | 2.2.1 | MIT | Bundle identity + upstream source-repository license file (see below) |

---

## 1. `openiap-google` (Android)

- **Artifact coordinate**: `io.github.hyochan.openiap:openiap-google:2.2.1`
  (declared in `extensions/OpenIAP/template/android/libiap/build.gradle`).
- **Verification method**: fetched the published POM for this exact
  coordinate/version from Maven Central
  (`https://central.sonatype.com/artifact/io.github.hyochan.openiap/openiap-google/2.2.1`).
  The POM's `<licenses>` metadata declares:
  - License name: **MIT License**
- **Cross-check**: the upstream source repository for this artifact,
  `https://github.com/hyodotdev/openiap-google`, carries an MIT license
  badge and a `LICENSE.md` at
  `https://raw.githubusercontent.com/hyodotdev/openiap-google/main/LICENSE.md`,
  copyright hyo.dev, 2025. Version numbers are consistent with the vendored
  2.2.1 artifact.
- **Conclusion**: MIT, verified via Maven Central POM metadata (authoritative
  for the published artifact) and corroborated by the upstream repository's
  license file.

### License text (MIT, hyodotdev/openiap-google)

```
MIT License

Copyright (c) 2025 hyo.dev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 2. `OpenIAP.xcframework` (iOS)

- **Local evidence gathered** (per-slice, e.g. `ios-arm64/OpenIAP.framework`):
  - `Info.plist`: `CFBundleIdentifier: dev.hyo.openiap.OpenIAP`,
    `CFBundleShortVersionString: 2.2.1`.
  - `openiap-versions.json` (bundled inside the framework):
    `{"spec": "2.0.2", "google": "2.2.0", "apple": "2.2.1"}`.
  - **No `LICENSE`, `NOTICE`, or `COPYING` file is embedded anywhere inside
    the xcframework** — a targeted search
    (`find ... -iname "*license*" -o -iname "*notice*" -o -iname "*copying*"`)
    across all 3 architecture slices returned no results.
- **Verification method**: because no license file ships inside the binary
  itself, the license was established by matching the bundle identity/version
  (`dev.hyo.openiap.OpenIAP`, `apple: 2.2.1`) to the upstream source project:
  - `https://github.com/hyodotdev/openiap-apple` — the original standalone
    Apple/Swift repository for this bundle id. It states an MIT license, but
    the repository is now **archived**; development moved into the
    `hyodotdev/openiap` monorepo (`packages/apple` subdirectory).
  - `https://github.com/hyodotdev/openiap/tree/main/packages/apple` — the
    current, active location of the Swift source that this xcframework is
    built from. Its version numbering is consistent with the vendored
    `apple: 2.2.1` value from `openiap-versions.json`.
  - `https://raw.githubusercontent.com/hyodotdev/openiap/main/LICENSE` — the
    monorepo's root license file, fetched directly, is the MIT License,
    copyright hyo.dev, 2025.
- **Conclusion**: MIT, verified by matching the compiled binary's bundle
  identifier and version against the upstream source repository that
  produces it, and reading that repository's license file directly. This is
  **source-repository-level verification**, not a license statement embedded
  in the binary itself (none exists in the binary). If hyo.dev re-licenses a
  future version, this record would need to be re-verified against the new
  version's upstream source before upgrading the vendored xcframework.

### License text (MIT, hyodotdev/openiap monorepo, `packages/apple`)

```
MIT License

Copyright (c) 2025 hyo.dev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 3. Build metadata removed from `OpenIAP.xcframework`

The vendored xcframework originally included five `.abi.json` files (Swift
ABI-digester metadata, used for ABI-stability tooling — distinct from the
`.swiftinterface` files that are actually consumed at build/link time), one
per Swift module slice. Each embedded an **absolute build-machine source
path** from when this framework was compiled upstream, e.g. a path under a
local developer's home directory referencing the source project this
extension was extracted from.

These `.abi.json` files have been removed from this repository (working tree
and git history). The ABI digest is diagnostic-only: it is not read by the
compiler, the linker, or Xcode when consuming a binary framework, so its
removal does not affect building or linking against `OpenIAP.xcframework`.
No other file inside the xcframework — including the Mach-O binaries, the
`Info.plist` files, and the `.swiftmodule`/`.swiftinterface`/`.swiftdoc`
artifacts — was modified, rebuilt, or otherwise touched; only the
`.abi.json` files were deleted. `*.abi.json` has also been added to
`.gitignore` so a future re-vendor of this framework does not silently
reintroduce the leak. This does not affect the MIT-license determination
above.

---

## Everything else in this repository

The remaining Cocos build-plugin TypeScript sources (`source/*.ts`,
`assets/*.ts`) are original code for this extension, licensed under this
repository's own MIT license (see [LICENSE](./LICENSE)) — no other
third-party runtime dependency is vendored.
