import { useState } from "react";
import { useContent } from "../context/ContentContext";
import type { SiteImage } from "../content/defaultContent";

type ComponentType = "gallery" | "slider" | "collapsible" | "accordion" | "callout" | "table";
type CalloutType = "info" | "warning" | "success" | "tip";

interface AccordionSection {
  title: string;
  content: string;
}

interface BuilderProps {
  open: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
}

const COMPONENT_TYPES: { type: ComponentType; icon: string; label: string; desc: string }[] = [
  { type: "gallery", icon: "🖼️", label: "Galerie", desc: "Bilder im Raster" },
  { type: "slider", icon: "🎠", label: "Slider", desc: "Bilder im Karussell" },
  { type: "collapsible", icon: "📋", label: "Aufklappbar", desc: "Text ein-/ausklappen" },
  { type: "accordion", icon: "❓", label: "Akkordeon", desc: "Nur ein Section offen" },
  { type: "callout", icon: "ℹ️", label: "Hinweisbox", desc: "Info, Warnung, Tipp" },
  { type: "table", icon: "📊", label: "Tabelle", desc: "Responsiv formatiert" },
];

const CALLOUT_STYLES: { type: CalloutType; icon: string; label: string; color: string }[] = [
  { type: "info", icon: "ℹ️", label: "Info", color: "border-blue-400 bg-blue-50 text-blue-800" },
  { type: "warning", icon: "⚠️", label: "Warnung", color: "border-amber-400 bg-amber-50 text-amber-800" },
  { type: "success", icon: "✅", label: "Erfolg", color: "border-green-400 bg-green-50 text-green-800" },
  { type: "tip", icon: "💡", label: "Tipp", color: "border-purple-400 bg-purple-50 text-purple-800" },
];

function ImagePickerGrid({
  images,
  selected,
  onToggle,
}: {
  images: SiteImage[];
  selected: { image: SiteImage; copyright: string }[];
  onToggle: (img: SiteImage) => void;
}) {
  const selectedIds = new Set(selected.map((s) => s.image.id));
  return (
    <div className="grid grid-cols-4 gap-2">
      {images.map((img) => {
        const isSelected = selectedIds.has(img.id);
        return (
          <button
            key={img.id}
            type="button"
            onClick={() => onToggle(img)}
            className={`relative rounded-lg overflow-hidden border-2 transition-colors aspect-square ${
              isSelected ? "border--primary ring-2 ring--primary/30" : "border-transparent hover:border-border"
            }`}
          >
            <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
            {isSelected && (
              <div className="absolute top-1 right-1 w-5 h-5 bg--primary text-white rounded-full flex items-center justify-center text-xs">
                ✓
              </div>
            )}
          </button>
        );
      })}
      {images.length === 0 && (
        <p className="col-span-4 text-xs text-text-muted">Keine Bilder in der Bibliothek.</p>
      )}
    </div>
  );
}

function PillGroup({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
            value === opt.value
              ? "bg--primary text-white border--primary"
              : "bg-surface-alt text-text border-border hover:border--primary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function ComponentBuilder({ open, onClose, onInsert }: BuilderProps) {
  const { content } = useContent();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<ComponentType | null>(null);

  if (!open) return null;

  const handleTypeSelect = (type: ComponentType) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedType(null);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedType(null);
    onClose();
  };

  const handleInsert = (html: string) => {
    onInsert(html);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className="bg-surface-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          {step === 2 ? (
            <button onClick={handleBack} className="text-sm text--primary hover:underline font-medium">
              ← Zurück
            </button>
          ) : (
            <span />
          )}
          <h2 className="font-bold text-text text-center flex-1">
            {step === 1 ? "Baustein einfügen" : COMPONENT_TYPES.find((c) => c.type === selectedType)?.label + " konfigurieren"}
          </h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text text-xl w-8 h-8 flex items-center justify-center">
            ✕
          </button>
        </div>

        <div className="p-4">
          {step === 1 && <Step1 onSelect={handleTypeSelect} />}
          {step === 2 && selectedType && (
            <Step2 type={selectedType} images={content.images} onInsert={handleInsert} />
          )}
        </div>
      </div>
    </div>
  );
}

