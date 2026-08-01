import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useOffline } from '../contexts/OfflineContext';

export function NetworkIndicator() {
  const { isOnline } = useNetworkStatus();
  const ctx = useOffline();
  const pendingCount = ctx?.pendingCount ?? 0;

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
      isOnline
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-amber-50 text-amber-700 border border-amber-200'
    }`}>
      <span className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
      }`} />
      {isOnline
        ? `Syncing ${pendingCount} pending...`
        : 'Offline — changes saved locally'
      }
    </div>
  );
}
