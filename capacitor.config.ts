import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elaf.islamiccompanion',
  appName: 'إيلاف',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'youtube.com',
      '*.youtube.com',
      'youtu.be',
      '*.youtu.be',
      'youtube-nocookie.com',
      '*.youtube-nocookie.com',
      '*.googlevideo.com',
      'google.com',
      '*.google.com',
      'generativelanguage.googleapis.com',
      '*.googleapis.com',
    ],
  },
  plugins: {
    CapacitorNfc: {
      // Scanning is started from the app (Misbaha / Athkar) with continuous mode
    },
    Geolocation: {
      // When-in-use / recent location for prayer times
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_elaf',
      iconColor: '#00A7B8',
      sound: 'madinah.mp3',
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
