import { site } from "../../siteConfig";

export default function ConsentServiceSummary() {
  const config = site.consent;
  if (!config || config.services.length === 0) return null;

  const groupedServices = config.categories
    .map((cat) => ({
      ...cat,
      services: config.services.filter((s) => s.category === cat.id),
    }))
    .filter((group) => group.services.length > 0);

  return (
    <div className="space-y-6">
      {groupedServices.map((group) => (
        <div key={group.id}>
          <h3 className="font-semibold text-text mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            {group.label}
          </h3>
          <p className="text-sm text-text-muted mb-3">{group.description}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg">
              <thead className="bg-surface-alt">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-text">Dienst</th>
                  <th className="text-left px-3 py-2 font-semibold text-text">Anbieter</th>
                  <th className="text-left px-3 py-2 font-semibold text-text">Zweck</th>
                  <th className="text-left px-3 py-2 font-semibold text-text">Datenschutz</th>
                </tr>
              </thead>
              <tbody>
                {group.services.map((svc) => (
                  <tr key={svc.id} className="border-t border-border">
                    <td className="px-3 py-2 text-text">{svc.label}</td>
                    <td className="px-3 py-2 text-text-muted">{svc.provider}</td>
                    <td className="px-3 py-2 text-text-muted">{svc.purpose}</td>
                    <td className="px-3 py-2">
                      <a
                        href={svc.privacyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text--primary hover:underline"
                      >
                        Informationen
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
