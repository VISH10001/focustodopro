import { Capacitor, registerPlugin } from '@capacitor/core';

const NotificationScheduler = registerPlugin('NotificationScheduler');

export async function checkNotificationPermission() {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await NotificationScheduler.checkPermissions();
      return res?.granted || res?.display === 'granted';
    } catch (e) {
      console.warn('Native checkPermissions error:', e);
      return false;
    }
  }
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission === 'granted';
  }
  return true;
}

export async function requestNotificationPermission() {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await NotificationScheduler.requestPermissions();
      return res?.granted || res?.display === 'granted';
    } catch (e) {
      console.warn('Native requestPermissions error:', e);
      return false;
    }
  }
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch {
      return false;
    }
  }
  return true;
}

export async function testNativeNotification() {
  if (Capacitor.isNativePlatform()) {
    try {
      return await NotificationScheduler.testNotification();
    } catch (e) {
      console.warn('testNotification error:', e);
    }
  } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification('FocusToDoPro Active', {
      body: 'Scheduled notifications and reminders are configured and working.',
      icon: '/favicon.svg',
    });
  }
}

export async function syncNativeReminders(tasks = [], projects = []) {
  if (!Capacitor.isNativePlatform()) return;

  const reminders = [];

  // Active task reminders
  for (const t of tasks) {
    if (
      !t.completed &&
      t.reminderType &&
      t.reminderType !== 'none' &&
      t.reminderTime
    ) {
      reminders.push({
        id: String(t.id),
        title: 'Task Reminder',
        body: `${t.title} is due at ${t.reminderTime}.`,
        time: t.reminderTime,
        schedule: t.reminderSchedule || 'always',
        weekdays: Array.isArray(t.reminderWeekdays) ? t.reminderWeekdays : [],
        date: t.reminderDate || t.dueDate || '',
        isAlarm: t.reminderType === 'alarm' || Boolean(t.reminderAlarm),
        type: 'task',
      });
    }
  }

  // Active project reminders
  for (const p of projects) {
    if (
      !p.archived &&
      !p.inactive &&
      p.reminderType &&
      p.reminderType !== 'none' &&
      p.reminderTime
    ) {
      const isDateSchedule = p.reminderSchedule === 'date' || Boolean(p.startDate);
      const scheduledDate = p.reminderDate || p.startDate || '';
      reminders.push({
        id: String(p.id),
        title: 'Project Reminder',
        body: `${isDateSchedule ? 'Scheduled Project' : "Today's Project"}: ${p.name}. Don't forget to work on this project today.`,
        time: p.reminderTime,
        schedule: p.reminderSchedule || (p.startDate ? 'date' : 'always'),
        weekdays: Array.isArray(p.reminderWeekdays) ? p.reminderWeekdays : [],
        date: scheduledDate,
        isAlarm: p.reminderType === 'alarm',
        type: 'project',
      });
    }
  }

  try {
    await NotificationScheduler.syncAllReminders({ reminders });
  } catch (err) {
    console.warn('syncNativeReminders error:', err);
  }
}
