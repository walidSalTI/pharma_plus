import { useLanguage } from "@/src/i18n/LanguageContext";
import { useAuth } from "@/src/context/AuthContext";
import { useLocalSearchParams } from "expo-router";
import LegalDocScreen from "@/components/LegalDocScreen";

const ROLE_HOME = {
  patient: "/(patient)/MedicationsScreen",
  doctor: "/(doctor)/DoctorDashboard",
  rep: "/(rep)/RepDashboard",
};

const SECTIONS = [
  ["terms_introTitle", "terms_intro"],
  ["terms_acceptanceTitle", "terms_acceptance"],
  ["terms_eligibilityTitle", "terms_eligibility"],
  ["terms_serviceTitle", "terms_service"],
  ["terms_notMedicalTitle", "terms_notMedical"],
  ["terms_emergencyTitle", "terms_emergency"],
  ["terms_responsibilitiesTitle", "terms_responsibilities"],
  ["terms_acceptableUseTitle", "terms_acceptableUse"],
  ["terms_ordersTitle", "terms_orders"],
  ["terms_ipTitle", "terms_ip"],
  ["terms_noWarrantyTitle", "terms_noWarranty"],
  ["terms_liabilityTitle", "terms_liability"],
  ["terms_indemnificationTitle", "terms_indemnification"],
  ["terms_changesTitle", "terms_changes"],
  ["terms_terminationTitle", "terms_termination"],
  ["terms_lawTitle", "terms_law"],
  ["terms_contactTitle", "terms_contact"],
];

export default function TermsScreen() {
  const { t } = useLanguage();
  const { returnTo: returnToParam } = useLocalSearchParams();
  const { role } = useAuth();
  const returnTo = returnToParam || ROLE_HOME[role];

  return (
    <LegalDocScreen
      title={t("termsOfUse")}
      subtitle={t("lastUpdated", { date: "August 17, 2026" })}
      returnTo={returnTo}
      sections={SECTIONS.map(([titleKey, bodyKey]) => ({
        title: t(titleKey),
        body: [t(bodyKey)],
      }))}
    />
  );
}