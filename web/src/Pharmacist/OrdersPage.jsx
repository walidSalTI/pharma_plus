import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from "react-i18next";
import { useOutletContext } from 'react-router-dom';
import toast from "react-hot-toast";
import { requestsApi } from '../services/requests.service';

const STATUS_OPTIONS = [
  { value: '', labelKey: 'orders.all' },
  { value: 'pending', labelKey: 'orders.status.pending' },
  { value: 'confirmed', labelKey: 'orders.status.confirmed' },
  { value: 'ready', labelKey: 'orders.status.ready' },
  { value: 'processing', labelKey: 'orders.status.processing' },
  { value: 'completed', labelKey: 'orders.status.completed' },
  { value: 'cancelled', labelKey: 'orders.status.cancelled' },
];

const STATUS_BADGE = {
  pending: "bg-blue-100 text-blue-700",
  confirmed: "bg-indigo-100 text-indigo-700",
  ready: "bg-purple-100 text-purple-700",
  processing: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-surface-container-high text-on-surface-variant",
};

export default function OrdersPage() {
  const { selectedPharmacy, orderVersion } = useOutletContext();
  const { t } = useTranslation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!selectedPharmacy?.id) return;

    const params = { page };
    if (statusFilter) params.status = statusFilter;

    const data = await requestsApi.getAll(selectedPharmacy.id, params);
    setOrders(data?.data ?? []);
  }, [selectedPharmacy, statusFilter, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);

    if (!selectedPharmacy?.id) {
      setLoading(false);
      return;
    }

    fetchOrders()
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [fetchOrders, selectedPharmacy?.id, orderVersion]);

  const handleFilterChange = (newStatus) => {
    setPage(1);
    setStatusFilter(newStatus);
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm(t("orders.confirmCancel"))) return;

    setCancelling(orderId);
    try {
      await requestsApi.updateStatus(selectedPharmacy.id, orderId, "cancelled");
      toast.success(t("orders.cancelled"));
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || t("orders.cancelFailed"));
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-surface px-4 py-8 lg:px-12 font-sans text-on-surface antialiased">
      <main className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">{t("orders.title")}</h1>
            <p className="text-base text-on-surface-variant">{t("orders.description")}</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high text-sm focus:ring-2 focus:ring-primary"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
            ))}
          </select>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-on-surface-variant">{t("orders.loading")}</div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600">{t("orders.loadError")}</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">{t("orders.noOrders")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody className="divide-y divide-surface-container-high">
                  {orders.map((order) => (
                    <tr key={order.order_id} className="hover:bg-surface transition-colors">
                      <td className="px-4 py-3 font-medium">{order.patient_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[order.status] || "bg-surface-container-high"}`}>
                          {t(`orders.status.${order.status}`, order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        {["pending", "confirmed"].includes(order.status) && (
                          <button
                            onClick={() => handleCancel(order.order_id)}
                            disabled={cancelling === order.order_id}
                            className="px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold"
                          >
                            {cancelling === order.order_id ? t("app.loading") : t("orders.cancel")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
