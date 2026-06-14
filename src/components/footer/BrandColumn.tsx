import { useContentFields } from "../../context/ContentFields";

export default function BrandColumn() {
  const { getStringField } = useContentFields();
  const shortName = getStringField("site.shortName");
  const tagline = getStringField("site.tagline");

  return (
    <div>
      <h4 className="font-bold text-lg mb-3" style={{ fontFamily: "var(--font-heading)" }}>
        {shortName}
      </h4>
      <p className="text-green-200 text-sm leading-relaxed">{tagline}</p>
    </div>
  );
}
