import { useContentFields } from "../../context/ContentFields";

export default function ContactWidget() {
  const { getStringField } = useContentFields();
  const email = getStringField("contact.email");
  const phone = getStringField("contact.phone");
  const phoneNote = getStringField("contact.phoneNote");
  const street = getStringField("address.street");
  const zip = getStringField("address.zip");
  const city = getStringField("address.city");

  return (
    <div className="bg-surface-card rounded-xl shadow-md overflow-hidden">
      <div className="bg--primary px-5 py-3">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Kontakt</h3>
      </div>
      <div className="p-5 text-sm text-text space-y-3">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text--primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <a href={`mailto:${email}`} className="text--primary hover:underline break-all">
            {email}
          </a>
        </div>
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text--primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <div>
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="text--primary hover:underline">
              {phone}
            </a>
            <span className="text-text-muted text-xs block">({phoneNote})</span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text--primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <p>{street}</p>
            <p>{zip} {city}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
