import React from 'react';
import { SecurityLockScreen } from './SecurityLockScreen';
import { BusinessInfo, SecurityConfig } from '../types/invoice';

export interface LockScreenProps {
  businessInfo: BusinessInfo;
  securityConfig: SecurityConfig;
  onUnlock: () => void;
  onEmergencyReset?: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = (props) => {
  return <SecurityLockScreen {...props} />;
};

export default LockScreen;
export { SecurityLockScreen };
