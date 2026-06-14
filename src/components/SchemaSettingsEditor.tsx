import { useState, useRef } from "react";
import type { ContentSchema, ContentSchemaField } from "../content/contentSchema";
import { useContent } from "../context/ContentContext";
import CmsContent from "./CmsContent";

interface SchemaSettingsEditorProps {
  schema: ContentSchema;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}

export default function SchemaSettingsEditor({ schema, values, onChange }: SchemaSettingsEditorProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    for (const group of schema.groups) {
      for (const field of group.fields) {
        if (field.required) {
          const val = values[field.key];
          if (val === undefined || val === null || val === "") {
            errors[field.key] = "Dieses Feld ist erforderlich.";
          }
        }
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveValidation = () => validate();

  return (
    <div className="space-y-6">
      {schema.groups.map((group) => (
        <SchemaGroup
          key={group.id}
          group={group}
          values={values}
          onChange={onChange}
          validationErrors={validationErrors}
        />
      ))}
      <div className="flex gap-3 pt-3 border-t border-border">
        <button
          onClick={handleSaveValidation}
          className="bg--primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg--primary-dark transition-colors"
        >
          Validierung prüfen
        </button>
      </div>
    </div>
  );
}

function SchemaGroup({
  group,
  values,
  onChange,
  validationErrors,
}: {
  group: { id: string; label: string; fields: ContentSchemaField[] };
  values: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  validationErrors: Record<string, string>;
}) {
  return (
    <details className="group rounded-lg border border-border bg-surface-alt/50" open>
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-bold text--primary uppercase tracking-wider">{group.label}</span>
        <span className="text-text-muted group-open:rotate-180 transition-transform">▾</span>
      </summary>
      <div className="space-y-3 px-4 pb-4">
        {group.fields.map((field) => (
          <SchemaField
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={(v) => onChange({ ...values, [field.key]: v })}
            error={validationErrors[field.key]}
          />
        ))}
      </div>
    </details>
  );
}

function SchemaField({
  field,
  value,
  onChange,
  error,
}: {
  field: ContentSchemaField;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}) {
  switch (field.type) {
    case "text":
      return (
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">{field.label}{field.required ? " *" : ""}</label>
          <input
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring--primary focus:border-transparent outline-none ${error ? "border-red-400" : "border-border"}`}
          />
          {field.helpText && <p className="text-xs text-text-muted mt-1">{field.helpText}</p>}
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );
    case "textarea":
      return (
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">{field.label}{field.required ? " *" : ""}</label>
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            rows={field.rows || 4}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring--primary focus:border-transparent outline-none ${error ? "border-red-400" : "border-border"}`}
          />
          {field.helpText && <p className="text-xs text-text-muted mt-1">{field.helpText}</p>}
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );
    case "html":
      return <SchemaHtmlField field={field} value={value} onChange={onChange} error={error} />;
    case "email":
      return (
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">{field.label}{field.required ? " *" : ""}</label>
          <input
            type="email"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring--primary focus:border-transparent outline-none ${error ? "border-red-400" : "border-border"}`}
          />
          {field.helpText && <p className="text-xs text-text-muted mt-1">{field.helpText}</p>}
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );
    case "tel":
      return (
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">{field.label}{field.required ? " *" : ""}</label>
          <input
            type="tel"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring--primary focus:border-transparent outline-none ${error ? "border-red-400" : "border-border"}`}
          />
          {field.helpText && <p className="text-xs text-text-muted mt-1">{field.helpText}</p>}
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );
    case "url":
      return (
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">{field.label}{field.required ? " *" : ""}</label>
          <input
            type="url"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring--primary focus:border-transparent outline-none ${error ? "border-red-400" : "border-border"}`}
          />
          {field.helpText && <p className="text-xs text-text-muted mt-1">{field.helpText}</p>}
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );
    case "image":
      return <SchemaImageField field={field} value={value} onChange={onChange} error={error} />;
    case "boolean":
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={typeof value === "boolean" ? value : false}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 text--primary border-border rounded focus:ring--primary"
          />
          <label className="text-sm font-medium text-text">{field.label}</label>
          {field.helpText && <p className="text-xs text-text-muted ml-2">{field.helpText}</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      );
    case "select":
      return (
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">{field.label}{field.required ? " *" : ""}</label>
          <select
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring--primary focus:border-transparent outline-none ${error ? "border-red-400" : "border-border"}`}
          >
            <option value="">-- Bitte wählen --</option>
            {(field.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {field.helpText && <p className="text-xs text-text-muted mt-1">{field.helpText}</p>}
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      );
    case "list":
      return <SchemaListField field={field} value={value} onChange={onChange} error={error} />;
    default:
      return null;
  }
}

function SchemaHtmlField({
  field,
  value,
  onChange,
  error,
}: {
  field: ContentSchemaField;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaId = `schema-html-${field.key.replace(/\./g, "-")}`;
  const strValue = typeof value === "string" ? value : "";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-xs font-medium text-text-muted">{field.label}{field.required ? " *" : ""}</label>
        <div className="flex bg-surface-alt rounded-lg p-0.5">
          <button type="button" onClick={() => setShowPreview(false)} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${!showPreview ? "bg-white shadow text--primary" : "text-text"}`}>
            Bearbeiten
          </button>
          <button type="button" onClick={() => setShowPreview(true)} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${showPreview ? "bg-white shadow text--primary" : "text-text"}`}>
            Vorschau
          </button>
        </div>
      </div>
      {showPreview ? (
        <CmsContent
          html={strValue || "_Kein Inhalt_"}
          className="border border-border rounded-lg p-4 min-h-40 max-h-[420px] overflow-y-auto bg-surface-card prose-sm max-w-none"
        />
      ) : (
        <textarea
          id={textareaId}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows || 10}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring--primary focus:border-transparent outline-none font-mono"
        />
      )}
      {field.helpText && <p className="text-xs text-text-muted">{field.helpText}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SchemaImageField({
  field,
  value,
  onChange,
  error,
}: {
  field: ContentSchemaField;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}) {
  const { addImage } = useContent();
  const fileRef = useRef<HTMLInputElement>(null);
  const strValue = typeof value === "string" ? value : "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { alert("Bild zu groß! Max. 500 KB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const name = file.name.replace(/\.[^.]+$/, "");
      const copyright = prompt(`Bildquellennachweis für "${name}" eingeben:\n\nZitierhilfe:\n- Eigenes Bild: Name\n- Kostenloses Portal (z.B. Unsplash): Foto: Name / Unsplash\n- Kaufbild: © Name / Adobe Stock`);
      if (copyright === null) return;
      if (!copyright.trim()) {
        alert("Der Bildquellennachweis darf nicht leer sein!");
        return;
      }
      addImage({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name,
        dataUrl,
        copyright: copyright.trim(),
        createdAt: new Date().toISOString(),
      });
      onChange(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div>
      <label className="block text-xs font-medium text-text-muted mb-1">{field.label}{field.required ? " *" : ""}</label>
      {strValue ? (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden h-32 bg-surface-alt">
            <img src={strValue} alt={field.label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
          <button
            onClick={() => { onChange(""); }}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Bild entfernen
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text--primary hover:file:bg-green-100"
          />
        </div>
      )}
      {field.helpText && <p className="text-xs text-text-muted mt-1">{field.helpText}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function SchemaListField({
  field,
  value,
  onChange,
  error,
}: {
  field: ContentSchemaField;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}) {
  const items = Array.isArray(value) ? value : [];

  const addItem = () => {
    const newItem: Record<string, string> = {};
    (field.itemFields || []).forEach((f) => { newItem[f.key] = ""; });
    onChange([...items, newItem]);
  };

  const removeItem = (i: number) => {
    onChange(items.filter((_, idx) => idx !== i));
  };

  const updateItem = (i: number, itemKey: string, itemValue: string) => {
    const updated = items.map((item, idx) => {
      if (idx !== i) return item;
      return { ...(typeof item === "object" && item !== null ? item : {}), [itemKey]: itemValue };
    });
    onChange(updated);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-text-muted mb-1">{field.label}{field.required ? " *" : ""}</label>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="border border-border rounded-lg p-3 bg-white space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-text-muted">Eintrag {i + 1}</span>
              <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-xs" title="Entfernen">
                ✕
              </button>
            </div>
            {(field.itemFields || []).map((subField) => (
              <div key={subField.key}>
                <label className="block text-xs font-medium text-text-muted mb-0.5">{subField.label}</label>
                <input
                  type="text"
                  value={typeof item === "object" && item !== null ? (item as Record<string, unknown>)[subField.key] as string || "" : ""}
                  onChange={(e) => updateItem(i, subField.key, e.target.value)}
                  className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring--primary focus:border-transparent outline-none"
                />
              </div>
            ))}
          </div>
        ))}
        <button onClick={addItem} className="text-sm text--primary font-medium hover:underline">
          + Eintrag hinzufügen
        </button>
      </div>
      {field.helpText && <p className="text-xs text-text-muted mt-1">{field.helpText}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
