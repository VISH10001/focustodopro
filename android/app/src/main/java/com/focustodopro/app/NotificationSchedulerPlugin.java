package com.focustodopro.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

@CapacitorPlugin(
    name = "NotificationScheduler",
    permissions = {
        @Permission(
            alias = "notifications",
            strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
    }
)
public class NotificationSchedulerPlugin extends Plugin {
    private static final String TAG = "FocusNotificationSched";

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject result = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            boolean granted = ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED;
            result.put("display", granted ? "granted" : "prompt");
            result.put("granted", granted);
        } else {
            result.put("display", "granted");
            result.put("granted", true);
        }
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestPermissionForAlias("notifications", call, "notificationsCallback");
        } else {
            JSObject result = new JSObject();
            result.put("display", "granted");
            result.put("granted", true);
            call.resolve(result);
        }
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void notificationsCallback(PluginCall call) {
        checkPermissions(call);
    }

    @PluginMethod
    public void testNotification(PluginCall call) {
        try {
            AlarmReceiver.createNotificationChannels(getContext());
            Intent intent = new Intent(getContext(), AlarmReceiver.class);
            intent.putExtra("id", 99999);
            intent.putExtra("title", "FocusToDoPro Active");
            intent.putExtra("body", "Scheduled notifications and reminders are configured and working.");
            intent.putExtra("isAlarm", false);
            intent.putExtra("type", "test");
            getContext().sendBroadcast(intent);

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to trigger test notification: " + e.getMessage());
        }
    }

    @PluginMethod
    public void syncAllReminders(PluginCall call) {
        try {
            JSArray remindersArray = call.getArray("reminders");
            if (remindersArray == null) {
                remindersArray = new JSArray();
            }

            AlarmReceiver.createNotificationChannels(getContext());
            cancelAllAlarms(getContext());

            // Save to SharedPreferences for persistence across device restarts
            SharedPreferences prefs = getContext().getSharedPreferences(
                AlarmReceiver.PREFS_NAME,
                Context.MODE_PRIVATE
            );
            prefs.edit().putString(AlarmReceiver.KEY_REMINDERS, remindersArray.toString()).apply();

            int scheduledCount = 0;
            for (int i = 0; i < remindersArray.length(); i++) {
                JSONObject obj = remindersArray.getJSONObject(i);
                boolean ok = scheduleReminderObject(getContext(), obj);
                if (ok) scheduledCount++;
            }

            Log.d(TAG, "Synced and scheduled " + scheduledCount + " native reminders.");
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("scheduledCount", scheduledCount);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error in syncAllReminders", e);
            call.reject("Could not sync native reminders: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        try {
            cancelAllAlarms(getContext());
            SharedPreferences prefs = getContext().getSharedPreferences(
                AlarmReceiver.PREFS_NAME,
                Context.MODE_PRIVATE
            );
            prefs.edit().remove(AlarmReceiver.KEY_REMINDERS).apply();

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Could not cancel all alarms: " + e.getMessage());
        }
    }

    public static boolean scheduleReminderObject(Context context, JSONObject obj) {
        try {
            String idStr = obj.optString("id", "");
            String title = obj.optString("title", "FocusToDoPro Reminder");
            String body = obj.optString("body", "");
            String timeStr = obj.optString("time", ""); // "HH:mm"
            String dateStr = obj.optString("date", ""); // "YYYY-MM-DD"
            String schedule = obj.optString("schedule", "always"); // "always", "weekdays", "date"
            JSONArray weekdays = obj.optJSONArray("weekdays"); // [1, 2, 3, 4, 5] (0=Sun, 1=Mon, etc.)
            boolean isAlarm = obj.optBoolean("isAlarm", false);
            String itemType = obj.optString("type", "task");

            if (timeStr.isEmpty()) return false;

            String[] timeParts = timeStr.split(":");
            int hour = Integer.parseInt(timeParts[0]);
            int minute = Integer.parseInt(timeParts[1]);

            Calendar now = Calendar.getInstance();
            Calendar target = Calendar.getInstance();
            target.set(Calendar.HOUR_OF_DAY, hour);
            target.set(Calendar.MINUTE, minute);
            target.set(Calendar.SECOND, 0);
            target.set(Calendar.MILLISECOND, 0);

            if ("date".equals(schedule) && !dateStr.isEmpty()) {
                String[] dateParts = dateStr.split("-");
                int year = Integer.parseInt(dateParts[0]);
                int month = Integer.parseInt(dateParts[1]) - 1;
                int day = Integer.parseInt(dateParts[2]);
                target.set(Calendar.YEAR, year);
                target.set(Calendar.MONTH, month);
                target.set(Calendar.DAY_OF_MONTH, day);

                // If already passed, do not schedule
                if (target.before(now)) {
                    return false;
                }
            } else if ("weekdays".equals(schedule) && weekdays != null && weekdays.length() > 0) {
                // Find next matching weekday
                boolean found = false;
                for (int dayOffset = 0; dayOffset < 8; dayOffset++) {
                    Calendar candidate = (Calendar) target.clone();
                    candidate.add(Calendar.DAY_OF_YEAR, dayOffset);
                    int jsDay = candidate.get(Calendar.DAY_OF_WEEK) - 1; // Calendar: Sun=1, Mon=2 -> JS: Sun=0, Mon=1

                    boolean matches = false;
                    for (int w = 0; w < weekdays.length(); w++) {
                        if (weekdays.getInt(w) == jsDay) {
                            matches = true;
                            break;
                        }
                    }

                    if (matches && candidate.after(now)) {
                        target = candidate;
                        found = true;
                        break;
                    }
                }
                if (!found) return false;
            } else {
                // "always" or daily
                if (target.before(now) || target.equals(now)) {
                    target.add(Calendar.DAY_OF_YEAR, 1);
                }
            }

            int notificationId = Math.abs(idStr.hashCode());
            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.putExtra("id", notificationId);
            intent.putExtra("reminderId", idStr);
            intent.putExtra("title", title);
            intent.putExtra("body", body);
            intent.putExtra("isAlarm", isAlarm);
            intent.putExtra("type", itemType);

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                notificationId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    if (isAlarm) {
                        alarmManager.setAlarmClock(
                            new AlarmManager.AlarmClockInfo(target.getTimeInMillis(), pendingIntent),
                            pendingIntent
                        );
                    } else {
                        alarmManager.setExactAndAllowWhileIdle(
                            AlarmManager.RTC_WAKEUP,
                            target.getTimeInMillis(),
                            pendingIntent
                        );
                    }
                } else {
                    alarmManager.setExact(
                        AlarmManager.RTC_WAKEUP,
                        target.getTimeInMillis(),
                        pendingIntent
                    );
                }
                Log.d(TAG, "Scheduled alarm for " + title + " at " + target.getTime());
                return true;
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule reminder object", e);
        }
        return false;
    }

    private static void cancelAllAlarms(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(
                AlarmReceiver.PREFS_NAME,
                Context.MODE_PRIVATE
            );
            String json = prefs.getString(AlarmReceiver.KEY_REMINDERS, null);
            if (json == null) return;

            JSONArray array = new JSONArray(json);
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.getJSONObject(i);
                String idStr = obj.optString("id", "");
                int notificationId = Math.abs(idStr.hashCode());

                Intent intent = new Intent(context, AlarmReceiver.class);
                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    notificationId,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
                );
                alarmManager.cancel(pendingIntent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error cancelling all alarms", e);
        }
    }
}