function Step1({ onSelect }: { onSelect: (t: ComponentType) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {COMPONENT_TYPES.map((ct) => (
        <button
          key={ct.type}
          type="button"
          onClick={() => onSelect(ct.type)}
          className="flex flex-col items-center p-4 rounded-xl border border-border hover:border--primary hover:shadow-md transition-all bg-white text-center"
        >
          <span className="text-3xl mb-2">{ct.icon}</span>
          <span className="font-semibold text-text text-sm">{ct.label}</span>
          <span className="text-xs text-text-muted mt-0.5">{ct.desc}</span>
        </button>
      ))}
    </div>
  );
}

function Step2({ type, images, onInsert }: { type: ComponentType; images: SiteImage[]; onInsert: (html: string) => void }) {
  switch (type) {
    case "gallery":
      return <GalleryConfig images={images} onInsert={onInsert} />;
    case "slider":
      return <SliderConfig images={images} onInsert={onInsert} />;
    case "collapsible":
      return <CollapsibleConfig onInsert={onInsert} />;
    case "accordion":
      return <AccordionConfig onInsert={onInsert} />;
    case "callout":
      return <CalloutConfig onInsert={onInsert} />;
    case "table":
      return <TableConfig onInsert={onInsert} />;
  }
}

function useImageSelection() {
  const [selected, setSelected] = useState<{ image: SiteImage; copyright: string }[]>([]);

  const toggle = (img: SiteImage) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.image.id === img.id);
      if (exists) return prev.filter((s) => s.image.id !== img.id);
      return [...prev, { image: img, copyright: img.copyright || "Privat" }];
    });
  };

  const updateCopyright = (id: string, copyright: string) => {
    setSelected((prev) => prev.map((s) => (s.image.id === id ? { ...s, copyright } : s)));
  };

  const remove = (id: string) => {
    setSelected((prev) => prev.filter((s) => s.image.id !== id));
  };

  return { selected, toggle, updateCopyright, remove };
}

