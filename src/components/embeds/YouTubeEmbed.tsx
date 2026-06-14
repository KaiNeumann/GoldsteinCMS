import { useState, useCallback, useEffect } from "react";

const VALID_VIDEO_ID = /^[a-zA-Z0-9_-]+$/;

interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  aspect?: string;
  start?: number;
}

function isValidVideoId(id: string): boolean {
  return VALID_VIDEO_ID.test(id) && id.length > 0 && id.length <= 20;
}

function hasYouTubeConsent(): boolean {
  try {
    const raw = localStorage.getItem("goldstein_consent");
    if (!raw) return false;
    const consent = JSON.parse(raw) as { services: Record<string, boolean> };
    return !!consent.services?.youtube;
  } catch {
    return false;
  }
}

export default function YouTubeEmbed({ videoId, title, aspect = "16:9", start }: YouTubeEmbedProps) {
  const [consented, setConsented] = useState(false);

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}${start ? `?start=${start}` : ""}`;

  useEffect(() => {
    if (!isValidVideoId(videoId)) return;
    if (hasYouTubeConsent()) setConsented(true);

    const handleConsentChange = () => {
      if (hasYouTubeConsent()) setConsented(true);
    };
    window.addEventListener("consent:changed", handleConsentChange);
    return () => window.removeEventListener("consent:changed", handleConsentChange);
  }, [videoId]);

  const handleLoadOnce = useCallback(() => {
    setConsented(true);
  }, []);

  const handleLoadAlways = useCallback(() => {
    window.dispatchEvent(new CustomEvent("consent:allow-permanent", { detail: { service: "youtube" } }));
    setConsented(true);
  }, []);

  if (!isValidVideoId(videoId)) {
    return null;
  }

  if (consented) {
    return (
      <div className="gf-youtube-embed" data-aspect={aspect}>
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="gf-youtube-placeholder">
      <div className="text-3xl mb-3">&#9654;</div>
      <h3 className="font-semibold text-text mb-1">{title}</h3>
      <p className="text-sm text-text-muted mb-4">
        YouTube · Externer Inhalt
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        <button
          type="button"
          onClick={handleLoadOnce}
          className="px-4 py-2 bg--primary text-white text-sm font-medium rounded-lg hover:bg--primary-dark transition-colors"
        >
          Einmalig laden
        </button>
        <button
          type="button"
          onClick={handleLoadAlways}
          className="px-4 py-2 border border-border text-text text-sm font-medium rounded-lg hover:border--primary transition-colors"
        >
          YouTube dauerhaft erlauben
        </button>
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 text--primary text-sm font-medium hover:underline"
        >
          Direkt auf YouTube ansehen
        </a>
      </div>
    </div>
  );
}
