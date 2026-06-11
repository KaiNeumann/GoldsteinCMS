import { useState } from "react";
import { useContent } from "../context/ContentContext";
import CmsContent from "../components/CmsContent";

export default function Huettennutzung() {
  const { content } = useContent();
  const { siteConfig: cfg } = content;
  const [calendarLoaded, setCalendarLoaded] = useState(false);

  return (
    <div>
      <div className="bg-gradient-to-r from--primary to--primary-light rounded-t-xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          Hüttennutzung
        </h1>
        <p className="text-green-100 mt-2">Belegungsplan und Anfrage zur Nutzung der roten Hütte</p>
      </div>

      <div className="bg-surface-card rounded-b-xl shadow-md p-6 md:p-8 text-text leading-relaxed space-y-6">
        <CmsContent
          html={cfg.pageContent.huettennutzungIntroHtml}
          className="max-w-none text-text leading-relaxed
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-text [&_h2]:mt-6 [&_h2]:mb-3
            [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text--primary [&_h3]:mt-6 [&_h3]:mb-3
            [&_p]:mb-4
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2
            [&_a]:text--primary [&_a]:underline"
        />

        <div className="rounded-lg overflow-hidden border border-border">
          {calendarLoaded ? (
            <iframe
              title="Belegungsplan Hütte"
              src="https://calendar.google.com/calendar/embed?src=goldsteinfreunde%40googlemail.com&ctz=Europe/Berlin"
              className="w-full h-[600px]"
              loading="lazy"
            />
          ) : (
            <div className="min-h-80 bg-green-50 flex items-center justify-center p-6 text-center">
              <div className="max-w-md">
                <h3 className="font-bold text--primary mb-2">Google-Kalender laden</h3>
                <p className="text-sm text-text mb-4">
                  Beim Laden des Kalenders wird eine Verbindung zu Google hergestellt. Dabei können technische Daten wie Ihre IP-Adresse übertragen werden.
                </p>
                <button
                  onClick={() => setCalendarLoaded(true)}
                  className="bg--primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg--primary-dark transition-colors"
                >
                  Kalender anzeigen
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-sm text-text-muted">
          Falls der eingebettete Kalender nicht angezeigt wird, nutzen Sie direkt diesen Link: {" "}
          <a
            href="https://calendar.google.com/calendar/embed?src=goldsteinfreunde%40googlemail.com&ctz=Europe/Berlin"
            target="_blank"
            rel="noopener noreferrer"
            className="text--primary hover:underline"
          >
            Belegungsplan Hütte öffnen
          </a>
          .
        </p>
      </div>
    </div>
  );
}
