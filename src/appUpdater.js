import { Capacitor, registerPlugin } from '@capacitor/core';

const AppUpdater = registerPlugin('AppUpdater');

// Vercel deployment ke baad is URL ko actual URL se replace karenge.
export const UPDATE_MANIFEST_URL =
  'https://focustodopro.vercel.app/updates/update.json';

export async function checkForAppUpdate() {
  if (!Capacitor.isNativePlatform()) return null;

  const [appInfo, response] = await Promise.all([
    AppUpdater.getAppInfo(),
    fetch(`${UPDATE_MANIFEST_URL}?t=${Date.now()}`, {
      cache: 'no-store',
    }),
  ]);

  if (!response.ok) {
    throw new Error(`Update server returned HTTP ${response.status}`);
  }

  const update = await response.json();

  if (
    !Number.isInteger(Number(update.versionCode)) ||
    !update.versionName ||
    !update.apkUrl ||
    !/^[a-f0-9]{64}$/i.test(update.sha256 || '') ||
    !Number.isInteger(Number(appInfo.versionCode))
  ) {
    throw new Error('Invalid update information received from server.');
  }

  if (Number(update.versionCode) <= Number(appInfo.versionCode)) {
    return null;
  }

  if (!update.apkUrl.startsWith('https://')) {
    throw new Error('Update APK must use HTTPS.');
  }

  return {
    ...update,
    currentVersion: appInfo.versionName,
    currentVersionCode: Number(appInfo.versionCode),
  };
}

export async function downloadAndInstallUpdate(update) {
  return AppUpdater.downloadAndInstall({
    url: update.apkUrl,
    sha256: update.sha256,
  });
}

export function addUpdateDownloadListener(callback) {
  return AppUpdater.addListener('downloadProgress', callback);
}
