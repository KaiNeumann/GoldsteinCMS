import siteJson from "../site.json";

export type NavigationItem = {
  label: string;
  path: string;
  children?: NavigationItem[];
};
export type SidebarWidget = "contact" | "bankAccount" | "quickInfo";
export type FooterColumn = "brand" | "navigation" | "contact";
export type HomeBlock = "welcome" | "latestPost" | "olderPosts";

export interface SiteStructure {
  navigation: NavigationItem[];
  sidebar: SidebarWidget[];
  footer: {
    columns: FooterColumn[];
    credit: string;
    showAdminLink: boolean;
  };
  homeBlocks: HomeBlock[];
  hero: {
    headline: string;
    subtitle: string;
    showTrees: boolean;
  };
  pages: Record<string, { component: string; title: string }>;
}

export const site = siteJson as SiteStructure;
