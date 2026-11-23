package com.focustodopro.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "FocusAlarmReceiver";
    public static final String CHANNEL_REMINDERS = "focustodopro_reminders";
    public static final String CHANNEL_ALARMS = "focustodopro_alarms";
    public static final String PREFS_NAME = "focustodopro_reminders_prefs";
    public static final String KEY_REMINDERS = "scheduled_reminders";

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            int notificationId = intent.getIntExtra("id", (int) System.currentTimeMillis());
            String title = intent.getStringExtra("title");
            String body = intent.getStringExtra("body");
            boolean isAlarm = intent.getBooleanExtra("isAlarm", false);
            String itemType = intent.getStringExtra("type"); // "task" or "project"
            String reminderId = intent.getStringExtra("reminderId");

            if (title == null || title.isEmpty()) {
                title = "FocusToDoPro Reminder";
            }
            if (body == null || body.isEmpty()) {
                body = "You have a scheduled reminder.";
            }

            createNotificationChannels(context);

            Intent openIntent = new Intent(context, MainActivity.class);
            openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            openIntent.putExtra("notificationId", notificationId);
            openIntent.putExtra("reminderId", reminderId);

            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                notificationId,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            String channelId = isAlarm ? CHANNEL_ALARMS : CHANNEL_REMINDERS;
            Uri defaultSoundUri = RingtoneManager.getDefaultUri(isAlarm ? RingtoneManager.TYPE_ALARM : RingtoneManager.TYPE_NOTIFICATION);

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(isAlarm ? NotificationCompat.PRIORITY_MAX : NotificationCompat.PRIORITY_HIGH)
                .setCategory(isAlarm ? NotificationCompat.CATEGORY_ALARM : NotificationCompat.CATEGORY_REMINDER)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setVibrate(isAlarm ? new long[]{0, 500, 250, 500, 250, 500} : new long[]{0, 250, 250, 250});

            if (defaultSoundUri != null) {
                builder.setSound(defaultSoundUri);
            }

            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
            notificationManager.notify(notificationId, builder.build());
            Log.d(TAG, "Notification delivered: id=" + notificationId + ", title=" + title);

            // Reschedule next occurrence if recurring
            rescheduleRecurringIfApplicable(context, reminderId);

        } catch (Exception e) {
            Log.e(TAG, "Error in AlarmReceiver onReceive", e);
        }
    }

    public static void createNotificationChannels(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = context.getSystemService(NotificationManager.class);
            if (manager == null) return;

            // Reminders Channel
            NotificationChannel remindersChannel = new NotificationChannel(
                CHANNEL_REMINDERS,
                "FocusToDoPro Reminders",
                NotificationManager.IMPORTANCE_HIGH
            );
            remindersChannel.setDescription("Scheduled notifications for tasks and projects");
            remindersChannel.enableLights(true);
            remindersChannel.setLightColor(Color.parseColor("#EF5350"));
            remindersChannel.enableVibration(true);

            // Alarms Channel
            NotificationChannel alarmsChannel = new NotificationChannel(
                CHANNEL_ALARMS,
                "FocusToDoPro Alarms",
                NotificationManager.IMPORTANCE_HIGH
            );
            alarmsChannel.setDescription("High-priority alarm notifications for tasks and projects");
            alarmsChannel.enableLights(true);
            alarmsChannel.setLightColor(Color.RED);
            alarmsChannel.enableVibration(true);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build();
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri != null) {
                alarmsChannel.setSound(alarmUri, audioAttributes);
            }

            manager.createNotificationChannel(remindersChannel);
            manager.createNotificationChannel(alarmsChannel);
        }
    }

    private void rescheduleRecurringIfApplicable(Context context, String reminderId) {
        if (reminderId == null) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String json = prefs.getString(KEY_REMINDERS, null);
            if (json == null) return;

            JSONArray array = new JSONArray(json);
            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.getJSONObject(i);
                if (reminderId.equals(obj.optString("id"))) {
                    String schedule = obj.optString("schedule");
                    if ("weekdays".equals(schedule) || "always".equals(schedule)) {
                        NotificationSchedulerPlugin.scheduleReminderObject(context, obj);
                    }
                    break;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to reschedule recurring reminder", e);
        }
    }
}
