export interface Post {
  id: string;
  date: string;
  author: string;
  title: string;
  content: string;
}

export interface SiteImage {
  id: string;
  name: string;
  dataUrl: string;
  copyright: string;
  createdAt: string;
}

export type CmsComponentType =
  | "gallery"
  | "slider"
  | "collapsible"
  | "accordion"
  | "callout"
  | "table"
  | "youtubeEmbed"
  | "pdfEmbed"
  | "cardGrid"
  | "steps"
  | "socialLinks"
  | "contactForm"
  | "newsletterSignup";

export interface CmsComponent {
  id: string;
  type: CmsComponentType;
  label?: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  email: string;
  phone: string;
  phoneNote: string;
  phoneLandline: string;
  address: { street: string; zip: string; city: string };
  bankAccount: { bank: string; accountNumber: string; blz: string; iban: string; bic: string };
  registry: { court: string; number: string };
  responsibleContent: { name: string; street: string; zip: string; city: string };
  founded: string;
  members: string;
  bannerImage: string;
  bannerImageCredit: string;
  pageContent: {
    homeWelcomeHtml: string;
    aboutMainHtml: string;
    huettennutzungIntroHtml: string;
    impressumHtml: string;
    datenschutzHtml: string;
  };
}

export interface ContentData {
  posts: Post[];
  siteConfig: SiteConfig;
  images: SiteImage[];
  fields?: Record<string, unknown>;
  components?: Record<string, CmsComponent>;
}

export const defaultContent: ContentData = {
  posts: [
    {
      id: "lovewall-1",
      date: "2026-01-15",
      author: "Nacho Martínez Rincón",
      title: "Data Scientist Advocate at Oracle",
      content: "The OpenHands SDK is one of the most complete SDKs for agent harness and agentic AI development - including enabling vibecoding with opensource models. Great reliability for tool calling through the Tool System - very dev friendly!"
    },
    {
      id: "lovewall-2",
      date: "2026-01-14",
      author: "Dan Kempe",
      title: "@danielkempe",
      content: "OpenHands raised $18.8M to build cloud coding agents that solve 87% of bug tickets same day. This is what AI coding tools should be. Not another chat interface. Actual autonomous problem solving that ships to production."
    },
    {
      id: "lovewall-3",
      date: "2026-01-13",
      author: "Esteban Puerta",
      title: "@Esteban_Puerta9",
      content: "At this point, there isn't much of a need to roll your own especially when claude code SDK and openhands sdk are offering nice API's to utilize them. This is where it gets interesting."
    },
    {
      id: "lovewall-4",
      date: "2026-01-12",
      author: "Fisherman",
      title: "@Rybens92",
      content: "Your agents are so underrated, but even though there are many benchmarks, which are testing agentic coding and are using your work as reference - OpenHands agent with tested model... I just don't get why everybody is so silent about your work... Reposting till people wake up."
    },
    {
      id: "lovewall-5",
      date: "2026-01-11",
      author: "Jingyi Zhao",
      title: "Software Engineer at Walmart Global Tech",
      content: "I love this project because it is the first of its kind in coding agent space and you have the freedom to configure your own way. It also integrates well with various ecosystems. I believe this project can go long!"
    },
    {
      id: "lovewall-6",
      date: "2026-01-10",
      author: "Leonardo Gonzalez",
      title: "@archimagos",
      content: "I love using autonomous agents like OpenHands for 80% of the work (esp. backend), and then an interactive IDE like Windsurf or Zed for debugging, refinement, and UI work. It saves tons of my time and saves a lot of money too with the right models/plans."
    },
    {
      id: "lovewall-7",
      date: "2026-01-09",
      author: "Wil - e/acc",
      title: "@wilfullyapt",
      content: "I fvkn love vibe coding with OpenHands. It's not like your editor is doing things for you, it's like an idiot internal that literally knows all the book stuff. OpenHands commit, my tweaks, rinse and repeat. Phenomenal!!"
    },
    {
      id: "lovewall-8",
      date: "2026-01-08",
      author: "Christian Genco",
      title: "@cgenco",
      content: "I haven't tried Devin yet but I freakin' love OpenHands. I prefer having more control over how it's working. Also that general workflow is the future. Just opening GitHub issues and the AI figures it out and writes tests and then pushes a PR is magical."
    }
  ],

  siteConfig: {
    name: "OpenHands",
    shortName: "OpenHands",
    tagline: "AI coding agents that ship to production",
    email: "hello@openhands.dev",
    phone: "",
    phoneNote: "",
    phoneLandline: "",
    address: { street: "", zip: "", city: "" },
    bankAccount: {
      bank: "",
      accountNumber: "",
      blz: "",
      iban: "",
      bic: "",
    },
    registry: { court: "", number: "" },
    responsibleContent: {
      name: "OpenHands Team",
      street: "",
      zip: "",
      city: "",
    },
    founded: "2024",
    members: "Open Source Community",
    bannerImage: "",
    bannerImageCredit: "",
    pageContent: {
      homeWelcomeHtml: `<h2>Autonomous AI Agents for Software Development</h2>
<p>OpenHands is an AI agent platform that executes real engineering work. Instead of just suggesting code, our agents complete entire tasks—from understanding requirements to shipping changes.</p>
<h3>Key Features</h3>
<ul>
<li><strong>End-to-End Task Completion</strong> - Agents that handle entire engineering tasks, not just code snippets</li>
<li><strong>Large Codebase Support</strong> - Map dependencies and orchestrate changes across complex codebases</li>
<li><strong>Parallel Execution</strong> - Multiple agents working together safely</li>
<li><strong>Open Source Foundation</strong> - Built on open source principles for transparency and control</li>
</ul>`,
      aboutMainHtml: `<h2>About OpenHands</h2>
<p>OpenHands is building the open standard for autonomous software development. Our platform empowers every software team to build faster with full control, security, and transparency.</p>
<h3>Our Mission</h3>
<p>We believe AI coding agents should be secure, transparent, and model-agnostic. OpenHands runs in your environment—whether on-prem or private cloud—so your code never leaves your control.</p>`,
      huettennutzungIntroHtml: "",
      impressumHtml: `<h2>Contact</h2>
<p>OpenHands<br/>hello@openhands.dev</p>
<h2>Legal</h2>
<p>OpenHands is an open source project. For licensing and contribution information, please visit our GitHub repository.</p>`,
      datenschutzHtml: `<p>OpenHands respects your privacy. This is a demonstration site built with GoldsteinCMS.</p>`,
    },
  },
  images: [],
  components: {},
  fields: {
    "pages.product.html": "## Product\n\nDescribe the product here.",
    "pages.enterprise.html": "## Enterprise\n\nDescribe enterprise options here.",
    "pages.pricing.html": "## Pricing\n\nDescribe pricing here.",
    "pages.about.html": "## About\n\nDescribe the organization here.",
    "pages.contact.html": "## Contact\n\nhello@openhands.dev",
    "social.links": [
      { "platform": "github", "url": "https://github.com/OpenHands/OpenHands" },
      { "platform": "twitter", "url": "https://x.com/OpenHandsDev" },
      { "platform": "slack", "url": "/joinslack" }
    ]
  },
};

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
