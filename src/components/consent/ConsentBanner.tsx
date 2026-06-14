import { useConsent } from "../../context/ConsentContext";

export default function ConsentBanner() {
  const { showBanner, acceptAll, rejectOptional, openSettings } = useConsent();

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6"
      role="dialog"
      aria-label="Cookie-Einstellungen"
    >
      <div className="max-w-4xl mx-auto bg-surface-card border border-border rounded-xl shadow-2xl p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-text" style={{ fontFamily: "var(--font-heading)" }}>
              Cookie-Einstellungen
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Wir nutzen Cookies, um Ihnen ein optimales Erlebnis zu bieten. Externe Dienste werden erst nach Ihrer Zustimmung geladen.{" "}
              <a href="#/datenschutz" className="text--primary hover:underline">
                Datenschutzerklärung
              </a>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:flex-shrink-0">
            <button
              onClick={rejectOptional}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-border text-text hover:bg-surface-alt transition-colors"
            >
              Nur notwendige
            </button>
            <button
              onClick={openSettings}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border--primary text--primary hover:bg--primary/10 transition-colors"
            >
              Einstellungen
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg--primary text-white hover:bg--primary-dark transition-colors"
            >
              Alle akzeptieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
