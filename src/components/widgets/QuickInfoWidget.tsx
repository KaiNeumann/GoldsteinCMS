import { useContent } from "../../context/ContentContext";

export default function QuickInfoWidget() {
  const { content } = useContent();
  const { siteConfig: cfg } = content;

  return (
    <div className="bg-surface-card rounded-xl shadow-md overflow-hidden">
      <div className="bg--primary px-5 py-3">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Verein</h3>
      </div>
      <div className="p-5 text-sm">
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-text">
            <span className="w-1.5 h-1.5 bg--primary-light rounded-full flex-shrink-0"></span>
            Gegründet {cfg.founded}
          </li>
          <li className="flex items-center gap-2 text-text">
            <span className="w-1.5 h-1.5 bg--primary-light rounded-full flex-shrink-0"></span>
            {cfg.members} Mitglieder
          </li>
          <li className="flex items-center gap-2 text-text">
            <span className="w-1.5 h-1.5 bg--primary-light rounded-full flex-shrink-0"></span>
            Gemeinnützig anerkannt
          </li>
          <li className="flex items-center gap-2 text-text">
            <span className="w-1.5 h-1.5 bg--primary-light rounded-full flex-shrink-0"></span>
            {cfg.registry.court}, {cfg.registry.number}
          </li>
          <li className="flex items-center gap-2 text-text">
            <span className="w-1.5 h-1.5 bg--primary-light rounded-full flex-shrink-0"></span>
            <a
              href="http://goldsteinfreunde.de/wp-content/uploads/2024/07/Mitgliedsantrag-Goldsteinfreunde-neu2024.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text--primary hover:underline text-sm font-medium"
            >
              Mitgliedsantrag (PDF)
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}