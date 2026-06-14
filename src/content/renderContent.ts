import { marked } from "marked";
import type { CmsComponent, SiteImage } from "./defaultContent";

type ShortcodeAttrs = Record<string, string>;
type ComponentStore = Record<string, CmsComponent>;

marked.setOptions({
  async: false,
  breaks: false,
  gfm: true,
});

export function renderContent(source: string, components: ComponentStore = {}, images: SiteImage[] = []): string {
  if (!source.trim()) return "";

  const placeholders: string[] = [];
  const escapedSource = escapeAuthoredHtml(source);
  const withPlaceholders = escapedSource.replace(/\{\{\s*([a-zA-Z][\w-]*)\s*([^}]*)\}\}/g, (match, name: string, rawAttrs: string) => {
    const html = renderShortcode(name, parseAttrs(rawAttrs), components, images);
    if (!html) return match;
    const placeholder = `@@GFCMS_SHORTCODE_${placeholders.length}@@`;
    placeholders.push(html);
    return placeholder;
  });

  const rendered = marked.parse(withPlaceholders) as string;
  const html = placeholders.reduce(
    (html, shortcodeHtml, index) => html.replace(`<p>@@GFCMS_SHORTCODE_${index}@@</p>`, shortcodeHtml).replace(`@@GFCMS_SHORTCODE_${index}@@`, shortcodeHtml),
    rendered
  );

  return html;
}

function escapeAuthoredHtml(source: string): string {
  return source.replace(/<\/?[a-zA-Z][^>]*>/g, (tag) => escapeHtml(tag));
}

function parseAttrs(input: string): ShortcodeAttrs {
  const attrs: ShortcodeAttrs = {};
  const attrPattern = /([a-zA-Z][\w-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s]+))/g;
  let match: RegExpExecArray | null;
  while ((match = attrPattern.exec(input))) {
    attrs[match[1]] = match[3] ?? match[4] ?? match[5] ?? "";
  }
  return attrs;
}

function renderShortcode(name: string, attrs: ShortcodeAttrs, components: ComponentStore, images: SiteImage[]): string {
  switch (name) {
    case "component":
      return renderStoredComponent(attrs.id || "", components, images);
    case "youtube":
      return renderYouTube(attrs);
    case "pdf":
      return renderPdf(attrs);
    case "contactForm":
      return `<div class="gf-contact-form" data-form-id="${escapeAttr(attrs.formId || "default")}"></div>`;
    case "newsletter":
      return `<div class="gf-newsletter-signup" data-form-id="${escapeAttr(attrs.formId || "default")}"></div>`;
    case "socialLinks":
      return `<div class="gf-social-links" data-variant="${escapeAttr(attrs.variant || "icons")}"></div>`;
    default:
      return "";
  }
}

function renderStoredComponent(id: string, components: ComponentStore, images: SiteImage[]): string {
  const component = components[id];
  if (!component) return "";
  const data = component.data || {};
  switch (component.type) {
    case "gallery":
      return renderGallery(data, images);
    case "slider":
      return renderSlider(data, images);
    case "collapsible":
      return renderCollapsible(data);
    case "accordion":
      return renderAccordion(data);
    case "callout":
      return renderCallout(data);
    case "table":
      return renderTable(data);
    case "youtubeEmbed":
      return renderYouTube(dataToAttrs(data));
    case "pdfEmbed":
      return renderPdf(dataToAttrs(data));
    case "cardGrid":
      return renderCardGrid(data, images);
    case "steps":
      return renderSteps(data, images);
    case "socialLinks":
      return `<div class="gf-social-links" data-variant="${escapeAttr(stringValue(data.variant, "icons"))}"></div>`;
    case "contactForm":
      return `<div class="gf-contact-form" data-form-id="${escapeAttr(stringValue(data.formId, "default"))}"></div>`;
    case "newsletterSignup":
      return `<div class="gf-newsletter-signup" data-form-id="${escapeAttr(stringValue(data.formId, "default"))}"></div>`;
    default:
      return "";
  }
}

function renderGallery(data: Record<string, unknown>, images: SiteImage[]): string {
  const columns = stringValue(data.columns, "3");
  const items = arrayValue(data.images);
  const figures = items.map((item) => renderFigure(item, images)).filter(Boolean).join("\n");
  if (!figures) return "";
  return `<div class="gf-gallery" data-columns="${escapeAttr(columns)}">\n${figures}\n</div>`;
}

function renderSlider(data: Record<string, unknown>, images: SiteImage[]): string {
  const autoplay = stringValue(data.autoplay, "5000");
  const figures = arrayValue(data.images).map((item) => renderFigure(item, images)).filter(Boolean).join("\n");
  if (!figures) return "";
  return `<div class="gf-slider" data-autoplay="${escapeAttr(autoplay)}">\n${figures}\n</div>`;
}

function renderFigure(raw: unknown, images: SiteImage[]): string {
  if (!raw || typeof raw !== "object") return "";
  const item = raw as Record<string, unknown>;
  const image = images.find((img) => img.id === item.imageId);
  if (!image) return "";
  const copyright = stringValue(item.copyright, image.copyright || "Privat");
  return `  <figure>\n    <img src="${escapeAttr(image.dataUrl)}" alt="${escapeAttr(image.name)}" loading="lazy" />\n    <figcaption>📷 ${escapeHtml(copyright)}</figcaption>\n  </figure>`;
}

function renderCollapsible(data: Record<string, unknown>): string {
  const title = stringValue(data.title, "Abschnitt");
  const content = stringValue(data.content, "Inhalt hier eingeben...");
  return `<details class="gf-collapsible">\n  <summary>${escapeHtml(title)}</summary>\n  <div>${marked.parse(content) as string}</div>\n</details>`;
}

