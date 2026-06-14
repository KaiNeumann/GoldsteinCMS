import siteJson from "../../../site.json";

interface ContentSchemaField {
  key: string;
  type: string;
  itemFields?: ContentSchemaField[];
}

interface ContentSchemaGroup {
  fields?: ContentSchemaField[];
}

export function sanitizeContentData(input: unknown): unknown {
  const data = JSON.parse(JSON.stringify(input)) as {
    posts?: { content?: string }[];
    siteConfig?: { pageContent?: Record<string, string> };
    fields?: Record<string, unknown>;
  };

  if (Array.isArray(data.posts)) {
    data.posts = data.posts.map((post) => ({
      ...post,
      content: sanitizeContentString(post.content || ""),
    }));
  }

  if (data.siteConfig?.pageContent) {
    data.siteConfig.pageContent = Object.fromEntries(
      Object.entries(data.siteConfig.pageContent).map(([key, value]) => [key, sanitizeContentString(value || "")])
    );
  }

  if (data.fields) {
    const htmlKeys = collectHtmlFieldKeys();
    for (const key of Object.keys(data.fields)) {
      if (typeof data.fields[key] === "string") {
        if (htmlKeys.has(key) || isHtmlFieldKey(key)) {
          data.fields[key] = sanitizeContentString(data.fields[key] as string);
        }
      }
    }
  }

  return data;
}

function sanitizeContentString(value: string): string {
  return escapeAuthoredHtml(sanitizeMarkdownUrls(value));
}

function sanitizeMarkdownUrls(value: string): string {
  return value.replace(/\]\(\s*(javascript:|data:)[^)]+\)/gi, "](unsafe-url-removed)");
}

function collectHtmlFieldKeys(): Set<string> {
  const groups = (siteJson as { contentSchema?: { groups?: ContentSchemaGroup[] } }).contentSchema?.groups || [];
  const keys = new Set<string>();

  function visit(fields: ContentSchemaField[] | undefined) {
    for (const field of fields || []) {
      if (field.type === "html") keys.add(field.key);
      visit(field.itemFields);
    }
  }

  for (const group of groups) visit(group.fields);
  return keys;
}

function isHtmlFieldKey(key: string): boolean {
  return key.endsWith(".html") || key.endsWith("Html");
}

function escapeAuthoredHtml(value: string): string {
  return value.replace(/<\/?[a-zA-Z][^>]*>/g, (tag) => tag.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
}
