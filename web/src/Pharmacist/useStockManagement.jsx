import { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import { stockApi } from '../services/stockApi';
import { api } from '../services/api';

export function useStockManagement(pharmacyId, lowStock = false) {
  const { t } = useTranslation();
  const [medications, setMedications] = useState([]);
  const [isLoadingMeds, setIsLoadingMeds] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbResults, setDbResults] = useState([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [addingItemId, setAddingItemId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All Medications');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categories] = useState(['All Medications']);
  const [isLoadingCategories] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [globalMinStock, setGlobalMinStock] = useState(10);
  const [updating, setUpdating] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchInventory = useCallback(async (pageNum, append = false, isLowStock = false) => {
    if (!pharmacyId) return;
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingMeds(true);
    }
    try {
      const res = isLowStock ? await stockApi.fetchLowStock(pharmacyId) : await stockApi.fetchInventory(pharmacyId, pageNum);
      const items = res?.data ?? [];
      if (Array.isArray(items)) {
        const enriched = items.map(med => ({
          ...med,
          editPrice: med.price ?? '',
        }));
        if (append) {
          setMedications(prev => [...prev, ...enriched]);
        } else {
          setMedications(enriched);
          const first = items.find(m => m.min_stock != null);
          if (first) setGlobalMinStock(first.min_stock);
        }
        const meta = res?.meta;
        if (meta) {
          setHasMore(meta.current_page < meta.last_page);
        } else {
          setHasMore(items.length === 50);
        }
      }
    } catch {
      setStatusMessage({ text: 'Failed to load inventory.', type: 'error' });
    } finally {
      setIsLoadingMeds(false);
      setIsLoadingMore(false);
    }
  }, [pharmacyId]);

  useEffect(() => {
    setMedications([]); // eslint-disable-line react-hooks/set-state-in-effect
    setPage(1);
    setHasMore(true);
    if (pharmacyId) {
      fetchInventory(1, false, lowStock);
    }
  }, [pharmacyId, fetchInventory, lowStock]);

  const loadMore = useCallback(() => {
    if (lowStock) return;
    if (!hasMore || isLoadingMore || isLoadingMeds) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchInventory(nextPage, true);
  }, [page, hasMore, isLoadingMore, isLoadingMeds, fetchInventory, lowStock]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setDbResults([]); return; } // eslint-disable-line react-hooks/set-state-in-effect
    const timer = setTimeout(async () => {
      setIsSearchingDb(true);
      try {
        const json = await api("GET", "/api/v1/medications", {
          params: { name: searchQuery, company: searchQuery, active_ingredient: searchQuery, page: 1 },
        });
        setDbResults(json?.data ?? []);
      } catch { setDbResults([]); }
      finally { setIsSearchingDb(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCheckboxChange = (id) => {
    setMedications(prev => prev.map(med => med.id === id ? { ...med, checked: !med.checked } : med));
  };

  const handleQuantityChange = (id, val) => {
    setMedications(prev => prev.map(med => med.id === id ? { ...med, addedQty: val } : med));
  };

  const handlePriceChange = (id, val) => {
    setMedications(prev => prev.map(med => med.id === id ? { ...med, editPrice: val } : med));
  };

  const addToInventory = async (med) => {
    if (!pharmacyId) return;
    setAddingItemId(med.id);
    try {
      const payload = {
        medication_id: med.id,
        price: 0,
        stock: 1,
        min_stock: globalMinStock,
      };
      await stockApi.addItem(pharmacyId, payload);
      setStatusMessage({ text: t("success.added", { name: med.trade_name }), type: 'success' });
      setDbResults(prev => prev.filter(d => d.id !== med.id));
      await fetchInventory(1, false);
    } catch {
      setStatusMessage({ text: t("errors.addFailed", { name: med.trade_name }), type: 'error' });
    } finally { setAddingItemId(null); }
  };

  const handleUpdateSelected = async () => {
    if (!pharmacyId) return;
    setUpdating(true);
    let updatedCount = 0;
    const minStock = parseInt(globalMinStock, 10);
    const globalMinStockChanged = !isNaN(minStock);

    const nextMeds = medications.map(med => {
      const qty = parseInt(med.addedQty, 10) || 0;
      const price = parseFloat(med.editPrice);
      const priceChanged = !isNaN(price) && price !== med.price;
      const shouldUpdate = med.checked || qty > 0 || priceChanged;

      if (shouldUpdate && med.id) {
        const payload = {};
        if (qty > 0) payload.stock = qty;
        if (priceChanged) payload.price = price;
        if (globalMinStockChanged && med.checked) payload.min_stock = minStock;
        if (Object.keys(payload).length > 0) {
          updatedCount++;
          stockApi.updateItem(pharmacyId, med.id, payload).catch(() => {});
        }
        return {
          ...med,
          stock: (med.stock || 0) + qty,
          price: priceChanged ? price : med.price,
          min_stock: globalMinStockChanged && med.checked ? minStock : med.min_stock,
          addedQty: '',
          checked: false,
        };
      }
      return med;
    });

    if (updatedCount === 0) {
      setStatusMessage({ text: t("validation.enterQuantity"), type: 'error' });
      setUpdating(false);
      return;
    }

    setMedications(nextMeds);
    await fetchInventory(1, false);
    setStatusMessage({ text: t("success.updated", { count: updatedCount }), type: 'success' });
    setUpdating(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !pharmacyId) return;

    setStatusMessage({ text: 'Processing file...', type: 'info' });
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length <= 1) throw new Error("File is empty or has an invalid format.");

        const dataRows = rows.slice(1);
        const payload = [];

        dataRows.forEach(row => {
          if (!row || row.length === 0) return;
          payload.push({
            commercial_name: row[0] ? String(row[0]).trim() : '',
            active_ingredient: row[1] ? String(row[1]).trim() : '',
            concentration: row[2] ? String(row[2]).trim() : '',
            stock_quantity: parseInt(row[3], 10) || 0,
            retail_price: parseFloat(row[4]) || 0,
            expiry_date: row[5] ? String(row[5]).trim() : '',
          });
        });

        if (payload.length === 0) {
          setStatusMessage({ text: 'No valid rows found in the file.', type: 'error' });
          return;
        }

        setStatusMessage({ text: `Bulk import completed (${payload.length} items).`, type: 'success' });
        fetchInventory(1, false);
      } catch (error) {
        setStatusMessage({ text: `Failed to process file: ${error.message}`, type: 'error' });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredMedications = medications.filter(med => {
    const name = med.medication?.trade_name || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const groupedMedications = { All: filteredMedications };

  const inventoryIds = new Set(medications.map(m => m.medication_id ?? m.id));
  const dbOnlyResults = dbResults.filter(d => !inventoryIds.has(d.id));

  const firstChecked = medications.find(m => m.checked);
  const selectedMedication = firstChecked ? { id: firstChecked.id } : null;

  return {
    isLoadingMeds,
    isLoadingMore,
    hasMore,
    loadMore,
    searchQuery, setSearchQuery,
    activeFilter, setActiveFilter,
    isDropdownOpen, setIsDropdownOpen,
    categorySearch, setCategorySearch,
    categories,
    isLoadingCategories,
    statusMessage,
    dropdownRef,
    fileInputRef,
    filteredCategories,
    groupedMedications,
    medications,
    handleCheckboxChange,
    handleQuantityChange,
    handlePriceChange,
    selectedMedication,
    globalMinStock, setGlobalMinStock,
    updating,
    handleUpdateSelected,
    handleFileChange,
    dbOnlyResults,
    isSearchingDb,
    addingItemId,
    addToInventory,
  };
}
