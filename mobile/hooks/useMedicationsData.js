import { useEffect, useState, useCallback, useRef } from "react";
import { getWallet } from "@/services/walletService";
import { saveMedsCache, getMedsCache } from "@/services/medicationStorage";

const to12Hour = (time24) => {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const findNextDose = (schedules, medId, takenDoses) => {
  if (!schedules || schedules.length === 0) return null;

  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dateKey = now.toISOString().split("T")[0];

  let best = null;
  let bestDiff = Infinity;

  for (const s of schedules) {
    const takenKey = `${dateKey}_${medId}_${s.dose_time}`;
    const isTakenToday = takenDoses.has(takenKey);

    const [h, m] = s.dose_time.split(":").map(Number);
    const scheduleMinutes = h * 60 + m;

    let dayDiff;
    if (s.day_of_week === null) {
      if (isTakenToday) {
        dayDiff = 1;
      } else {
        dayDiff = scheduleMinutes > currentMinutes ? 0 : 1;
      }
    } else {
      if (isTakenToday && currentDay === s.day_of_week) {
        dayDiff = 7;
      } else {
        dayDiff = (s.day_of_week - currentDay + 7) % 7;
        if (dayDiff === 0 && scheduleMinutes <= currentMinutes) dayDiff = 7;
      }
    }

    const totalDiff = dayDiff * 24 * 60 + (scheduleMinutes - currentMinutes);
    if (totalDiff < bestDiff) {
      bestDiff = totalDiff;
      best = s;
    }
  }

  return { schedule: best, totalDiff: bestDiff };
};

const toUIMed = (item, takenDoses) => {
  const result = findNextDose(item.schedules, item.medication_id, takenDoses);
  const next = result?.schedule;
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
    nextDoseMinutes: result?.totalDiff ?? Infinity,
    nextDoseTime24: next?.dose_time ?? null,
  };
};

export const useMedicationsData = () => {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);
  const takenDosesRef = useRef(new Set());

  const markDoseTaken = useCallback((medId, doseTime) => {
    const dateKey = new Date().toISOString().split("T")[0];
    takenDosesRef.current.add(`${dateKey}_${medId}_${doseTime}`);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getWallet();
      const items = Array.isArray(data) ? data : [];
      await saveMedsCache(items);
      setOffline(false);
      const active = items.filter((item) => item.is_active !== false);
      setMeds(active.map((item) => toUIMed(item, takenDosesRef.current)));
    } catch {
      setError(true);
      const cached = await getMedsCache();
      if (Array.isArray(cached) && cached.length > 0) {
        const active = cached.filter((item) => item.is_active !== false);
        setMeds(active.map((item) => toUIMed(item, takenDosesRef.current)));
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

  const sortedByNextDose = [...meds.filter((m) => !m.isAsNeeded)].sort(
    (a, b) => (a.nextDoseMinutes ?? Infinity) - (b.nextDoseMinutes ?? Infinity)
  );

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
    markDoseTaken,
  };
};
