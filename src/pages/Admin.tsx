import { useCallback, useEffect, useState, useRef, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBold,
  faItalic,
  faUnderline,
  faListUl,
  faLink,
  faParagraph,
  faHeading,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useContent } from "../context/ContentContext";
import { defaultContent, formatDate } from "../content/defaultContent";
import type { Post, SiteConfig, SiteImage } from "../content/defaultContent";
import CmsContent from "../components/CmsContent";
import ComponentBuilder from "../components/ComponentBuilder";

// ─── Main Admin Component ────────────────────────────────

export default function Admin() {
  const { validateAdminPassword, checkAdminSession, logoutAdminSession } = useContent();
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem("gf_admin_auth") === "true"
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const verifyExistingSession = async () => {
      if (!sessionStorage.getItem("gf_admin_auth")) return;
      const status = await checkAdminSession();
      if (cancelled) return;
      if (!status.success || !status.authenticated) {
        sessionStorage.removeItem("gf_admin_auth");
        setAuthenticated(false);
      }
    };

    verifyExistingSession();
    const interval = window.setInterval(verifyExistingSession, 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [checkAdminSession]);

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <div className="bg-surface-card rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from--primary to--primary-light p-6 text-center">
            <svg className="w-12 h-12 text-white/80 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h1 className="text-2xl font-bold text-white">Admin-Bereich</h1>
            <p className="text-green-100 text-sm mt-1">Bitte melden Sie sich an</p>
          </div>
          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsLoggingIn(true);
                const result = await validateAdminPassword(password);
                setIsLoggingIn(false);
                if (result.success) {
                  setAuthenticated(true);
                  sessionStorage.setItem("gf_admin_auth", "true");
                  setError("");
                } else {
                  setError(result.error || "Falsches Passwort");
                }
              }}
            >
              <label className="block text-sm font-medium text-text mb-2">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none"
                placeholder="Passwort eingeben…"
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-4 bg--primary text-white py-3 rounded-lg font-semibold hover:bg--primary-dark transition-colors"
              >
                {isLoggingIn ? "Prüfe..." : "Anmelden"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={() => { sessionStorage.removeItem("gf_admin_auth"); logoutAdminSession(); setAuthenticated(false); }} />;
}

// ─── Admin Dashboard ──────────────────────────────────────

