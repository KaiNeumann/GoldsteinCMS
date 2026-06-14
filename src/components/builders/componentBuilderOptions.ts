import type { CmsComponentType } from "../../content/defaultContent";

export type ComponentType = CmsComponentType;
export type CalloutType = "info" | "warning" | "success" | "tip";

export const COMPONENT_TYPES: { type: ComponentType; icon: string; label: string; desc: string }[] = [
  { type: "gallery", icon: "🖼️", label: "Galerie", desc: "Bilder im Raster" },
  { type: "slider", icon: "🎠", label: "Slider", desc: "Bilder im Karussell" },
  { type: "collapsible", icon: "📋", label: "Aufklappbar", desc: "Text ein-/ausklappen" },
  { type: "accordion", icon: "❓", label: "Akkordeon", desc: "Nur ein Section offen" },
  { type: "callout", icon: "ℹ️", label: "Hinweisbox", desc: "Info, Warnung, Tipp" },
  { type: "table", icon: "📊", label: "Tabelle", desc: "Responsiv formatiert" },
  { type: "youtubeEmbed", icon: "▶️", label: "YouTube-Video", desc: "Video einbetten" },
  { type: "pdfEmbed", icon: "📄", label: "PDF einbetten", desc: "PDF-Dokument anzeigen" },
  { type: "cardGrid", icon: "🃏", label: "Kartenraster", desc: "Service/Feature Übersicht" },
  { type: "steps", icon: "📋", label: "Prozessschritte", desc: "Schritt-für-Schritt" },
  { type: "socialLinks", icon: "🔗", label: "Social Links", desc: "Facebook, Instagram & Co." },
  { type: "contactForm", icon: "✉️", label: "Kontaktformular", desc: "Name, E-Mail, Nachricht" },
  { type: "newsletterSignup", icon: "📰", label: "Newsletter", desc: "E-Mail-Adresse sammeln" },
];

export const CALLOUT_STYLES: { type: CalloutType; icon: string; label: string; color: string }[] = [
  { type: "info", icon: "ℹ️", label: "Info", color: "border-blue-400 bg-blue-50 text-blue-800" },
  { type: "warning", icon: "⚠️", label: "Warnung", color: "border-amber-400 bg-amber-50 text-amber-800" },
  { type: "success", icon: "✅", label: "Erfolg", color: "border-green-400 bg-green-50 text-green-800" },
  { type: "tip", icon: "💡", label: "Tipp", color: "border-purple-400 bg-purple-50 text-purple-800" },
];
