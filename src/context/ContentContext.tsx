import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { defaultContent, type CmsComponent, type ContentData, type Post, type SiteConfig, type SiteImage } from "../content/defaultContent";
import { migrateSiteConfigToFields } from "../content/migrateSiteConfig";

const STORAGE_KEY = "goldsteinfreunde_content";
const DEV_ADMIN_PASSWORD_RAW = import.meta.env.VITE_DEV_ADMIN_PASSWORD as string | undefined;
const DEV_ADMIN_PASSWORD = normalizeDevPassword(DEV_ADMIN_PASSWORD_RAW);
const IS_LOCAL_DEV_FALLBACK = import.meta.env.DEV && !!DEV_ADMIN_PASSWORD;

interface ContentContextType {
  content: ContentData;
  isLoading: boolean;
  hasRemoteBackend: boolean;
  // Content operations
  savePost: (post: Post) => void;
  deletePost: (id: string) => void;
  updateSiteConfig: (config: SiteConfig) => void;
  updateFields: (fields: Record<string, unknown>) => void;
  saveComponent: (component: CmsComponent) => void;
  deleteComponent: (id: string) => void;
  // Image operations
  addImage: (image: SiteImage) => void;
  deleteImage: (id: string) => void;
  // Remote operations
  validateAdminPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  checkAdminSession: () => Promise<{ success: boolean; authenticated: boolean; error?: string }>;
  publishToRemote: (editor: string, summary: string) => Promise<{ success: boolean; error?: string; authExpired?: boolean }>;
  refreshFromRemote: () => Promise<{ success: boolean; error?: string }>;
  logoutAdminSession: () => Promise<void>;
  // Export/Import
  exportAsJson: (label?: string) => void;
  importFromJson: (json: string) => { success: boolean; error?: string };
  // Local save
  saveToLocal: () => void;
}

const ContentContext = createContext<ContentContextType | null>(null);

