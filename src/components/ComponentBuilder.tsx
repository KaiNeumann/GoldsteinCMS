import { useState } from "react";
import { useContent } from "../context/ContentContext";
import type { CmsComponent, CmsComponentType, SiteImage } from "../content/defaultContent";
import { CALLOUT_STYLES, COMPONENT_TYPES, type CalloutType, type ComponentType } from "./builders/componentBuilderOptions";

type InsertComponent = (type: CmsComponentType, label: string, data: Record<string, unknown>) => void;
type ComponentData = Record<string, unknown>;

interface AccordionSection {
  title: string;
  content: string;
}

interface BuilderProps {
  open: boolean;
  onClose: () => void;
  onInsert?: (html: string) => void;
  editComponent?: CmsComponent | null;
  onSaved?: () => void;
}

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

export default function ComponentBuilder({ open, onClose, onInsert, editComponent, onSaved }: BuilderProps) {
  const { content, saveComponent } = useContent();
  const isEditing = Boolean(editComponent);
  const [step, setStep] = useState<1 | 2>(editComponent ? 2 : 1);
  const [selectedType, setSelectedType] = useState<ComponentType | null>((editComponent?.type as ComponentType | undefined) || null);

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
    setStep(editComponent ? 2 : 1);
    setSelectedType((editComponent?.type as ComponentType | undefined) || null);
    onClose();
  };

  const handleInsertComponent: InsertComponent = (type, label, data) => {
    const id = editComponent?.id || createComponentId(type);
    const now = new Date().toISOString();
    const component: CmsComponent = {
      id,
      type,
      label,
      data,
      createdAt: editComponent?.createdAt || now,
      updatedAt: now,
    };
    saveComponent(component);
    if (!editComponent) onInsert?.(`{{component id="${id}"}}`);
    onSaved?.();
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className="bg-surface-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          {step === 2 && !isEditing ? (
            <button onClick={handleBack} className="text-sm text--primary hover:underline font-medium">
              ← Zurück
            </button>
          ) : (
            <span />
          )}
          <h2 className="font-bold text-text text-center flex-1">
            {step === 1 ? "Baustein einfügen" : `${COMPONENT_TYPES.find((c) => c.type === selectedType)?.label} ${isEditing ? "bearbeiten" : "konfigurieren"}`}
          </h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text text-xl w-8 h-8 flex items-center justify-center">
            ✕
          </button>
        </div>

        <div className="p-4">
          {step === 1 && <Step1 onSelect={handleTypeSelect} />}
          {step === 2 && selectedType && (
            <Step2
              type={selectedType}
              images={content.images}
              initialData={editComponent?.data}
              isEditing={isEditing}
              onInsertComponent={handleInsertComponent}
            />
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

function Step2({
  type,
  images,
  initialData,
  isEditing,
  onInsertComponent,
}: {
  type: ComponentType;
  images: SiteImage[];
  initialData?: ComponentData;
  isEditing: boolean;
  onInsertComponent: InsertComponent;
}) {
  const submitLabel = isEditing ? "Änderungen speichern" : undefined;
  switch (type) {
    case "gallery":
      return <GalleryConfig images={images} initialData={initialData} submitLabel={submitLabel || "Galerie einfügen"} onInsertComponent={onInsertComponent} />;
    case "slider":
      return <SliderConfig images={images} initialData={initialData} submitLabel={submitLabel || "Slider einfügen"} onInsertComponent={onInsertComponent} />;
    case "collapsible":
      return <CollapsibleConfig initialData={initialData} submitLabel={submitLabel || "Aufklappbar einfügen"} onInsertComponent={onInsertComponent} />;
    case "accordion":
      return <AccordionConfig initialData={initialData} submitLabel={submitLabel || "Akkordeon einfügen"} onInsertComponent={onInsertComponent} />;
    case "callout":
      return <CalloutConfig initialData={initialData} submitLabel={submitLabel || "Hinweisbox einfügen"} onInsertComponent={onInsertComponent} />;
    case "table":
      return <TableConfig initialData={initialData} submitLabel={submitLabel || "Tabelle einfügen"} onInsertComponent={onInsertComponent} />;
    case "youtubeEmbed":
      return <YouTubeEmbedConfig initialData={initialData} submitLabel={submitLabel || "YouTube-Video einfügen"} onInsertComponent={onInsertComponent} />;
    case "pdfEmbed":
      return <PdfEmbedConfig initialData={initialData} submitLabel={submitLabel || "PDF einbetten"} onInsertComponent={onInsertComponent} />;
    case "cardGrid":
      return <CardGridConfig images={images} initialData={initialData} submitLabel={submitLabel || "Kartenraster einfügen"} onInsertComponent={onInsertComponent} />;
    case "steps":
      return <StepsConfig images={images} initialData={initialData} submitLabel={submitLabel || "Prozessschritte einfügen"} onInsertComponent={onInsertComponent} />;
    case "socialLinks":
      return <SocialLinksConfig initialData={initialData} submitLabel={submitLabel || "Social Links einfügen"} onInsertComponent={onInsertComponent} />;
    case "contactForm":
      return <ContactFormConfig initialData={initialData} submitLabel={submitLabel || "Kontaktformular einfügen"} onInsertComponent={onInsertComponent} />;
    case "newsletterSignup":
      return <NewsletterSignupConfig initialData={initialData} submitLabel={submitLabel || "Newsletter-Formular einfügen"} onInsertComponent={onInsertComponent} />;
  }
}

function useImageSelection(images: SiteImage[], initialData?: ComponentData) {
  const [selected, setSelected] = useState<{ image: SiteImage; copyright: string }[]>(() => {
    const entries = Array.isArray(initialData?.images) ? initialData.images : [];
    return entries.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const imageId = String((entry as { imageId?: unknown }).imageId || "");
      const image = images.find((img) => img.id === imageId);
      if (!image) return [];
      return [{ image, copyright: String((entry as { copyright?: unknown }).copyright || image.copyright || "Privat") }];
    });
  });

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

function dataString(data: ComponentData | undefined, key: string, fallback = ""): string {
  const value = data?.[key];
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : fallback;
}

function dataStringArray(data: ComponentData | undefined, key: string): string[][] | null {
  const rows = data?.[key];
  if (!Array.isArray(rows)) return null;
  const normalized = rows.map((row) => Array.isArray(row) ? row.map((cell) => String(cell ?? "")) : []);
  return normalized.length > 0 ? normalized : null;
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

function GalleryConfig({ images, initialData, submitLabel, onInsertComponent }: { images: SiteImage[]; initialData?: ComponentData; submitLabel: string; onInsertComponent: InsertComponent }) {
  const [columns, setColumns] = useState(dataString(initialData, "columns", "3"));
  const { selected, toggle, updateCopyright, remove } = useImageSelection(images, initialData);

  const generate = () => {
    if (selected.length === 0) return;
    onInsertComponent("gallery", "Galerie", {
      columns,
      images: selected.map((s) => ({ imageId: s.image.id, copyright: s.copyright })),
    });
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
        {submitLabel}
      </button>
    </div>
  );
}

function SliderConfig({ images, initialData, submitLabel, onInsertComponent }: { images: SiteImage[]; initialData?: ComponentData; submitLabel: string; onInsertComponent: InsertComponent }) {
  const [autoplay, setAutoplay] = useState(dataString(initialData, "autoplay", "5000"));
  const { selected, toggle, updateCopyright, remove } = useImageSelection(images, initialData);

  const generate = () => {
    if (selected.length === 0) return;
    onInsertComponent("slider", "Slider", {
      autoplay,
      images: selected.map((s) => ({ imageId: s.image.id, copyright: s.copyright })),
    });
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
        {submitLabel}
      </button>
    </div>
  );
}

function CollapsibleConfig({ initialData, submitLabel, onInsertComponent }: { initialData?: ComponentData; submitLabel: string; onInsertComponent: InsertComponent }) {
  const [title, setTitle] = useState(dataString(initialData, "title"));
  const [content, setContent] = useState(dataString(initialData, "content"));

  const generate = () => {
    if (!title.trim()) return;
    onInsertComponent("collapsible", title.trim(), {
      title: title.trim(),
      content: content.trim() || "Inhalt hier eingeben...",
    });
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
        {submitLabel}
      </button>
    </div>
  );
}

function AccordionConfig({ initialData, submitLabel, onInsertComponent }: { initialData?: ComponentData; submitLabel: string; onInsertComponent: InsertComponent }) {
  const [sections, setSections] = useState<AccordionSection[]>(() => {
    const items = Array.isArray(initialData?.items) ? initialData.items : [];
    const normalized = items.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      return [{ title: dataString(item as ComponentData, "title"), content: dataString(item as ComponentData, "content") }];
    });
    return normalized.length > 0 ? normalized : [{ title: "", content: "" }];
  });

  const updateSection = (i: number, field: "title" | "content", value: string) => {
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const addSection = () => setSections((prev) => [...prev, { title: "", content: "" }]);
  const removeSection = (i: number) => setSections((prev) => prev.filter((_, idx) => idx !== i));

  const generate = () => {
    const valid = sections.filter((s) => s.title.trim());
    if (valid.length === 0) return;
    onInsertComponent("accordion", "Akkordeon", {
      items: valid.map((s) => ({ title: s.title.trim(), content: s.content.trim() || "Inhalt hier eingeben..." })),
    });
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
        {submitLabel}
      </button>
    </div>
  );
}

function CalloutConfig({ initialData, submitLabel, onInsertComponent }: { initialData?: ComponentData; submitLabel: string; onInsertComponent: InsertComponent }) {
  const [calloutType, setCalloutType] = useState<CalloutType>(() => {
    const value = dataString(initialData, "calloutType", "info");
    return CALLOUT_STYLES.some((style) => style.type === value) ? value as CalloutType : "info";
  });
  const [content, setContent] = useState(dataString(initialData, "content"));

  const generate = () => {
    onInsertComponent("callout", "Hinweisbox", {
      calloutType,
      content: content.trim() || "Hinweis hier eingeben...",
    });
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
        {submitLabel}
      </button>
    </div>
  );
}

function TableConfig({ initialData, submitLabel, onInsertComponent }: { initialData?: ComponentData; submitLabel: string; onInsertComponent: InsertComponent }) {
  const initialRows = dataStringArray(initialData, "rows") || [
    ["Termin", "Event", "Ort"],
    ["15.03.", "Baumaktion", "Goldsteinpark"],
    ["02.04.", "Osterwanderung", "Goldsteinturm"],
  ];
  const [rows, setRows] = useState(initialRows.length);
  const [cols, setCols] = useState(initialRows[0]?.length || 1);
  const [cells, setCells] = useState<string[][]>(initialRows);

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
    onInsertComponent("table", "Tabelle", { rows: cells });
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
        {submitLabel}
      </button>
    </div>
  );
}

function parseYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{1,20}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
      let id = url.searchParams.get("v");
      if (id) return id;
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length > 0) {
        const last = parts[parts.length - 1];
        if (/^[a-zA-Z0-9_-]{1,20}$/.test(last)) return last;
      }
    }
  } catch { /* not a URL, treat as raw ID */ }
  return null;
}

function YouTubeEmbedConfig({ initialData, submitLabel, onInsertComponent }: { initialData?: ComponentData; submitLabel: string; onInsertComponent: InsertComponent }) {
  const [videoInput, setVideoInput] = useState(dataString(initialData, "videoId"));
  const [title, setTitle] = useState(dataString(initialData, "title"));
  const [aspect, setAspect] = useState(dataString(initialData, "aspect", "16:9"));
  const [error, setError] = useState("");

  const generate = () => {
    const videoId = parseYouTubeVideoId(videoInput);
    if (!videoId) {
      setError("Ungültige YouTube-URL oder Video-ID");
      return;
    }
    setError("");
    const safeTitle = title.trim() || "YouTube-Video";
    onInsertComponent("youtubeEmbed", safeTitle, { videoId, title: safeTitle, aspect });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">YouTube-URL oder Video-ID *</label>
        <input
          type="text"
          value={videoInput}
          onChange={(e) => { setVideoInput(e.target.value); setError(""); }}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
          placeholder="z.B. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">Titel</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
          placeholder="z.B. Vorstellung der Floral Manufaktur"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-text mb-2">Seitenverhältnis:</p>
        <PillGroup
          options={[
            { value: "16:9", label: "16:9" },
            { value: "4:3", label: "4:3" },
            { value: "1:1", label: "1:1" },
            { value: "9:16", label: "9:16" },
          ]}
          value={aspect}
          onChange={setAspect}
        />
      </div>
      <button
        type="button"
        onClick={generate}
        disabled={!videoInput.trim()}
        className="w-full py-2.5 bg--primary text-white rounded-lg font-semibold hover:bg--primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function PdfEmbedConfig({ initialData, submitLabel, onInsertComponent }: { initialData?: ComponentData; submitLabel: string; onInsertComponent: InsertComponent }) {
  const [src, setSrc] = useState(dataString(initialData, "src"));
  const [title, setTitle] = useState(dataString(initialData, "title"));
  const [height, setHeight] = useState(dataString(initialData, "height", "700"));
  const [error, setError] = useState("");

  const generate = () => {
    const trimmed = src.trim();
    if (!trimmed || !/\.pdf$/i.test(trimmed.split("?")[0].split("#")[0])) {
      setError("Pfad muss auf .pdf enden und auf der gleichen Seite liegen");
      return;
    }
    if (!trimmed.startsWith("/")) {
      setError("Pfad muss mit / beginnen (gleich-origin)");
      return;
    }
    const h = parseInt(height, 10);
    if (isNaN(h) || h < 300 || h > 1200) {
      setError("Höhe muss zwischen 300 und 1200 liegen");
      return;
    }
    setError("");
    const safeTitle = title.trim() || "PDF-Dokument";
    onInsertComponent("pdfEmbed", safeTitle, { src: trimmed, title: safeTitle, height: h });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">PDF-Pfad *</label>
        <input
          type="text"
          value={src}
          onChange={(e) => { setSrc(e.target.value); setError(""); }}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
          placeholder="z.B. /downloads/preisliste.pdf"
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">Titel</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
          placeholder="z.B. Preisliste"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">Höhe (300-1200)</label>
        <input
          type="number"
          min="300"
          max="1200"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
        />
      </div>
      <button
        type="button"
        onClick={generate}
        disabled={!src.trim()}
        className="w-full py-2.5 bg--primary text-white rounded-lg font-semibold hover:bg--primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitLabel}
      </button>
    </div>
  );
}

interface CardEntry {
  image: SiteImage | null;
  title: string;
  text: string;
  url: string;
  cta: string;
}

function CardGridConfig({ images, initialData, submitLabel, onInsertComponent }: { images: SiteImage[]; initialData?: ComponentData; submitLabel: string; onInsertComponent: InsertComponent }) {
  const [variant, setVariant] = useState(dataString(initialData, "variant", "service"));
  const [columns, setColumns] = useState(dataString(initialData, "columns", "auto"));
  const [cards, setCards] = useState<CardEntry[]>(() => {
    const storedCards = Array.isArray(initialData?.cards) ? initialData.cards : [];
    const normalized = storedCards.flatMap((card) => {
      if (!card || typeof card !== "object") return [];
      const data = card as ComponentData;
      const imageId = dataString(data, "imageId");
      return [{
        image: images.find((img) => img.id === imageId) || null,
        title: dataString(data, "title"),
        text: dataString(data, "text"),
        url: dataString(data, "url"),
        cta: dataString(data, "cta"),
      }];
    });
    return normalized.length > 0 ? normalized : [{ image: null, title: "", text: "", url: "", cta: "" }];
  });

  const updateCard = (i: number, field: keyof CardEntry, value: string | SiteImage | null) => {
    setCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  };

  const addCard = () => setCards((prev) => [...prev, { image: null, title: "", text: "", url: "", cta: "" }]);
  const removeCard = (i: number) => setCards((prev) => prev.filter((_, idx) => idx !== i));

  const generate = () => {
    const valid = cards.filter((c) => c.title.trim());
    if (valid.length === 0) return;

    onInsertComponent("cardGrid", "Kartenraster", {
      variant,
      columns,
      cards: valid.map((card) => ({
        imageId: card.image?.id,
        copyright: card.image?.copyright,
        title: card.title,
        text: card.text,
        url: card.url,
        cta: card.cta,
      })),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-text mb-2">Variante:</p>
        <PillGroup
          options={[
            { value: "service", label: "Service" },
            { value: "imageOverlay", label: "Bildüberlagert" },
            { value: "compact", label: "Kompakt" },
            { value: "feature", label: "Feature" },
          ]}
          value={variant}
          onChange={setVariant}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-text mb-2">Spalten:</p>
        <PillGroup
          options={[
            { value: "auto", label: "Auto" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
          ]}
          value={columns}
          onChange={setColumns}
        />
      </div>

      <div className="space-y-3">
        {cards.map((card, i) => (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Karte {i + 1}</span>
              {cards.length > 1 && (
                <button type="button" onClick={() => removeCard(i)} className="text-red-400 hover:text-red-600 text-xs">
                  ✕
                </button>
              )}
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Bild (optional):</p>
              <div className="flex gap-1 flex-wrap">
                {images.slice(0, 8).map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => updateCard(i, "image", card.image?.id === img.id ? null : img)}
                    className={`w-10 h-10 rounded overflow-hidden border-2 transition-colors ${
                      card.image?.id === img.id ? "border--primary" : "border-transparent"
                    }`}
                  >
                    <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                {images.length === 0 && <span className="text-xs text-text-muted">Keine Bilder</span>}
              </div>
            </div>
            <input
              type="text"
              value={card.title}
              onChange={(e) => updateCard(i, "title", e.target.value)}
              className="w-full px-3 py-1.5 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
              placeholder="Titel *"
            />
            <input
              type="text"
              value={card.text}
              onChange={(e) => updateCard(i, "text", e.target.value)}
              className="w-full px-3 py-1.5 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
              placeholder="Beschreibung (optional)"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={card.url}
                onChange={(e) => updateCard(i, "url", e.target.value)}
                className="flex-1 px-3 py-1.5 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
                placeholder="Link-URL (optional)"
              />
              <input
                type="text"
                value={card.cta}
                onChange={(e) => updateCard(i, "cta", e.target.value)}
                className="w-28 px-3 py-1.5 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
                placeholder="CTA-Text"
              />
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={addCard} className="text-sm text--primary hover:underline font-medium">
        + Karte hinzufügen
      </button>
      <button
        type="button"
        onClick={generate}
        disabled={cards.every((c) => !c.title.trim())}
        className="w-full py-2.5 bg--primary text-white rounded-lg font-semibold hover:bg--primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitLabel}
      </button>
    </div>
  );
}

interface StepEntry {
  image: SiteImage | null;
  title: string;
  text: string;
}

function StepsConfig({ images, initialData, submitLabel, onInsertComponent }: { images: SiteImage[]; initialData?: ComponentData; submitLabel: string; onInsertComponent: InsertComponent }) {
  const [variant, setVariant] = useState(dataString(initialData, "variant", "cards"));
  const [columns, setColumns] = useState(dataString(initialData, "columns", "4"));
  const [numbered, setNumbered] = useState(dataString(initialData, "numbered", "false"));
  const [steps, setSteps] = useState<StepEntry[]>(() => {
    const storedSteps = Array.isArray(initialData?.steps) ? initialData.steps : [];
    const normalized = storedSteps.flatMap((step) => {
      if (!step || typeof step !== "object") return [];
      const data = step as ComponentData;
      const imageId = dataString(data, "imageId");
      return [{
        image: images.find((img) => img.id === imageId) || null,
        title: dataString(data, "title"),
        text: dataString(data, "text"),
      }];
    });
    return normalized.length > 0 ? normalized : [{ image: null, title: "", text: "" }];
  });

  const updateStep = (i: number, field: keyof StepEntry, value: string | SiteImage | null) => {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const addStep = () => setSteps((prev) => [...prev, { image: null, title: "", text: "" }]);
  const removeStep = (i: number) => setSteps((prev) => prev.filter((_, idx) => idx !== i));

  const generate = () => {
    const valid = steps.filter((s) => s.title.trim());
    if (valid.length === 0) return;

    onInsertComponent("steps", "Prozessschritte", {
      variant,
      columns,
      numbered: numbered === "true",
      steps: valid.map((step) => ({
        imageId: step.image?.id,
        copyright: step.image?.copyright,
        title: step.title,
        text: step.text,
      })),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-text mb-2">Variante:</p>
        <PillGroup
          options={[
            { value: "cards", label: "Karten" },
            { value: "timeline", label: "Timeline" },
            { value: "icons", label: "Icons" },
          ]}
          value={variant}
          onChange={setVariant}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-text mb-2">Spalten:</p>
        <PillGroup
          options={[
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
          ]}
          value={columns}
          onChange={setColumns}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-text mb-2">Automatisch nummerieren:</p>
        <PillGroup
          options={[
            { value: "false", label: "Nein" },
            { value: "true", label: "Ja" },
          ]}
          value={numbered}
          onChange={setNumbered}
        />
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Schritt {i + 1}</span>
              {steps.length > 1 && (
                <button type="button" onClick={() => removeStep(i)} className="text-red-400 hover:text-red-600 text-xs">
                  ✕
                </button>
              )}
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Bild (optional):</p>
              <div className="flex gap-1 flex-wrap">
                {images.slice(0, 8).map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => updateStep(i, "image", step.image?.id === img.id ? null : img)}
                    className={`w-10 h-10 rounded overflow-hidden border-2 transition-colors ${
                      step.image?.id === img.id ? "border--primary" : "border-transparent"
                    }`}
                  >
                    <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                {images.length === 0 && <span className="text-xs text-text-muted">Keine Bilder</span>}
              </div>
            </div>
            <input
              type="text"
              value={step.title}
              onChange={(e) => updateStep(i, "title", e.target.value)}
              className="w-full px-3 py-1.5 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
              placeholder="Titel *"
            />
            <textarea
              value={step.text}
              onChange={(e) => updateStep(i, "text", e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
              placeholder="Beschreibung (optional)"
            />
          </div>
        ))}
      </div>

      <button type="button" onClick={addStep} className="text-sm text--primary hover:underline font-medium">
        + Schritt hinzufügen
      </button>
      <button
        type="button"
        onClick={generate}
        disabled={steps.every((s) => !s.title.trim())}
        className="w-full py-2.5 bg--primary text-white rounded-lg font-semibold hover:bg--primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function SocialLinksConfig({ initialData, submitLabel, onInsertComponent }: { initialData?: ComponentData; submitLabel: string; onInsertComponent: InsertComponent }) {
  const [variant, setVariant] = useState(dataString(initialData, "variant", "icons"));

  const generate = () => {
    onInsertComponent("socialLinks", "Social Links", { variant });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-text mb-2">Darstellung:</p>
        <PillGroup
          options={[
            { value: "icons", label: "Icons" },
            { value: "list", label: "Liste" },
            { value: "cards", label: "Karten" },
          ]}
          value={variant}
          onChange={setVariant}
        />
      </div>
      <p className="text-xs text-text-muted">
        Die Links werden automatisch aus den konfigurierten Social-Media-Profilen geladen.
      </p>
      <button
        type="button"
        onClick={generate}
        className="w-full py-2.5 bg--primary text-white rounded-lg font-semibold hover:bg--primary-dark transition-colors"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function ContactFormConfig({ initialData, submitLabel, onInsertComponent }: { initialData?: ComponentData; submitLabel: string; onInsertComponent: InsertComponent }) {
  const [formId, setFormId] = useState(dataString(initialData, "formId", "default"));

  const generate = () => {
    onInsertComponent("contactForm", "Kontaktformular", { formId });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">Formular-ID</label>
        <input
          type="text"
          value={formId}
          onChange={(e) => setFormId(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
          placeholder="z.B. default"
        />
      </div>
      <p className="text-xs text-text-muted">
        Das Kontaktformular wird mit Name, E-Mail, Telefon, Betreff und Nachricht angezeigt.
      </p>
      <button
        type="button"
        onClick={generate}
        disabled={!formId.trim()}
        className="w-full py-2.5 bg--primary text-white rounded-lg font-semibold hover:bg--primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function NewsletterSignupConfig({ initialData, submitLabel, onInsertComponent }: { initialData?: ComponentData; submitLabel: string; onInsertComponent: InsertComponent }) {
  const [formId, setFormId] = useState(dataString(initialData, "formId", "default"));

  const generate = () => {
    onInsertComponent("newsletterSignup", "Newsletter", { formId });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">Formular-ID</label>
        <input
          type="text"
          value={formId}
          onChange={(e) => setFormId(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
          placeholder="z.B. default"
        />
      </div>
      <p className="text-xs text-text-muted">
        Newsletter-Anmeldungsformular mit E-Mail-Feld und Datenschutz-Checkbox.
      </p>
      <button
        type="button"
        onClick={generate}
        disabled={!formId.trim()}
        className="w-full py-2.5 bg--primary text-white rounded-lg font-semibold hover:bg--primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function createComponentId(type: string): string {
  return `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
