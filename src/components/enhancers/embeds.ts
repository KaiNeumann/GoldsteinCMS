import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { addCleanupCallback } from "../cms-enhance";

function checkConsentService(serviceId: string): boolean {
  try {
    const raw = localStorage.getItem("goldstein_consent");
    if (!raw) return false;
    const consent = JSON.parse(raw) as { version: string; services: Record<string, boolean> };
    return !!consent.services?.[serviceId];
  } catch {
    return false;
  }
}

function renderYouTubeEmbed(
  el: HTMLElement,
  videoId: string,
  title: string,
  aspect: string,
  start: string | null
) {
  const mountPoint = document.createElement("div");
  el.replaceChildren(mountPoint);

  import("../embeds/YouTubeEmbed").then(({ default: YouTubeEmbed }) => {
    const root = createRoot(mountPoint);
    root.render(
      createElement(YouTubeEmbed, {
        videoId,
        title,
        aspect,
        start: start ? parseInt(start, 10) : undefined,
      })
    );
    addCleanupCallback(el, () => {
      root.unmount();
    });
  });
}

export function enhanceYouTube(root: HTMLElement) {
  const containers = root.querySelectorAll("div.gf-youtube[data-video-id]");
  if (containers.length === 0) return;

  const VALID_ID = /^[a-zA-Z0-9_-]+$/;

  containers.forEach((container) => {
    const el = container as HTMLElement;
    const videoId = el.getAttribute("data-video-id") || "";
    const title = el.getAttribute("data-title") || "YouTube-Video";
    const aspect = el.getAttribute("data-aspect") || "16:9";
    const start = el.getAttribute("data-start");

    if (!videoId || !VALID_ID.test(videoId) || videoId.length > 20) {
      return;
    }

    const hasYoutubeConsent = checkConsentService("youtube");
    if (!hasYoutubeConsent) {
      const placeholder = document.createElement("div");
      placeholder.className = "bg-green-50 border border-border rounded-lg p-6 text-center";
      placeholder.setAttribute("role", "region");
      placeholder.setAttribute("aria-label", `${title} — YouTube`);

      const inner = document.createElement("div");
      inner.className = "max-w-md mx-auto";

      const heading = document.createElement("h3");
      heading.className = "font-bold text--primary mb-2";
      heading.textContent = `${title} laden?`;

      const desc = document.createElement("p");
      desc.className = "text-sm text-text mb-4";
      desc.textContent = "Beim Laden des Videos wird eine Verbindung zu YouTube hergestellt. Dabei können technische Daten wie Ihre IP-Adresse übertragen werden.";

      const btnRow = document.createElement("div");
      btnRow.className = "flex flex-wrap gap-2 justify-center";

      const settingsBtn = document.createElement("button");
      settingsBtn.className = "px-4 py-2 text-sm font-semibold rounded-lg border border--primary text--primary hover:bg--primary/10 transition-colors";
      settingsBtn.textContent = "Cookie-Einstellungen öffnen";
      settingsBtn.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("consent:open-settings"));
      });

      btnRow.appendChild(settingsBtn);
      inner.append(heading, desc, btnRow);
      placeholder.appendChild(inner);
      el.replaceChildren(placeholder);

      const consentHandler = () => {
        el.innerHTML = "";
        renderYouTubeEmbed(el, videoId, title, aspect, start);
      };
      window.addEventListener("consent:changed", consentHandler);
      addCleanupCallback(el, () => {
        window.removeEventListener("consent:changed", consentHandler);
      });
      return;
    }

    renderYouTubeEmbed(el, videoId, title, aspect, start);
  });
}

