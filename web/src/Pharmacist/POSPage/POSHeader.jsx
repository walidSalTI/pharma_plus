import { useTranslation } from 'react-i18next';

export default function POSHeader({ onScan, setScannerOpen, manualBarcode, setManualBarcode, cart, onClearAll }) {
  const { t } = useTranslation();

  return (
    <header className="bg-surface/80 backdrop-blur-2xl sticky top-0 border-b border-surface-container-high flex flex-wrap items-center justify-between w-full px-4 sm:px-8 py-3 z-50 gap-3">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <button
          onClick={() => setScannerOpen(true)}
          className="group flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
        >
          <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">barcode_scanner</span>
          <span className="hidden sm:inline">{t('scanner.scanBarcode')}</span>
        </button>
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute start-3 text-outline-variant text-lg pointer-events-none">barcode</span>
          <input
            type="text"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                const val = manualBarcode.trim();
                if (val) { onScan(val); setManualBarcode(''); }
              }
            }}
            placeholder={t('pos.enterBarcode', 'Enter barcode')}
            className="w-36 sm:w-48 bg-surface-container-lowest border border-surface-container-high rounded-xl py-2.5 ps-10 pe-3 text-sm text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
      </div>
      {cart.length > 0 && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant font-bold text-sm hover:bg-rose-50 hover:text-rose-600 transition-all"
        >
          <span className="material-symbols-outlined text-lg">delete_sweep</span>
          <span className="hidden sm:inline">{t('pos.clearAll')}</span>
        </button>
      )}
    </header>
  );
}
