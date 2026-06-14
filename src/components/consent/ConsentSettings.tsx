import { useEffect, useRef, useCallback, useState } from "react";
import { useConsent } from "../../context/ConsentContext";
import { site } from "../../siteConfig";

export default function ConsentSettings() {
  const { showSettings, categories, services, closeSettings, saveConsent, acceptAll, rejectOptional } =
    useConsent();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const [editCategories, setEditCategories] = useState<Record<string, boolean>>({});
  const [editServices, setEditServices] = useState<Record<string, boolean>>({});

  const config = site.consent;

  useEffect(() => {
    if (showSettings) {
      previousFocus.current = document.activeElement as HTMLElement;
      setEditCategories({ ...categories });
      setEditServices({ ...services });
      setTimeout(() => {
        const first = dialogRef.current?.querySelector<HTMLElement>("button");
        first?.focus();
      }, 0);
    } else {
      previousFocus.current?.focus();
    }
  }, [showSettings, categories, services]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeSettings();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [closeSettings]
  );

  useEffect(() => {
    if (!showSettings) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showSettings, handleKeyDown]);

  const toggleCategory = (catId: string) => {
    const cat = config?.categories.find((c) => c.id === catId);
    if (cat?.required) return;
    const newValue = !editCategories[catId];
    setEditCategories((prev) => ({ ...prev, [catId]: newValue }));
    if (!newValue) {
      const svcs = config?.services.filter((s) => s.category === catId) || [];
      setEditServices((prev) => {
        const next = { ...prev };
        for (const svc of svcs) {
          next[svc.id] = false;
        }
        return next;
      });
    }
  };

  const toggleService = (svcId: string) => {
    const svc = config?.services.find((s) => s.id === svcId);
    if (!svc) return;
    const newCatValue = !editServices[svcId];
    setEditServices((prev) => ({ ...prev, [svcId]: newCatValue }));
    if (newCatValue) {
      setEditCategories((prev) => ({ ...prev, [svc.category]: true }));
    }
  };

  const handleSave = () => {
    saveConsent(editCategories, editServices);
  };

  if (!showSettings || !config) return null;

  const groupedServices = config.categories.map((cat) => ({
    ...cat,
    services: config.services.filter((s) => s.category === cat.id),
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-label="Cookie-Einstellungen"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/50" onClick={closeSettings} />
      <div
        ref={dialogRef}
        className="relative bg-surface-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text" style={{ fontFamily: "var(--font-heading)" }}>
              Cookie-Einstellungen
            </h2>
            <button
              onClick={closeSettings}
              className="text-text-muted hover:text-text p-1"
              aria-label="Schließen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-text-muted mt-2">
            Wählen Sie aus, welche externen Dienste Sie zulassen möchten.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {groupedServices.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-text">{cat.label}</h3>
                  <p className="text-xs text-text-muted">{cat.description}</p>
                </div>
                <button
                  onClick={() => toggleCategory(cat.id)}
                  disabled={cat.required}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    editCategories[cat.id]
                      ? "bg--primary"
                      : "bg-gray-300"
                  } ${cat.required ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  role="switch"
                  aria-checked={editCategories[cat.id]}
                  aria-label={`${cat.label} ${cat.required ? "(erforderlich)" : ""}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      editCategories[cat.id] ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
              {cat.services.length > 0 && (
                <div className="ml-4 space-y-2">
                  {cat.services.map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between py-1">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm text-text">{svc.label}</p>
                        <p className="text-xs text-text-muted">
                          {svc.provider} — {svc.purpose}
                        </p>
                        <a
                          href={svc.privacyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text--primary hover:underline"
                        >
                          Datenschutzinformation
                        </a>
                      </div>
                      <button
                        onClick={() => toggleService(svc.id)}
                        disabled={!editCategories[cat.id]}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                          editServices[svc.id] ? "bg--primary" : "bg-gray-300"
                        } ${
                          !editCategories[cat.id]
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        role="switch"
                        aria-checked={editServices[svc.id]}
                        aria-label={svc.label}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            editServices[svc.id] ? "translate-x-5" : ""
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-border flex flex-wrap gap-2">
          <button
            onClick={handleSave}
            className="flex-1 min-w-[140px] px-4 py-2 text-sm font-semibold rounded-lg bg--primary text-white hover:bg--primary-dark transition-colors"
          >
            Auswahl speichern
          </button>
          <button
            onClick={acceptAll}
            className="flex-1 min-w-[140px] px-4 py-2 text-sm font-semibold rounded-lg border border--primary text--primary hover:bg--primary/10 transition-colors"
          >
            Alle akzeptieren
          </button>
          <button
            onClick={rejectOptional}
            className="flex-1 min-w-[140px] px-4 py-2 text-sm font-semibold rounded-lg border border-border text-text hover:bg-surface-alt transition-colors"
          >
            Alle ablehnen
          </button>
        </div>
      </div>
    </div>
  );
}
