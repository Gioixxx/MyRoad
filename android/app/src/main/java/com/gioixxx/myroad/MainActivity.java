package com.gioixxx.myroad;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String PAUSE_AUDIO_JS =
        "document.querySelectorAll('audio').forEach(function(a){ a.pause(); });";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        UpdateChecker.checkAsync(this);
    }

    @Override
    public void onPause() {
        super.onPause();
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().evaluateJavascript(PAUSE_AUDIO_JS, null);
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().evaluateJavascript(PAUSE_AUDIO_JS, null);
        }
    }
}
