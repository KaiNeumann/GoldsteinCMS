import { useContentFields } from "../context/ContentFields";
import CmsContent from "../components/CmsContent";
import PageLayout from "../components/PageLayout";
import { site } from "../siteConfig";
import { useLocation } from "react-router-dom";

export default function Impressum() {
  const { getStringField } = useContentFields();
  const location = useLocation();
  const page = site.pages?.[location.pathname];
  const slug = location.pathname.replace(/^\//, "") || "contact";
  const content = getStringField(`pages.${slug}.html`) || getStringField("pages.impressum.html");

  return (
    <PageLayout title={page?.title || "Impressum"}>
      <CmsContent
        html={content}
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
