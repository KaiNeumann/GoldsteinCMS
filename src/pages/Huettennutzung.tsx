import { useContentFields } from "../context/ContentFields";
import CmsContent from "../components/CmsContent";
import PageLayout from "../components/PageLayout";

export default function Huettennutzung() {
  const { getStringField } = useContentFields();

  return (
    <PageLayout title="Hüttennutzung" subtitle="Belegungsplan und Anfrage zur Nutzung der roten Hütte" contentClassName="text-text leading-relaxed space-y-6">
      <CmsContent
        html={getStringField("pages.huettennutzung.introHtml")}
        className="max-w-none text-text leading-relaxed
          [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-text [&_h2]:mt-6 [&_h2]:mb-3
          [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text--primary [&_h3]:mt-6 [&_h3]:mb-3
          [&_p]:mb-4
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2
          [&_a]:text--primary [&_a]:underline"
      />
    </PageLayout>
  );
}
