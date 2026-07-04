import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNotificationCount } from "../contexts/NotificationContext";
import MedicationSearchBar from "../components/MedicationSearchBar";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { stockApi } from "../services/stockApi";

const dosageOptions = [
  { id: "Tablet", label: "drugs.tablet", icon: "pill" },
  { id: "Syrup", label: "drugs.syrup", icon: "water_drop" },
  { id: "Injection", label: "drugs.injection", icon: "vaccines" },
  { id: "Capsule", label: "drugs.capsule", icon: "medical_services" },
  { id: "Other", label: "drugs.other", icon: "add" },
];

const emptyForm = {
  tradeName: "", activeIngredient: "", manufacturer: "",
  concentration: "", dosageForm: "Tablet", stock: 1,
};

const validate = (t) => (data) => {
  const errors = {};
  if (!data.tradeName.trim()) errors.tradeName = t("validation.tradeNameRequired");
  if (!data.activeIngredient.trim()) errors.activeIngredient = t("validation.ingredientRequired");
  if (!data.manufacturer.trim()) errors.manufacturer = t("validation.manufacturerRequired");
  if (!data.concentration.trim()) errors.concentration = t("validation.concentrationRequired");
  else if (isNaN(parseFloat(data.concentration)) || parseFloat(data.concentration) <= 0)
    errors.concentration = t("validation.validConcentration");
  return errors;
};

