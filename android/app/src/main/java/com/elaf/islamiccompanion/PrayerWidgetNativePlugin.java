package com.elaf.islamiccompanion;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.widget.RemoteViews;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

/**
 * Persistent prayer widget as an ongoing custom notification.
 * Live 1s countdown ticker + RemoteViews (small logo, RTL text, green countdown).
 */
@CapacitorPlugin(name = "PrayerWidgetNative")
public class PrayerWidgetNativePlugin extends Plugin {

    public static final int NOTIF_ID = 7001;
    public static final String CHANNEL_ID = "elaf_prayer_widget_v4";
    private static final String OLD_CHANNEL_ID = "elaf_prayer_widget";
    private static final String OLD_CHANNEL_ID_V2 = "elaf_prayer_widget_v2";
    private static final String OLD_CHANNEL_ID_V3 = "elaf_prayer_widget_v3";
    private static final String TAG = "PrayerWidget";
    private static final int BRAND_TEAL = Color.parseColor("#24ACB5");
    private static final int COUNTDOWN_GREEN = Color.parseColor("#2BB673");

    private final Handler ticker = new Handler(Looper.getMainLooper());
    private Runnable tickRunnable;
    private String currentTitle = "الصلاة القادمة";
    private String currentPrayerTime = "";
    private String currentHijri = "";
    private long targetAtMs = 0L;

    @PluginMethod
    public void show(PluginCall call) {
        currentTitle = call.getString("title", "الصلاة القادمة");
        if (currentTitle == null || currentTitle.isEmpty()) currentTitle = "الصلاة القادمة";
        currentPrayerTime = call.getString("prayerTime", call.getString("time", ""));
        if (currentPrayerTime == null) currentPrayerTime = "";
        currentHijri = call.getString("hijriDate", "");
        if (currentHijri == null) currentHijri = "";

        // Prefer remainingSec (int) — Capacitor often drops large epoch doubles as null
        targetAtMs = resolveTargetAtMs(call);
        Log.i(TAG, "show title=" + currentTitle + " time=" + currentPrayerTime
            + " hijri=" + currentHijri + " targetAtMs=" + targetAtMs + " left=" + remainingSec(targetAtMs));

        Context context = getContext().getApplicationContext();
        ensureChannel(context);

        boolean enabled = NotificationManagerCompat.from(context).areNotificationsEnabled();
        boolean channelBlocked = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = context.getSystemService(NotificationManager.class);
            NotificationChannel ch = nm != null ? nm.getNotificationChannel(CHANNEL_ID) : null;
            if (ch != null && ch.getImportance() == NotificationManager.IMPORTANCE_NONE) {
                channelBlocked = true;
            }
        }

        JSObject ret = new JSObject();
        if (!enabled) {
            Log.w(TAG, "App notifications disabled");
            ret.put("ok", false);
            ret.put("reason", "notifications_disabled");
            call.resolve(ret);
            return;
        }
        if (channelBlocked) {
            Log.w(TAG, "Widget channel blocked by user");
            ret.put("ok", false);
            ret.put("reason", "channel_blocked");
            call.resolve(ret);
            return;
        }

