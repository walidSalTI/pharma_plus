import { useEffect, useState, useCallback } from "react";
import { getWallet } from "@/services/walletService";
import { saveMedsCache, getMedsCache } from "@/services/medicationStorage";

const to12Hour = (time24) => {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const findNextDose = (schedules) => {
  if (!schedules || schedules.length === 0) return null;

  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let best = null;
  let bestDiff = Infinity;

  for (const s of schedules) {
    const [h, m] = s.dose_time.split(":").map(Number);
    const scheduleMinutes = h * 60 + m;
    let dayDiff = (s.day_of_week - currentDay + 7) % 7;
    if (dayDiff === 0 && scheduleMinutes <= currentMinutes) dayDiff = 7;
    const totalDiff = dayDiff * 24 * 60 + (scheduleMinutes - currentMinutes);
    if (totalDiff < bestDiff) {
      bestDiff = totalDiff;
      best = s;
    }
  }

  return best;
};

const toUIMed = (item) => {
  const next = findNextDose(item.schedules);
  return {
    id: item.id,
    medicationId: item.medication_id,
    name: item.trade_name,
    dose: item.dosage,
    time: next ? to12Hour(next.dose_time) : "As Needed",
    icon: "pill",
    color: item.state === "temporary" ? "#d97706" : "#0b6a6a",
    isAsNeeded: item.state === "temporary",
    isActive: item.is_active,
    availablePills: item.available_pills,
    refillRisk: item.refill_risk,
    instructions: item.instructions_before,
    instructionsAfter: item.instructions_after,
    schedules: item.schedules,
    frequency: item.frequency,
  };
};

export const useMedicationsData = () => {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getWallet();
      const items = Array.isArray(data) ? data : [];
      await saveMedsCache(items);
      setOffline(false);
      const active = items.filter((item) => item.is_active !== false);
      setMeds(active.map(toUIMed));
    } catch {
      setError(true);
      const cached = await getMedsCache();
      if (Array.isArray(cached) && cached.length > 0) {
        const active = cached.filter((item) => item.is_active !== false);
        setMeds(active.map(toUIMed));
        setOffline(true);
      } else {
        setMeds([]);
        setOffline(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sortedByNextDose = [...meds.filter((m) => !m.isAsNeeded)].sort((a, b) => {
    const aNext = a.time === "As Needed" ? "23:59" : a.time;
    const bNext = b.time === "As Needed" ? "23:59" : b.time;
    return aNext.localeCompare(bNext);
  });

  const nextMed = sortedByNextDose.length > 0 ? sortedByNextDose[0] : null;
  const otherMeds = sortedByNextDose.slice(1);

  return {
    meds,
    loading,
    error,
    offline,
    nextMed,
    otherMeds,
    refreshMedications: loadData,
  };
};
