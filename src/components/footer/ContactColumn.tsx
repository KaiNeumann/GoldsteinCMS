import { useContentFields } from "../../context/ContentFields";

export default function ContactColumn() {
  const { getStringField } = useContentFields();
  const street = getStringField("address.street");
  const zip = getStringField("address.zip");
  const city = getStringField("address.city");
  const email = getStringField("contact.email");

  return (
    <div>
      <h4 className="font-bold mb-3 text-green-100">Kontakt</h4>
      <div className="text-green-200 text-sm space-y-1">
        <p>{street}</p>
        <p>{zip} {city}</p>
        <p className="mt-2">
          <a href={`mailto:${email}`} className="hover:text-white transition-colors no-underline text-green-200">
            {email}
          </a>
        </p>
      </div>
    </div>
  );
}
