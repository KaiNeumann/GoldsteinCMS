import { useContent } from "../../context/ContentContext";

export default function ContactColumn() {
  const { content } = useContent();
  const { siteConfig: cfg } = content;

  return (
    <div>
      <h4 className="font-bold mb-3 text-green-100">Kontakt</h4>
      <div className="text-green-200 text-sm space-y-1">
        <p>{cfg.address.street}</p>
        <p>{cfg.address.zip} {cfg.address.city}</p>
        <p className="mt-2">
          <a href={`mailto:${cfg.email}`} className="hover:text-white transition-colors no-underline text-green-200">
            {cfg.email}
          </a>
        </p>
      </div>
    </div>
  );
}