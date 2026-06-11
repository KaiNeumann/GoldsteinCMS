import { useState } from "react";
import { useContent } from "../context/ContentContext";
import CmsContent from "../components/CmsContent";

export default function About() {
  const { content } = useContent();
  const { siteConfig: cfg } = content;
  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <div>
      <div className="bg-gradient-to-r from--primary to--primary-light rounded-t-xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          Über uns
        </h1>
        <p className="text-green-100 mt-2">Lernen Sie die Goldsteinfreunde kennen</p>
      </div>

      <div className="bg-surface-card rounded-b-xl shadow-md p-6 md:p-8">
        <CmsContent
          html={cfg.pageContent.aboutMainHtml}
          className="max-w-none text-text leading-relaxed mb-8
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-text [&_h2]:mt-6 [&_h2]:mb-3
            [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text--primary [&_h3]:mt-6 [&_h3]:mb-3
            [&_p]:mb-4
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2
            [&_li]:text-text
            [&_a]:text--primary [&_a]:underline"
        />

        <div className="mb-8 rounded-lg overflow-hidden border border-border h-52 md:h-72 relative group">
          <img
            src={cfg.aboutImage || "/images/about-goldsteinpark.jpg"}
            alt="Goldsteinpark Bad Nauheim"
            className="w-full h-full object-cover"
            style={{ objectPosition: "50% 62%" }}
          />
          {cfg.aboutImageCredit && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none z-10">
              📷 {cfg.aboutImageCredit}
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
            <div className="w-1 h-8 bg--primary rounded-full"></div>
            Vorstand
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cfg.board.map((member, i) => (
              <div key={i} className="flex items-center gap-3 bg-surface-card border border-border rounded-lg p-3">
                <div className="w-10 h-10 bg--primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {member.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-text text-sm">{member.name}</p>
                  {member.role && <p className="text-xs text-text-muted">{member.role}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg overflow-hidden border border-border">
          {mapLoaded ? (
            <iframe
              title="Karte Goldsteinpark"
              src="https://www.openstreetmap.org/export/embed.html?bbox=8.7499%2C50.3700%2C8.7525%2C50.3713&layer=mapnik&marker=50.370689%2C8.751141"
              className="w-full h-64"
              loading="lazy"
            />
          ) : (
            <div className="h-64 bg-green-50 flex items-center justify-center p-6 text-center">
              <div className="max-w-md">
                <h3 className="font-bold text--primary mb-2">OpenStreetMap-Karte laden</h3>
                <p className="text-sm text-text mb-4">
                  Beim Laden der Karte wird eine Verbindung zu OpenStreetMap hergestellt. Dabei können technische Daten wie Ihre IP-Adresse übertragen werden.
                </p>
                <button
                  onClick={() => setMapLoaded(true)}
                  className="bg--primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg--primary-dark transition-colors"
                >
                  Karte anzeigen
                </button>
              </div>
            </div>
          )}
          <div className="bg-surface-alt px-3 py-2 text-xs text-text">
            <a
              href="https://www.openstreetmap.org/#map=18/50.370689/8.751141"
              target="_blank"
              rel="noopener noreferrer"
              className="text--primary hover:underline"
            >
              Größere Karte in OpenStreetMap öffnen →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
