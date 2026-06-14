import { useState, useEffect } from "react";
import { useConsent } from "../../context/ConsentContext";
import { site } from "../../siteConfig";

interface ConsentEmbedProps {
  service: string;
  src?: string;
  title: string;
  aspect?: string;
  children?: React.ReactNode;
}

export default function ConsentEmbed({
  service,
  src,
  title,
  aspect = "16/9",
  children,
}: ConsentEmbedProps) {
  const { hasConsent, saveServiceConsent, openSettings } = useConsent();
  const config = site.consent;
  const serviceConfig = config?.services.find((s) => s.id === service);
  const isConsented = hasConsent(service);

  const [onceLoaded, setOnceLoaded] = useState(false);

  useEffect(() => {
    const handleOnceLoad = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.service === service) {
        setOnceLoaded(true);
      }
    };
    const handleAllowPermanent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.service === service) {
        saveServiceConsent(service);
      }
    };
    const handleOpenSettings = () => {
      openSettings();
    };

    window.addEventListener("consent:load-once", handleOnceLoad);
    window.addEventListener("consent:allow-permanent", handleAllowPermanent);
    window.addEventListener("consent:open-settings", handleOpenSettings);
    return () => {
      window.removeEventListener("consent:load-once", handleOnceLoad);
      window.removeEventListener("consent:allow-permanent", handleAllowPermanent);
      window.removeEventListener("consent:open-settings", handleOpenSettings);
    };
  }, [service, saveServiceConsent, openSettings]);

  if (isConsented || onceLoaded) {
    if (children) return <>{children}</>;
    if (src) {
      return (
        <div style={{ aspectRatio: aspect }} className="relative w-full">
          <iframe
            title={title}
            src={src}
            className="absolute inset-0 w-full h-full rounded-lg"
            loading="lazy"
          />
        </div>
      );
    }
    return null;
  }

  return (
    <div
      className="bg-green-50 border border-border rounded-lg p-6 text-center"
      role="region"
      aria-label={`${title} — ${serviceConfig?.label || service}`}
    >
      <div className="max-w-md mx-auto">
        <h3 className="font-bold text--primary mb-2">{title} laden?</h3>
        <p className="text-sm text-text mb-1">
          {serviceConfig?.purpose || "Dieses Element lädt Inhalte von einem externen Dienst."}
        </p>
        <p className="text-xs text-text-muted mb-4">
          Dabei werden Daten an {serviceConfig?.provider || service} übertragen.
          {serviceConfig?.privacyUrl && (
            <>
              {" "}
              <a
                href={serviceConfig.privacyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text--primary hover:underline"
              >
                Datenschutzinformation
              </a>
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {src && (
            <button
              onClick={() => setOnceLoaded(true)}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-border text-text hover:bg-surface-alt transition-colors"
            >
              Einmalig laden
            </button>
          )}
          <button
            onClick={() => saveServiceConsent(service)}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg--primary text-white hover:bg--primary-dark transition-colors"
          >
            Dauerhaft erlauben
          </button>
        </div>
      </div>
    </div>
  );
}
