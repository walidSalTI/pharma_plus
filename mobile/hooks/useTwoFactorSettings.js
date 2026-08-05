import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useToast } from "@/src/context/ToastContext";
import { getUserRole } from "@/services/tokenService";
import {
  get2FAStatus,
  enable2FA,
  confirm2FA,
  disable2FA,
  getRecoveryCodes,
} from "@/services/doctorAuthService";
import {
  get2FAStatus as get2FAStatusRep,
  enable2FA as enable2FARep,
  confirm2FA as confirm2FARep,
  disable2FA as disable2FARep,
  getRecoveryCodes as getRecoveryCodesRep,
} from "@/services/repAuthService";

export const useTwoFactorSettings = (initialRole = "doctor") => {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [confirmCode, setConfirmCode] = useState(["", "", "", "", "", ""]);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [step, setStep] = useState("status");
  const [actionLoading, setActionLoading] = useState(false);
  const [role, setRole] = useState(initialRole);
  const inputRefs = useRef([]);

  useEffect(() => {
    let cancelled = false;
    loadStatus().then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, []);

  const getFns = (r) => {
    if (r === "rep") {
      return {
        getStatus: get2FAStatusRep,
        enable: enable2FARep,
        confirm: confirm2FARep,
        disable: disable2FARep,
        recovery: getRecoveryCodesRep,
      };
    }
    return { get2FAStatus, enable: enable2FA, confirm: confirm2FA, disable: disable2FA, recovery: getRecoveryCodes };
  };

  const loadStatus = async () => {
    setLoading(true);
    try {
      const currentRole = (await getUserRole()) || initialRole;
      setRole(currentRole);
      const fns = getFns(currentRole);
      const res = await fns.getStatus();
      setIsEnabled(res.data?.enabled ?? res.enabled ?? false);
    } catch (err) {
      toastError(err.message || "Failed to check 2FA status");
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    setActionLoading(true);
    try {
      const fns = getFns(role);
      const res = await fns.enable();
      const data = res.data || res;
      setQrData(data);
      setStep("setup");
    } catch (err) {
      toastError(err.message || "Failed to enable 2FA");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    const code = confirmCode.join("");
    if (code.length !== 6) {
      toastError("Please enter the 6-digit code");
      return;
    }
    setActionLoading(true);
    try {
      const fns = getFns(role);
      await fns.confirm(code);
      const res = await fns.recovery();
      setRecoveryCodes(res.data?.recovery_codes || res.recovery_codes || []);
      setStep("recovery");
      setIsEnabled(true);
      toastSuccess("Two-factor authentication has been enabled.");
    } catch (err) {
      toastError(err.message || "Failed to confirm 2FA setup");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async () => {
    setActionLoading(true);
    try {
      const fns = getFns(role);
      await fns.disable();
      setIsEnabled(false);
      setStep("status");
      toastSuccess("Two-factor authentication has been disabled.");
    } catch (err) {
      toastError(err.message || "Failed to disable 2FA");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...confirmCode];
    newCode[index] = value.slice(-1);
    setConfirmCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.nativeEvent.key === "Backspace" && !confirmCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resetToStatus = () => {
    setStep("status");
    setConfirmCode(["", "", "", "", "", ""]);
    setQrData(null);
    setRecoveryCodes([]);
  };

  return {
    isEnabled,
    loading,
    qrData,
    confirmCode,
    setConfirmCode,
    recoveryCodes,
    step,
    setStep,
    actionLoading,
    role,
    inputRefs,
    handleEnable,
    handleConfirm,
    handleDisable,
    handleDigitChange,
    handleKeyDown,
    resetToStatus,
  };
};
