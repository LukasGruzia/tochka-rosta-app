# Preview / Beta build

Preview is the standalone `Точка Роста Beta` application. It uses identifiers `ru.tochkarosta.app.beta`, scheme `tochkarosta-beta`, the Beta icon and the `preview` channel. A completed binary launches from its own icon without Expo Go or Metro.

## Create a build

```powershell
cd "C:\Users\lukac\OneDrive\Desktop\tochka-rosta-app"
npx eas-cli login
npx eas-cli whoami
npx eas-cli build:configure
npx eas-cli build --platform ios --profile preview
```

Android Preview:

```powershell
npx eas-cli build --platform android --profile preview
```

The Android profile produces an internally installable APK. iOS internal distribution can require registering the tester's real device through the link provided by EAS. Credentials and UDIDs must be supplied by the account/device owner.

## Install and update

After EAS accepts the build, copy the build URL/ID from the CLI or EAS dashboard and open the installation link on the test device. A newer binary can be installed over the same Beta identifier and should preserve that variant's SQLite container.

The production app, Dev app and Beta app intentionally use separate identifiers. Their local data is isolated; installing Beta does not copy or erase production data.

## EAS Update status

The `preview` channel and `appVersion` runtime policy are prepared. EAS Update is not automatically enabled or published because this repository does not yet contain a confirmed EAS `owner`, `projectId` or update URL.

Can be delivered later without a new installation, after explicit EAS Update setup and compatibility review:

- JavaScript/TypeScript fixes;
- styles and copy;
- compatible bundled assets.

Requires a new binary:

- native dependencies;
- Expo SDK changes;
- config plugins;
- permissions;
- bundle/package identifiers;
- changes that alter the native runtime.

The runtime rule follows the official [runtime version documentation](https://docs.expo.dev/eas-update/runtime-versions/). Do not publish a production update as part of Preview testing.

## Diagnostics and rollback

- Open Profile → Beta Center.
- Complete the checklist and export the technical report or feedback JSON through Share.
- Keep the previous successful build URL/ID.
- To roll back a binary, reinstall a previously approved build from the EAS build history.
- To roll back a future update, use the EAS dashboard/CLI workflow only after Update is explicitly configured.
