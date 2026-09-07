# Cocos OpenIAP — Extension

This is the Cocos Creator extension package (build-panel plugin + runtime
API + native templates) for in-app purchases, backed by
[OpenIAP](https://openiap.dev).

- Full documentation (English): [doc/en/index.md](./doc/en/index.md)
- Full documentation (中文): [doc/zh/index.md](./doc/zh/index.md)
- Android platform notes: [doc/en/android/index.md](./doc/en/android/index.md) / [doc/zh/android/index.md](./doc/zh/android/index.md)
- iOS platform notes: [doc/en/ios/index.md](./doc/en/ios/index.md) / [doc/zh/ios/index.md](./doc/zh/ios/index.md)

## Layout

- `source/` — TypeScript build-plugin source (compiled to `dist/`).
- `dist/` — compiled build-plugin JavaScript, loaded by Cocos Creator.
- `assets/` — runtime API (`IapClient`, `Types`, native bridge), mounted
  read-only into your project's asset database as `db://openiap/...`.
- `i18n/` — build-panel label translations (English / Chinese).
- `template/android/`, `template/ios/` — native payload copied into your
  built project by the build hooks when `enableIAP` is on.

## License

MIT — see the repository root [LICENSE](../../LICENSE). Vendored
third-party components keep their own licenses; see
[THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).
