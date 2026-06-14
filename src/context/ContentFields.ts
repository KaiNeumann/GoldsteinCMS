import { useContent } from "./ContentContext";

export function useContentFields() {
  const { content } = useContent();
  const fields = content.fields || {};

  function getField(key: string): unknown {
    return fields[key];
  }

  function getStringField(key: string, fallback = ""): string {
    const v = fields[key];
    if (typeof v === "string") return v;
    return fallback;
  }

  function getListField<T>(key: string, fallback: T[] = []): T[] {
    const v = fields[key];
    if (Array.isArray(v)) return v as T[];
    return fallback;
  }

  function getBooleanField(key: string, fallback = false): boolean {
    const v = fields[key];
    if (typeof v === "boolean") return v;
    return fallback;
  }

  return { content, getField, getStringField, getListField, getBooleanField, fields };
}
