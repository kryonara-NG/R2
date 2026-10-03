plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "com.kryonara.reelhouse"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.kryonara.reelhouse"
        minSdk = 21
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    buildFeatures { buildConfig = true }
}
dependencies {
    implementation("androidx.core:core-ktx:1.17.0")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.webkit:webkit:1.14.0")
    implementation("androidx.work:work-runtime-ktx:2.12.0")
}
