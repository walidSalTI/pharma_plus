import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNotificationCount } from "../contexts/NotificationContext";
import toast from "react-hot-toast";
import { medicationApi } from "../services/medication.service";
import { stockApi } from "../services/stockApi";
import MedicationSearchBar from "../components/MedicationSearchBar";

  export default function MedicationsPage() {
  const { t } = useTranslation();
  const { selectedPharmacy } = useOutletContext();
  const { unreadCount } = useNotificationCount();

  const [medications, setMedications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [searched, setSearched] = useState(false);
  const [currentName, setCurrentName] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentIngredient, setCurrentIngredient] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === medications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(medications.map(m => m.id));
    }
  };

  const handleBulkAdd = async () => {
    if (!selectedPharmacy?.id) { toast.error(t("errors.noPharmacySelected")); return; }
    setSubmitting(true);
    const items = selectedIds.map((id) => ({
      medication_id: id,
      stock: 0,
      min_stock: 0,
      price: 0,
    }));
    try {
      const res = await stockApi.bulkAddItems(selectedPharmacy.id, items);
      const count = res?.data?.length ?? 0;
      const skipped = res?.skipped?.length ?? 0;
      setSubmitting(false);
      setSelectedIds([]);
      if (count > 0) {
        toast.success(t("medications.addedToInventory", { count }));
      }
      if (skipped > 0) {
        toast(t("medications.someSkipped", { count: skipped }), { icon: "⚠️" });
      }
      if (count === 0 && skipped === 0) {
        toast.error(t("medications.addFailed"));
      }
    } catch {
      setSubmitting(false);
      toast.error(t("medications.addFailed"));
    }
  };

  const fetchMedications = async (name, company, ingredient, p, append = false) => {
    if (append) { setLoadingMore(true); } else { setLoading(true); }
    try {
      const params = { page: p };
      if (name.trim()) params.name = name.trim();
      if (company.trim()) params.company = company.trim();
      if (ingredient.trim()) params.active_ingredient = ingredient.trim();
      const json = await medicationApi.fetchAll(params);
      const items = json?.data ?? [];
      if (append) { setMedications(prev => [...prev, ...items]); } else { setMedications(items); }
      const meta = json?.meta;
      if (meta) { setHasMore(meta.current_page < meta.last_page); } else { setHasMore(items.length === 15); }
      setLoaded(true);
    } catch {
      setMedications([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications("", "", "", 1); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const handleSearch = (name, company, ingredient) => {
    setCurrentName(name);
    setCurrentCompany(company);
    setCurrentIngredient(ingredient);
    setSearched(true);
    setPage(1);
    fetchMedications(name, company, ingredient, 1);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchMedications(currentName, currentCompany, currentIngredient, next, true);
  };

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent pointer-events-none" />
        <div className="relative z-10">
          <header className="sticky top-0 z-50 bg-surface/70 backdrop-blur-xl border-b border-surface-container-high">
            <div className="flex items-center justify-between px-8 py-3">
              <div className="flex-1 flex items-center gap-4">
                <MedicationSearchBar onSearch={handleSearch} searching={loading} />
              </div>
              <div className="flex items-center gap-1">
                <Link to="/Dashboard/Notifications" className="relative p-2.5 hover:bg-primary-container/20 transition-all rounded-xl">
                  <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-surface" />
                  )}
                </Link>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-8 py-10 pb-32">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-on-primary text-lg">medication</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-on-surface tracking-tight">{t("medications.title")}</h1>
                  <p className="text-sm text-on-surface-variant">{t("medications.description")}</p>
                </div>
              </div>
              {loaded && medications.length > 0 && (
                <div className="flex items-center gap-3 text-xs text-on-surface-variant/60">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    {t("medications.count", { count: medications.length })}
                  </span>
                  {selectedIds.length > 0 && (
                    <>
                      <span className="w-0.5 h-3 bg-outline-variant/30 rounded-full" />
                      <span className="flex items-center gap-1.5 text-primary font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {t("medications.nSelected", { count: selectedIds.length })}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {initialLoading && (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-2xl bg-primary/5 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-primary/40 animate-spin">refresh</span>
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant font-medium">{t("app.loading")}</p>
              </div>
            )}

            {!initialLoading && loaded && medications.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-6 border border-amber-200 dark:border-amber-800/30">
                  <span className="material-symbols-outlined text-4xl text-amber-400" style={{ fontVariationSettings: "'wght' 300" }}>pill_off</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">
                  {searched ? t("medications.notFoundTitle") : t("medications.emptyTitle")}
                </h3>
                <p className="text-on-surface-variant/70 text-sm max-w-md text-center mb-8">
                  {searched ? t("medications.notFoundHint") : t("medications.emptyHint")}
                </p>
              </div>
            )}

            {!initialLoading && loading && medications.length === 0 && (
              <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                  <p className="text-sm text-on-surface-variant">{t("app.loading")}</p>
                </div>
              </div>
            )}

            {medications.length > 0 && (
              <>
                <div className="bg-surface-container/40 rounded-2xl border border-surface-container-high overflow-hidden">
                  <div className="px-6 py-3.5 bg-surface-container/60 border-b border-surface-container-high flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center justify-center w-5 h-5 cursor-pointer">
                        <input type="checkbox"
                          checked={selectedIds.length === medications.length}
                          onChange={selectAll}
                          className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30 focus:ring-offset-0 transition-all cursor-pointer" />
                      </label>
                      <span className="text-xs font-medium text-on-surface-variant">{t("medications.selectAll")}</span>
                    </div>
                    {selectedIds.length > 0 && (
                      <span className="text-xs font-bold text-primary bg-primary-container/30 px-3 py-1 rounded-full">
                        {t("medications.nSelected", { count: selectedIds.length })}
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-surface-container-high">
                    {medications.map((med) => {
                      const isSelected = selectedIds.includes(med.id);
                      return (
                        <div key={med.id}
                          onClick={() => toggleSelect(med.id)}
                          className={`flex items-start gap-4 px-6 py-4.5 transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? "bg-primary-container/[0.06]"
                              : "hover:bg-surface-container/30"
                          }`}
                        >
                          <label className="flex items-center justify-center w-5 h-5 mt-1 cursor-pointer flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(med.id)}
                              className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30 focus:ring-offset-0 transition-all cursor-pointer" />
                          </label>

                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/[0.07] flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-xl text-primary/70">medication</span>
                          </div>

                          <div className="min-w-0 flex-1 pt-0.5">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <p className="font-semibold text-sm text-on-surface truncate max-w-[280px]">{med.trade_name}</p>
                              {med.form && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-container-high text-on-surface-variant/70 uppercase tracking-wide">
                                  {med.form}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {med.manufacture?.name && (
                                <span className="text-[11px] text-on-surface-variant/60 flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[13px] text-on-surface-variant/40">domain</span>
                                  {med.manufacture.name}
                                </span>
                              )}
                            </div>
                            {med.active_ingredients?.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                <span className="material-symbols-outlined text-[12px] text-on-surface-variant/30">science</span>
                                {med.active_ingredients.map((a, i) => (
                                  <span key={i}
                                    className="text-[11px] text-on-surface-variant/50 bg-surface-container-high/50 px-2 py-0.5 rounded-md">
                                    {a.ingredient_name_en}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>


                        </div>
                      );
                    })}
                  </div>

                  {hasMore && (
                    <div className="flex justify-center py-5 border-t border-surface-container-high bg-surface-container/20">
                      <button onClick={loadMore} disabled={loadingMore}
                        className="px-8 py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant font-semibold text-xs hover:bg-surface-container-higher transition-all disabled:opacity-40 flex items-center gap-2.5">
                        {loadingMore && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                        {loadingMore ? t("app.loading") : (
                          <>
                            {t("medications.loadMore")}
                            <span className="material-symbols-outlined text-sm">expand_more</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {!hasMore && medications.length > 0 && (
                    <div className="flex justify-center py-4 border-t border-surface-container-high bg-surface-container/20">
                      <p className="text-[11px] text-on-surface-variant/40 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        {t("medications.allLoaded")}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedPharmacy && selectedIds.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-surface-container-high px-5 py-3.5 flex items-center gap-4 backdrop-blur-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-container/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm text-primary">checklist</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface leading-tight">{selectedIds.length}</p>
                  <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-wide font-medium">{t("medications.selected")}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-outline-variant/20" />
              <button onClick={handleBulkAdd} disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-dim transition-all flex items-center gap-2 shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                <span className="material-symbols-outlined text-sm">inventory_2</span>
                {submitting ? t("app.loading") : t("medications.bulkAdd")}
              </button>
              <button onClick={() => setSelectedIds([])}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-all">
                {t("app.cancel")}
              </button>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
