import { db } from '../db';

export async function lookupByBarcode(barcode) {
  try {
    const item = await db.inventory.where('barcode').equals(barcode).first();
    return item || null;
  } catch {
    return null;
  }
}

export async function recordOfflineSale(saleData) {
  try {
    return await db.transaction('rw', db.pendingSales, db.pendingActions, db.inventory, async () => {
      const saleId = await db.pendingSales.add({
        ...saleData,
        createdAt: new Date().toISOString(),
        synced: false
      });

      for (const prod of saleData.items) {
        const localProd = await db.inventory.get(prod.medicationId);
        if (localProd) {
          await db.inventory.update(prod.medicationId, {
            stock: localProd.stock - prod.quantity
          });
        }
      }

      await db.pendingActions.add({
        type: 'SALE',
        endpoint: '/api/v1/sales',
        method: 'POST',
        body: { saleId, ...saleData },
        dependsOn: null,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        attempts: 0,
        lastError: null
      });

      return { success: true, saleId };
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function cacheInventory(items, pharmacyId) {
  const timestamp = new Date().toISOString();
  await db.transaction('rw', db.inventory, async () => {
    await db.inventory.where('pharmacyId').equals(pharmacyId).delete();
    const mapped = items.map(item => ({
      id: item.medication_id ?? item.id,
      pharmacyId,
      barcode: item.medication?.barcode ?? '',
      name: item.medication?.trade_name ?? '',
      price: item.price ?? 0,
      stock: item.stock ?? 0,
      min_stock: item.min_stock ?? 0,
      cachedAt: timestamp,
      raw: item,
    }));
    await db.inventory.bulkAdd(mapped);
  });
}

export async function getCachedInventory(pharmacyId) {
  try {
    return await db.inventory.where('pharmacyId').equals(pharmacyId).toArray();
  } catch {
    return [];
  }
}

export async function getOldestCacheTime(pharmacyId) {
  try {
    const items = await db.inventory.where('pharmacyId').equals(pharmacyId).toArray();
    if (items.length === 0) return null;
    return items.reduce((oldest, item) => {
      const d = new Date(item.cachedAt);
      return d < oldest ? d : oldest;
    }, new Date());
  } catch {
    return null;
  }
}

export async function cacheDashboard(pharmacyId, data) {
  await db.dashboardCache.put({
    pharmacyId,
    data,
    cachedAt: new Date().toISOString(),
  });
}

export async function getCachedDashboard(pharmacyId) {
  try {
    const record = await db.dashboardCache.get(pharmacyId);
    return record?.data ?? null;
  } catch {
    return null;
  }
}

export async function cacheEmployees(pharmacyId, data) {
  await db.employeeCache.put({
    pharmacyId,
    data,
    cachedAt: new Date().toISOString(),
  });
}

export async function getCachedEmployees(pharmacyId) {
  try {
    const record = await db.employeeCache.get(pharmacyId);
    return record?.data ?? [];
  } catch {
    return [];
  }
}