function SelectedImages({
  selected,
  updateCopyright,
  remove,
}: {
  selected: { image: SiteImage; copyright: string }[];
  updateCopyright: (id: string, c: string) => void;
  remove: (id: string) => void;
}) {
  if (selected.length === 0) return null;
  return (
    <div className="space-y-2 mt-3">
      <p className="text-xs font-medium text-text-muted">Ausgewählte Bilder:</p>
      <div className="flex flex-wrap gap-2">
        {selected.map((s) => (
          <div key={s.image.id} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-border">
            <img src={s.image.dataUrl} alt={s.image.name} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(s.image.id)}
              className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
            <input
              type="text"
              value={s.copyright}
              onChange={(e) => updateCopyright(s.image.id, e.target.value)}
              className="absolute bottom-0 left-0 right-0 text-[9px] bg-black/60 text-white px-1 py-0.5 truncate"
              title="Bildquellennachweis"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryConfig({ images, onInsert }: { images: SiteImage[]; onInsert: (h: string) => void }) {
  const [columns, setColumns] = useState("3");
  const { selected, toggle, updateCopyright, remove } = useImageSelection();

  const generate = () => {
    if (selected.length === 0) return;
    const figures = selected
      .map(
        (s) =>
          `  <figure>\n    <img src="${s.image.dataUrl}" alt="${s.image.name}" />\n    <figcaption>📷 ${s.copyright}</figcaption>\n  </figure>`
      )
      .join("\n");
    onInsert(`<div class="gf-gallery" data-columns="${columns}">\n${figures}\n</div>`);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-text mb-2">Spalten:</p>
        <PillGroup
          options={[
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
            { value: "auto", label: "Auto" },
          ]}
          value={columns}
          onChange={setColumns}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-text mb-2">Bilder:</p>
        <ImagePickerGrid images={images} selected={selected} onToggle={toggle} />
        <SelectedImages selected={selected} updateCopyright={updateCopyright} remove={remove} />
      </div>
      <p className="text-xs text-text-muted">Copyright wird automatisch aus der Bibliothek übernommen.</p>
      <button
        type="button"
        onClick={generate}
        disabled={selected.length === 0}
        className="w-full py-2.5 bg--primary text-white rounded-lg font-semibold hover:bg--primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Galerie einfügen
      </button>
    </div>
  );
}

function SliderConfig({ images, onInsert }: { images: SiteImage[]; onInsert: (h: string) => void }) {
  const [autoplay, setAutoplay] = useState("5000");
  const { selected, toggle, updateCopyright, remove } = useImageSelection();

  const generate = () => {
    if (selected.length === 0) return;
    const figures = selected
      .map(
        (s) =>
          `  <figure>\n    <img src="${s.image.dataUrl}" alt="${s.image.name}" />\n    <figcaption>📷 ${s.copyright}</figcaption>\n  </figure>`
      )
      .join("\n");
    onInsert(`<div class="gf-slider" data-autoplay="${autoplay}">\n${figures}\n</div>`);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-text mb-2">Autoplay:</p>
        <PillGroup
          options={[
            { value: "0", label: "Aus" },
            { value: "3000", label: "3s" },
            { value: "5000", label: "5s" },
            { value: "8000", label: "8s" },
            { value: "10000", label: "10s" },
          ]}
          value={autoplay}
          onChange={setAutoplay}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-text mb-2">Bilder:</p>
        <ImagePickerGrid images={images} selected={selected} onToggle={toggle} />
        <SelectedImages selected={selected} updateCopyright={updateCopyright} remove={remove} />
      </div>
      <button
        type="button"
        onClick={generate}
        disabled={selected.length === 0}
        className="w-full py-2.5 bg--primary text-white rounded-lg font-semibold hover:bg--primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Slider einfügen
      </button>
    </div>
  );
}

function CollapsibleConfig({ onInsert }: { onInsert: (h: string) => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const generate = () => {
    if (!title.trim()) return;
    const inner = content.trim() || "<p>Inhalt hier eingeben…</p>";
    onInsert(`<details class="gf-collapsible">\n  <summary>${title}</summary>\n  <div>${inner}</div>\n</details>`);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">Titel *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
          placeholder="z.B. Was ist der Goldsteinfreunde e.V.?"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">Inhalt</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none font-mono text-sm leading-relaxed"
          placeholder="<p>Inhalt hier eingeben…</p>"
        />
      </div>
      <button
        type="button"
        onClick={generate}
        disabled={!title.trim()}
        className="w-full py-2.5 bg--primary text-white rounded-lg font-semibold hover:bg--primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Aufklappbar einfügen
      </button>
    </div>
  );
}

function AccordionConfig({ onInsert }: { onInsert: (h: string) => void }) {
  const [sections, setSections] = useState<AccordionSection[]>([{ title: "", content: "" }]);

  const updateSection = (i: number, field: "title" | "content", value: string) => {
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const addSection = () => setSections((prev) => [...prev, { title: "", content: "" }]);
  const removeSection = (i: number) => setSections((prev) => prev.filter((_, idx) => idx !== i));

  const generate = () => {
    const valid = sections.filter((s) => s.title.trim());
    if (valid.length === 0) return;
    const items = valid
      .map(
        (s, i) =>
          `  <details class="gf-accordion-item"${i === 0 ? " open" : ""}>\n    <summary>${s.title}</summary>\n    <div>${s.content.trim() || "<p>Inhalt hier eingeben…</p>"}</div>\n  </details>`
      )
      .join("\n");
    onInsert(`<div class="gf-accordion">\n${items}\n</div>`);
  };

  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        <div key={i} className="border border-border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Abschnitt {i + 1}</span>
            {sections.length > 1 && (
              <button type="button" onClick={() => removeSection(i)} className="text-red-400 hover:text-red-600 text-xs">
                ✕
              </button>
            )}
          </div>
          <input
            type="text"
            value={section.title}
            onChange={(e) => updateSection(i, "title", e.target.value)}
            className="w-full px-3 py-1.5 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
            placeholder="Titel"
          />
          <textarea
            value={section.content}
            onChange={(e) => updateSection(i, "content", e.target.value)}
            rows={3}
            className="w-full px-3 py-1.5 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none font-mono text-xs leading-relaxed"
            placeholder="<p>Inhalt…</p>"
          />
        </div>
      ))}
      <button type="button" onClick={addSection} className="text-sm text--primary hover:underline font-medium">
        + Abschnitt hinzufügen
      </button>
      <button
        type="button"
        onClick={generate}
        disabled={sections.every((s) => !s.title.trim())}
        className="w-full py-2.5 bg--primary text-white rounded-lg font-semibold hover:bg--primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Akkordeon einfügen
      </button>
    </div>
  );
}

function CalloutConfig({ onInsert }: { onInsert: (h: string) => void }) {
  const [calloutType, setCalloutType] = useState<CalloutType>("info");
  const [content, setContent] = useState("");

  const generate = () => {
    const inner = content.trim() || "<p>Hinweis hier eingeben…</p>";
    onInsert(`<div class="gf-callout" data-type="${calloutType}">\n  ${inner}\n</div>`);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-text mb-2">Typ:</p>
        <div className="flex gap-2 flex-wrap">
          {CALLOUT_STYLES.map((cs) => (
            <button
              key={cs.type}
              type="button"
              onClick={() => setCalloutType(cs.type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                calloutType === cs.type
                  ? cs.color + " border-current"
                  : "border-border text-text hover:border--primary"
              }`}
            >
              <span>{cs.icon}</span>
              <span>{cs.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={`border-l-4 rounded-r-lg p-3 text-sm ${
        CALLOUT_STYLES.find((c) => c.type === calloutType)?.color || ""
      }`}>
        <span className="mr-1">{CALLOUT_STYLES.find((c) => c.type === calloutType)?.icon}</span>
        {content.trim() || "Vorschau: Hinweis hier eingeben…"}
      </div>
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">Inhalt</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none font-mono text-sm leading-relaxed"
          placeholder="Hinweistext hier eingeben…"
        />
      </div>
      <button
        type="button"
        onClick={generate}
        className="w-full py-2.5 bg--primary text-white rounded-lg font-semibold hover:bg--primary-dark transition-colors"
      >
        Hinweisbox einfügen
      </button>
    </div>
  );
}

function TableConfig({ onInsert }: { onInsert: (h: string) => void }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [cells, setCells] = useState<string[][]>([
    ["Termin", "Event", "Ort"],
    ["15.03.", "Baumaktion", "Goldsteinpark"],
    ["02.04.", "Osterwanderung", "Goldsteinturm"],
  ]);

  const ensureGrid = (r: number, c: number) => {
    const grid: string[][] = [];
    for (let i = 0; i < r; i++) {
      const row: string[] = [];
      for (let j = 0; j < c; j++) {
        row.push(cells[i]?.[j] ?? "");
      }
      grid.push(row);
    }
    setCells(grid);
    setRows(r);
    setCols(c);
  };

  const updateCell = (r: number, c: number, val: string) => {
    setCells((prev) => prev.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? val : cell)) : row)));
  };

  const generate = () => {
    if (cells.length === 0) return;
    const headerRow = cells[0].map((c) => `      <th>${c || "&nbsp;"}</th>`).join("\n");
    const bodyRows = cells
      .slice(1)
      .map((row) => `    <tr>\n${row.map((c) => `      <td>${c || "&nbsp;"}</td>`).join("\n")}\n    </tr>`)
      .join("\n");
    const html = `<div class="gf-table-wrap">\n  <table>\n    <thead>\n    <tr>\n${headerRow}\n    </tr>\n    </thead>\n    <tbody>\n${bodyRows}\n    </tbody>\n  </table>\n</div>`;
    onInsert(html);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text">Zeilen:</span>
          <button type="button" onClick={() => ensureGrid(Math.max(1, rows - 1), cols)} className="w-7 h-7 rounded border border-border text-sm hover:bg-surface-alt">−</button>
          <span className="text-sm font-medium w-6 text-center">{rows}</span>
          <button type="button" onClick={() => ensureGrid(rows + 1, cols)} className="w-7 h-7 rounded border border-border text-sm hover:bg-surface-alt">+</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text">Spalten:</span>
          <button type="button" onClick={() => ensureGrid(rows, Math.max(1, cols - 1))} className="w-7 h-7 rounded border border-border text-sm hover:bg-surface-alt">−</button>
          <span className="text-sm font-medium w-6 text-center">{cols}</span>
          <button type="button" onClick={() => ensureGrid(rows, cols + 1)} className="w-7 h-7 rounded border border-border text-sm hover:bg-surface-alt">+</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border border-border text-sm">
          <thead>
            <tr>
              {cells[0]?.map((_, ci) => (
                <th key={ci} className="border border-border bg-surface-alt p-0">
                  <input
                    type="text"
                    value={cells[0]?.[ci] ?? ""}
                    onChange={(e) => updateCell(0, ci, e.target.value)}
                    className="w-full px-2 py-1.5 bg-transparent outline-none text-xs font-semibold"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cells.slice(1).map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-border p-0">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(ri + 1, ci, e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent outline-none text-xs"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={generate}
        className="w-full py-2.5 bg--primary text-white rounded-lg font-semibold hover:bg--primary-dark transition-colors"
      >
        Tabelle einfügen
      </button>
    </div>
  );
}
