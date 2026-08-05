import { useState, useEffect, useCallback } from "react";
import { getRepDashboard } from "@/services/repService";

export const useRepDashboard = () => {
  const [rep, setRep] = useState(null);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [todayByStatus, setTodayByStatus] = useState([]);
  const [weeklyOverview, setWeeklyOverview] = useState({ upcoming: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await getRepDashboard();
      const d = data?.data || data;
      setRep(d?.rep || null);
      setTodaySchedules(d?.today_schedules || []);
      setTodayByStatus(d?.today_by_status || []);
      setWeeklyOverview(d?.weekly_overview || { upcoming: 0, completed: 0, cancelled: 0 });
    } catch {
      setError(true);
      setRep(null);
      setTodaySchedules([]);
      setTodayByStatus([]);
      setWeeklyOverview({ upcoming: 0, completed: 0, cancelled: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { rep, todaySchedules, todayByStatus, weeklyOverview, loading, error, refresh: fetchDashboard };
};
