package com.margelo.nitro.installer

import android.content.Intent
import android.os.Build
import androidx.core.content.FileProvider
import androidx.core.net.toUri
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.NitroModules
import com.margelo.nitro.core.Promise
import android.net.Uri
import java.io.File

@DoNotStrip
class HybridInstaller : HybridInstallerSpec() {
    override fun apkInstall(localUri: String): Promise<Unit> {
        return Promise.async {
            val context = NitroModules.applicationContext
                ?: throw IllegalStateException("Application context is not available")

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                !context.packageManager.canRequestPackageInstalls()
            ) {
                throw IllegalStateException("App is not allowed to install unknown apps")
            }

            val file = when {
                localUri.startsWith("file://") -> File(localUri.toUri().path!!)
                else -> File(localUri)
            }
            if (!file.exists()) {
                throw IllegalArgumentException("APK file not found: $localUri")
            }

            val contentUri = FileProvider.getUriForFile(
                context, "${context.packageName}.fileprovider", file
            )

            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(contentUri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        }
    }
    override fun openInstallSettings() : Promise<Unit> {
        return Promise.async {
            val context = NitroModules.applicationContext ?: throw IllegalStateException("Application context is not available")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val intent = Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                    data = "package:${context.packageName}".toUri()
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
            }
        }
    }
}