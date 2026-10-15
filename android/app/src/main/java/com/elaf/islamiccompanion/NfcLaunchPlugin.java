package com.elaf.islamiccompanion;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Exposes NFC launch intents to the web layer:
 * - whether the app was opened by a tag tap
 * - the physical tag UID (so pairing can proceed without a second scan)
 */
@CapacitorPlugin(name = "NfcLaunch")
public class NfcLaunchPlugin extends Plugin {

    @PluginMethod
    public void consume(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("launched", MainActivity.consumeNfcLaunch());
        String uid = MainActivity.consumePendingTagUid();
        if (uid != null && !uid.isEmpty()) {
            ret.put("tagUid", uid);
        }
        call.resolve(ret);
    }
}
