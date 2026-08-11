package com.gioixxx.myroad;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Scanner;
import java.util.concurrent.Executors;

/**
 * Controllo aggiornamenti per i tester senza accesso ADB: confronta la versione installata con
 * l'ultima release GitHub, propone il download+installazione via il package installer di
 * sistema. Mirror semplificato dell'auto-updater del launcher desktop (UpdateChecker.cs).
 * Richiede una build firmata con una chiave stabile (vedi android/keystore.properties, mai
 * committata) — senza firma stabile Android tratterebbe ogni aggiornamento come un'app diversa.
 */
public class UpdateChecker {
    private static final String TAG = "UpdateChecker";
    private static final String LATEST_RELEASE_URL =
        "https://api.github.com/repos/Gioixxx/MyRoad/releases/latest";

    public static void checkAsync(Activity activity) {
        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                check(activity);
            } catch (Exception e) {
                // Best-effort: nessuna connessione, rate limit GitHub, ecc. Il check periodico
                // resta silenzioso by design, come il launcher desktop.
                Log.i(TAG, "Controllo aggiornamenti fallito (non bloccante): " + e.getMessage());
            }
        });
    }

    private static void check(Activity activity) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(LATEST_RELEASE_URL).openConnection();
        conn.setRequestProperty("Accept", "application/vnd.github+json");
        conn.setConnectTimeout(8000);
        conn.setReadTimeout(8000);

        String body;
        try (InputStream in = conn.getInputStream(); Scanner scanner = new Scanner(in, "UTF-8")) {
            scanner.useDelimiter("\\A");
            body = scanner.hasNext() ? scanner.next() : "";
        }

        JSONObject release = new JSONObject(body);
        String tagName = release.optString("tag_name", "");
        String latestVersion = tagName.startsWith("v") ? tagName.substring(1) : tagName;
        String currentVersion = BuildConfig.VERSION_NAME;

        if (!isNewer(latestVersion, currentVersion)) return;

        String apkUrl = null;
        JSONArray assets = release.optJSONArray("assets");
        if (assets != null) {
            for (int i = 0; i < assets.length(); i++) {
                JSONObject asset = assets.getJSONObject(i);
                String name = asset.optString("name", "");
                if (name.endsWith(".apk")) {
                    apkUrl = asset.optString("browser_download_url", null);
                    break;
                }
            }
        }
        if (apkUrl == null) return;

        String finalApkUrl = apkUrl;
        activity.runOnUiThread(() -> promptUpdate(activity, latestVersion, finalApkUrl));
    }

    private static boolean isNewer(String latest, String current) {
        try {
            String[] latestParts = latest.split("\\.");
            String[] currentParts = current.split("\\.");
            int len = Math.max(latestParts.length, currentParts.length);
            for (int i = 0; i < len; i++) {
                int l = i < latestParts.length ? Integer.parseInt(latestParts[i]) : 0;
                int c = i < currentParts.length ? Integer.parseInt(currentParts[i]) : 0;
                if (l != c) return l > c;
            }
            return false;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private static void promptUpdate(Activity activity, String latestVersion, String apkUrl) {
        if (activity.isFinishing()) return;
        new AlertDialog.Builder(activity)
            .setTitle("Nuova versione disponibile")
            .setMessage("È disponibile My Road " + latestVersion + ". Vuoi aggiornare ora?")
            .setPositiveButton("Aggiorna", (dialog, which) -> startDownload(activity, apkUrl))
            .setNegativeButton("Più tardi", null)
            .setCancelable(true)
            .show();
    }

    private static void startDownload(Activity activity, String apkUrl) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            && !activity.getPackageManager().canRequestPackageInstalls()) {
            new AlertDialog.Builder(activity)
                .setTitle("Permesso richiesto")
                .setMessage(
                    "Per installare l'aggiornamento, consenti a My Road di installare app "
                        + "sconosciute nella prossima schermata, poi torna qui e tocca di nuovo "
                        + "\"Aggiorna\" dal menu.")
                .setPositiveButton("Apri impostazioni", (dialog, which) -> {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + activity.getPackageName()));
                    activity.startActivity(intent);
                })
                .setNegativeButton("Annulla", null)
                .show();
            return;
        }

        Toast.makeText(activity, "Download aggiornamento in corso…", Toast.LENGTH_SHORT).show();
        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                File apkFile = downloadApk(activity, apkUrl);
                activity.runOnUiThread(() -> installApk(activity, apkFile));
            } catch (Exception e) {
                Log.w(TAG, "Download aggiornamento fallito", e);
                activity.runOnUiThread(() ->
                    Toast.makeText(activity, "Download fallito, riprova più tardi.", Toast.LENGTH_LONG).show());
            }
        });
    }

    private static File downloadApk(Activity activity, String apkUrl) throws Exception {
        File outFile = new File(activity.getCacheDir(), "myroad-update.apk");
        HttpURLConnection conn = (HttpURLConnection) new URL(apkUrl).openConnection();
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(30000);
        conn.setInstanceFollowRedirects(true);
        try (InputStream in = conn.getInputStream(); FileOutputStream out = new FileOutputStream(outFile)) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
        }
        return outFile;
    }

    private static void installApk(Activity activity, File apkFile) {
        Uri apkUri = FileProvider.getUriForFile(
            activity, activity.getPackageName() + ".fileprovider", apkFile);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        activity.startActivity(intent);
    }
}