function renderAccordion(data: Record<string, unknown>): string {
  const items = arrayValue(data.items).filter((item) => item && typeof item === "object") as Record<string, unknown>[];
  const html = items.map((item, index) => {
    const title = stringValue(item.title, "Abschnitt");
    const content = stringValue(item.content, "Inhalt hier eingeben...");
    return `  <details class="gf-accordion-item"${index === 0 ? " open" : ""}>\n    <summary>${escapeHtml(title)}</summary>\n    <div>${marked.parse(content) as string}</div>\n  </details>`;
  }).join("\n");
  if (!html) return "";
  return `<div class="gf-accordion">\n${html}\n</div>`;
}

function renderCallout(data: Record<string, unknown>): string {
  const type = stringValue(data.calloutType, "info");
  const content = stringValue(data.content, "Hinweis hier eingeben...");
  return `<div class="gf-callout" data-type="${escapeAttr(type)}">\n  ${marked.parse(content) as string}\n</div>`;
}

function renderTable(data: Record<string, unknown>): string {
  const rows = arrayValue(data.rows).map((row) => Array.isArray(row) ? row.map((cell) => String(cell || "")) : []);
  if (!rows.length) return "";
  const headerRow = (rows[0] || []).map((cell) => `      <th>${escapeHtml(cell) || "&nbsp;"}</th>`).join("\n");
  const bodyRows = rows.slice(1).map((row) => `    <tr>\n${row.map((cell) => `      <td>${escapeHtml(cell) || "&nbsp;"}</td>`).join("\n")}\n    </tr>`).join("\n");
  return `<div class="gf-table-wrap">\n  <table>\n    <thead>\n    <tr>\n${headerRow}\n    </tr>\n    </thead>\n    <tbody>\n${bodyRows}\n    </tbody>\n  </table>\n</div>`;
}

function renderCardGrid(data: Record<string, unknown>, images: SiteImage[]): string {
  const variant = stringValue(data.variant, "service");
  const columns = stringValue(data.columns, "auto");
  const cards = arrayValue(data.cards).filter((card) => card && typeof card === "object") as Record<string, unknown>[];
  const articles = cards.map((card) => {
    const imageFigure = card.imageId ? renderFigure(card, images) : "";
    const title = stringValue(card.title);
    const text = stringValue(card.text);
    const url = stringValue(card.url);
    const cta = stringValue(card.cta);
    const hrefAttr = url ? ` data-href="${escapeAttr(url)}"` : "";
    const link = url && cta ? `  <a href="${escapeAttr(url)}">${escapeHtml(cta)}</a>\n` : "";
    return `  <article class="gf-card"${hrefAttr}>\n${imageFigure ? imageFigure + "\n" : ""}  <h3>${escapeHtml(title)}</h3>\n${text ? `  <p>${escapeHtml(text)}</p>\n` : ""}${link}  </article>`;
  }).join("\n");
  if (!articles) return "";
  return `<div class="gf-card-grid" data-variant="${escapeAttr(variant)}" data-columns="${escapeAttr(columns)}">\n${articles}\n</div>`;
}

function renderSteps(data: Record<string, unknown>, images: SiteImage[]): string {
  const columns = stringValue(data.columns, "4");
  const variant = stringValue(data.variant, "cards");
  const numbered = data.numbered === true;
  const steps = arrayValue(data.steps).filter((step) => step && typeof step === "object") as Record<string, unknown>[];
  const articles = steps.map((step) => {
    const imageFigure = step.imageId ? renderFigure(step, images) : "";
    const title = stringValue(step.title);
    const text = stringValue(step.text);
    return `  <article class="gf-step">\n${imageFigure ? imageFigure + "\n" : ""}  <h3>${escapeHtml(title)}</h3>\n${text ? `  <p>${escapeHtml(text)}</p>\n` : ""}  </article>`;
  }).join("\n");
  if (!articles) return "";
  const variantAttr = variant !== "cards" ? ` data-variant="${escapeAttr(variant)}"` : "";
  const numberedAttr = numbered ? ` data-numbered="true"` : "";
  return `<div class="gf-steps" data-columns="${escapeAttr(columns)}"${variantAttr}${numberedAttr}>\n${articles}\n</div>`;
}

function dataToAttrs(data: Record<string, unknown>): ShortcodeAttrs {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value ?? "")])) as ShortcodeAttrs;
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function renderYouTube(attrs: ShortcodeAttrs): string {
  const id = attrs.id || attrs.videoId || "";
  if (!/^[a-zA-Z0-9_-]{1,20}$/.test(id)) return "";
  const title = attrs.title || "YouTube-Video";
  const aspect = attrs.aspect || "16:9";
  const start = attrs.start && /^\d+$/.test(attrs.start) ? ` data-start="${escapeAttr(attrs.start)}"` : "";
  return `<div class="gf-youtube" data-video-id="${escapeAttr(id)}" data-title="${escapeAttr(title)}" data-aspect="${escapeAttr(aspect)}"${start}></div>`;
}

function renderPdf(attrs: ShortcodeAttrs): string {
  const src = attrs.src || "";
  if (!src.startsWith("/") || !/\.pdf$/i.test(src.split("?")[0].split("#")[0])) return "";
  const title = attrs.title || "PDF-Dokument";
  const height = attrs.height && /^\d+$/.test(attrs.height) ? Number(attrs.height) : 700;
  if (height < 300 || height > 1200) return "";
  return `<div class="gf-pdf" data-src="${escapeAttr(src)}" data-title="${escapeAttr(title)}" data-height="${height}"></div>`;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
