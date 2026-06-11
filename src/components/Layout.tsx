import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useContent } from "../context/ContentContext";
import ThemeToggle from "./ThemeToggle";

const navigation = [
  { label: "Startseite", path: "/" },
  { label: "Über uns", path: "/ueber-uns" },
  { label: "Aktivitäten", path: "/aktivitaeten" },
  { label: "Hüttennutzung", path: "/huettennutzung" },
  { label: "Impressum", path: "/impressum" },
  { label: "Datenschutz", path: "/datenschutz" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { content } = useContent();
  const { siteConfig: cfg } = content;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = location.pathname === "/admin";
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-surface-alt">
      {/* Header */}
      <header className="bg-gradient-to-br from--primary-dark via--primary to--primary-dark text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" onClick={scrollToTop} className="flex items-center gap-4 no-underline">
              <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                <img src="/images/goldsteinturm-icon.svg" alt="Goldsteinturm" className="w-9 h-9 text-green-100" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                  {cfg.shortName}
                </h1>
                <p className="text-green-200 text-sm md:text-base opacity-90 mt-0.5">
                  {cfg.tagline}
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Menü öffnen"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation bar */}
        <nav className="bg-black/20 border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4">
            <div className="hidden md:flex gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={scrollToTop}
                  className={`px-5 py-3 text-sm font-semibold tracking-wide uppercase transition-colors no-underline ${
                    location.pathname === item.path
                      ? "bg-white/20 text-white"
                      : "text-green-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {mobileMenuOpen && (
              <div className="md:hidden py-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => { setMobileMenuOpen(false); scrollToTop(); }}
                    className={`block px-4 py-3 text-sm font-semibold uppercase transition-colors no-underline rounded-lg ${
                      location.pathname === item.path
                        ? "bg-white/20 text-white"
                        : "text-green-100 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="px-4 py-2">
                  <ThemeToggle />
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Banner */}
      {location.pathname === "/" && (
        <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden bg-gradient-to-br from--primary to--primary-dark">
          {/* Background image or default gradient */}
          {cfg.bannerImage ? (
            <div className="absolute inset-0">
              <img src={cfg.bannerImage} alt="Goldsteinpark" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"></div>
              {cfg.bannerImageCredit && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none z-10">
                  📷 {cfg.bannerImageCredit}
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40"></div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-4">
              {!cfg.bannerImage && (
                <div className="flex items-center justify-center gap-3 mb-3">
                  <svg viewBox="0 0 100 120" className="w-12 h-16 md:w-16 md:h-20 opacity-30" fill="white">
                    <ellipse cx="50" cy="40" rx="35" ry="40" />
                    <rect x="46" y="75" width="8" height="25" rx="2" />
                  </svg>
                  <svg viewBox="0 0 100 120" className="w-16 h-20 md:w-20 md:h-24 opacity-50" fill="white">
                    <ellipse cx="50" cy="40" rx="38" ry="42" />
                    <rect x="46" y="78" width="8" height="22" rx="2" />
                  </svg>
                  <svg viewBox="0 0 100 120" className="w-12 h-16 md:w-16 md:h-20 opacity-30" fill="white">
                    <ellipse cx="50" cy="40" rx="35" ry="40" />
                    <rect x="46" y="75" width="8" height="25" rx="2" />
                  </svg>
                </div>
              )}
              <h2 className="text-xl md:text-3xl font-bold drop-shadow-lg" style={{ fontFamily: "var(--font-heading)" }}>
                Willkommen im Goldsteinpark
              </h2>
              <p className="text-green-100 mt-2 text-sm md:text-lg opacity-90 drop-shadow">
                Gemeinsam für Natur und Umwelt in Bad Nauheim
              </p>
            </div>
          </div>
          {!cfg.bannerImage && (
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {isAdmin ? (
            <div>{children}</div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 min-w-0">{children}</div>
              <aside className="lg:w-72 flex-shrink-0">
                <div className="space-y-6">
                  {/* Contact Widget */}
                  <div className="bg-surface-card rounded-xl shadow-md overflow-hidden">
                    <div className="bg--primary px-5 py-3">
                      <h3 className="text-white font-bold text-sm uppercase tracking-wider">Kontakt</h3>
                    </div>
                    <div className="p-5 text-sm text-text space-y-3">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text--primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <a href={`mailto:${cfg.email}`} className="text--primary hover:underline break-all">
                          {cfg.email}
                        </a>
                      </div>
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text--primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <div>
                          <a href={`tel:${cfg.phone.replace(/\s/g, '')}`} className="text--primary hover:underline">
                            {cfg.phone}
                          </a>
                          <span className="text-text-muted text-xs block">({cfg.phoneNote})</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text--primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p>{cfg.address.street}</p>
                          <p>{cfg.address.zip} {cfg.address.city}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Account Widget */}
                  <div className="bg-surface-card rounded-xl shadow-md overflow-hidden">
                    <div className="bg--primary px-5 py-3">
                      <h3 className="text-white font-bold text-sm uppercase tracking-wider">Spendenkonto</h3>
                    </div>
                    <div className="p-5 text-sm text-text space-y-1.5">
                      <p className="font-semibold">{cfg.bankAccount.bank}</p>
                      <p>Kto. Nr.: {cfg.bankAccount.accountNumber}</p>
                      <p>BLZ: {cfg.bankAccount.blz}</p>
                      <p className="text-xs text-text-muted mt-2">IBAN: {cfg.bankAccount.iban}</p>
                      <p className="text-xs text-text-muted">BIC: {cfg.bankAccount.bic}</p>
                    </div>
                  </div>

                  {/* Quick Info Widget */}
                  <div className="bg-surface-card rounded-xl shadow-md overflow-hidden">
                    <div className="bg--primary px-5 py-3">
                      <h3 className="text-white font-bold text-sm uppercase tracking-wider">Verein</h3>
                    </div>
                    <div className="p-5 text-sm">
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-text">
                          <span className="w-1.5 h-1.5 bg--primary-light rounded-full flex-shrink-0"></span>
                          Gegründet {cfg.founded}
                        </li>
                        <li className="flex items-center gap-2 text-text">
                          <span className="w-1.5 h-1.5 bg--primary-light rounded-full flex-shrink-0"></span>
                          {cfg.members} Mitglieder
                        </li>
                        <li className="flex items-center gap-2 text-text">
                          <span className="w-1.5 h-1.5 bg--primary-light rounded-full flex-shrink-0"></span>
                          Gemeinnützig anerkannt
                        </li>
                        <li className="flex items-center gap-2 text-text">
                          <span className="w-1.5 h-1.5 bg--primary-light rounded-full flex-shrink-0"></span>
                          {cfg.registry.court}, {cfg.registry.number}
                        </li>
                        <li className="flex items-center gap-2 text-text">
                          <span className="w-1.5 h-1.5 bg--primary-light rounded-full flex-shrink-0"></span>
                          <a
                            href="http://goldsteinfreunde.de/wp-content/uploads/2024/07/Mitgliedsantrag-Goldsteinfreunde-neu2024.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text--primary hover:underline text-sm font-medium"
                          >
                            Mitgliedsantrag (PDF)
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from--primary-dark via--primary to--primary-dark text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                {cfg.shortName}
              </h4>
              <p className="text-green-200 text-sm leading-relaxed">{cfg.tagline}</p>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-green-100">Navigation</h4>
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} onClick={scrollToTop} className="text-green-200 hover:text-white transition-colors text-sm no-underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-green-100">Kontakt</h4>
              <div className="text-green-200 text-sm space-y-1">
                <p>{cfg.address.street}</p>
                <p>{cfg.address.zip} {cfg.address.city}</p>
                <p className="mt-2">
                  <a href={`mailto:${cfg.email}`} className="hover:text-white transition-colors no-underline text-green-200">
                    {cfg.email}
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-green-300 text-xs">
            <p>© {new Date().getFullYear()} {cfg.name}. Alle Rechte vorbehalten.</p>
            <div className="flex items-center gap-3">
              <span>Website &amp; CMS: Kai Uwe Neumann</span>
              <Link to="/admin" onClick={scrollToTop} className="text-green-400/60 hover:text-green-300 transition-colors no-underline text-xs">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