        boolean posted = postNotification(context, formatCountdown(remainingSec(targetAtMs)));
        if (posted) {
            startTicker(context);
            ret.put("ok", true);
            ret.put("leftSec", remainingSec(targetAtMs));
        } else {
            stopTicker();
            ret.put("ok", false);
            ret.put("reason", "notify_failed");
        }
        call.resolve(ret);
    }

    /** Build absolute target from remainingSec (preferred) or targetAt epoch. */
    private static long resolveTargetAtMs(PluginCall call) {
        Integer remaining = call.getInt("remainingSec");
        if (remaining != null && remaining > 0) {
            return System.currentTimeMillis() + remaining.longValue() * 1000L;
        }

        Double targetAt = call.getDouble("targetAt");
        if (targetAt != null && targetAt > 1_000_000_000_000L) {
            return targetAt.longValue();
        }

        // Fallback: raw JSON (handles Long / String forms)
        try {
            JSONObject data = call.getData();
            if (data != null) {
                if (data.has("remainingSec")) {
                    long sec = data.optLong("remainingSec", 0L);
                    if (sec > 0) return System.currentTimeMillis() + sec * 1000L;
                }
                if (data.has("targetAt")) {
                    Object raw = data.opt("targetAt");
                    if (raw instanceof Number) {
                        long v = ((Number) raw).longValue();
                        if (v > 1_000_000_000_000L) return v;
                    } else if (raw != null) {
                        long v = Long.parseLong(String.valueOf(raw));
                        if (v > 1_000_000_000_000L) return v;
                    }
                }
                String asStr = call.getString("targetAtStr");
                if (asStr != null && !asStr.isEmpty()) {
                    long v = Long.parseLong(asStr);
                    if (v > 1_000_000_000_000L) return v;
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "resolveTargetAtMs fallback failed", e);
        }

        // Last resort: parse countdown string if provided
        String countdown = call.getString("countdown", "");
        long fromCountdown = parseCountdownToSec(countdown);
        if (fromCountdown > 0) {
            return System.currentTimeMillis() + fromCountdown * 1000L;
        }

        return 0L;
    }

    private static long parseCountdownToSec(String countdown) {
        if (countdown == null || countdown.isEmpty()) return 0L;
        try {
            String[] parts = countdown.trim().split(":");
            if (parts.length == 3) {
                return Long.parseLong(parts[0]) * 3600L
                    + Long.parseLong(parts[1]) * 60L
                    + Long.parseLong(parts[2]);
            }
            if (parts.length == 2) {
                return Long.parseLong(parts[0]) * 60L + Long.parseLong(parts[1]);
            }
        } catch (Exception ignored) {
        }
        return 0L;
    }

    @PluginMethod
    public void hide(PluginCall call) {
        stopTicker();
        targetAtMs = 0L;
        try {
            NotificationManagerCompat.from(getContext().getApplicationContext()).cancel(NOTIF_ID);
        } catch (Exception e) {
            Log.w(TAG, "cancel failed", e);
        }
        call.resolve();
    }

    private void startTicker(final Context context) {
        stopTicker();
        if (targetAtMs <= 0) {
            Log.w(TAG, "startTicker skipped — targetAtMs=0");
            return;
        }
        tickRunnable = new Runnable() {
            @Override
            public void run() {
                long left = remainingSec(targetAtMs);
                postNotification(context, formatCountdown(left));
                if (left <= 0) {
                    stopTicker();
                    return;
                }
                ticker.postDelayed(this, 1000L);
            }
        };
        // First tick immediately so UI isn't stuck for 1s
        ticker.post(tickRunnable);
    }

    private void stopTicker() {
        if (tickRunnable != null) {
            ticker.removeCallbacks(tickRunnable);
            tickRunnable = null;
        }
    }

    private RemoteViews buildViews(Context context, int layoutId, String countdown) {
        RemoteViews views = new RemoteViews(context.getPackageName(), layoutId);
        views.setViewVisibility(R.id.widget_brand, View.GONE);
        if (currentHijri != null && !currentHijri.isEmpty()) {
            views.setTextViewText(R.id.widget_hijri, currentHijri);
            views.setViewVisibility(R.id.widget_hijri, View.VISIBLE);
        } else {
            views.setTextViewText(R.id.widget_hijri, "");
            views.setViewVisibility(R.id.widget_hijri, View.GONE);
        }
        views.setTextViewText(R.id.widget_title, currentTitle);
        views.setTextViewText(R.id.widget_time, currentPrayerTime);
        views.setTextViewText(R.id.widget_countdown, "−" + countdown);
        views.setTextColor(R.id.widget_countdown, COUNTDOWN_GREEN);
        return views;
    }

    private boolean postNotification(Context context, String countdown) {
        Intent launch = new Intent(context, MainActivity.class);
        launch.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
            context,
            0,
            launch,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        RemoteViews compact = buildViews(context, R.layout.notification_prayer_widget, countdown);
        RemoteViews expanded = buildViews(context, R.layout.notification_prayer_widget_big, countdown);

        String fallback = currentTitle + "  " + currentPrayerTime + "  −" + countdown;

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_elaf)
            .setColor(BRAND_TEAL)
            .setContentTitle("إيلاف")
            .setContentText(fallback)
            .setCustomContentView(compact)
            .setCustomBigContentView(expanded)
            .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setAutoCancel(false)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(contentIntent)
            .setShowWhen(false)
            .setSilent(true);

        try {
            NotificationManagerCompat.from(context).notify(NOTIF_ID, builder.build());
            return true;
        } catch (Exception e) {
            Log.e(TAG, "notify failed", e);
            return false;
        }
    }

    private void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = context.getSystemService(NotificationManager.class);
        if (nm == null) return;
        try {
            nm.deleteNotificationChannel(OLD_CHANNEL_ID);
            nm.deleteNotificationChannel(OLD_CHANNEL_ID_V2);
            nm.deleteNotificationChannel(OLD_CHANNEL_ID_V3);
        } catch (Exception ignored) {
        }
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return;

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "ويدجت الصلاة",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription("إشعار ثابت: الصلاة القادمة والعدّ التنازلي");
        channel.enableVibration(false);
        channel.setSound(null, null);
        channel.setShowBadge(false);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(channel);
    }

    private static long remainingSec(long targetAtMs) {
        if (targetAtMs <= 0) return 0L;
        return Math.max(0L, (targetAtMs - System.currentTimeMillis()) / 1000L);
    }

    private static String formatCountdown(long totalSec) {
        long s = Math.max(0L, totalSec);
        long h = s / 3600L;
        long m = (s % 3600L) / 60L;
        long sec = s % 60L;
        return h + ":" + pad2(m) + ":" + pad2(sec);
    }

    private static String pad2(long n) {
        return n < 10 ? "0" + n : String.valueOf(n);
    }

    @Override
    protected void handleOnDestroy() {
        stopTicker();
        super.handleOnDestroy();
    }
}
