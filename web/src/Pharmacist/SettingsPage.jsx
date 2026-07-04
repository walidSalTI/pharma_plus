import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../services/auth.service";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, login } = useAuth();
  const { verificationStatus, refreshPharmacies } = useOutletContext();

  const [profile, setProfile] = useState({
    f_name: "", l_name: "", email: "", phone_number: "",
    age: "", gender: "", location: "",
  });
  const [saving, setSaving] = useState(false);

  const [cardFile, setCardFile] = useState(null);
  const [cardPreview, setCardPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    authApi.dashboard().then((res) => {
      const p = res.data?.pharmacist;
      if (p) {
        const parts = (p.name || "").split(" ");
        setProfile({
          f_name: p.f_name || parts[0] || "",
          l_name: p.l_name || parts.slice(1).join(" ") || "",
          email: p.email || "",
          phone_number: p.phone_number || "",
          age: p.age ?? "",
          gender: p.gender || "",
          location: p.location || "",
        });
      }
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile(profile);
      const fullName = `${profile.f_name} ${profile.l_name}`.trim();
      if (user) login({ ...user, name: fullName, email: profile.email, f_name: profile.f_name, l_name: profile.l_name, phone_number: profile.phone_number, age: profile.age, gender: profile.gender, location: profile.location }, localStorage.getItem("token"));
      toast.success(t("settings.profileSaved"));
    } catch {
      toast.error(t("settings.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCardFile(file);
    setCardPreview(URL.createObjectURL(file));
  };

  const handleUploadCard = async () => {
    if (!cardFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('syndicate_card', cardFile);
      await authApi.verify(formData);
      toast.success(t("profile.cardSubmitted"));
      setCardFile(null);
      setCardPreview(null);
      refreshPharmacies();
    } catch (err) {
      toast.error(err.response?.data?.message || t("profile.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const inputClass = "w-full border border-surface-container-high bg-surface px-3 py-2 rounded-lg text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

  const statusLabels = {
    approved: { label: t("profile.verified"), class: 'bg-green-100 text-green-700', icon: 'check_circle' },
    pending: { label: t("profile.pending"), class: 'bg-amber-100 text-amber-700', icon: 'pending' },
    unverified: { label: t("profile.unverified"), class: 'bg-gray-100 text-gray-600', icon: 'cancel' },
  };
  const status = statusLabels[verificationStatus] || statusLabels.unverified;

  return (
    <div className="h-full overflow-y-auto bg-surface px-6 py-8 lg:px-12 font-sans text-on-surface antialiased">
      <main className="max-w-2xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{t("settings.title")}</h1>
          <p className="text-sm text-on-surface-variant mt-1">{t("settings.description")}</p>
        </div>

        <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-base font-semibold text-on-surface pb-3 border-b border-surface-container-high flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">badge</span>
              {t("settings.personalInfo")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">{t("auth.firstName")}</label>
                <input type="text" name="f_name" value={profile.f_name} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">{t("auth.lastName")}</label>
                <input type="text" name="l_name" value={profile.l_name} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">{t("auth.email")}</label>
                <input type="email" name="email" value={profile.email} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">{t("auth.phoneNumber")}</label>
                <input type="text" name="phone_number" value={profile.phone_number} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">{t("auth.age")}</label>
                <input type="number" name="age" value={profile.age} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">{t("auth.gender")}</label>
                <select name="gender" value={profile.gender} onChange={handleChange} className={inputClass}>
                  <option value="">--</option>
                  <option value="male">{t("auth.male")}</option>
                  <option value="female">{t("auth.female")}</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-on-surface mb-1">{t("auth.location")}</label>
                <input type="text" name="location" value={profile.location} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            <div className="flex justify-end mt-5 pt-4 border-t border-surface-container-high">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dim transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                {saving ? t("settings.saving") : t("settings.saveProfile")}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <h2 className="text-base font-semibold text-on-surface">{t("profile.accountVerification")}</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${status.class}`}>
              <span className="material-symbols-outlined text-sm">{status.icon}</span>
              {status.label}
            </span>
          </div>

          {verificationStatus === 'approved' ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-green-600">verified</span>
              <p className="text-sm text-green-700 font-medium">
                {t("profile.verifiedMessage")}
              </p>
            </div>
          ) : verificationStatus === 'pending' ? (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600">hourglass_top</span>
              <p className="text-sm text-amber-700 font-medium">
                {t("profile.pendingMessage")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-on-surface-variant">
                {t("profile.uploadCard")}
              </p>

              <div className="flex flex-col gap-3">
                <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                  {t("profile.syndicateCard")}
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="w-full h-40 bg-surface-container/30 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-surface-container/50 border-2 border-dashed border-outline-variant transition-colors relative overflow-hidden"
                >
                  {cardPreview ? (
                    <>
                      <img src={cardPreview} alt="Card preview" className="absolute inset-0 w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm font-bold">{t("app.clickToChange")}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-ambient-sm">
                        <span className="material-symbols-outlined text-primary">description</span>
                      </div>
                      <div className="flex flex-col items-center text-xs">
                        <span className="font-bold text-on-surface">{t("profile.uploadSyndicateCard")}</span>
                        <span className="text-on-surface-variant">{t("profile.fileHint")}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleUploadCard}
                  disabled={!cardFile || uploading}
                  className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-dim text-on-primary text-sm font-bold transition-all flex items-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                      {t("profile.uploading")}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">upload</span>
                      {t("profile.submitVerification")}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-on-surface-variant mt-0.5">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
              <div>
                <h2 className="text-sm font-semibold text-on-surface">{t("settings.appearance")}</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">{t("settings.appearanceDesc")}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                theme === 'dark' ? 'bg-primary' : 'bg-surface-container-high'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all flex items-center justify-center ${
                  theme === 'dark' ? 'ltr:left-5.5 rtl:right-5.5' : 'ltr:left-0.5 rtl:right-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-on-surface-variant mt-0.5">language</span>
              <div>
                <h2 className="text-sm font-semibold text-on-surface">{t("settings.language")}</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">{t("settings.languageDesc")}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => i18n.changeLanguage("en")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  i18n.language === "en"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => i18n.changeLanguage("ar")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  i18n.language === "ar"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                AR
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
