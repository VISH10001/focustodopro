package com.focustodopro.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "FocusBootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        Log.d(TAG, "BootReceiver triggered with action: " + action);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(action) ||
            "com.htc.intent.action.QUICKBOOT_POWERON".equals(action)) {

            try {
                AlarmReceiver.createNotificationChannels(context);

                SharedPreferences prefs = context.getSharedPreferences(
                    AlarmReceiver.PREFS_NAME,
                    Context.MODE_PRIVATE
                );
                String json = prefs.getString(AlarmReceiver.KEY_REMINDERS, null);

                if (json != null && !json.isEmpty()) {
                    JSONArray array = new JSONArray(json);
                    Log.d(TAG, "Restoring " + array.length() + " scheduled reminders after restart.");

                    for (int i = 0; i < array.length(); i++) {
                        JSONObject obj = array.getJSONObject(i);
                        NotificationSchedulerPlugin.scheduleReminderObject(context, obj);
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Error restoring alarms on boot", e);
            }
        }
    }
}
