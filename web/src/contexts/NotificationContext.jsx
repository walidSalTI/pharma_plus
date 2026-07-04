import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { notificationApi } from "../services/notification.service";
import { useEcho } from "./EchoContext";

const NotificationContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useNotificationCount = () => useContext(NotificationContext);

export default function NotificationProvider({ children, pharmacyId }) {
  const { echo } = useEcho();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    notificationApi
      .fetchUnreadCount()
      .then((res) => setUnreadCount(res?.unread_count ?? 0))
      .catch(() => setUnreadCount(0));
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!pharmacyId || !echo) return;

    const channelName = `private-pharmacy.${pharmacyId}`;
    const channel = echo.private(channelName);

    channel.notification(() => {
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      echo.leave(channelName);
    };
  }, [pharmacyId, echo]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}
