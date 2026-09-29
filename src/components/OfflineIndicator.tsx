import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xl animate-fade-in no-print border border-amber-500">
      <span className="h-2 w-2 rounded-full bg-white animate-pulse shrink-0" />
      <span>Offline Mode — All local ledger and PDF actions remain fully functional.</span>
    </div>
  );
};
