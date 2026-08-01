import { Fragment, useState, useEffect, useCallback } from 'react';
import { useTranslation } from "react-i18next";
import { useOutletContext } from 'react-router-dom';
import toast from "react-hot-toast";
import { requestsApi } from '../services/pharmacist';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const STATUS_OPTIONS = [
  { value: '', labelKey: 'orders.all' },
  { value: 'pending', labelKey: 'orders.status.pending' },
  { value: 'confirmed', labelKey: 'orders.status.confirmed' },
  { value: 'ready', labelKey: 'orders.status.ready' },
  { value: 'processing', labelKey: 'orders.status.processing' },
  { value: 'completed', labelKey: 'orders.status.completed' },
  { value: 'cancelled', labelKey: 'orders.status.cancelled' },
];

const SOURCE_OPTIONS = [
  { value: '', labelKey: 'orders.all' },
  { value: 'app', labelKey: 'orders.source.app' },
  { value: 'POS', labelKey: 'orders.source.pos' },
];

const TYPE_OPTIONS = [
  { value: '', labelKey: 'orders.all' },
  { value: 'sale', labelKey: 'orders.type.sale' },
  { value: 'damaged', labelKey: 'orders.type.damaged' },
  { value: 'purchase', labelKey: 'orders.type.purchase' },
  { value: 'supplier_return', labelKey: 'orders.type.supplierReturn' },
  { value: 'customer_return', labelKey: 'orders.type.customerReturn' },
  { value: 'damage_reversal', labelKey: 'orders.type.damageReversal' },
];

const STATUS_BADGE = {
  pending: "bg-blue-100 text-blue-700",
  confirmed: "bg-indigo-100 text-indigo-700",
  ready: "bg-purple-100 text-purple-700",
  processing: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-surface-container-high text-on-surface-variant",
};

const initialFilters = {
  status: '',
  source: '',
  type: '',
  invoice_number: '',
  is_returned: '',
  min_price: '',
  max_price: '',
  min_cost: '',
  max_cost: '',
  date_from: '',
  date_to: '',
};