export default function AddDrugPage() {
  const { t } = useTranslation();
  const { selectedPharmacy } = useOutletContext();
  const { unreadCount } = useNotificationCount();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchingMore, setSearchingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [currentName, setCurrentName] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentIngredient, setCurrentIngredient] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const search = async (name, company, ingredient, p, append = false) => {
    if (!name.trim() && !company.trim() && !ingredient.trim()) return;
    setSearched(true);
    setShowForm(false);
    if (append) { setSearchingMore(true); } else { setSearching(true); setResults([]); }
    try {
      const params = { page: p };
      if (name.trim()) params.name = name.trim();
      if (company.trim()) params.company = company.trim();
      if (ingredient.trim()) params.active_ingredient = ingredient.trim();
      const json = await api("GET", "/api/v1/medications", { params });
      const items = json?.data ?? [];
      if (append) { setResults(prev => [...prev, ...items]); } else { setResults(items); }
      const meta = json?.meta;
      if (meta) { setHasMore(meta.current_page < meta.last_page); } else { setHasMore(items.length === 15); }
    } catch {
      toast.error(t("drugs.searchFailed"));
    } finally { setSearching(false); setSearchingMore(false); }
  };
  const handleSearch = (name, company, ingredient) => { setCurrentName(name); setCurrentCompany(company); setCurrentIngredient(ingredient); setPage(1); search(name, company, ingredient, 1); };

  const loadMore = () => { const next = page + 1; setPage(next); search(currentName, currentCompany, currentIngredient, next, true); };

  const startRegister = () => {
    setShowForm(true);
    setFormData(emptyForm);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(t)(formData);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    try {
      await stockApi.addItem(selectedPharmacy.id, {
        name: formData.tradeName,
        active_ingredient: formData.activeIngredient,
        manufacturer: formData.manufacturer,
        concentration: formData.concentration,
        dosage_form: formData.dosageForm,
        price: 0,
        stock: parseInt(formData.stock) || 1,
        min_stock: 10,
      });
      toast.success(t("drugs.addedSuccess"));
      navigate("/Dashboard/StockManagement");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || t("drugs.addFailed"));
    } finally { setSubmitting(false); }
  };

  const inputCls = (field) =>
    `w-full bg-surface-container-lowest text-on-surface text-base px-5 py-3.5 rounded-xl border-b-[3px] focus:outline-none focus:ring-0 transition-all shadow-sm placeholder:text-outline-variant ${
      errors[field] ? "border-b-rose-400" : "border-transparent focus:border-primary"
    }`;

  const labelCls = "text-[11px] tracking-[0.05em] uppercase text-on-surface-variant font-bold ml-1";

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <header className="bg-surface/80 backdrop-blur-2xl sticky top-0 border-b border-surface-container-high flex items-center w-full px-8 py-2.5 z-50 gap-3">
        <MedicationSearchBar onSearch={handleSearch} searching={searching} />
        <Link to="/Dashboard/Notifications" className="relative p-2 hover:bg-primary-container/20 transition-all rounded-full shrink-0">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />}
        </Link>
      </header>

      <div className="max-w-6xl mx-auto w-full px-8 py-10 pb-32">
        <div className="mb-12 max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/30 text-primary text-[11px] tracking-[0.05em] uppercase font-bold mb-4">
            <span className="material-symbols-outlined text-sm">database</span>
            {t("drugs.centralDbEntry")}
          </span>
          <h1 className="text-[3.25rem] leading-[1.1] tracking-[-0.02em] text-on-surface font-light mb-3">
            {t("drugs.globalDrugSubmission")}
          </h1>
          <p className="text-base text-on-surface-variant max-w-xl leading-relaxed">
            {t("drugs.searchDescription")}
          </p>
        </div>

        {!showForm && (
          <div className="bg-surface-container/40 rounded-3xl border border-surface-container-high overflow-hidden">
            {!searched && !searching && (
              <div className="flex flex-col items-center justify-center py-20 px-8">
                <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl text-primary/60" style={{ fontVariationSettings: "'wght' 300" }}>database_search</span>
                </div>
                <p className="text-on-surface-variant text-lg font-medium mb-1">{t("drugs.searchEmptyTitle")}</p>
                <p className="text-on-surface-variant/60 text-sm max-w-md text-center">
                  {t("drugs.searchEmptyHint")}
                </p>
              </div>
            )}

            {searching && (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                  <p className="text-sm text-on-surface-variant">{t("drugs.searching")}</p>
                </div>
              </div>
            )}

            {searched && !searching && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-8">
                <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6 border border-amber-200">
                  <span className="material-symbols-outlined text-4xl text-amber-400" style={{ fontVariationSettings: "'wght' 300" }}>pill_off</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">{t("drugs.notFoundTitle")}</h3>
                <p className="text-on-surface-variant text-sm max-w-md text-center mb-8">
                  {t("drugs.notFoundHint")}
                </p>
                <button onClick={startRegister}
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                  {t("drugs.registerNew")}
                </button>
              </div>
            )}

            {results.length > 0 && (
              <div>
                <div className="px-8 py-4 bg-surface-container/20 border-b border-surface-container-high flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">checklist</span>
                    <p className="text-sm font-medium text-on-surface">
                      {t("drugs.matchCount", { count: results.length })}
                    </p>
                  </div>
                  <button onClick={startRegister}
                    className="text-xs font-bold text-primary hover:text-primary-dim transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">add</span>
                    {t("drugs.notHereRegister")}
                  </button>
                </div>

                <div className="divide-y divide-surface-container-high">
                  {results.map((med) => (
                    <div key={med.id} className="flex items-center gap-5 px-8 py-5 hover:bg-surface-container/20 transition-colors group">
                      <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-xl text-primary">medication</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-on-surface truncate">{med.trade_name}</p>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{t("drugs.exists")}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {med.manufacture?.name && (
                            <span className="text-xs text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">domain</span>
                              {med.manufacture.name}
                            </span>
                          )}
                          {med.form && (
                            <span className="text-xs text-on-surface-variant/60">{med.form}</span>
                          )}
                        </div>
                        {med.active_ingredients?.length > 0 && (
                          <p className="text-xs text-on-surface-variant/50 mt-1 truncate">
                            {med.active_ingredients.map(a => a.ingredient_name_en).join(", ")}
                          </p>
                        )}
                      </div>
                      <Link to="/Dashboard/StockManagement"
                        className="px-5 py-2.5 rounded-full bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-all flex items-center gap-1.5 opacity-0 group-hover:opacity-100">
                        <span className="material-symbols-outlined text-sm">inventory_2</span>
                        {t("drugs.addToInventory")}
                      </Link>
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center py-5 border-t border-surface-container-high">
                    <button onClick={loadMore} disabled={searchingMore}
                      className="px-8 py-2.5 rounded-full bg-surface-container text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-all disabled:opacity-50 flex items-center gap-2">
                      {searchingMore && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                      {searchingMore ? t("app.loading") : t("drugs.loadMore")}
                    </button>
                  </div>
                )}

                {searched && !hasMore && results.length > 0 && (
                  <div className="flex justify-center py-4 border-t border-surface-container-high">
                    <p className="text-xs text-on-surface-variant/60 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      {t("drugs.allLoaded")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {showForm && (
          <div>
            <button onClick={() => setShowForm(false)}
              className="mb-6 flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors group">
              <span className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
              {t("drugs.backToSearch")}
            </button>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              <div className="xl:col-span-7 bg-surface-container/40 rounded-3xl border border-surface-container-high p-10 flex flex-col gap-7">
                <div>
                  <h3 className="text-xl font-bold text-on-surface mb-1">{t("drugs.drugInfoTitle")}</h3>
                  <p className="text-sm text-on-surface-variant">{t("drugs.drugInfoHint")}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>{t("drugs.tradeName")}</label>
                  <div className="relative">
                    <input type="text" name="tradeName" value={formData.tradeName} onChange={handleChange}
                      className={`${inputCls("tradeName")} pl-12`} placeholder={t("placeholders.tradeNamePlaceholder")} />
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant/60 pointer-events-none text-lg">badge</span>
                  </div>
                  {errors.tradeName && <p className="text-xs text-rose-500 font-medium ml-1">{errors.tradeName}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>{t("drugs.activeIngredient")}</label>
                  <div className="relative">
                    <input type="text" name="activeIngredient" value={formData.activeIngredient} onChange={handleChange}
                      className={`${inputCls("activeIngredient")} pl-12`} placeholder={t("placeholders.ingredientPlaceholder")} />
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant/60 pointer-events-none text-lg">science</span>
                  </div>
                  {errors.activeIngredient && <p className="text-xs text-rose-500 font-medium ml-1">{errors.activeIngredient}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>{t("drugs.manufacturer")}</label>
                  <div className="relative">
                    <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange}
                      className={`${inputCls("manufacturer")} pl-12 pr-12`} placeholder={t("placeholders.manufacturerPlaceholder")} />
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant/60 pointer-events-none text-lg">domain</span>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant/30 pointer-events-none">business</span>
                  </div>
                  {errors.manufacturer && <p className="text-xs text-rose-500 font-medium ml-1">{errors.manufacturer}</p>}
                </div>
              </div>

              <div className="xl:col-span-5 bg-surface-container-lowest rounded-3xl p-10 shadow-ambient flex flex-col gap-7 xl:-mt-8 relative z-10 border border-surface-container-high">
                <div className="flex items-center gap-3 pb-5 border-b border-surface-container-high">
                  <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>science</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">{t("drugs.pharmacokinetics")}</h3>
                    <p className="text-xs text-on-surface-variant">{t("drugs.pharmacokineticsHint")}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>{t("drugs.concentration")}</label>
                  <div className="flex">
                    <input type="number" name="concentration" value={formData.concentration}
                      onChange={handleChange} step="0.01"
                      className={`w-full bg-surface-container/60 text-on-surface text-lg font-medium px-5 py-3.5 rounded-l-xl border-b-[3px] focus:outline-none focus:ring-0 transition-all placeholder:text-outline-variant ${
                        errors.concentration ? "border-b-rose-400" : "border-transparent focus:border-primary"
                      }`}
                      placeholder={t("placeholders.concentrationPlaceholder")} />
                    <div className="bg-surface-container flex items-center px-5 rounded-r-xl text-on-surface-variant font-bold text-sm border-b-[3px] border-transparent tracking-wide">{t("drugs.concentrationUnit")}</div>
                  </div>
                  {errors.concentration && <p className="text-xs text-rose-500 font-medium ml-1">{errors.concentration}</p>}
                </div>

                <div className="flex flex-col gap-3">
                  <label className={labelCls}>{t("drugs.dosageForm")}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {dosageOptions.map((opt) => {
                      const active = formData.dosageForm === opt.id;
                      return (
                        <button key={opt.id} type="button" onClick={() => setFormData(p => ({ ...p, dosageForm: opt.id }))}
                          className={`px-4 py-3 rounded-xl text-sm flex items-center gap-2.5 transition-all border ${
                            active
                              ? "bg-primary-container/30 border-primary text-primary font-bold shadow-sm"
                              : "bg-surface border-surface-container-high text-on-surface-variant font-medium hover:border-primary/30 hover:bg-surface-container/50"
                          }`}>
                          <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                          {t(opt.label)}
                        </button>
                      );
                    })}
                  </div>
                </div>


              </div>

              <div className="xl:col-span-12 flex justify-end items-center gap-4 pt-6 border-t border-surface-container-high">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-7 py-3.5 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-all">
                  {t("app.cancel")}
                </button>
                <button type="submit" disabled={submitting}
                  className="px-10 py-3.5 bg-gradient-to-r from-primary to-primary-dim text-on-primary rounded-full font-bold text-base shadow-ambient hover:shadow-[0px_15px_40px_-10px_rgba(11,106,106,0.5)] transition-all hover:-translate-y-0.5 flex items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting && <span className="material-symbols-outlined text-lg animate-spin">refresh</span>}
                  {submitting ? t("drugs.submitting") : t("drugs.submitDossier")}
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'wght' 700" }}>arrow_forward</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
