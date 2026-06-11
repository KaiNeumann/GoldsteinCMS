import { useContent } from "../../context/ContentContext";

export default function BrandColumn() {
  const { content } = useContent();
  const { siteConfig: cfg } = content;

  return (
    <div>
      <h4 className="font-bold text-lg mb-3" style={{ fontFamily: "var(--font-heading)" }}>
        {cfg.shortName}
      </h4>
      <p className="text-green-200 text-sm leading-relaxed">{cfg.tagline}</p>
    </div>
  );
}