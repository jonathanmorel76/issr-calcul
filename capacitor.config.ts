import type { CapacitorConfig } from '@capacitor/cli'

const serverUrl = process.env.MOBILE_APP_URL

const config: CapacitorConfig = {
  appId: 'fr.monremplacement.app.beta',
  appName: 'Mon Remplacement Beta',
  webDir: 'out',
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: false,
        allowNavigation: [new URL(serverUrl).hostname],
      }
    : undefined,
  ios: {
    contentInset: 'automatic',
  },
}

export default config
