import AsyncStorage from "@react-native-async-storage/async-storage";

const CONSENT_KEY = "@legal_consent";

export const LEGAL_TERMS_VERSION = "2026-08-17";

const DEFAULT_CONSENT = { accepted: false, docs: [], version: "", acceptedAt: null };

export async function getConsent() {
  try {
    const raw = await AsyncStorage.getItem(CONSENT_KEY);
    if (!raw) return DEFAULT_CONSENT;
    return { ...DEFAULT_CONSENT, ...JSON.parse(raw) };
  } catch (e) {
    console.warn("[LegalConsent] Failed to read consent:", e);
    return DEFAULT_CONSENT;
  }
}

export async function getConsentAccepted() {
  try {
    const consent = await getConsent();
    return consent.accepted === true && consent.version === LEGAL_TERMS_VERSION;
  } catch {
    return false;
  }
}

export async function setConsent(accepted, docs = ["terms", "privacy"]) {
  const record = {
    accepted: !!accepted,
    docs,
    version: LEGAL_TERMS_VERSION,
    acceptedAt: new Date().toISOString(),
  };
  try {
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(record));
  } catch (e) {
    console.warn("[LegalConsent] Failed to save consent:", e);
  }
  return record;
}

export async function clearConsent() {
  try {
    await AsyncStorage.removeItem(CONSENT_KEY);
  } catch (e) {
    console.warn("[LegalConsent] Failed to clear consent:", e);
  }
}