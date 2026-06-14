import { useConsent } from "../../context/ConsentContext";

export default function CookieSettingsLink({ className = "" }: { className?: string }) {
  const { openSettings } = useConsent();

  return (
    <button
      onClick={openSettings}
      className={`text--primary hover:underline ${className}`}
    >
      Cookie-Einstellungen
    </button>
  );
}
