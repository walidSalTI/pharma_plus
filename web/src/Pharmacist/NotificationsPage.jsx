import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { notificationApi } from "../services/notification.service";
import { useNotificationCount } from "../contexts/NotificationContext";

const typeStyles = {
  staff_invitation: "bg-blue-50 border-blue-200 text-blue-800",
  join_request: "bg-amber-50 border-amber-200 text-amber-800",
};

const typeIcons = {
  staff_invitation: "person_add",
  join_request: "handshake",
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { refresh } = useNotificationCount();
  const { t } = useTranslation();

  const fetchNotifications = () => {
    setLoading(true);
    setError(null);
    notificationApi
      .fetchAll()
      .then((res) => setNotifications(res?.data ?? res ?? []))
      .catch((err) => setError(err.response?.data?.message || err.message || "Failed to load notifications"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications(); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const handleAccept = (id) => {
    notificationApi.acceptInvitation(id).then(() => {
      fetchNotifications();
      refresh();
    }).catch(() => {});
  };

  const handleReject = (id) => {
    notificationApi.rejectInvitation(id).then(() => {
      fetchNotifications();
      refresh();
    }).catch(() => {});
  };

  const handleAcceptJoin = (id) => {
    notificationApi.acceptJoinRequest(id).then(() => {
      fetchNotifications();
      refresh();
    }).catch(() => {});
  };

  const handleRejectJoin = (id) => {
    notificationApi.rejectJoinRequest(id).then(() => {
      fetchNotifications();
      refresh();
    }).catch(() => {});
  };

  return (
    <div className="h-full overflow-y-auto bg-surface px-8 py-10 font-['Manrope'] antialiased">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">{t("notifications.title")}</h1>
            <p className="text-on-surface-variant mt-1">{t("notifications.description")}</p>
          </div>
          </div>

        {loading && (
          <div className="text-center py-20 text-on-surface-variant text-sm">{t("notifications.loading")}</div>
        )}

        {error && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-4xl text-red-400 mb-2">error_outline</span>
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={fetchNotifications}
              className="mt-4 text-sm text-primary font-bold hover:underline"
            >
              {t("app.tryAgain")}
            </button>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">notifications_off</span>
            <p className="text-on-surface-variant text-sm">{t("notifications.empty")}</p>
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl border p-5 flex items-start gap-4 transition-all ${
                  n.read_at
                    ? "bg-surface-container-lowest border-surface-container-high opacity-60"
                    : "bg-red-50 border-red-200 ring-1 ring-inset ring-red-300 shadow-sm"
                }`}
              >
                <span className="material-symbols-outlined text-xl flex-shrink-0">
                  {typeIcons[n.type] || "notifications"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">{n.title}</h3>
                  </div>
                  <p className="text-sm mt-0.5 opacity-80">{n.message}</p>
                  <p className="text-xs mt-1.5 opacity-60">{n.created_at}</p>
                  {n.type === "staff_invitation" && (
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleAccept(n.id)}
                        className="px-3 py-1 rounded-full bg-primary text-on-primary text-xs font-bold hover:opacity-90"
                      >
                        {t("app.accept")}
                      </button>
                      <button
                        onClick={() => handleReject(n.id)}
                        className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold hover:bg-rose-100 hover:text-rose-700"
                      >
                        {t("app.reject")}
                      </button>
                    </div>
                  )}
                  {n.type === "join_request" && (
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleAcceptJoin(n.id)}
                        className="px-3 py-1 rounded-full bg-primary text-on-primary text-xs font-bold hover:opacity-90"
                      >
                        {t("app.accept")}
                      </button>
                      <button
                        onClick={() => handleRejectJoin(n.id)}
                        className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold hover:bg-rose-100 hover:text-rose-700"
                      >
                        {t("app.reject")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
