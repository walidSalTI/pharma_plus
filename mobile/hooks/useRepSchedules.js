import { useState, useEffect, useCallback } from "react";
import { getRepSchedules, getRepScheduleDetail } from "@/services/repService";

export const useRepSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [scheduleDetail, setScheduleDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchSchedules = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(false);
      }
      const data = await getRepSchedules(pageNum);
      const items = data?.data || [];
      const meta = data?.meta || {};
      if (append) {
        setSchedules((prev) => [...prev, ...items]);
      } else {
        setSchedules(items);
      }
      setHasMore(meta.current_page < meta.last_page);
      setPage(meta.current_page || pageNum);
    } catch {
      setError(true);
      if (!append) setSchedules([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchSchedules(page + 1, true);
    }
  }, [fetchSchedules, page, hasMore, loadingMore]);

  const fetchDetail = useCallback(async (id) => {
    try {
      setDetailLoading(true);
      const data = await getRepScheduleDetail(id);
      setScheduleDetail(data?.data || data);
    } catch {
      setScheduleDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setPage(1);
    fetchSchedules(1, false);
  }, [fetchSchedules]);

  useEffect(() => {
    fetchSchedules(1, false);
  }, [fetchSchedules]);

  return {
    schedules,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    scheduleDetail,
    detailLoading,
    fetchDetail,
  };
};
