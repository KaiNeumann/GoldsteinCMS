import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { site } from "../siteConfig";

const STORAGE_KEY = "goldstein_consent";

interface StoredConsent {
  version: string;
  decidedAt: string;
  categories: Record<string, boolean>;
  services: Record<string, boolean>;
}

interface ConsentContextType {
  consented: boolean;
  categories: Record<string, boolean>;
  services: Record<string, boolean>;
  showBanner: boolean;
  showSettings: boolean;
  hasConsent: (serviceId: string) => boolean;
  hasCategoryConsent: (categoryId: string) => boolean;
  saveConsent: (categories: Record<string, boolean>, services: Record<string, boolean>) => void;
  saveServiceConsent: (serviceId: string) => void;
  acceptAll: () => void;
  rejectOptional: () => void;
  openBanner: () => void;
  closeBanner: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const ConsentContext = createContext<ConsentContextType | null>(null);

export function useConsent(): ConsentContextType {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    return {
      consented: false,
      categories: {},
      services: {},
      showBanner: false,
      showSettings: false,
      hasConsent: () => false,
      hasCategoryConsent: () => false,
      saveConsent: () => {},
      saveServiceConsent: () => {},
      acceptAll: () => {},
      rejectOptional: () => {},
      openBanner: () => {},
      closeBanner: () => {},
      openSettings: () => {},
      closeSettings: () => {},
    };
  }
  return ctx;
}

function loadStoredConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredConsent;
  } catch {
    return null;
  }
}

function isConsentCurrent(stored: StoredConsent | null): boolean {
  if (!stored || !site.consent) return false;
  return stored.version === site.consent.version;
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [categories, setCategories] = useState<Record<string, boolean>>({});
  const [services, setServices] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = loadStoredConsent();
    if (isConsentCurrent(stored)) {
      setCategories(stored!.categories);
      setServices(stored!.services);
    } else if (site.consent?.enabled) {
      setShowBanner(true);
      const defaultCategories: Record<string, boolean> = {};
      const defaultServices: Record<string, boolean> = {};
      site.consent.categories.forEach((cat) => {
        defaultCategories[cat.id] = cat.required;
      });
      site.consent.services.forEach((svc) => {
        defaultServices[svc.id] = false;
      });
      setCategories(defaultCategories);
      setServices(defaultServices);
    }
  }, []);

  const saveConsent = useCallback((newCategories: Record<string, boolean>, newServices: Record<string, boolean>) => {
    setCategories(newCategories);
    setServices(newServices);
    const stored: StoredConsent = {
      version: site.consent?.version || "1.0",
      decidedAt: new Date().toISOString(),
      categories: newCategories,
      services: newServices,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    setShowBanner(false);
    setShowSettings(false);
  }, []);

  const saveServiceConsent = useCallback((serviceId: string) => {
    setServices((prev) => {
      const updated = { ...prev, [serviceId]: true };
      const stored: StoredConsent = {
        version: site.consent?.version || "1.0",
        decidedAt: new Date().toISOString(),
        categories,
        services: updated,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      return updated;
    });
  }, [categories]);

  const acceptAll = useCallback(() => {
    if (!site.consent) return;
    const allCategories: Record<string, boolean> = {};
    const allServices: Record<string, boolean> = {};
    site.consent.categories.forEach((cat) => {
      allCategories[cat.id] = true;
    });
    site.consent.services.forEach((svc) => {
      allServices[svc.id] = true;
    });
    saveConsent(allCategories, allServices);
  }, [saveConsent]);

  const rejectOptional = useCallback(() => {
    if (!site.consent) return;
    const requiredOnly: Record<string, boolean> = {};
    const noServices: Record<string, boolean> = {};
    site.consent.categories.forEach((cat) => {
      requiredOnly[cat.id] = cat.required;
    });
    site.consent.services.forEach((svc) => {
      noServices[svc.id] = false;
    });
    saveConsent(requiredOnly, noServices);
  }, [saveConsent]);

  const hasConsent = useCallback(
    (serviceId: string) => {
      return services[serviceId] === true;
    },
    [services]
  );

  const hasCategoryConsent = useCallback(
    (categoryId: string) => {
      return categories[categoryId] === true;
    },
    [categories]
  );

  const openBanner = useCallback(() => setShowBanner(true), []);
  const closeBanner = useCallback(() => setShowBanner(false), []);
  const openSettings = useCallback(() => {
    setShowSettings(true);
    setShowBanner(false);
  }, []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  const value: ConsentContextType = {
    consented: Object.entries(categories).some(([id, accepted]) => accepted),
    categories,
    services,
    showBanner,
    showSettings,
    hasConsent,
    hasCategoryConsent,
    saveConsent,
    saveServiceConsent,
    acceptAll,
    rejectOptional,
    openBanner,
    closeBanner,
    openSettings,
    closeSettings,
  };

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}