function StarRating({ rating }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`material-symbols-outlined text-sm ${i <= rating ? 'text-amber-400' : 'text-on-surface-variant/30'}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >star</span>
      ))}
    </span>
  );
}

export default function OrdersPage() {
  const { selectedPharmacy, orderVersion } = useOutletContext();
  const { t } = useTranslation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const { isOnline } = useNetworkStatus();

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);

  const reviewsByOrderId = Object.fromEntries(
    reviews.filter((r) => r.order_id).map((r) => [r.order_id, r])
  );

  const activeFilterCount = Object.values(filters).filter((v) => v !== '').length;

  const fetchOrders = useCallback(async () => {
    if (!selectedPharmacy?.id) return;

    const params = { page };
    if (filters.status) params.status = filters.status;
    if (filters.source) params.source = filters.source;
    if (filters.type) params.type = filters.type;
    if (filters.invoice_number) params.invoice_number = filters.invoice_number;
    if (filters.is_returned) params.is_returned = filters.is_returned;
    if (filters.min_price) params.min_price = filters.min_price;
    if (filters.max_price) params.max_price = filters.max_price;
    if (filters.min_cost) params.min_cost = filters.min_cost;
    if (filters.max_cost) params.max_cost = filters.max_cost;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;

    const data = await requestsApi.getAll(selectedPharmacy.id, params);
    setOrders(data?.data ?? []);
  }, [selectedPharmacy, filters, page]);

  const fetchReviews = useCallback(async () => {
    if (!selectedPharmacy?.id) return;

    const data = await requestsApi.getReviews(selectedPharmacy.id);
    setReviews(data?.data ?? []);
    setAverageRating(data?.meta?.average_rating ?? null);
  }, [selectedPharmacy]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);

    if (!selectedPharmacy?.id) {
      setLoading(false);
      return;
    }

    Promise.all([fetchOrders(), fetchReviews()])
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [fetchOrders, fetchReviews, selectedPharmacy?.id, orderVersion]);

  const applyFilters = () => {
    setFilters({ ...draftFilters });
    setPage(1);
  };

  const clearFilters = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
    setPage(1);
  };

  const updateDraft = (key, value) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleDetail = (orderId) => {
    setExpandedId((prev) => (prev === orderId ? null : orderId));
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

const inputClass = "w-full bg-surface-container/50 text-on-surface px-3 py-2 rounded-xl border border-surface-container-high text-sm focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none transition-all";
const labelClass = "text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-1.5 block";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isSupplierOrder(type) {
  return type === "purchase" || type === "supplier_return";
}

  return (
    <div className="h-full overflow-y-auto bg-surface px-4 py-8 lg:px-12 font-sans text-on-surface antialiased">
      <main className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">{t("orders.title")}</h1>
            <p className="text-base text-on-surface-variant">{t("orders.description")}</p>
            {averageRating && (
              <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                {Number(averageRating).toFixed(1)} {t("orders.averageRating")}
              </span>
            )}
          </div>
          <button
            onClick={() => setFiltersOpen((prev) => !prev)}
            className={`relative px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              filtersOpen || activeFilterCount > 0
                ? "bg-primary text-white shadow-md"
                : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
            }`}
          >
            <span className="material-symbols-outlined text-sm">filter_alt</span>
            {t("orders.filters")}
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {filtersOpen && (
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-high flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>{t("orders.filterStatus")}</label>
                <select value={draftFilters.status} onChange={(e) => updateDraft("status", e.target.value)} className={inputClass}>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("orders.filterSource")}</label>
                <select value={draftFilters.source} onChange={(e) => updateDraft("source", e.target.value)} className={inputClass}>
                  {SOURCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("orders.filterType")}</label>
                <select value={draftFilters.type} onChange={(e) => updateDraft("type", e.target.value)} className={inputClass}>
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t("orders.filterInvoice")}</label>
                <input type="text" value={draftFilters.invoice_number} onChange={(e) => updateDraft("invoice_number", e.target.value)} className={inputClass} placeholder={t("orders.filterInvoicePlaceholder")} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>{t("orders.filterDateFrom")}</label>
                <input type="date" value={draftFilters.date_from} onChange={(e) => updateDraft("date_from", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("orders.filterDateTo")}</label>
                <input type="date" value={draftFilters.date_to} onChange={(e) => updateDraft("date_to", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("orders.filterReturned")}</label>
                <select value={draftFilters.is_returned} onChange={(e) => updateDraft("is_returned", e.target.value)} className={inputClass}>
                  <option value="">{t("orders.all")}</option>
                  <option value="1">{t("orders.yes")}</option>
                  <option value="0">{t("orders.no")}</option>
                </select>
              </div>
            </div>
            <div className="border-t border-surface-container-high pt-4">
              <p className={labelClass}>{t("orders.priceRange")}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1 block">{t("orders.minPrice")}</label>
                  <input type="number" min="0" value={draftFilters.min_price} onChange={(e) => updateDraft("min_price", e.target.value)} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1 block">{t("orders.maxPrice")}</label>
                  <input type="number" min="0" value={draftFilters.max_price} onChange={(e) => updateDraft("max_price", e.target.value)} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1 block">{t("orders.minCost")}</label>
                  <input type="number" min="0" value={draftFilters.min_cost} onChange={(e) => updateDraft("min_cost", e.target.value)} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mb-1 block">{t("orders.maxCost")}</label>
                  <input type="number" min="0" value={draftFilters.max_cost} onChange={(e) => updateDraft("max_cost", e.target.value)} className={inputClass} placeholder="0" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={clearFilters} className="px-4 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant text-sm font-bold transition-all">
                {t("orders.clearAll")}
              </button>
              <button onClick={applyFilters} className="px-5 py-2 rounded-full bg-primary hover:bg-primary-dim text-white text-sm font-bold transition-all shadow-md flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check</span>
                {t("orders.applyFilters")}
              </button>
            </div>
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-on-surface-variant">{t("orders.loading")}</div>
          ) : error && !isOnline ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-50 mb-4">
                <span className="material-symbols-outlined text-amber-400 text-3xl">cloud_off</span>
              </div>
              <p className="text-on-surface font-semibold mb-1">{t("orders.loadError")}</p>
              <p className="text-on-surface-variant text-sm">{t("orders.offlineMessage")}</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600">{t("orders.loadError")}</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">{t("orders.noOrders")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-container-high text-xs uppercase tracking-widest text-on-surface-variant/60 font-bold">
                    <th className="px-4 py-3 text-start">{t("orders.date")}</th>
                    <th className="px-4 py-3 text-start">{t("orders.invoiceNumber")}</th>
                    <th className="px-4 py-3 text-start">{t("orders.patient")}</th>
                    <th className="px-4 py-3 text-start">{t("orders.supplier")}</th>
                    <th className="px-4 py-3 text-start">{t("orders.filterType")}</th>
                    <th className="px-4 py-3 text-start">{t("orders.filterSource")}</th>
                    <th className="px-4 py-3 text-end">{t("orders.items")}</th>
                    <th className="px-4 py-3 text-end">{t("orders.total")}</th>
                    <th className="px-4 py-3 text-start">{t("orders.statusLabel")}</th>
                    <th className="px-4 py-3 text-start">{t("orders.rating")}</th>
                    <th className="px-4 py-3 text-end">{t("orders.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {orders.map((order) => {
                    const review = reviewsByOrderId[order.order_id];
                    const isExpanded = expandedId === order.order_id;
                    return (
                      <Fragment key={order.order_id}>
                      <tr
                        onClick={() => toggleDetail(order.order_id)}
                        className={`cursor-pointer transition-colors ${isExpanded ? "bg-surface-container-low" : "hover:bg-surface"}`}
                      >
                        <td className="px-4 py-3 text-sm text-on-surface-variant whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                          {order.invoice_number || "—"}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {order.patient_name || (isSupplierOrder(order.type) ? "—" : order.pharmacist_name || "—")}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                          {order.supplier_name || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {order.type && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface-container-high text-on-surface-variant capitalize">
                              {t(`orders.type.${order.type}`, order.type)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {order.source && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-secondary-container/50 text-on-secondary-container capitalize">
                              {t(`orders.source.${order.source}`, order.source)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-end text-sm tabular-nums text-on-surface-variant">
                          {order.items_count ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-end text-sm font-extrabold tabular-nums whitespace-nowrap">
                          {formatCurrency(order.total_price)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[order.status] || "bg-surface-container-high"}`}>
                            {t(`orders.status.${order.status}`, order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {review ? (
                            <span className="inline-flex items-center gap-2" title={review.comment || ""}>
                              <StarRating rating={review.rating} />
                              {review.comment && (
                                <span className="text-xs text-on-surface-variant truncate max-w-[160px] hidden sm:inline">
                                  "{review.comment}"
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-on-surface-variant/40 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-end">
                          <span className="inline-flex items-center gap-2 justify-end">
                            {order.status === "pending" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCancel(order.order_id); }}
                                disabled={cancelling === order.order_id}
                                className="px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold"
                              >
                                {cancelling === order.order_id ? t("app.loading") : t("orders.cancel")}
                              </button>
                            )}
                            <span
                              className={`material-symbols-outlined text-on-surface-variant/60 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              expand_more
                            </span>
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-surface-container-low/60">
                          <td colSpan={11} className="px-4 py-4">
                            <div className="animate-[fadeIn_0.2s_ease_both] rounded-xl border border-surface-container-high bg-surface-container-lowest p-4 flex flex-col gap-4">
                              {(order.notes || order.pharmacist_note) && (
                                <div>
                                  <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-1.5">{t("orders.notes")}</p>
                                  <p className="text-sm text-on-surface whitespace-pre-wrap">{order.notes || order.pharmacist_note}</p>
                                </div>
                              )}
                              {order.items?.length > 0 && (
                                <div>
                                  <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">{t("orders.items")}</p>
                                  <div className="space-y-1.5">
                                    {order.items.map((item, i) => (
                                      <div key={i} className="flex items-center justify-between gap-3 text-sm">
                                        <span className="text-on-surface">{item.trade_name}</span>
                                        <span className="text-on-surface-variant whitespace-nowrap">x{item.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                <div>
                                  <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">{t("orders.invoiceNumber")}</p>
                                  <p className="font-medium">{order.invoice_number || "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">{t("orders.total")}</p>
                                  <p className="font-bold tabular-nums">{formatCurrency(order.total_price)}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">{t("orders.statusLabel")}</p>
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${STATUS_BADGE[order.status] || "bg-surface-container-high"}`}>
                                    {t(`orders.status.${order.status}`, order.status)}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">{t("orders.filterType")}</p>
                                  <p className="capitalize">{order.type ? t(`orders.type.${order.type}`, order.type) : "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">{t("orders.filterSource")}</p>
                                  <p className="capitalize">{order.source ? t(`orders.source.${order.source}`, order.source) : "—"}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
