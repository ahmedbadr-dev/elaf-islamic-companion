package com.elaf.islamiccompanion;

import android.content.Intent;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    /** Set when the app is opened by tapping an NFC tag; consumed once by the web layer. */
    private static volatile boolean launchedFromNfc = false;
    /** Hardware UID of the tag that launched the app (hex), if available. */
    private static volatile String pendingTagUid = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocationAccuracyPlugin.class);
        registerPlugin(PrayerWidgetNativePlugin.class);
        registerPlugin(NfcLaunchPlugin.class);
        super.onCreate(savedInstanceState);
        handleNfcIntent(getIntent());
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleNfcIntent(intent);
    }

    private void handleNfcIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (NfcAdapter.ACTION_NDEF_DISCOVERED.equals(action)
                || NfcAdapter.ACTION_TECH_DISCOVERED.equals(action)
                || NfcAdapter.ACTION_TAG_DISCOVERED.equals(action)) {
            launchedFromNfc = true;
            Tag tag = readTagExtra(intent);
            if (tag != null) {
                byte[] id = tag.getId();
                if (id != null && id.length > 0) {
                    pendingTagUid = bytesToHex(id);
                }
            }
        }
    }

    @SuppressWarnings("deprecation")
    private static Tag readTagExtra(Intent intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return intent.getParcelableExtra(NfcAdapter.EXTRA_TAG, Tag.class);
        }
        return intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
    }

    /** Returns true once if the app was launched/resumed by an NFC tag, then resets the flag. */
    public static boolean consumeNfcLaunch() {
        boolean v = launchedFromNfc;
        launchedFromNfc = false;
        return v;
    }

    /** Returns and clears the UID of the tag that launched the app (may be null). */
    public static String consumePendingTagUid() {
        String uid = pendingTagUid;
        pendingTagUid = null;
        return uid;
    }
}
