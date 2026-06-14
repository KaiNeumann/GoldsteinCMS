export type ContentFieldType =
  | "text"
  | "textarea"
  | "html"
  | "email"
  | "tel"
  | "url"
  | "image"
  | "boolean"
  | "select"
  | "list";

export interface ContentSchemaField {
  key: string;
  label: string;
  type: ContentFieldType;
  required?: boolean;
  rows?: number;
  options?: { label: string; value: string }[];
  itemFields?: ContentSchemaField[];
  helpText?: string;
}

export interface ContentSchemaGroup {
  id: string;
  label: string;
  fields: ContentSchemaField[];
}

export interface ContentSchema {
  groups: ContentSchemaGroup[];
}
