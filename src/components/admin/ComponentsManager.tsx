import { useState } from "react";
import ComponentBuilder from "../ComponentBuilder";
import { useContent } from "../../context/ContentContext";
import type { CmsComponent } from "../../content/defaultContent";

interface ComponentsManagerProps {
  onStatus: (type: "success" | "error", text: string) => void;
}

export default function ComponentsManager({ onStatus }: ComponentsManagerProps) {
  const { content, deleteComponent } = useContent();
  const [editing, setEditing] = useState<CmsComponent | null>(null);
  const components = Object.values(content.components || {}).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const handleDelete = (id: string) => {
    if (!confirm("Baustein wirklich löschen? Bestehende {{component}}-Verweise zeigen danach nichts mehr an.")) return;
    deleteComponent(id);
    onStatus("success", "Baustein gelöscht.");
  };

  return (
    <div className="bg-surface-card rounded-xl shadow-md overflow-hidden">
      <div className="p-5 border-b border-border">
        <h2 className="font-bold text-text">Bausteine</h2>
        <p className="text-sm text-text-muted mt-1">Strukturierte CMS-Bausteine, die per <code>{"{{component id=\"...\"}}"}</code> in Markdown-Inhalten eingebunden werden.</p>
      </div>
      <div className="p-5">
        {components.length === 0 ? (
          <div className="bg-surface-alt border border-border rounded-xl p-6 text-center text-text-muted">
            <p>Noch keine gespeicherten Bausteine vorhanden.</p>
            <p className="text-sm mt-1">Fügen Sie über den Editor einen Baustein ein, um hier strukturierte Einträge zu sehen.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {components.map((component) => (
              <ComponentEditor
                key={component.id}
                component={component}
                onEdit={() => setEditing(component)}
                onDelete={() => handleDelete(component.id)}
              />
            ))}
          </div>
        )}
      </div>
      <ComponentBuilder
        key={editing?.id || "component-builder"}
        open={Boolean(editing)}
        editComponent={editing}
        onClose={() => setEditing(null)}
        onSaved={() => onStatus("success", "Baustein gespeichert.")}
      />
    </div>
  );
}

function ComponentEditor({ component, onEdit, onDelete }: { component: CmsComponent; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="border border-border rounded-xl p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-text">{component.label || component.type}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-alt text-text-muted border border-border">{component.type}</span>
          </div>
          <code className="block text-xs text-text-muted mt-2 break-all">{"{{component id=\""}{component.id}{"\"}}"}</code>
          <p className="text-xs text-text-muted mt-1">Aktualisiert: {new Date(component.updatedAt).toLocaleString("de-DE")}</p>
        </div>
        <div className="flex gap-2 self-start md:self-center">
          <button type="button" onClick={onEdit} className="px-3 py-1.5 text-sm text--primary border border-border rounded-lg hover:bg-surface-alt transition-colors">
            Bearbeiten
          </button>
          <button type="button" onClick={onDelete} className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}