export function useContent(): ContentContextType {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ContentData>(defaultContent);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [hasRemoteBackend, setHasRemoteBackend] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState("");

  // Load saved content on mount
  useEffect(() => {
    // Detect if we're running from file:// protocol (standalone HTML)
    const isFileProtocol = typeof window !== "undefined" && window.location.protocol === "file:";
    // Also detect if no remote backend is configured (empty origin means file or local)
    const isLocalOnly = typeof window !== "undefined" && (window.location.origin === "null" || isFileProtocol);

    const loadContent = async () => {
      // Skip remote fetch for file:// protocol or when explicitly local
      if (isLocalOnly) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as ContentData;
            setContent(normalizeContent(parsed));
          } catch {
            // Use defaults
          }
        }
        setIsLoading(false);
        return;
      }

      try {
        const remote = await fetchFromRemote();
        const normalized = normalizeContent(remote.data);
        setContent(normalized);
        setRemoteVersion(remote.version);
        setHasRemoteBackend(true);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        setIsLoading(false);
        return;
      } catch (error) {
        // Try localStorage fallback - useful for standalone HTML files
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as ContentData;
            setContent(normalizeContent(parsed));
            setIsLoading(false);
            return;
          } catch {
            // Use defaults if localStorage parse fails
          }
        }
        if (!IS_LOCAL_DEV_FALLBACK) {
          setLoadError(error instanceof Error ? error.message : "Inhalte konnten nicht geladen werden");
          setIsLoading(false);
          return;
        }
      }

      // LocalStorage fallback is intentionally development-only.
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as ContentData;
          setContent(normalizeContent(parsed));
        } catch {
          // Use defaults
        }
      }
      setIsLoading(false);
    };

    loadContent();
  }, []);

  const savePost = useCallback((post: Post) => {
    setContent((prev) => {
      const exists = prev.posts.find((p) => p.id === post.id);
      const newPosts = exists
        ? prev.posts.map((p) => (p.id === post.id ? post : p))
        : [post, ...prev.posts];
      const updated = { ...prev, posts: sortPostsNewestFirst(newPosts) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deletePost = useCallback((id: string) => {
    setContent((prev) => {
      const updated = { ...prev, posts: prev.posts.filter((p) => p.id !== id) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateSiteConfig = useCallback((config: SiteConfig) => {
    setContent((prev) => {
      const updated = { ...prev, siteConfig: config };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateFields = useCallback((fields: Record<string, unknown>) => {
    setContent((prev) => {
      const updated = { ...prev, fields: sanitizeFields(fields) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const saveComponent = useCallback((component: CmsComponent) => {
    setContent((prev) => {
      const updated = {
        ...prev,
        components: {
          ...(prev.components || {}),
          [component.id]: component,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteComponent = useCallback((id: string) => {
    setContent((prev) => {
      const nextComponents = { ...(prev.components || {}) };
      delete nextComponents[id];
      const updated = { ...prev, components: nextComponents };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addImage = useCallback((image: SiteImage) => {
    setContent((prev) => {
      const updated = { ...prev, images: [image, ...(prev.images || [])] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteImage = useCallback((id: string) => {
    setContent((prev) => {
      const updated = { ...prev, images: (prev.images || []).filter((img) => img.id !== id) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const validateAdminPassword = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (IS_LOCAL_DEV_FALLBACK) {
      if (password === DEV_ADMIN_PASSWORD) {
        return { success: true };
      }
      return { success: false, error: "Falsches Passwort" };
    }

    try {
      await verifyPassword(password);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Unbekannter Fehler" };
    }
  }, []);

  const checkAdminSession = useCallback(async (): Promise<{ success: boolean; authenticated: boolean; error?: string }> => {
    if (IS_LOCAL_DEV_FALLBACK) {
      return { success: true, authenticated: true };
    }
    try {
      const authenticated = await fetchAdminSession();
      return { success: true, authenticated };
    } catch (e) {
      return { success: false, authenticated: false, error: e instanceof Error ? e.message : "Unbekannter Fehler" };
    }
  }, []);

  const publishToRemote = useCallback(async (editor: string, summary: string): Promise<{ success: boolean; error?: string; authExpired?: boolean }> => {
    try {
      const published = await publishRemoteContent(content, remoteVersion, editor, summary);
      setRemoteVersion(published.version);
      setHasRemoteBackend(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
      return { success: true };
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        return { success: false, error: e.message, authExpired: true };
      }
      return { success: false, error: e instanceof Error ? e.message : "Unbekannter Fehler" };
    }
  }, [content, remoteVersion]);

  const refreshFromRemote = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const remote = await fetchFromRemote();
      const normalized = normalizeContent(remote.data);
      setContent(normalized);
      setRemoteVersion(remote.version);
      setHasRemoteBackend(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Unbekannter Fehler" };
    }
  }, []);

  const exportAsJson = useCallback((label?: string) => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const safeLabel = (label || "backup").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/(^-|-$)/g, "").toLowerCase();
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goldsteinfreunde-content-${safeLabel}-${yyyy}${mm}${dd}-${hh}${min}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [content]);

  const importFromJson = useCallback((json: string): { success: boolean; error?: string } => {
    try {
      const data = JSON.parse(json) as ContentData;
      if (!data.posts) {
        return { success: false, error: "Ungültiges Format: posts erforderlich" };
      }
      const normalized = normalizeContent(data);
      setContent(normalized);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return { success: true };
    } catch {
      return { success: false, error: "Ungültiges JSON-Format" };
    }
  }, []);

  const saveToLocal = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  }, [content]);

  const logoutAdminSession = useCallback(async (): Promise<void> => {
    if (IS_LOCAL_DEV_FALLBACK) return;
    await fetch("/api/logout", { method: "POST" }).catch(() => undefined);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-alt flex items-center justify-center px-4">
        <div className="bg-surface-card rounded-xl shadow-md p-6 text-center text-text">
          <p className="font-semibold text--primary">Goldsteinfreunde</p>
          <p className="text-sm mt-1">Inhalte werden geladen...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-surface-alt flex items-center justify-center px-4">
        <div className="bg-surface-card rounded-xl shadow-md p-6 max-w-md text-center">
          <p className="font-semibold text-red-700">Inhalte konnten nicht geladen werden.</p>
          <p className="text-sm text-text mt-2">Bitte versuchen Sie es später erneut.</p>
        </div>
      </div>
    );
  }

  return (
    <ContentContext.Provider
      value={{
        content,
        isLoading,
        hasRemoteBackend,
        savePost,
        deletePost,
        updateSiteConfig,
        updateFields,
        saveComponent,
        deleteComponent,
        addImage,
        deleteImage,
        validateAdminPassword,
        checkAdminSession,
        publishToRemote,
        refreshFromRemote,
        logoutAdminSession,
        exportAsJson,
        importFromJson,
        saveToLocal,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}

function normalizeContent(data: ContentData): ContentData {
  const defaults = defaultContent.siteConfig;
  const siteConfig = data.siteConfig || defaults;
  const siteConfigFields = migrateSiteConfigToFields({
    ...defaults,
    ...siteConfig,
    address: { ...defaults.address, ...siteConfig.address },
    bankAccount: { ...defaults.bankAccount, ...siteConfig.bankAccount },
    registry: { ...defaults.registry, ...siteConfig.registry },
    responsibleContent: { ...defaults.responsibleContent, ...siteConfig.responsibleContent },
    pageContent: { ...defaults.pageContent, ...siteConfig.pageContent },
  });
  const normalized: ContentData = {
    ...data,
    posts: sortPostsNewestFirst((data.posts || []).map((post) => ({ ...post, content: sanitizeContentString(post.content || "") }))),
    images: (data.images || []).map((img) => ({
      ...img,
      copyright: img.copyright || "Privat",
    })),
    components: normalizeComponents(data.components),
    fields: sanitizeFields({
      ...migrateSiteConfigToFields(defaults),
      ...siteConfigFields,
      ...(data.fields || {}),
    }),
    siteConfig: {
      ...defaults,
      ...siteConfig,
      address: { ...defaults.address, ...siteConfig.address },
      bankAccount: { ...defaults.bankAccount, ...siteConfig.bankAccount },
      registry: { ...defaults.registry, ...siteConfig.registry },
      responsibleContent: { ...defaults.responsibleContent, ...siteConfig.responsibleContent },
      bannerImage: siteConfig.bannerImage || defaults.bannerImage,
      bannerImageCredit: siteConfig.bannerImageCredit || defaults.bannerImageCredit || "Gerd Hildebrand",
      pageContent: {
        homeWelcomeHtml: sanitizeContentString(siteConfig.pageContent?.homeWelcomeHtml || defaults.pageContent.homeWelcomeHtml),
        aboutMainHtml: sanitizeContentString(siteConfig.pageContent?.aboutMainHtml || defaults.pageContent.aboutMainHtml),
        huettennutzungIntroHtml: sanitizeContentString(siteConfig.pageContent?.huettennutzungIntroHtml || defaults.pageContent.huettennutzungIntroHtml),
        impressumHtml: sanitizeContentString(siteConfig.pageContent?.impressumHtml || defaults.pageContent.impressumHtml),
        datenschutzHtml: sanitizeContentString(siteConfig.pageContent?.datenschutzHtml || defaults.pageContent.datenschutzHtml),
      },
    },
  };
  return normalized;
}

function normalizeComponents(components: ContentData["components"]): Record<string, CmsComponent> {
  if (!components || typeof components !== "object") return {};
  return Object.fromEntries(
    Object.entries(components).filter(([, component]) => {
      return component && typeof component.id === "string" && typeof component.type === "string" && typeof component.data === "object";
    })
  );
}

function sanitizeFields(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => {
      if (typeof value === "string" && isHtmlFieldKey(key)) {
        return [key, sanitizeContentString(value)];
      }
      return [key, value];
    })
  );
}

function isHtmlFieldKey(key: string): boolean {
  return key.endsWith(".html") || key.endsWith("Html");
}

function sortPostsNewestFirst(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.id.localeCompare(a.id);
  });
}

function sanitizeContentString(value: string): string {
  return escapeAuthoredHtml(sanitizeMarkdownUrls(value));
}

function sanitizeMarkdownUrls(value: string): string {
  return value.replace(/\]\(\s*(javascript:|data:)[^)]+\)/gi, "](unsafe-url-removed)");
}

function escapeAuthoredHtml(value: string): string {
  return value.replace(/<\/?[a-zA-Z][^>]*>/g, (tag) => tag.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
}

function normalizeDevPassword(value: string | undefined): string {
  if (!value) return "";
  let normalized = value.trim();
  if (
    (normalized.startsWith("\"") && normalized.endsWith("\"")) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1);
  }
  normalized = normalized.replace(/\\\$/g, "$");
  return normalized;
}

// ─── Remote API helpers ──────────────────────────────────────

async function fetchFromRemote(): Promise<{ data: ContentData; version: string }> {
  const res = await fetch("/api/content");
  if (!res.ok) throw new Error(`Remote-Inhalte nicht erreichbar (${res.status})`);
  const payload = await readJsonResponse(res, "Remote-Inhalte nicht erreichbar. Läuft lokal nur Vite statt Cloudflare Pages Functions?");
  return { data: payload.data as ContentData, version: (payload.version as string) || "" };
}

async function verifyPassword(password: string): Promise<void> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Anmeldung fehlgeschlagen (${res.status})`);
  }
}

async function fetchAdminSession(): Promise<boolean> {
  const res = await fetch("/api/session");
  if (!res.ok) throw new Error(`Sitzungsprüfung fehlgeschlagen (${res.status})`);
  const payload = (await readJsonResponse(res, "Sitzungsprüfung fehlgeschlagen")) as { authenticated?: boolean };
  return !!payload.authenticated;
}

async function readJsonResponse(res: Response, fallbackError: string): Promise<any> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(fallbackError);
  }
  try {
    return await res.json();
  } catch {
    throw new Error(fallbackError);
  }
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function publishRemoteContent(data: ContentData, baseVersion: string, editor: string, summary: string): Promise<{ version: string }> {
  const res = await fetch("/api/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, baseVersion, editor, summary }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(res.status, err.error || `Veröffentlichen fehlgeschlagen (${res.status})`);
  }
  return (await readJsonResponse(res, "Veröffentlichen fehlgeschlagen")) as { version: string };
}
