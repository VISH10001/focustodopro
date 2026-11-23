import { Capacitor, registerPlugin } from '@capacitor/core';

const AppUpdater = registerPlugin('AppUpdater');

export const UPDATE_MANIFEST_URL =
  'https://focustodopro.vercel.app/updates/update.json';

export async function checkForAppUpdate() {
  // 1. Android native Capacitor platform
  if (Capacitor.isNativePlatform()) {
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

  // 2. Windows Desktop (Electron)
  if (typeof window !== 'undefined' && window.electronAPI?.checkForUpdates) {
    try {
      const electronResult = await window.electronAPI.checkForUpdates();
      if (electronResult) return electronResult;
    } catch (e) {
      throw new Error(e.message || 'Windows update check failed.', { cause: e });
    }
  }

  // Local development-only popup test (never active in production)
  if (
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('testUpdatePopup') === '1'
  ) {
    return {
      versionCode: 4,
      versionName: '1.0.2',
      currentVersion: '1.0.1',
      currentVersionCode: 3,
      apkUrl: 'https://focustodopro.vercel.app/updates/focustodopro.apk',
      sha256: 'D0EF1E91E8226E581E89FA29A2A3EE8409C3433447314BC25E624E89F9BBB304',
      releaseNotes: 'LOCAL TEST: FocusToDoPro 1.0.2 update popup display test.'
    };
  }
  // 3. Web browser: native app updates are not applicable here.
  return null;
}

export async function downloadAndInstallUpdate(update) {
  if (Capacitor.isNativePlatform()) {
    return AppUpdater.downloadAndInstall({
      url: update.apkUrl,
      sha256: update.sha256,
    });
  }

  if (typeof window !== 'undefined' && window.electronAPI?.downloadAndInstallUpdate) {
    return window.electronAPI.downloadAndInstallUpdate();
  }

  return null;
}

export function addUpdateDownloadListener(callback) {
  if (Capacitor.isNativePlatform()) {
    return AppUpdater.addListener('downloadProgress', callback);
  }

  if (typeof window !== 'undefined' && window.electronAPI?.onUpdateDownloadProgress) {
    return window.electronAPI.onUpdateDownloadProgress(callback);
  }

  return { remove: () => {} };
}


