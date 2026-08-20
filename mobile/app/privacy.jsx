import { useLanguage } from "@/src/i18n/LanguageContext";
import LegalDocScreen from "@/components/LegalDocScreen";

const SECTIONS = [
  ["privacy_introTitle", "privacy_intro"],
  ["privacy_scopeTitle", "privacy_scope"],
  ["privacy_useTitle", "privacy_use"],
  ["privacy_aiTitle", "privacy_ai"],
  ["privacy_sharingTitle", "privacy_sharing"],
  ["privacy_securityTitle", "privacy_security"],
  ["privacy_rightsTitle", "privacy_rights"],
  ["privacy_childrenTitle", "privacy_children"],
  ["privacy_changesTitle", "privacy_changes"],
  ["privacy_contactTitle", "privacy_contact"],
];

export default function PrivacyScreen() {
  const { t } = useLanguage();
  return (
    <LegalDocScreen
      title={t("privacyPolicy")}
      subtitle={t("lastUpdated", { date: "August 17, 2026" })}
      sections={SECTIONS.map(([titleKey, bodyKey]) => ({
        title: t(titleKey),
        body: [t(bodyKey)],
      }))}
    />
  );
}