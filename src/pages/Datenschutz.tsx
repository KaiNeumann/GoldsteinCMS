import { useContentFields } from "../context/ContentFields";
import CmsContent from "../components/CmsContent";
import PageLayout from "../components/PageLayout";

export default function Datenschutz() {
  const { getStringField } = useContentFields();

  return (
    <PageLayout title="Datenschutzerklärung" subtitle="Datenschutzinformationen der Goldsteinfreunde Bad Nauheim e.V.">
      <CmsContent
        html={getStringField("pages.datenschutz.html")}
        className="max-w-none text-text leading-relaxed
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-text [&_h2]:mt-6 [&_h2]:mb-3
          [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-text [&_h3]:mt-5 [&_h3]:mb-2
          [&_p]:mb-4
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
          [&_a]:text--primary [&_a]:underline"
      />
    </PageLayout>
  );
}
