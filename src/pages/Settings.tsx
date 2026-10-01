import React from 'react';
import { StoreInfoModule, StoreInfoModuleProps } from '../components/StoreInfoModule';

export type SettingsProps = StoreInfoModuleProps;

/**
 * Settings Page: Manages Store Profile, 4-Digit PIN & Biometric Lock, Cloud Backup & Firestore Sync.
 */
export const Settings: React.FC<SettingsProps> = (props) => {
  return <StoreInfoModule {...props} />;
};

export default Settings;
export { StoreInfoModule };
