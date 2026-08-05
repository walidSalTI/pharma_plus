import { useState, useEffect, useCallback } from "react";
import {
  getRepVisits,
  getRepStats,
  checkInVisit,
  updateVisitNotes,
} from "@/services/repService";

export const useRepVisits = () => {
  const [visits, setVisits] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const fetchVisits = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(false);
      }
      const data = await getRepVisits(pageNum);
      const items = data?.data || [];
      const meta = data?.meta || {};
      if (append) {
        setVisits((prev) => [...prev, ...items]);
      } else {
        setVisits(items);
      }
      setHasMore(meta.current_page < meta.last_page);
      setPage(meta.current_page || pageNum);
    } catch {
      setError(true);
      if (!append) setVisits([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getRepStats();
      setStats(data?.data || data);
    } catch {
      setStats(null);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchVisits(page + 1, true);
    }
  }, [fetchVisits, page, hasMore, loadingMore]);

  const doCheckIn = useCallback(async (payload) => {
    const data = await checkInVisit(payload);
    return data;
  }, []);

  const doUpdateNotes = useCallback(async (visitId, notes) => {
    const data = await updateVisitNotes(visitId, notes);
    return data;
  }, []);

  const refresh = useCallback(() => {
    setPage(1);
    fetchVisits(1, false);
    fetchStats();
  }, [fetchVisits, fetchStats]);

  useEffect(() => {
    fetchVisits(1, false);
    fetchStats();
  }, [fetchVisits, fetchStats]);

  return {
    visits,
    stats,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    doCheckIn,
    doUpdateNotes,
  };
};
