interface PdfEmbedProps {
  src: string;
  title: string;
  height?: number;
}

function isSameOrigin(path: string): boolean {
  if (path.startsWith("//")) return false;
  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  }
  return path.startsWith("/");
}

function isValidPdfPath(path: string): boolean {
  return isSameOrigin(path) && /\.pdf$/i.test(path.split("?")[0].split("#")[0]);
}

function isValidHeight(h: number): boolean {
  return h >= 300 && h <= 1200;
}

export default function PdfEmbed({ src, title, height = 700 }: PdfEmbedProps) {
  if (!isValidPdfPath(src) || !isValidHeight(height)) {
    return null;
  }

  const openUrl = src;
  const downloadUrl = src + (src.includes("?") ? "&" : "?") + "download";

  return (
    <div className="my-4">
      <div className="hidden sm:block">
        <object
          data={src}
          type="application/pdf"
          width="100%"
          height={height}
          className="rounded-lg border border-border w-full"
          aria-label={title}
        >
          <div className="p-4 text-center text-text-muted border border-border rounded-lg">
            <p className="mb-3">PDF-Vorschau wird nicht unterstützt.</p>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="text--primary font-medium hover:underline"
            >
              PDF in neuem Tab öffnen
            </a>
          </div>
        </object>
      </div>

      <div className="sm:hidden rounded-lg border border-border p-4 bg-surface-card">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">📄</span>
          <div>
            <h3 className="font-semibold text-text text-sm">{title}</h3>
            <p className="text-xs text-text-muted">PDF-Dokument</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg--primary text-white text-sm font-medium rounded-lg hover:bg--primary-dark transition-colors"
        >
          PDF öffnen
        </a>
        <a
          href={downloadUrl}
          download
          className="px-4 py-2 border border-border text-text text-sm font-medium rounded-lg hover:border--primary transition-colors"
        >
          PDF herunterladen
        </a>
      </div>
    </div>
  );
}
