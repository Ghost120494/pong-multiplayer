import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.puppypals.game',
  appName: 'Puppy Pals',
  webDir: 'dist/mobile',
  server: { androidScheme: 'https' },
  backgroundColor: '#fbfaf6',
};

export default config;