type Tab = "posts" | "editor" | "settings" | "images" | "github" | "export" | "deploy";

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "posts", label: "Beiträge", icon: "📰" },
    { key: "settings", label: "Einstellungen", icon: "⚙️" },
    { key: "images", label: "Bilder", icon: "🖼️" },
    { key: "github", label: "Veröffentlichen", icon: "🚀" },
    { key: "export", label: "Export/Import", icon: "📦" },
    { key: "deploy", label: "Deployment", icon: "🌐" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text" style={{ fontFamily: "var(--font-heading)" }}>
            Admin-Dashboard
          </h1>
          <p className="text-text-muted text-sm mt-1">Inhalte der Website verwalten</p>
        </div>
        <button onClick={onLogout} className="text-sm text-text-muted hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50">
          ← Abmelden
        </button>
      </div>

      {/* Status message */}
      {statusMessage && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${statusMessage.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {statusMessage.text}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface-alt rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setEditingPost(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white shadow text--primary"
                : "text-text hover:text-text"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {(activeTab === "posts" && !editingPost) && <PostsList onEdit={(post) => { setEditingPost(post); setActiveTab("editor"); }} onNewPost={() => { setEditingPost({ id: "", date: new Date().toISOString().split("T")[0], author: "", title: "", content: "" }); setActiveTab("editor"); }} />}
      {activeTab === "editor" && <PostEditor post={editingPost} onCancel={() => { setEditingPost(null); setActiveTab("posts"); }} onSaved={() => { setEditingPost(null); setActiveTab("posts"); showStatus("success", "Beitrag gespeichert!"); }} />}
      {activeTab === "settings" && <SettingsEditor onSaved={() => showStatus("success", "Einstellungen gespeichert!")} />}
      {activeTab === "github" && <GitHubSetup onStatus={showStatus} onLogout={onLogout} />}
      {activeTab === "export" && <ExportImport onStatus={showStatus} />}
      {activeTab === "images" && <ImageLibrary onStatus={showStatus} />}
      {activeTab === "deploy" && <DeployHelp />}
    </div>
  );
}

// ─── Posts List ────────────────────────────────────────────

function PostsList({ onEdit, onNewPost }: { onEdit: (post: Post) => void; onNewPost: () => void }) {
  const { content, deletePost } = useContent();

  return (
    <div className="bg-surface-card rounded-xl shadow-md overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h2 className="font-bold text-text">Alle Beiträge ({content.posts.length})</h2>
        <button onClick={onNewPost} className="bg--primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg--primary-dark transition-colors flex items-center gap-1">
          <span className="text-lg leading-none">+</span> Neuer Beitrag
        </button>
      </div>
      <div className="px-5 pt-5">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
          <h3 className="font-bold text-purple-900 mb-2">📝 Beiträge verwalten</h3>
          <p className="text-sm text-purple-800">
            Hier erstellen und bearbeiten Sie Beiträge für die Website. Beiträge werden nach dem Datum sortiert angezeigt – der neueste erscheint zuerst auf der Startseite.
          </p>
          <ul className="text-sm text-purple-800 mt-2 space-y-1 list-disc list-inside">
            <li>Neuen Beitrag mit „+" erstellen</li>
            <li>Vorhandene Beiträge per „Bearbeiten" ändern</li>
            <li>Änderungen sind erst nach Veröffentlichung im Tab „Veröffentlichen" für Besucher sichtbar</li>
          </ul>
        </div>
      </div>
      {content.posts.length === 0 ? (
        <div className="p-8 text-center text-text-muted">
          <p>Noch keine Beiträge vorhanden.</p>
          <button onClick={onNewPost} className="mt-3 text--primary font-medium hover:underline">
            Ersten Beitrag erstellen →
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {content.posts.map((post) => (
            <div key={post.id} className="flex items-center gap-4 p-4 hover:bg-surface-alt transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-green-700 text-lg">📄</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text truncate">{post.title || "(Ohne Titel)"}</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {formatDate(post.date)} · {post.author || "Unbekannt"}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => onEdit(post)} className="px-3 py-1.5 text-sm text--primary bg-green-50 rounded-lg hover:bg-green-100 transition-colors font-medium">
                  Bearbeiten
                </button>
                <button
                  onClick={() => { if (confirm(`Beitrag "${post.title}" wirklich löschen?`)) deletePost(post.id); }}
                  className="px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Post Editor ───────────────────────────────────────────

function PostEditor({ post, onCancel, onSaved }: { post: Post | null; onCancel: () => void; onSaved: () => void }) {
  const { savePost } = useContent();
  const isNew = !post?.id;
  const [form, setForm] = useState<Post>(post || { id: "", date: new Date().toISOString().split("T")[0], author: "", title: "", content: "" });
  const [showPreview, setShowPreview] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);

  const handleSave = () => {
    if (!form.title.trim()) { alert("Bitte einen Titel eingeben."); return; }
    if (!form.date) { alert("Bitte ein Datum eingeben."); return; }
    const id = form.id || form.title.toLowerCase().replace(/[^a-zäöüß0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + form.date;
    savePost({ ...form, id });
    onSaved();
  };

  const insertHtml = (html: string) => {
    const ta = document.getElementById("post-content") as HTMLTextAreaElement | null;
    const pos = ta?.selectionStart ?? form.content.length;
    setForm({ ...form, content: form.content.substring(0, pos) + html + form.content.substring(pos) });
  };

  return (
    <div className="bg-surface-card rounded-xl shadow-md overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h2 className="font-bold text-text">{isNew ? "Neuer Beitrag" : "Beitrag bearbeiten"}</h2>
        <button onClick={onCancel} className="text-sm text-text-muted hover:text-text">← Zurück</button>
      </div>
      <div className="p-5 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Titel *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none"
            placeholder="z.B. Aktivitäten und Termine 2026"
          />
        </div>

        {/* Date & Author row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Datum *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Autor</label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none"
              placeholder="z.B. Peter Hippeli"
            />
          </div>
        </div>

        {/* Content with Edit/Preview toggle */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-text">Inhalt (HTML)</label>
            <div className="flex bg-surface-alt rounded-lg p-0.5">
              <button
                onClick={() => setShowPreview(false)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${!showPreview ? "bg-white shadow text--primary" : "text-text"}`}
              >
                Bearbeiten
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${showPreview ? "bg-white shadow text--primary" : "text-text"}`}
              >
                Vorschau
              </button>
            </div>
          </div>

          {showPreview ? (
              <CmsContent
                html={form.content || "<p><em>Kein Inhalt</em></p>"}
                className="max-w-none text-text leading-relaxed border border-border rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto
                  [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text--primary [&_h3]:mt-4 [&_h3]:mb-2
                  [&_p]:mb-3
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:space-y-1
                  [&_a]:text--primary [&_a]:underline
                  [&_strong]:text-text"
              />
          ) : (
            <>
              {/* Quick formatting toolbar */}
              <div className="flex gap-1 mb-1.5 flex-wrap relative">
                <FormatBtn label="Fett" icon={faBold} before="<strong>" after="</strong>" form={form} setForm={setForm} textareaId="post-content" />
                <FormatBtn label="Kursiv" icon={faItalic} before="<em>" after="</em>" form={form} setForm={setForm} textareaId="post-content" />
                <FormatBtn label="Unterstrichen" icon={faUnderline} before="<u>" after="</u>" form={form} setForm={setForm} textareaId="post-content" />
                <FormatBtn label="H1" icon={faHeading} before="<h1>" after="</h1>" form={form} setForm={setForm} textareaId="post-content" />
                <FormatBtn label="H2" icon={faHeading} before="<h2>" after="</h2>" form={form} setForm={setForm} textareaId="post-content" />
                <FormatBtn label="H3" icon={faHeading} before="<h3>" after="</h3>" form={form} setForm={setForm} textareaId="post-content" />
                <FormatBtn label="Absatz" icon={faParagraph} before="<p>" after="</p>" form={form} setForm={setForm} textareaId="post-content" />
                <FormatBtn label="Liste" icon={faListUl} before="<ul>\n<li>" after="</li>\n</ul>" form={form} setForm={setForm} textareaId="post-content" />
                <FormatBtn label="Link" icon={faLink} before='<a href="URL">' after="</a>" form={form} setForm={setForm} textareaId="post-content" />
                <ImagePickerButton form={form} setForm={setForm} textareaId="post-content" />
                <button
                  type="button"
                  onClick={() => setShowBuilder(true)}
                  className="px-2.5 py-1 text-xs bg-surface-alt text-text rounded-md hover:bg-border transition-colors font-mono border border-border"
                  title="Baustein einfügen"
                >
                  🧩 Baustein
                </button>
              </div>
              <textarea
                id="post-content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={15}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none font-mono text-sm leading-relaxed"
                placeholder="<p>Ihr Inhalt in HTML…</p>"
              />
              <p className="text-xs text-text-muted mt-1">
                Tipp: Nutzen Sie HTML-Tags wie &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;&lt;li&gt;, &lt;strong&gt;, &lt;a href="…"&gt;
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-3 border-t border-border">
          <button onClick={handleSave} className="bg--primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg--primary-dark transition-colors">
            💾 Speichern
          </button>
          <button onClick={onCancel} className="px-6 py-2.5 border border-border rounded-lg text-text font-medium hover:bg-surface-alt transition-colors">
            Abbrechen
          </button>
        </div>
      </div>
      <ComponentBuilder open={showBuilder} onClose={() => setShowBuilder(false)} onInsert={insertHtml} />
    </div>
  );
}

function FormatBtn({ label, icon, before, after, form, setForm, textareaId }: {
  label: string; icon: IconDefinition; before: string; after: string;
  form: Post; setForm: (f: Post) => void; textareaId: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        const ta = document.getElementById(textareaId) as HTMLTextAreaElement | null;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = form.content.substring(start, end);
        const newContent = form.content.substring(0, start) + before + selected + after + form.content.substring(end);
        setForm({ ...form, content: newContent });
        setTimeout(() => {
          ta.focus();
          ta.selectionStart = start + before.length;
          ta.selectionEnd = start + before.length + selected.length;
        }, 0);
      }}
      className="px-2.5 py-1 text-xs bg-surface-alt text-text rounded-md hover:bg-border transition-colors font-mono border border-border inline-flex items-center gap-1"
      title={label}
    >
      <FontAwesomeIcon icon={icon} className="text-[11px]" />
      <span>{label}</span>
    </button>
  );
}

// ─── Settings Editor ───────────────────────────────────────

function SettingsEditor({ onSaved }: { onSaved: () => void }) {
  const { content, updateSiteConfig } = useContent();
  const [config, setConfig] = useState<SiteConfig>(content.siteConfig);
  const pageContent = config.pageContent || defaultContent.siteConfig.pageContent;

  const handleSave = () => {
    if (config.bannerImage && !config.bannerImageCredit?.trim()) {
      alert("Bitte geben Sie einen Bildquellennachweis für das Banner-Bild an.");
      return;
    }
    if (config.aboutImage && !config.aboutImageCredit?.trim()) {
      alert("Bitte geben Sie einen Bildquellennachweis für das Über-uns-Bild an.");
      return;
    }
    updateSiteConfig(config);
    onSaved();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-surface-card rounded-xl shadow-md overflow-hidden">
      <div className="p-5 border-b border-border">
        <h2 className="font-bold text-text">Website-Einstellungen</h2>
        <p className="text-sm text-text-muted mt-1">Kontaktdaten, Vereinsinformationen usw.</p>
      </div>
      <div className="p-5 space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-bold text-amber-900 mb-2">⚙️ Einstellungen bearbeiten</h3>
          <p className="text-sm text-amber-800">
            Hier pflegen Sie alle allgemeinen Informationen der Website – von Vereinsdaten über Kontaktadressen bis hin zu Seiteninhalten.
          </p>
          <ul className="text-sm text-amber-800 mt-2 space-y-1 list-disc list-inside">
            <li>Banner- und Über-uns-Bild erfordern zwingend einen Bildquellennachweis</li>
            <li>Seiteninhalte (Startseite, Impressum, Datenschutz usw.) können direkt hier bearbeitet werden</li>
            <li>Änderungen erst nach Veröffentlichung im Tab „Veröffentlichen" wirksam</li>
          </ul>
        </div>
        {/* Basic info */}
        <Section title="Allgemein" collapsible>
          <Field label="Vereinsname" value={config.name} onChange={(v) => setConfig({ ...config, name: v })} />
          <Field label="Kurzname" value={config.shortName} onChange={(v) => setConfig({ ...config, shortName: v })} />
          <Field label="Untertitel" value={config.tagline} onChange={(v) => setConfig({ ...config, tagline: v })} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Gegründet" value={config.founded} onChange={(v) => setConfig({ ...config, founded: v })} />
            <Field label="Mitglieder" value={config.members} onChange={(v) => setConfig({ ...config, members: v })} />
          </div>
        </Section>

        {/* Banner Image */}
        <Section title="Banner-Bild (Startseite)" collapsible>
          <p className="text-xs text-text-muted mb-2">Laden Sie ein Bild für den Banner auf der Startseite hoch. Empfohlen: 1200×400px, max. 500 KB.</p>
          {config.bannerImage ? (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden h-32 bg-surface-alt">
                <img src={config.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
              <button
                onClick={() => setConfig({ ...config, bannerImage: "", bannerImageCredit: "" })}
                className="text-sm text-red-600 hover:text-red-800 font-medium font-sans"
              >
                ✕ Banner-Bild entfernen
              </button>
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 500 * 1024) { alert("Bild zu groß! Max. 500 KB."); return; }
                  const reader = new FileReader();
                  reader.onload = () => setConfig({ ...config, bannerImage: reader.result as string });
                  reader.readAsDataURL(file);
                }}
                className="block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text--primary hover:file:bg-green-100"
              />
              <p className="text-xs text-text-muted mt-1">Aktuell wird ein grüner Gradient als Banner angezeigt.</p>
            </div>
          )}
          {config.bannerImage && (
            <div className="mt-3">
              <Field
                label="Bildquellennachweis / Urheberrecht *"
                value={config.bannerImageCredit || ""}
                onChange={(v) => setConfig({ ...config, bannerImageCredit: v })}
              />
              <p className="text-[11px] text-text-muted mt-1">
                Geben Sie den Urheber an (z. B. <code>Gerd Hildebrand</code> oder <code>© Name / Stockagentur</code>). Das Feld darf nicht leer sein.
              </p>
            </div>
          )}
        </Section>

        {/* Contact */}
        <Section title="Kontakt" collapsible>
          <Field label="E-Mail" value={config.email} onChange={(v) => setConfig({ ...config, email: v })} type="email" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Telefon (mobil)" value={config.phone} onChange={(v) => setConfig({ ...config, phone: v })} />
            <Field label="Hinweis" value={config.phoneNote} onChange={(v) => setConfig({ ...config, phoneNote: v })} />
          </div>
          <Field label="Telefon (fest)" value={config.phoneLandline} onChange={(v) => setConfig({ ...config, phoneLandline: v })} />
        </Section>

        {/* Address */}
        <Section title="Adresse" collapsible>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Field label="Straße" value={config.address.street} onChange={(v) => setConfig({ ...config, address: { ...config.address, street: v } })} />
            </div>
            <Field label="PLZ" value={config.address.zip} onChange={(v) => setConfig({ ...config, address: { ...config.address, zip: v } })} />
            <Field label="Ort" value={config.address.city} onChange={(v) => setConfig({ ...config, address: { ...config.address, city: v } })} />
          </div>
        </Section>

        {/* Bank Account */}
        <Section title="Spendenkonto" collapsible>
          <Field label="Bank" value={config.bankAccount.bank} onChange={(v) => setConfig({ ...config, bankAccount: { ...config.bankAccount, bank: v } })} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kontonummer" value={config.bankAccount.accountNumber} onChange={(v) => setConfig({ ...config, bankAccount: { ...config.bankAccount, accountNumber: v } })} />
            <Field label="BLZ" value={config.bankAccount.blz} onChange={(v) => setConfig({ ...config, bankAccount: { ...config.bankAccount, blz: v } })} />
          </div>
          <Field label="IBAN" value={config.bankAccount.iban} onChange={(v) => setConfig({ ...config, bankAccount: { ...config.bankAccount, iban: v } })} />
          <Field label="BIC" value={config.bankAccount.bic} onChange={(v) => setConfig({ ...config, bankAccount: { ...config.bankAccount, bic: v } })} />
        </Section>

        {/* Registry */}
        <Section title="Register" collapsible>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Gericht" value={config.registry.court} onChange={(v) => setConfig({ ...config, registry: { ...config.registry, court: v } })} />
            <Field label="Registernummer" value={config.registry.number} onChange={(v) => setConfig({ ...config, registry: { ...config.registry, number: v } })} />
          </div>
        </Section>

        {/* Board */}
        <Section title="Vorstand" collapsible>
          <BoardEditor board={config.board} onChange={(board) => setConfig({ ...config, board })} />
        </Section>

        <Section title="Seiteninhalte" collapsible defaultOpen>
          <p className="text-xs text-text-muted -mt-1">Hier können die Haupttexte von Startseite, Über uns, Hüttennutzung, Impressum und Datenschutz gepflegt werden (HTML erlaubt).</p>
          <SubSection title="Startseite" defaultOpen>
            <HtmlField
              label="Willkommensbox"
              value={pageContent.homeWelcomeHtml}
              onChange={(v) => setConfig({ ...config, pageContent: { ...pageContent, homeWelcomeHtml: v } })}
              rows={8}
            />
          </SubSection>
          <SubSection title="Über uns">
            <div className="mb-4 space-y-3 p-3 bg-surface-alt border border-border rounded-lg">
              <label className="block text-xs font-bold text-text uppercase tracking-wider">Bild der Über uns Seite</label>
              {config.aboutImage ? (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden h-32 bg-surface-alt max-w-sm">
                    <img src={config.aboutImage} alt="Über uns Bild" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, aboutImage: "", aboutImageCredit: "" })}
                    className="text-sm text-red-600 hover:text-red-800 font-medium font-sans"
                  >
                    ✕ Bild entfernen
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 500 * 1024) { alert("Bild zu groß! Max. 500 KB."); return; }
                      const reader = new FileReader();
                      reader.onload = () => setConfig({ ...config, aboutImage: reader.result as string });
                      reader.readAsDataURL(file);
                    }}
                    className="block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text--primary hover:file:bg-green-100 cursor-pointer"
                  />
                  <p className="text-xs text-text-muted mt-1">Aktuell wird das Standardbild angezeigt.</p>
                </div>
              )}
              {config.aboutImage && (
                <div className="mt-2">
                  <Field
                    label="Bildquellennachweis / Urheberrecht *"
                    value={config.aboutImageCredit || ""}
                    onChange={(v) => setConfig({ ...config, aboutImageCredit: v })}
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    Geben Sie den Urheber an (z. B. <code>Privat</code> oder <code>Foto: Gerd Hildebrand</code>). Das Feld darf nicht leer sein.
                  </p>
                </div>
              )}
            </div>
            <HtmlField
              label="Hauptinhalt"
              value={pageContent.aboutMainHtml}
              onChange={(v) => setConfig({ ...config, pageContent: { ...pageContent, aboutMainHtml: v } })}
              rows={12}
            />
          </SubSection>
          <SubSection title="Hüttennutzung">
            <HtmlField
              label="Text oberhalb Kalender"
              value={pageContent.huettennutzungIntroHtml}
              onChange={(v) => setConfig({ ...config, pageContent: { ...pageContent, huettennutzungIntroHtml: v } })}
              rows={10}
            />
          </SubSection>
          <SubSection title="Impressum">
            <HtmlField
              label="Impressum-Inhalt"
              value={pageContent.impressumHtml}
              onChange={(v) => setConfig({ ...config, pageContent: { ...pageContent, impressumHtml: v } })}
              rows={14}
            />
          </SubSection>
          <SubSection title="Datenschutz">
            <HtmlField
              label="Datenschutz-Inhalt"
              value={pageContent.datenschutzHtml}
              onChange={(v) => setConfig({ ...config, pageContent: { ...pageContent, datenschutzHtml: v } })}
              rows={14}
            />
          </SubSection>
        </Section>

        <div className="flex gap-3 pt-3 border-t border-border">
          <button onClick={handleSave} className="bg--primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg--primary-dark transition-colors">
            💾 Einstellungen speichern
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Board Editor (sub-component) ──────────────────────────

function BoardEditor({ board, onChange }: { board: SiteConfig["board"]; onChange: (b: SiteConfig["board"]) => void }) {
  const addMember = () => onChange([...board, { name: "", role: "" }]);
  const removeMember = (i: number) => onChange(board.filter((_, idx) => idx !== i));
  const updateMember = (i: number, field: "name" | "role", value: string) =>
    onChange(board.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));

  return (
    <div className="space-y-3">
      {board.map((member, i) => (
        <div key={i} className="flex items-center gap-3">
          <input
            type="text"
            value={member.name}
            onChange={(e) => updateMember(i, "name", e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring--primary focus:border-transparent outline-none"
            placeholder="Name"
          />
          <input
            type="text"
            value={member.role}
            onChange={(e) => updateMember(i, "role", e.target.value)}
            className="w-40 px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring--primary focus:border-transparent outline-none"
            placeholder="Rolle (optional)"
          />
          <button onClick={() => removeMember(i)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Entfernen">
            ✕
          </button>
        </div>
      ))}
      <button onClick={addMember} className="text-sm text--primary font-medium hover:underline">
        + Mitglied hinzufügen
      </button>
    </div>
  );
}

// ─── GitHub Setup ──────────────────────────────────────────

interface AuditLogEntry {
  timestamp: string;
  editor: string;
  summary: string;
}

function GitHubSetup({ onStatus, onLogout }: { onStatus: (type: "success" | "error", text: string) => void; onLogout: () => void }) {
  const { hasRemoteBackend, publishToRemote, refreshFromRemote, exportAsJson, content } = useContent();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editorName, setEditorName] = useState("");
  const [publishSummary, setPublishSummary] = useState("");
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [auditError, setAuditError] = useState("");
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  const loadAuditLog = useCallback(async () => {
    if (!hasRemoteBackend) return;
    setIsAuditLoading(true);
    try {
      const res = await fetch("/api/audit");
      if (res.status === 401) {
        onStatus("error", "Sitzung abgelaufen. Bitte erneut anmelden.");
        onLogout();
        return;
      }
      if (!res.ok) throw new Error(`Audit-Log nicht erreichbar (${res.status})`);
      const payload = await res.json() as { audit?: AuditLogEntry[] };
      setAuditLog(payload.audit || []);
      setAuditError("");
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : "Audit-Log konnte nicht geladen werden");
    } finally {
      setIsAuditLoading(false);
    }
  }, [hasRemoteBackend, onLogout, onStatus]);

  useEffect(() => {
    loadAuditLog();
  }, [loadAuditLog]);

  const handlePublish = async () => {
    if (!editorName.trim()) {
      onStatus("error", "Bitte Namen der bearbeitenden Person angeben.");
      return;
    }
    if (!publishSummary.trim()) {
      onStatus("error", "Bitte eine kurze Änderungsbeschreibung angeben.");
      return;
    }
    setIsPublishing(true);
    const result = await publishToRemote(editorName.trim(), publishSummary.trim());
    setIsPublishing(false);
    if (result.success) {
      onStatus("success", "✓ Inhalte erfolgreich veröffentlicht! Die Website wird für alle Besucher aktualisiert.");
      setPublishSummary("");
      loadAuditLog();
    } else {
      if (result.authExpired) {
        onStatus("error", "Sitzung abgelaufen. Bitte erneut anmelden.");
        onLogout();
        return;
      }
      onStatus("error", `Fehler beim Veröffentlichen: ${result.error}`);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const result = await refreshFromRemote();
    setIsRefreshing(false);
    if (result.success) {
      onStatus("success", "✓ Inhalte erfolgreich geladen.");
      loadAuditLog();
    } else {
      onStatus("error", `Fehler beim Laden: ${result.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Setup instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-bold text-blue-900 mb-3">🔒 Sichere Veröffentlichung</h3>
        <p className="text-sm text-blue-800">
          Zugangsdaten liegen serverseitig in Cloudflare-Umgebungsvariablen. Editorinnen und Editoren benötigen nur das Admin-Passwort.
        </p>
      </div>

      {/* Connection form */}
      <div className="bg-surface-card rounded-xl shadow-md overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-bold text-text">Verbindung</h2>
          <p className="text-sm text-text-muted mt-1">
            {hasRemoteBackend ? "✓ Verbunden mit Gist" : "Noch nicht erreichbar"}
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Bearbeitet von *</label>
              <input
                type="text"
                value={editorName}
                onChange={(e) => setEditorName(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
                placeholder="z.B. Martina"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Änderungsnotiz *</label>
              <input
                type="text"
                value={publishSummary}
                onChange={(e) => setPublishSummary(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
                placeholder="z.B. Neue Termine ergänzt"
              />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => {
                exportAsJson("pre-publish");
                onStatus("success", "Backup heruntergeladen.");
              }}
              className="px-5 py-2.5 border border-amber-300 bg-amber-50 text-amber-800 rounded-lg font-medium hover:bg-amber-100 transition-colors"
            >
              💾 Backup herunterladen
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg--primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg--primary-dark transition-colors disabled:opacity-50"
            >
              {isPublishing ? "⏳ Veröffentliche…" : "🚀 Jetzt veröffentlichen"}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-5 py-2.5 border border-border rounded-lg font-medium hover:bg-surface-alt transition-colors disabled:opacity-50"
            >
              {isRefreshing ? "⏳ Laden…" : "🔄 Inhalte laden"}
            </button>
          </div>
        </div>
      </div>

      {/* Publish info */}
      {hasRemoteBackend && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <h3 className="font-bold text-green-900 mb-2">🚀 Workflow zum Veröffentlichen</h3>
          <ol className="text-sm text-green-800 space-y-1.5 list-decimal list-inside">
            <li>Erstellen oder bearbeiten Sie Beiträge im Tab „Beiträge"</li>
            <li>Kontrollieren Sie die Änderungen auf der Website</li>
            <li>Klicken Sie auf „🚀 Jetzt veröffentlichen" um die Änderung für alle Besucher sichtbar zu machen</li>
          </ol>
          <p className="text-xs text-green-600 mt-3">
            Die Website lädt die Inhalte automatisch beim nächsten Besuch. 
            {content.posts.length > 0 && ` Aktuell: ${content.posts.length} Beitrag${content.posts.length !== 1 ? "e" : ""} gespeichert.`}
          </p>
        </div>
      )}

      {hasRemoteBackend && (
        <div className="bg-surface-card rounded-xl shadow-md overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-text">Letzte Veröffentlichungen</h3>
              <p className="text-sm text-text-muted mt-0.5">Die letzten 5 Einträge aus dem Audit-Log.</p>
            </div>
            <button onClick={loadAuditLog} className="text-sm text--primary hover:underline font-medium">
              Aktualisieren
            </button>
          </div>
          <div className="p-5">
            {isAuditLoading ? (
              <p className="text-sm text-text-muted">Audit-Log wird geladen...</p>
            ) : auditError ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{auditError}</p>
            ) : auditLog.length === 0 ? (
              <p className="text-sm text-text-muted">Noch keine Veröffentlichungen im Audit-Log. Einträge erscheinen nach dem nächsten erfolgreichen Publish.</p>
            ) : (
              <div className="space-y-3">
                {auditLog.map((entry, index) => (
                  <div key={`${entry.timestamp}-${index}`} className="border border-border rounded-lg p-3 bg-surface-alt">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-text-muted mb-1">
                      <span>{new Date(entry.timestamp).toLocaleString("de-DE")}</span>
                      <span>von {entry.editor}</span>
                    </div>
                    <p className="text-sm text-text">{entry.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Export / Import ───────────────────────────────────────

function ExportImport({ onStatus }: { onStatus: (type: "success" | "error", text: string) => void }) {
  const { exportAsJson, importFromJson, saveToLocal } = useContent();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importFromJson(reader.result as string);
      if (result.success) {
        onStatus("success", "✓ Inhalte erfolgreich importiert!");
      } else {
        onStatus("error", result.error || "Import fehlgeschlagen");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="font-bold text-amber-900 mb-2">💾 Lokale Speicherung</h3>
        <p className="text-sm text-amber-800">
          Inhalte werden automatisch in Ihrem Browser gespeichert (localStorage). 
          Verwenden Sie Export/Import, um Inhalte zwischen Geräten zu übertragen oder ein Backup zu erstellen.
        </p>
        <button onClick={() => { saveToLocal(); onStatus("success", "✓ Inhalte lokal gespeichert."); }} className="mt-3 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
          💾 Jetzt lokal speichern
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export */}
        <div className="bg-surface-card rounded-xl shadow-md p-5">
          <h3 className="font-bold text-text mb-3">📤 Export</h3>
          <p className="text-sm text-text mb-4">
            Laden Sie alle Inhalte als JSON-Datei herunter.
          </p>
          <button
            onClick={() => { exportAsJson(); onStatus("success", "✓ Export gestartet (Download). Bitte Download-Ordner prüfen."); }}
            className="w-full bg--primary text-white px-4 py-2.5 rounded-lg font-semibold hover:bg--primary-dark transition-colors"
          >
            📥 Inhalt exportieren
          </button>
        </div>

        {/* Import */}
        <div className="bg-surface-card rounded-xl shadow-md p-5">
          <h3 className="font-bold text-text mb-3">📥 Import</h3>
          <p className="text-sm text-text mb-4">
            Laden Sie eine zuvor exportierte JSON-Datei hoch.
          </p>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-border text-text px-4 py-2.5 rounded-lg font-semibold hover:border--primary hover:text--primary transition-colors"
          >
            📂 Datei auswählen…
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Image Picker Button (in post editor) ─────────────────

function ImagePickerButton({ form, setForm, textareaId }: {
  form: Post; setForm: (f: Post) => void; textareaId: string;
}) {
  const { content, addImage } = useContent();
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const insertTag = (imgSrc: string, alt: string, copyright: string) => {
    const ta = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    const pos = ta?.selectionStart ?? form.content.length;
    const tag = `<figure><img src="${imgSrc}" alt="${alt}" /><figcaption>📷 ${copyright}</figcaption></figure>`;
    setForm({ ...form, content: form.content.substring(0, pos) + tag + form.content.substring(pos) });
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="px-2.5 py-1 text-xs bg-surface-alt text-text rounded-md hover:bg-border transition-colors font-mono border border-border"
        title="Bild aus Bibliothek einfügen"
      >
        🖼️ Bibliothek
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="px-2.5 py-1 text-xs bg-surface-alt text-text rounded-md hover:bg-border transition-colors font-mono border border-border"
        title="Neues Bild hochladen und einfügen"
      >
        ⬆️ Upload
      </button>
      {open && (
        <div className="absolute z-20 mt-1 bg-surface-card border border-border rounded-lg shadow-xl p-3 w-72 max-h-64 overflow-y-auto">
          <p className="text-xs text-text-muted mb-2 font-medium">Bild aus Bibliothek einfügen:</p>
          {content.images?.length ? (
            <div className="grid grid-cols-3 gap-2">
              {content.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => insertTag(img.dataUrl, img.name, img.copyright || "Privat")}
                  className="rounded-lg overflow-hidden border-2 border-transparent hover:border--primary transition-colors aspect-square"
                >
                  <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-text-muted bg-surface-alt border border-border rounded-lg px-3 py-2">
              Noch keine Bilder in der Bibliothek.
            </div>
          )}
          <div className="border-t border-border mt-2 pt-2">
            <button onClick={() => { setOpen(false); fileRef.current?.click(); }} className="text-xs text--primary font-medium hover:underline">
              + Neues Bild hochladen…
            </button>
          </div>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 500 * 1024) { alert("Bild zu groß! Max. 500 KB für Artikel-Bilder."); return; }
          const reader = new FileReader();
          reader.onload = () => {
            const name = file.name.replace(/\.[^.]+$/, "");
            const copyright = prompt(`Bildquellennachweis für "${name}" eingeben:\n\nZitierhilfe:\n- Eigenes Bild: Name\n- Kostenloses Portal (z.B. Unsplash): Foto: Name / Unsplash\n- Kaufbild: © Name / Adobe Stock`);
            if (copyright === null) return;
            if (!copyright.trim()) {
              alert("Der Bildquellennachweis darf nicht leer sein!");
              return;
            }
            const newImg = {
              id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
              name,
              dataUrl: reader.result as string,
              copyright: copyright.trim(),
              createdAt: new Date().toISOString(),
            };
            addImage(newImg);
            insertTag(newImg.dataUrl, newImg.name, newImg.copyright);
          };
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
    </>
  );
}

// ─── Image Library ─────────────────────────────────────────

function ImageLibrary({ onStatus }: { onStatus: (type: "success" | "error", text: string) => void }) {
  const { content, addImage, deleteImage } = useContent();
  const fileRef = useRef<HTMLInputElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ file: File, dataUrl: string, name: string, copyright: string } | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      onStatus("error", `"${file.name}" ist zu groß (${(file.size / 1024).toFixed(0)} KB). Max. 500 KB pro Bild.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingFile({
        file,
        dataUrl: reader.result as string,
        name: file.name.replace(/\.[^.]+$/, ""),
        copyright: "",
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const copyTag = (img: SiteImage) => {
    const tag = `<figure><img src="${img.dataUrl}" alt="${img.name}" /><figcaption>📷 ${img.copyright}</figcaption></figure>`;
    navigator.clipboard.writeText(tag);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalSize = content.images?.reduce((sum, img) => sum + (img.dataUrl.length * 0.75), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-bold text-blue-900 mb-2">🖼️ Bilder-Verwaltung</h3>
        <p className="text-sm text-blue-800">
          Hier laden Sie Bilder hoch und verwalten Ihre Bildergalerie. Jedes Bild benötigt zwingend einen Bildquellennachweis (Urheberangabe).
        </p>
        <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
          <li>Maximale Dateigröße: 500 KB pro Bild (JPEG, PNG oder WebP)</li>
          <li>Kopieren Sie den Bild-Tag per Klick und fügen Sie ihn in Beiträge oder Seiten ein</li>
          <li>Bilder werden als Data-URLs im CMS gespeichert – kein externer Speicher nötig</li>
        </ul>
      </div>
      {/* Upload Modal */}
      {pendingFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-card rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg--primary p-4 text-white">
              <h3 className="font-bold text-lg">📸 Bildquellennachweis angeben</h3>
              <p className="text-xs text-green-100 mt-0.5">Urheberangaben sind gesetzlich vorgeschrieben</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-4 items-center bg-surface-alt p-3 rounded-lg border border-border">
                <img src={pendingFile.dataUrl} alt="Vorschau" className="w-16 h-16 object-cover rounded-lg border border-border" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-text-muted font-medium">Datei:</p>
                  <p className="text-sm font-semibold text-text truncate">{pendingFile.file.name}</p>
                  <p className="text-xs text-text-muted">{(pendingFile.file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1">Bildname</label>
                <input
                  type="text"
                  value={pendingFile.name}
                  onChange={(e) => setPendingFile({ ...pendingFile, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring--primary focus:border-transparent outline-none"
                  placeholder="z.B. Eröffnungstermin"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text uppercase tracking-wider mb-1">Quellennachweis / Urheberrecht *</label>
                <input
                  type="text"
                  value={pendingFile.copyright}
                  onChange={(e) => setPendingFile({ ...pendingFile, copyright: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring--primary focus:border-transparent outline-none"
                  placeholder="z.B. Gerd Hildebrand"
                  autoFocus
                />
              </div>

              {/* Zitierhilfe */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
                <p className="font-bold">💡 Zitierhilfe:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li><strong>Eigenes Bild:</strong> <code>Gerd Hildebrand</code> oder <code>Foto: Privat</code></li>
                  <li><strong>Kostenloses Portal:</strong> <code>Foto: Name / Unsplash</code></li>
                  <li><strong>Kaufbild:</strong> <code>© Name / Adobe Stock</code></li>
                </ul>
                <p className="text-[10px] text-amber-700/80 mt-1 italic">Das Feld darf nicht leer sein.</p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setPendingFile(null)}
                  className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-text hover:bg-surface-alt transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!pendingFile.copyright.trim()) { alert("Bitte geben Sie einen Bildquellennachweis an."); return; }
                    if (!pendingFile.name.trim()) { alert("Bitte geben Sie einen Namen für das Bild an."); return; }
                    addImage({
                      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                      name: pendingFile.name.trim(),
                      dataUrl: pendingFile.dataUrl,
                      copyright: pendingFile.copyright.trim(),
                      createdAt: new Date().toISOString(),
                    });
                    setPendingFile(null);
                    onStatus("success", `Bild "${pendingFile.name}" erfolgreich hinzugefügt!`);
                  }}
                  disabled={!pendingFile.copyright.trim() || !pendingFile.name.trim()}
                  className="px-4 py-2 bg--primary text-white rounded-lg text-sm font-semibold hover:bg--primary-dark transition-colors disabled:opacity-50"
                >
                  Bild hinzufügen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload + Info */}
      <div className="bg-surface-card rounded-xl shadow-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-bold text-text">Bild-Bibliothek</h2>
            <p className="text-sm text-text-muted mt-0.5">
              {content.images?.length || 0} Bilder · {(totalSize / 1024).toFixed(0)} KB belegt
            </p>
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="bg--primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg--primary-dark transition-colors flex items-center gap-1">
              <span className="text-lg leading-none">+</span> Bild hochladen
            </button>
          </div>
        </div>

        {/* Image grid */}
        {(!content.images || content.images.length === 0) ? (
          <div className="p-10 text-center text-text-muted">
            <p className="text-4xl mb-3">🖼️</p>
            <p>Noch keine Bilder vorhanden.</p>
            <p className="text-sm mt-1">Laden Sie Bilder hoch, um sie in Artikeln zu verwenden.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-5">
            {content.images.map((img) => (
              <div key={img.id} className="group relative bg-surface-alt rounded-lg overflow-hidden border border-border">
                <div className="aspect-square">
                  <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-text truncate">{img.name}</p>
                  <p className="text-[10px] text-text-muted truncate" title={`Urheber: ${img.copyright}`}>📷 {img.copyright || "Privat"}</p>
                  <p className="text-xs text-text-muted">{(img.dataUrl.length * 0.75 / 1024).toFixed(0)} KB</p>
                </div>
                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => copyTag(img)}
                    className="px-3 py-1.5 bg-white text-text rounded-lg text-xs font-medium hover:bg-surface-alt shadow"
                  >
                    {copiedId === img.id ? "✓ Kopiert!" : "📋 Code kopieren"}
                  </button>
                  <button
                    onClick={() => { if (confirm(`Bild "${img.name}" löschen?`)) deleteImage(img.id); }}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 shadow"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help */}
      <div className="bg-surface-card rounded-xl shadow-md p-5 space-y-3">
        <h3 className="font-bold text-text">💡 Bilder in Artikeln verwenden</h3>
        <div className="text-sm text-text space-y-2">
          <p><strong>Methode 1 — Aus Bibliothek:</strong> Klicken Sie im Beitragseditor auf „🖼️ Bibliothek" und wählen Sie ein vorhandenes Bild.</p>
          <p><strong>Methode 2 — Direkt hochladen:</strong> Klicken Sie im Beitragseditor auf „⬆️ Upload" und wählen Sie eine neue Datei. Das Bild wird direkt eingefügt.</p>
          <p><strong>Methode 3 — Code kopieren:</strong> Klicken Sie auf „📋 Code kopieren" bei einem Bild und fügen Sie den HTML-Code im Beitragseditor ein.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <strong>Max. 500 KB pro Bild.</strong> Empfohlen: JPEG oder WebP, 800–1200px Breite. Größere Bilder verlangsamen die Website.
          Bilder werden als Base64 im GitHub Gist gespeichert — pro Jahr ca. 10–20 Bilder sind problemlos möglich (Gist-Limit: 100 MB).
        </div>
      </div>

      {/* Storage info */}
      <div className="bg-surface-card rounded-xl shadow-md p-5">
        <h3 className="font-bold text-text mb-3">📊 Speicherplatz-Übersicht</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text">GitHub Gist (Bilder + Inhalte)</span>
              <span className="font-medium">{(totalSize / 1024).toFixed(0)} KB / 100 MB</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div className="bg--primary rounded-full h-2 transition-all" style={{ width: `${Math.min(100, (totalSize / (100 * 1024 * 1024)) * 100)}%` }}></div>
            </div>
          </div>
          <p className="text-xs text-text-muted">
            Cloudflare Pages: Unbegrenzte Bandbreite, 25 MB pro Datei, 20.000 Dateien.
            Der Gist speichert alle Inhalte und Bilder als JSON.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable UI helpers ──────────────────────────────────

function Section({ title, children, collapsible = false, defaultOpen = false }: { title: string; children: React.ReactNode; collapsible?: boolean; defaultOpen?: boolean }) {
  if (!collapsible) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-bold text--primary uppercase tracking-wider">{title}</h3>
        <div className="space-y-3 pl-1">{children}</div>
      </div>
    );
  }

  return (
    <details className="group rounded-lg border border-border bg-surface-alt/50" open={defaultOpen}>
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-bold text--primary uppercase tracking-wider">{title}</span>
        <span className="text-text-muted group-open:rotate-180 transition-transform">▾</span>
      </summary>
      <div className="space-y-3 px-4 pb-4">{children}</div>
    </details>
  );
}

function SubSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group rounded-lg border border-border bg-white" open={defaultOpen}>
      <summary className="cursor-pointer list-none px-3 py-2 flex items-center justify-between hover:bg-surface-alt rounded-lg">
        <span className="text-sm font-semibold text-text">{title}</span>
        <span className="text-text-muted group-open:rotate-180 transition-transform">▾</span>
      </summary>
      <div className="px-3 pb-3 pt-1">{children}</div>
    </details>
  );
}

function Field({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring--primary focus:border-transparent outline-none"
      />
    </div>
  );
}

function HtmlField({ label, value, onChange, rows = 10 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const textareaId = `html-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const warning = validateHtmlFragment(value);

  const insertHtml = (before: string, after = "") => {
    const ta = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    const start = ta?.selectionStart ?? value.length;
    const end = ta?.selectionEnd ?? value.length;
    const selected = value.substring(start, end);
    const next = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(next);
    window.setTimeout(() => {
      ta?.focus();
      if (!ta) return;
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    }, 0);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-xs font-medium text-text-muted">{label}</label>
        <div className="flex bg-surface-alt rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${!showPreview ? "bg-white shadow text--primary" : "text-text"}`}
          >
            Bearbeiten
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${showPreview ? "bg-white shadow text--primary" : "text-text"}`}
          >
            Vorschau
          </button>
        </div>
      </div>

      {!showPreview && (
        <div className="flex gap-1 flex-wrap relative">
          <HtmlFormatBtn label="Fett" icon={faBold} onClick={() => insertHtml("<strong>", "</strong>")} />
          <HtmlFormatBtn label="Kursiv" icon={faItalic} onClick={() => insertHtml("<em>", "</em>")} />
          <HtmlFormatBtn label="Unterstrichen" icon={faUnderline} onClick={() => insertHtml("<u>", "</u>")} />
          <HtmlFormatBtn label="H1" icon={faHeading} onClick={() => insertHtml("<h1>", "</h1>")} />
          <HtmlFormatBtn label="H2" icon={faHeading} onClick={() => insertHtml("<h2>", "</h2>")} />
          <HtmlFormatBtn label="H3" icon={faHeading} onClick={() => insertHtml("<h3>", "</h3>")} />
          <HtmlFormatBtn label="Absatz" icon={faParagraph} onClick={() => insertHtml("<p>", "</p>")} />
          <HtmlFormatBtn label="Liste" icon={faListUl} onClick={() => insertHtml("<ul>\n<li>", "</li>\n</ul>")} />
          <HtmlFormatBtn label="Link" icon={faLink} onClick={() => insertHtml('<a href="URL">', "</a>")} />
          <HtmlImagePickerButton onInsert={(html) => insertHtml(html)} />
        </div>
      )}

      {showPreview ? (
        <CmsContent
          html={value || "<p><em>Kein Inhalt</em></p>"}
          className="max-w-none text-text leading-relaxed border border-border rounded-lg p-4 min-h-40 max-h-[420px] overflow-y-auto bg-surface-card
            [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-text [&_h1]:mt-4 [&_h1]:mb-3
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-text [&_h2]:mt-4 [&_h2]:mb-3
            [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text--primary [&_h3]:mt-4 [&_h3]:mb-2
            [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text--primary [&_a]:underline"
        />
      ) : (
        <textarea
          id={textareaId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring--primary focus:border-transparent outline-none font-mono ${warning ? "border-amber-400 bg-amber-50/30" : "border-border"}`}
        />
      )}

      {warning && (
        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          HTML-Hinweis: {warning}
        </div>
      )}

    </div>
  );
}

function HtmlFormatBtn({ label, icon, onClick }: { label: string; icon: IconDefinition; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1 text-xs bg-surface-alt text-text rounded-md hover:bg-border transition-colors font-mono border border-border inline-flex items-center gap-1"
      title={label}
    >
      <FontAwesomeIcon icon={icon} className="text-[11px]" />
      <span>{label}</span>
    </button>
  );
}

function HtmlImagePickerButton({ onInsert }: { onInsert: (html: string) => void }) {
  const { content, addImage } = useContent();
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const insertImage = (imgSrc: string, alt: string, copyright: string) => {
    onInsert(`<figure><img src="${imgSrc}" alt="${alt}" /><figcaption>📷 ${copyright}</figcaption></figure>`);
    setOpen(false);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(!open)} className="px-2.5 py-1 text-xs bg-surface-alt text-text rounded-md hover:bg-border transition-colors font-mono border border-border">🖼️ Bibliothek</button>
      <button type="button" onClick={() => fileRef.current?.click()} className="px-2.5 py-1 text-xs bg-surface-alt text-text rounded-md hover:bg-border transition-colors font-mono border border-border">⬆️ Upload</button>
      {open && (
        <div className="absolute z-20 mt-1 bg-surface-card border border-border rounded-lg shadow-xl p-3 w-72 max-h-64 overflow-y-auto">
          <p className="text-xs text-text-muted mb-2 font-medium">Bild aus Bibliothek einfügen:</p>
          {content.images?.length ? (
            <div className="grid grid-cols-3 gap-2">
              {content.images.map((img) => (
                <button key={img.id} onClick={() => insertImage(img.dataUrl, img.name, img.copyright || "Privat")} className="rounded-lg overflow-hidden border-2 border-transparent hover:border--primary transition-colors aspect-square">
                  <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-text-muted bg-surface-alt border border-border rounded-lg px-3 py-2">Noch keine Bilder in der Bibliothek.</div>
          )}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 500 * 1024) { alert("Bild zu groß! Max. 500 KB für Seiten-Bilder."); return; }
          const reader = new FileReader();
          reader.onload = () => {
            const name = file.name.replace(/\.[^.]+$/, "");
            const copyright = prompt(`Bildquellennachweis für "${name}" eingeben:\n\nZitierhilfe:\n- Eigenes Bild: Name\n- Kostenloses Portal (z.B. Unsplash): Foto: Name / Unsplash\n- Kaufbild: © Name / Adobe Stock`);
            if (copyright === null) return;
            if (!copyright.trim()) {
              alert("Der Bildquellennachweis darf nicht leer sein!");
              return;
            }
            const newImg = {
              id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
              name,
              dataUrl: reader.result as string,
              copyright: copyright.trim(),
              createdAt: new Date().toISOString(),
            };
            addImage(newImg);
            insertImage(newImg.dataUrl, newImg.name, newImg.copyright);
          };
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
    </>
  );
}

function validateHtmlFragment(html: string): string {
  const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  const stack: string[] = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(?:\s[^>]*)?>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html))) {
    const full = match[0];
    const tag = match[1].toLowerCase();
    if (full.startsWith("<!--") || voidTags.has(tag) || full.endsWith("/>")) continue;

    if (full.startsWith("</")) {
      const open = stack.pop();
      if (open !== tag) {
        return open ? `Schließendes </${tag}> passt nicht zum offenen <${open}>.` : `Schließendes </${tag}> ohne passenden öffnenden Tag.`;
      }
    } else {
      stack.push(tag);
    }
  }

  if (stack.length > 0) return `Tag <${stack[stack.length - 1]}> wurde nicht geschlossen.`;
  return "";
}

// ─── Deployment Help ───────────────────────────────────────

function DeployHelp() {
  const [expanded, setExpanded] = useState<"cloudflare" | null>(null);

  const toggle = (section: "cloudflare") => {
    setExpanded(expanded === section ? null : section);
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-surface-card rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-text mb-3">🌐 Website bereitstellen</h2>
        <p className="text-text text-sm leading-relaxed mb-4">
          Die Website besteht aus einer einzigen HTML-Datei und kann überall kostenlos gehostet werden. 
          Da Ihre Domain bereits über Cloudflare verwaltet wird, ist <strong>Cloudflare Pages</strong> die passende Plattform.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <p className="font-semibold text-green-800 mb-1">💡 Tipp: Inhalt vs. Code</p>
          <p className="text-green-700">
            <strong>Inhalte</strong> (Beiträge, Termine, Kontaktdaten) werden über den Admin-Bereich bearbeitet und via GitHub Gist veröffentlicht — kein Deployment nötig!
            <br />
            Ein <strong>Deployment</strong> (neu bereitstellen) ist nur nötig, wenn sich der <strong>Code</strong> ändert (z.B. neues Passwort, Design-Änderung).
          </p>
        </div>
      </div>

      {/* Option A: Cloudflare Pages */}
      <div className="bg-surface-card rounded-xl shadow-md overflow-hidden">
        <button
          onClick={() => toggle("cloudflare")}
          className="w-full flex items-center justify-between p-5 hover:bg-surface-alt transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl">☁️</div>
            <div>
              <h3 className="font-bold text-text">Option A: Cloudflare Pages</h3>
              <p className="text-sm text-text-muted">Empfohlen — Kostenlos, automatisch, Ihre Domain ist bereits dort</p>
            </div>
          </div>
          <svg className={`w-5 h-5 text-text-muted transition-transform ${expanded === "cloudflare" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expanded === "cloudflare" && (
          <div className="px-5 pb-5 border-t border-border pt-4 space-y-5">
            <Step number={1} title="Code auf GitHub hochladen">
              <p>Erstellen Sie einen kostenlosen Account auf <ExtLink href="https://github.com">github.com</ExtLink>.</p>
              <p>Erstellen Sie ein neues Repository (privat):</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Gehe zu <ExtLink href="https://github.com/new">github.com/new</ExtLink></li>
                <li>Name: <code className="bg-surface-alt px-1.5 py-0.5 rounded text-xs">goldsteinfreunde-website</code></li>
                <li>Sichtbarkeit: <strong>Private</strong></li>
                <li>„Create repository" klicken</li>
              </ol>
              <p className="mt-2">Dann im Projektordner auf dem eigenen Rechner:</p>
              <pre className="bg-gray-900 text-green-300 p-3 rounded-lg text-xs overflow-x-auto mt-1">
{`git init
git add .
git commit -m "Goldsteinfreunde Website"
git remote add origin https://github.com/BENUTZER/goldsteinfreunde-website.git
git push -u origin main`}
              </pre>
            </Step>

            <Step number={2} title="Cloudflare Pages verbinden">
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Einloggen im <ExtLink href="https://dash.cloudflare.com">Cloudflare Dashboard</ExtLink></li>
                <li>Links auf <strong>Workers &amp; Pages</strong></li>
                <li><strong>Create</strong> → <strong>Pages</strong> → <strong>Connect to Git</strong></li>
                <li>GitHub autorisieren und Repository <code className="bg-surface-alt px-1.5 py-0.5 rounded text-xs">goldsteinfreunde-website</code> auswählen</li>
                <li>Build-Einstellungen:
                  <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                    <li>Build command: <code className="bg-surface-alt px-1.5 py-0.5 rounded text-xs">npm run build</code></li>
                    <li>Output directory: <code className="bg-surface-alt px-1.5 py-0.5 rounded text-xs">dist</code></li>
                  </ul>
                </li>
                <li><strong>Save and Deploy</strong> klicken</li>
              </ol>
              <p className="text-sm text-text-muted mt-2">
                ✅ Cloudflare baut die Website automatisch. Nach ca. 1 Minute ist sie unter 
                <code className="bg-surface-alt px-1.5 py-0.5 rounded text-xs ml-1">goldsteinfreunde-website.pages.dev</code> erreichbar.
              </p>
            </Step>

            <Step number={3} title="Domain verbinden">
              <ol className="list-decimal list-inside space-y-1.5">
                <li>In Cloudflare Pages: Projekt öffnen → <strong>Custom domains</strong></li>
                <li><strong>Set up a custom domain</strong> klicken</li>
                <li><code className="bg-surface-alt px-1.5 py-0.5 rounded text-xs">goldsteinfreunde.de</code> eingeben</li>
                <li>Cloudflare fügt den DNS-Eintrag automatisch hinzu (sofort aktiv)</li>
                <li>Auch <code className="bg-surface-alt px-1.5 py-0.5 rounded text-xs">www.goldsteinfreunde.de</code> hinzufügen</li>
              </ol>
            </Step>

            <Step number={4} title="Alte Website-DNS-Einträge prüfen">
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Cloudflare Dashboard → <strong>Websites</strong> → <strong>goldsteinfreunde.de</strong> → <strong>DNS</strong></li>
                <li>Alte A/CNAME-Einträge für die bisherige Website <strong>löschen</strong> oder deaktivieren</li>
                <li>Behalten: die neuen CNAME-Einträge auf <code className="bg-surface-alt px-1.5 py-0.5 rounded text-xs">*.pages.dev</code></li>
              </ol>
              <p className="text-sm text-text-muted mt-2">
                📧 E-Mail-Einträge wie MX, SPF, DKIM oder DMARC bleiben unverändert bestehen.
              </p>
            </Step>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-semibold text-blue-800 mb-1">🔄 Automatische Updates</p>
              <p className="text-blue-700">
                Bei jeder Änderung am Code (Push auf GitHub) baut Cloudflare die Website automatisch neu. 
                Kein manuelles Deployment nötig!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Costs */}
      <div className="bg-surface-card rounded-xl shadow-md p-6">
        <h3 className="font-bold text-text mb-3">💰 Kostenübersicht</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-text font-medium">Bestandteil</th>
                <th className="text-left py-2 text-text font-medium">Kosten</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr><td className="py-2 pr-4">Cloudflare Pages (Hosting)</td><td className="py-2 text-green-700 font-medium">Kostenlos</td></tr>
              <tr><td className="py-2 pr-4">GitHub (Repository + Gist)</td><td className="py-2 text-green-700 font-medium">Kostenlos</td></tr>
              <tr><td className="py-2 pr-4">Cloudflare DNS + CDN</td><td className="py-2 text-green-700 font-medium">Kostenlos (vorhanden)</td></tr>
              <tr><td className="py-2 pr-4">SSL/HTTPS</td><td className="py-2 text-green-700 font-medium">Kostenlos (inklusive)</td></tr>
              <tr className="font-bold"><td className="py-2 pr-4">Gesamt pro Monat</td><td className="py-2 text-green-700">0,00 €</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloudflare Free Tier Limits */}
      <div className="bg-surface-card rounded-xl shadow-md p-6">
        <h3 className="font-bold text-text mb-3">📏 Cloudflare Pages Free-Tier Limits</h3>
        <p className="text-sm text-text mb-4">
          Für diese Website völlig ausreichend — hier die konkreten Zahlen:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Bandbreite", value: "Unbegrenzt", ok: true },
            { label: "Anfragen", value: "Unbegrenzt", ok: true },
            { label: "Builds pro Monat", value: "500", ok: true, note: "(=~1 Code-Änderung pro Tag)" },
            { label: "Dateien pro Site", value: "20.000", ok: true },
            { label: "Max. Dateigröße", value: "25 MB", ok: true },
            { label: "Custom Domains", value: "5 / Projekt", ok: true },
            { label: "SSL-Zertifikate", value: "Inklusive", ok: true },
            { label: "GitHub Gist", value: "100 MB / Datei", ok: true, note: "(Inhalt + Bilder)" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 bg-surface-alt rounded-lg p-3">
              <span className="text-green-500 mt-0.5">✓</span>
              <div>
                <span className="text-sm font-medium text-text">{item.label}: </span>
                <span className="text-sm font-bold text-green-700">{item.value}</span>
                {item.note && <p className="text-xs text-text-muted mt-0.5">{item.note}</p>}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-4">
          Fazit: Eine Vereinswebsite mit ~20 Artikeln und ~30 Fotos pro Jahr beansprucht geschätzt weniger als 1 % der Limits.
        </p>
      </div>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 bg--primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <h4 className="font-bold text-text mb-2">{title}</h4>
        <div className="text-sm text-text space-y-2 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text--primary underline hover:no-underline font-medium">
      {children}
    </a>
  );
}
