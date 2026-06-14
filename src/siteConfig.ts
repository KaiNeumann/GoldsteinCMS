import siteJson from "../site.json";
import type { FormsConfig } from "./content/formConfig";
import { defaultFormsConfig } from "./content/formConfig";
import type { ContentSchema } from "./content/contentSchema";

export type NavigationItem = {
  label: string;
  path: string;
  children?: NavigationItem[];
};
export type SidebarWidget = "contact" | "bankAccount" | "quickInfo";
export type FooterColumn = "brand" | "navigation" | "contact" | "socialLinks";
export type HomeBlock = "welcome" | "latestPost" | "olderPosts";

export interface ConsentCategory {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

export interface ConsentService {
  id: string;
  category: string;
  label: string;
  provider: string;
  purpose: string;
  privacyUrl: string;
  hosts: string[];
}

export interface ConsentConfig {
  enabled: boolean;
  version: string;
  privacyPagePath: string;
  categories: ConsentCategory[];
  services: ConsentService[];
}

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
  consent?: ConsentConfig;
  forms?: FormsConfig;
  contentSchema?: ContentSchema;
}

export const site: SiteStructure = {
  ...(siteJson as unknown as SiteStructure),
  forms: {
    ...defaultFormsConfig,
    ...((siteJson as { forms?: Partial<FormsConfig> }).forms || {}),
    contact: {
      ...defaultFormsConfig.contact,
      ...((siteJson as { forms?: Partial<FormsConfig> }).forms?.contact || {}),
    },
    newsletter: {
      ...defaultFormsConfig.newsletter,
      ...((siteJson as { forms?: Partial<FormsConfig> }).forms?.newsletter || {}),
    },
  },
};
