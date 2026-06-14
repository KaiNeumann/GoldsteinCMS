import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useContentFields } from "../context/ContentFields";
import { site, NavigationItem } from "../siteConfig";
import ContactWidget from "./widgets/ContactWidget";
import BankAccountWidget from "./widgets/BankAccountWidget";
import QuickInfoWidget from "./widgets/QuickInfoWidget";
import BrandColumn from "./footer/BrandColumn";
import NavColumn from "./footer/NavColumn";
import ContactColumn from "./footer/ContactColumn";
import SocialLinksColumn from "./footer/SocialLinksColumn";
import ThemeToggle from "./ThemeToggle";

function NavLink({ item, scrollToTop }: { item: NavigationItem; scrollToTop: () => void }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasChildren = item.children && item.children.length > 0;

  useEffect(() => {
    if (!hasChildren) return;
    const el = ref.current;
    if (!el) return;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    el.addEventListener("keydown", handleKeydown);
    return () => el.removeEventListener("keydown", handleKeydown);
  }, [hasChildren]);

  const isActive = location.pathname === item.path;

  if (!hasChildren) {
    return (
      <Link
        to={item.path}
        onClick={scrollToTop}
        className={`px-5 py-3 text-sm font-semibold tracking-wide uppercase transition-colors no-underline ${
          isActive
            ? "bg-white/20 text-white"
            : "text-green-100 hover:bg-white/10 hover:text-white"
        }`}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        className={`px-5 py-3 text-sm font-semibold tracking-wide uppercase transition-colors flex items-center gap-1 ${
          isActive
            ? "bg-white/20 text-white"
            : "text-green-100 hover:bg-white/10 hover:text-white"
        }`}
      >
        {item.label}
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-0.5 min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {item.children!.map((child) => (
            <Link
              key={child.path}
              to={child.path}
              onClick={() => { setOpen(false); scrollToTop(); }}
              className={`block px-4 py-2 text-sm transition-colors no-underline ${
                location.pathname === child.path
                  ? "bg--primary/10 text--primary font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileNavLink({ item, scrollToTop, onNavigate }: { item: NavigationItem; scrollToTop: () => void; onNavigate: () => void }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = location.pathname === item.path;

  if (!hasChildren) {
    return (
      <Link
        to={item.path}
        onClick={() => { onNavigate(); scrollToTop(); }}
        className={`block px-4 py-3 text-sm font-semibold uppercase transition-colors no-underline rounded-lg ${
          isActive
            ? "bg-white/20 text-white"
            : "text-green-100 hover:bg-white/10 hover:text-white"
        }`}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <div className="flex items-center">
        <Link
          to={item.path}
          onClick={() => { onNavigate(); scrollToTop(); }}
          className={`flex-1 px-4 py-3 text-sm font-semibold uppercase transition-colors no-underline rounded-l-lg ${
            isActive
              ? "bg-white/20 text-white"
              : "text-green-100 hover:bg-white/10 hover:text-white"
          }`}
        >
          {item.label}
        </Link>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`px-3 py-3 text-green-100 hover:bg-white/10 transition-colors rounded-r-lg ${
            expanded ? "bg-white/10" : ""
          }`}
          aria-label={expanded ? `${item.label} schließen` : `${item.label} öffnen`}
        >
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="pl-4 space-y-1 mt-1">
          {item.children!.map((child) => (
            <Link
              key={child.path}
              to={child.path}
              onClick={() => { onNavigate(); scrollToTop(); }}
              className={`block px-4 py-2 text-sm transition-colors no-underline rounded-lg ${
                location.pathname === child.path
                  ? "bg-white/20 text-white font-semibold"
                  : "text-green-100/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { getStringField } = useContentFields();
  const siteName = getStringField("site.name");
  const shortName = getStringField("site.shortName");
  const tagline = getStringField("site.tagline");
  const bannerImage = getStringField("site.bannerImage");
  const bannerImageCredit = getStringField("site.bannerImageCredit");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = location.pathname === "/admin";
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const widgetMap: Record<string, React.ComponentType> = {
    contact: ContactWidget,
    bankAccount: BankAccountWidget,
    quickInfo: QuickInfoWidget,
  };

  const footerColumnMap: Record<string, React.ComponentType> = {
    brand: BrandColumn,
    navigation: NavColumn,
    contact: ContactColumn,
    socialLinks: SocialLinksColumn,
  };

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
                  {shortName}
                </h1>
                <p className="text-green-200 text-sm md:text-base opacity-90 mt-0.5">
                  {tagline}
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
              {site.navigation.map((item) => (
                <NavLink key={item.path} item={item} scrollToTop={scrollToTop} />
              ))}
            </div>
            {mobileMenuOpen && (
              <div className="md:hidden py-2 space-y-1">
                {site.navigation.map((item) => (
                  <MobileNavLink
                    key={item.path}
                    item={item}
                    scrollToTop={scrollToTop}
                    onNavigate={() => setMobileMenuOpen(false)}
                  />
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
          {bannerImage ? (
            <div className="absolute inset-0">
              <img src={bannerImage} alt="Goldsteinpark" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"></div>
              {bannerImageCredit && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none z-10">
                  📷 {bannerImageCredit}
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40"></div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-4">
              {!bannerImage && site.hero.showTrees && (
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
                {site.hero.headline}
              </h2>
              <p className="text-green-100 mt-2 text-sm md:text-lg opacity-90 drop-shadow">
                {site.hero.subtitle}
              </p>
            </div>
          </div>
          {!bannerImage && (
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
                  {site.sidebar.map((widgetType) => {
                    const WidgetComponent = widgetMap[widgetType];
                    return WidgetComponent ? <WidgetComponent key={widgetType} /> : null;
                  })}
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
            {site.footer.columns.map((columnType) => {
              const ColumnComponent = footerColumnMap[columnType];
              return ColumnComponent ? <ColumnComponent key={columnType} /> : null;
            })}
          </div>
          <div className="border-t border-white/20 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-green-300 text-xs">
            <p>© {new Date().getFullYear()} {siteName}. Alle Rechte vorbehalten.</p>
            <div className="flex items-center gap-3">
              <span>{site.footer.credit}</span>
              {site.footer.showAdminLink && (
                <Link to="/admin" onClick={scrollToTop} className="text-green-400/60 hover:text-green-300 transition-colors no-underline text-xs">
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
