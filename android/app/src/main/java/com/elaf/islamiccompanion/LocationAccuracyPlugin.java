package com.elaf.islamiccompanion;

import android.app.Activity;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.LocationSettingsResponse;
import com.google.android.gms.location.Priority;
import com.google.android.gms.location.SettingsClient;
import com.google.android.gms.tasks.Task;

/**
 * Shows Google Play Services "Turn on Location Accuracy" dialog in-app
 * (ResolvableApiException) instead of leaving the app for system Settings.
 */
@CapacitorPlugin(name = "LocationAccuracy")
public class LocationAccuracyPlugin extends Plugin {

    private ActivityResultLauncher<IntentSenderRequest> resolutionLauncher;
    private PluginCall pendingCall;

    @Override
    public void load() {
        resolutionLauncher =
            getBridge()
                .registerForActivityResult(
                    new ActivityResultContracts.StartIntentSenderForResult(),
                    result -> {
                        PluginCall call = pendingCall;
                        pendingCall = null;
                        if (call == null) {
                            return;
                        }
                        JSObject ret = new JSObject();
                        ret.put("enabled", result.getResultCode() == Activity.RESULT_OK);
                        call.resolve(ret);
                    }
                );
    }

    @PluginMethod
    public void promptEnable(PluginCall call) {
        LocationRequest locationRequest =
            new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 10_000L).build();

        LocationSettingsRequest settingsRequest =
            new LocationSettingsRequest.Builder()
                .addLocationRequest(locationRequest)
                .setAlwaysShow(true)
                .build();

        SettingsClient client = LocationServices.getSettingsClient(getContext());
        Task<LocationSettingsResponse> task = client.checkLocationSettings(settingsRequest);

        task.addOnSuccessListener(
            response -> {
                JSObject ret = new JSObject();
                ret.put("enabled", true);
                call.resolve(ret);
            }
        );

        task.addOnFailureListener(
            e -> {
                if (e instanceof ResolvableApiException) {
                    ResolvableApiException resolvable = (ResolvableApiException) e;
                    try {
                        pendingCall = call;
                        IntentSenderRequest request =
                            new IntentSenderRequest.Builder(resolvable.getResolution()).build();
                        resolutionLauncher.launch(request);
                    } catch (Exception ex) {
                        pendingCall = null;
                        call.reject("Unable to show location dialog", ex);
                    }
                } else if (e instanceof ApiException) {
                    call.reject(
                        "Location settings unavailable: " + ((ApiException) e).getStatusCode()
                    );
                } else {
                    call.reject("Location settings check failed", e);
                }
            }
        );
    }
}
