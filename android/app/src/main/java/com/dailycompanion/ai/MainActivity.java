package com.dailycompanion.ai;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import io.capawesome.capacitor.firebase.authentication.FirebaseAuthenticationPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(FirebaseAuthenticationPlugin.class);
    }
}

