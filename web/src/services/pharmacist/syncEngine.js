import { db } from '../db';
import { BaseUrl } from '../api';

const MAX_RETRIES = 5;

let isSyncing = false;
let stopRequested = false;

export async function processSyncQueue() {
  if (isSyncing || !navigator.onLine) return;
  isSyncing = true;
  stopRequested = false;

  try {
    const pendingItems = await db.pendingActions
      .where('status')
      .equals('PENDING')
      .sortBy('createdAt');

    if (pendingItems.length === 0) {
      isSyncing = false;
      return;
    }

    console.log(`[Sync] Processing ${pendingItems.length} pending actions...`);

    for (const item of pendingItems) {
      if (stopRequested || !navigator.onLine) break;

      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(BaseUrl + item.endpoint, {
          method: item.method,
          headers,
          body: item.body ? JSON.stringify(item.body) : undefined,
        });

        if (response.ok) {
          await db.pendingActions.delete(item.id);

          if (item.type === 'SALE' && item.body?.saleId) {
            await db.pendingSales.update(item.body.saleId, { synced: true });
          }

          console.log(`[Sync] Success: ${item.method} ${item.endpoint}`);
        } else if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        } else if (response.status >= 400 && response.status < 500) {
          await db.pendingActions.update(item.id, {
            attempts: item.attempts + 1,
            lastError: `Client error: ${response.status}`,
            status: 'FAILED',
          });
          console.warn(`[Sync] Failed (client): ${item.method} ${item.endpoint} — ${response.status}`);
        } else {
          const attempts = item.attempts + 1;
          if (attempts >= MAX_RETRIES) {
            await db.pendingActions.update(item.id, {
              attempts,
              lastError: `Server error: ${response.status} (max retries exceeded)`,
              status: 'FAILED',
            });
            console.warn(`[Sync] Failed (max retries): ${item.method} ${item.endpoint}`);
          } else {
            await db.pendingActions.update(item.id, {
              attempts,
              lastError: `Server error: ${response.status}`,
            });
            console.warn(`[Sync] Retrying later: ${item.method} ${item.endpoint} — ${response.status}`);
          }
        }
      } catch (err) {
        console.error('[Sync] Network error during sync item:', err);
        break;
      }
    }
  } catch (error) {
    console.error('[Sync] Fatal error:', error);
  } finally {
    isSyncing = false;
  }
}

export function startSyncEngine() {
  window.addEventListener('online', processSyncQueue);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      processSyncQueue();
    }
  });

  if (navigator.onLine) {
    processSyncQueue();
  }
}

export function stopSyncEngine() {
  stopRequested = true;
  window.removeEventListener('online', processSyncQueue);
}
