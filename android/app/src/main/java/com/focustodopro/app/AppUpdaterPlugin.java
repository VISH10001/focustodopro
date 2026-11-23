package com.focustodopro.app;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void getAppInfo(PluginCall call) {
        try {
            PackageInfo info = getContext().getPackageManager()
                .getPackageInfo(getContext().getPackageName(), 0);

            JSObject result = new JSObject();
            result.put("versionCode", info.versionCode);
            result.put("versionName", info.versionName);
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Could not read app version: " + e.getMessage());
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        String expectedHash = call.getString("sha256");

        if (url == null || !url.startsWith("https://")) {
            call.reject("A valid HTTPS APK URL is required.");
            return;
        }

        if (expectedHash == null || !expectedHash.matches("(?i)[a-f0-9]{64}")) {
            call.reject("A valid SHA-256 checksum is required.");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            !getContext().getPackageManager().canRequestPackageInstalls()) {

            Intent settingsIntent = new Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + getContext().getPackageName())
            );

            getActivity().startActivity(settingsIntent);

            JSObject result = new JSObject();
            result.put("permissionRequired", true);
            call.resolve(result);
            return;
        }

        executor.execute(() -> {
            HttpURLConnection connection = null;

            try {
                File apkFile = new File(
                    getContext().getCacheDir(),
                    "focustodopro-update.apk"
                );

                connection = (HttpURLConnection) new URL(url).openConnection();
                connection.setConnectTimeout(20000);
                connection.setReadTimeout(30000);
                connection.setInstanceFollowRedirects(true);
                connection.connect();

                if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
                    throw new Exception("APK download failed. HTTP " +
                        connection.getResponseCode());
                }

                long totalBytes = connection.getContentLengthLong();

                if (totalBytes > 300L * 1024L * 1024L) {
                    throw new Exception("APK exceeds the 300 MB download limit.");
                }

                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                long downloaded = 0;
                int lastProgress = -1;

                try (InputStream input = connection.getInputStream();
                     FileOutputStream output = new FileOutputStream(apkFile)) {

                    byte[] buffer = new byte[8192];
                    int count;

                    while ((count = input.read(buffer)) != -1) {
                        output.write(buffer, 0, count);
                        digest.update(buffer, 0, count);
                        downloaded += count;

                        int progress = totalBytes > 0 ? (int) (downloaded * 100 / totalBytes) : 0;
                        if (progress != lastProgress || downloaded == totalBytes) {
                            lastProgress = progress;
                            JSObject progressData = new JSObject();
                            progressData.put("progress", progress);
                            progressData.put("bytesDownloaded", downloaded);
                            progressData.put("totalBytes", totalBytes);
                            notifyListeners("downloadProgress", progressData);
                        }
                    }
                }

                StringBuilder actualHash = new StringBuilder();

                for (byte b : digest.digest()) {
                    actualHash.append(String.format("%02x", b));
                }

                if (!actualHash.toString().equalsIgnoreCase(expectedHash)) {
                    apkFile.delete();
                    throw new Exception("APK security verification failed. Checksum mismatch.");
                }

                Uri apkUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    apkFile
                );

                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(
                    apkUri,
                    "application/vnd.android.package-archive"
                );
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                getActivity().runOnUiThread(() -> {
                    try {
                        getActivity().startActivity(installIntent);

                        JSObject result = new JSObject();
                        result.put("permissionRequired", false);
                        result.put("downloaded", true);
                        call.resolve(result);

                    } catch (Exception e) {
                        call.reject("Could not open Android installer: " + e.getMessage());
                    }
                });

            } catch (Exception e) {
                call.reject("Update failed: " + e.getMessage());

            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        });
    }
}

