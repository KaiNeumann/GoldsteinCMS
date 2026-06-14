import { useContent } from "../context/ContentContext";
import { useContentFields } from "../context/ContentFields";

type SocialVariant = "icons" | "list" | "cards";

interface SocialLink {
  platform: string;
  label?: string;
  url: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  facebook: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  pinterest: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/></svg>`,
  mastodon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 00.023-.043v-1.809a.052.052 0 00-.02-.041.053.053 0 00-.046-.01 20.282 20.282 0 01-4.709.547c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 01-.319-1.433.053.053 0 01.066-.054 19.648 19.648 0 004.637.536c.395 0 .79-.008 1.18-.025 2.28-.115 4.645-.56 4.962-.629.015-.001.03-.001.045-.001.305 0 3.264.07 5.185-.448.089-.024.18-.043.262-.07.253-.082.508-.165.756-.258.246-.092.556-.22.849-.433a.057.057 0 00.014-.034v-.574c0-.143.025-.28.073-.408.054-.145.152-.26.277-.34.096-.064.206-.116.324-.15.118-.035.243-.057.369-.065l.009-.001c1.137-.074 2.344-.146 3.44-.445 2.392-.654 4.597-2.078 5.02-7.185.001-.014.001-.028.001-.042 0-.034-.001-.067-.003-.1.001-.034.001-.067.001-.1z"/></svg>`,
  website: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
};

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  mastodon: "Mastodon",
  website: "Website",
};

function getSocialLinks(content: any): SocialLink[] {
  const raw = content?.fields?.["social.links"];
  if (Array.isArray(raw)) {
    return raw.filter(
      (l: any) => l && typeof l.url === "string" && typeof l.platform === "string"
    );
  }
  return [];
}

function validateHttps(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizePlatform(p: string): string {
  const lower = p.toLowerCase().trim();
  if (lower === "x" || lower === "twitter" || lower === "twitter/x") return "website";
  return lower;
}

function getIcon(platform: string): string {
  return PLATFORM_ICONS[platform] || PLATFORM_ICONS.website;
}

function getLabel(link: SocialLink): string {
  if (link.label) return link.label;
  return PLATFORM_LABELS[link.platform] || link.platform;
}

function getAriaLabel(link: SocialLink, siteName: string): string {
  const label = getLabel(link);
  return `${siteName} auf ${label} öffnen`;
}

function SocialLinkItem({
  link,
  siteName,
  variant,
}: {
  link: SocialLink;
  siteName: string;
  variant: SocialVariant;
}) {
  const platform = normalizePlatform(link.platform);
  const label = getLabel(link);
  const ariaLabel = getAriaLabel(link, siteName);
  const icon = getIcon(platform);

  if (!validateHttps(link.url)) return null;

  if (variant === "icons") {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        title={label}
      >
        <span className="w-5 h-5" dangerouslySetInnerHTML={{ __html: icon }} />
      </a>
    );
  }

  if (variant === "list") {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className="inline-flex items-center gap-2 text-green-200 hover:text-white text-sm transition-colors no-underline"
      >
        <span className="w-4 h-4 flex-shrink-0" dangerouslySetInnerHTML={{ __html: icon }} />
        <span>{label}</span>
      </a>
    );
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="flex flex-col items-center p-4 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors text-center no-underline"
    >
      <span className="w-8 h-8 mb-2" dangerouslySetInnerHTML={{ __html: icon }} />
      <span className="text-sm font-semibold">{label}</span>
    </a>
  );
}

export default function SocialLinks({ variant = "icons" }: { variant?: SocialVariant }) {
  const { content } = useContent();
  const { getStringField } = useContentFields();
  const links = getSocialLinks(content);
  const siteName = getStringField("site.name", getStringField("site.shortName", "Uns"));

  if (links.length === 0) return null;

  if (variant === "cards") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {links.map((link) => (
          <SocialLinkItem key={link.platform} link={link} siteName={siteName} variant={variant} />
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="flex flex-wrap gap-4">
        {links.map((link) => (
          <SocialLinkItem key={link.platform} link={link} siteName={siteName} variant={variant} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {links.map((link) => (
        <SocialLinkItem key={link.platform} link={link} siteName={siteName} variant={variant} />
      ))}
    </div>
  );
}
