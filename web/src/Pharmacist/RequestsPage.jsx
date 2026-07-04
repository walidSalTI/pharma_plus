import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useOutletContext } from 'react-router-dom';
import { requestsApi } from '../services/requests.service';

export default function RequestsPage() {
  const { selectedPharmacy } = useOutletContext();
  const { t } = useTranslation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب الطلبات عند تغيير الصيدلية المختارة
  useEffect(() => {
    if (!selectedPharmacy?.id) {
      setLoading(false); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }

    setLoading(true);
    requestsApi
      .getAll(selectedPharmacy.id)
      .then((data) => setPrescriptions(data?.data ?? []))
      .catch(() => setPrescriptions(null))
      .finally(() => setLoading(false));
  }, [selectedPharmacy?.id]);

  // دالة الموافقة والتحقق (Ready)
  const handleVerify = async (orderId) => {
    try {
      await requestsApi.updateStatus(selectedPharmacy.id, orderId, "ready");
      setPrescriptions((prevPrescriptions) => 
        prevPrescriptions.map((rx) => 
          rx.order_id === orderId ? { ...rx, status: "ready" } : rx
        )
      );
    } catch (error) {
      console.error("حدث خطأ أثناء الموافقة على الطلب:", error);
    }
  };

  // دالة الرفض (Rejected)
  const handleReject = async (orderId) => {
    try {
      await requestsApi.updateStatus(selectedPharmacy.id, orderId, "cancelled");
      setPrescriptions((prevPrescriptions) => 
        prevPrescriptions.map((rx) => 
          rx.order_id === orderId ? { ...rx, status: "cancelled" } : rx
        )
      );
    } catch (error) {
      console.error("حدث خطأ أثناء رفض الطلب:", error);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-surface px-4 py-8 lg:px-12 font-sans text-on-surface antialiased">
      <main className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* العناوين */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">{t("requests.title")}</h1>
          <p className="text-base text-on-surface-variant">{t("requests.description")}</p>
        </div>

        {/* الحاوية الرئيسية للطلبات */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-on-surface-variant">{t("requests.loading")}</div>
          ) : prescriptions === null ? (
            <div className="p-8 text-center text-on-surface-variant">Orders endpoint not available in the current API</div>
          ) : prescriptions.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">{t("requests.noRequests")}</div>
          ) : (
            <div className="divide-y divide-surface-container-high">
              {prescriptions.map((rx) => (
                <div key={rx.order_id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 hover:bg-surface transition-colors">
                  
                  {/* معلومات المريض والطلب */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-9 h-9 rounded-full bg-primary-container/30 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {rx.patient_name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-on-surface">{rx.patient_name}</p>
                      <p className="text-sm text-on-surface-variant truncate">
                        {`${rx.invoice_number} · ${rx.items_count} item(s) · $${rx.total_price}${rx.items?.length ? ` · ${rx.items[0].trade_name} x${rx.items[0].quantity}` : ''}`}
                      </p>
                    </div>
                  </div>

                  {/* شارة الحالة وأزرار التحكم */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-12 sm:ml-0 flex-wrap sm:flex-nowrap">
                    
                    {/* شارة الحالة الديناميكية */}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      rx.status === "pending" ? "bg-blue-100 text-blue-700" :
                      rx.status === "ready" ? "bg-green-100 text-green-700" :
                      rx.status === "cancelled" ? "bg-red-100 text-red-700" :
                      "bg-surface-container-high text-on-surface-variant"
                    }`}>
                      {rx.status === "pending" ? t("requests.pending") : 
                       rx.status === "cancelled" ? t("requests.cancelled") || "cancelled" : 
                       rx.status === "ready" ? t("requests.ready") || "Ready" : rx.status}
                    </span>
                    
                    {/* تظهر أزرار التحكم فقط إذا كانت الحالة معلقة (Pending) */}
                    {rx.status === "pending" && (
                      <div className="flex items-center gap-2">
                        {/* زر التحقق والموافقة */}
                        <button
                          onClick={() => handleVerify(rx.order_id)}
                          className="px-3 sm:px-4 py-1.5 rounded-full bg-primary hover:bg-primary-dim text-white text-xs font-bold transition-all whitespace-nowrap"
                        >
                          {t("requests.verify")}
                        </button>
                        
                        {/* زر الرفض */}
                        <button
                          onClick={() => handleReject(rx.order_id)}
                          className="px-3 sm:px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all whitespace-nowrap"
                        >
                          {t("requests.reject") || "Reject"}
                        </button>
                      </div>
                    )}
                    
                    {/* زر التفاصيل يظهر دائماً */}
                    <button className="px-3 sm:px-4 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container text-xs font-bold text-on-surface-variant transition-all whitespace-nowrap">
                      {t("requests.details")}
                    </button>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}