export function enhancePdf(root: HTMLElement) {
  const containers = root.querySelectorAll("div.gf-pdf[data-src]");
  if (containers.length === 0) return;

  containers.forEach((container) => {
    const el = container as HTMLElement;
    const src = el.getAttribute("data-src") || "";
    const title = el.getAttribute("data-title") || "PDF-Dokument";
    const height = parseInt(el.getAttribute("data-height") || "700", 10);

    if (!src || !/\.pdf$/i.test(src.split("?")[0].split("#")[0])) {
      return;
    }
    if (height < 300 || height > 1200) return;

    const mountPoint = document.createElement("div");
    el.replaceChildren(mountPoint);

    import("../embeds/PdfEmbed").then(({ default: PdfEmbed }) => {
      const root = createRoot(mountPoint);
      root.render(
        createElement(PdfEmbed, { src, title, height })
      );
      addCleanupCallback(el, () => {
        root.unmount();
      });
    });
  });
}

export function enhanceConsentEmbed(root: HTMLElement) {
  const embeds = root.querySelectorAll(".gf-consent-embed[data-service]");
  embeds.forEach((el) => {
    const container = el as HTMLElement;
    const service = container.getAttribute("data-service") || "";
    const title = container.getAttribute("data-title") || "";
    const src = container.getAttribute("data-src") || "";

    if (!service) return;

    if (checkConsentService(service) && src) {
      const iframe = document.createElement("iframe");
      iframe.title = title;
      iframe.src = src;
      iframe.className = "w-full rounded-lg border border-border";
      iframe.loading = "lazy";
      const height = container.getAttribute("data-height");
      if (height) iframe.style.height = `${height}px`;
      container.replaceChildren(iframe);
      return;
    }

    const placeholder = document.createElement("div");
    placeholder.className = "bg-green-50 border border-border rounded-lg p-6 text-center";
    placeholder.setAttribute("role", "region");
    placeholder.setAttribute("aria-label", `${title} — ${service}`);

    const inner = document.createElement("div");
    inner.className = "max-w-md mx-auto";

    const heading = document.createElement("h3");
    heading.className = "font-bold text--primary mb-2";
    heading.textContent = title ? `${title} laden?` : "Externes Element laden?";

    const desc = document.createElement("p");
    desc.className = "text-sm text-text mb-4";
    desc.textContent = "Dieses Element lädt Inhalte von einem externen Dienst. Aktivieren Sie die Zustimmung in den Cookie-Einstellungen.";

    const btnRow = document.createElement("div");
    btnRow.className = "flex flex-wrap gap-2 justify-center";

    if (src) {
      const loadOnceBtn = document.createElement("button");
      loadOnceBtn.className = "px-4 py-2 text-sm font-semibold rounded-lg border border-border text-text hover:bg-surface-alt transition-colors";
      loadOnceBtn.textContent = "Einmalig laden";
      loadOnceBtn.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("consent:load-once", { detail: { service } }));
        const iframe = document.createElement("iframe");
        iframe.title = title;
        iframe.src = src;
        iframe.className = "w-full rounded-lg border border-border";
        iframe.loading = "lazy";
        const height = container.getAttribute("data-height");
        if (height) iframe.style.height = `${height}px`;
        container.replaceChildren(iframe);
      });
      btnRow.appendChild(loadOnceBtn);
    }

    const settingsBtn = document.createElement("button");
    settingsBtn.className = "px-4 py-2 text-sm font-semibold rounded-lg border border--primary text--primary hover:bg--primary/10 transition-colors";
    settingsBtn.textContent = "Cookie-Einstellungen öffnen";
    settingsBtn.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("consent:open-settings"));
    });

    btnRow.appendChild(settingsBtn);
    inner.append(heading, desc, btnRow);
    placeholder.appendChild(inner);
    container.appendChild(placeholder);

    const consentHandler = () => {
      if (checkConsentService(service) && src) {
        window.removeEventListener("consent:changed", consentHandler);
        const iframe = document.createElement("iframe");
        iframe.title = title;
        iframe.src = src;
        iframe.className = "w-full rounded-lg border border-border";
        iframe.loading = "lazy";
        const height = container.getAttribute("data-height");
        if (height) iframe.style.height = `${height}px`;
        container.replaceChildren(iframe);
      }
    };
    window.addEventListener("consent:changed", consentHandler);
    addCleanupCallback(container, () => {
      window.removeEventListener("consent:changed", consentHandler);
    });
  });
}
