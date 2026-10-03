package com.kryonara.reelhouse

import android.Manifest
import android.app.DownloadManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Vibrator
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import java.util.UUID
import kotlin.math.sqrt

class MainActivity : AppCompatActivity(), SensorEventListener {
    private lateinit var web: WebView
    private lateinit var sensorManager: SensorManager
    private var lastShake = 0L
    private val site = "https://r2-kryonara1.vercel.app/"
    private val channelId = "reelhouse"
    private val installationId by lazy {
        getSharedPreferences("reelhouse", MODE_PRIVATE).let { prefs ->
            prefs.getString("installation_id", null) ?: UUID.randomUUID().toString().also {
                prefs.edit().putString("installation_id", it).apply()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        createNotificationChannel()
        requestNotificationPermissionIfNeeded()

        web = WebView(this)
        setContentView(web)
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.mediaPlaybackRequiresUserGesture = false
        web.settings.userAgentString = web.settings.userAgentString + " ReelhouseAndroid/1.0"
        web.addJavascriptInterface(NativeBridge(this), "Android")
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val host = request.url.host ?: return true
                return host != "r2-kryonara1.vercel.app"
            }
        }
        web.loadUrl(site + "?app=1")

        sensorManager = getSystemService(SENSOR_SERVICE) as SensorManager
        sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        }
    }

    override fun onDestroy() {
        sensorManager.unregisterListener(this)
        web.removeJavascriptInterface("Android")
        web.destroy()
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            getSystemService(NotificationManager::class.java).createNotificationChannel(
                NotificationChannel(channelId, "Reelhouse", NotificationManager.IMPORTANCE_DEFAULT)
            )
        }
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 700)
    }

    override fun onSensorChanged(event: SensorEvent) {
        val x = event.values[0]
        val y = event.values[1]
        val z = event.values[2]
        val g = sqrt(x * x + y * y + z * z) / SensorManager.GRAVITY_EARTH
        val now = System.currentTimeMillis()
        if (g > 2.4f && now - lastShake > 1200) {
            lastShake = now
            vibrate(40)
            web.post { web.evaluateJavascript("window.dispatchEvent(new Event('rhshake'))", null) }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

    private fun vibrate(ms: Long) {
        val v = getSystemService(VIBRATOR_SERVICE) as Vibrator
        if (Build.VERSION.SDK_INT >= 26) v.vibrate(android.os.VibrationEffect.createOneShot(ms, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
        else @Suppress("DEPRECATION") v.vibrate(ms)
    }

    inner class NativeBridge(private val context: Context) {
        @JavascriptInterface fun vibrate(ms: Int) = vibrate(ms.coerceIn(1, 500))
        @JavascriptInterface fun installationId(): String = installationId
        @JavascriptInterface fun deviceName(): String = "${Build.MANUFACTURER} ${Build.MODEL}".trim()
        @JavascriptInterface fun androidVersion(): String = Build.VERSION.RELEASE ?: Build.VERSION.SDK_INT.toString()

        @JavascriptInterface fun notify(title: String, body: String) {
            if (Build.VERSION.SDK_INT >= 33 &&
                ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
            ) return
            val n = NotificationCompat.Builder(context, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .build()
            (context.getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
                .notify((System.currentTimeMillis() % Int.MAX_VALUE).toInt(), n)
        }

        // Only direct, authorized HTTPS media URLs may be downloaded.
        @JavascriptInterface fun downloadAuthorized(url: String, title: String): Boolean {
            val uri = try { Uri.parse(url) } catch (_: Exception) { return false }
            if (uri.scheme != "https" || uri.host.isNullOrBlank()) return false
            if (uri.host.equals("vidsrc.sh", true)) return false
            val request = DownloadManager.Request(uri)
                .setTitle(title)
                .setDescription("Reelhouse offline download")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalPublicDir(Environment.DIRECTORY_MOVIES, "Reelhouse/$title.mp4")
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(false)
            (context.getSystemService(DOWNLOAD_SERVICE) as DownloadManager).enqueue(request)
            return true
        }
    }
}
