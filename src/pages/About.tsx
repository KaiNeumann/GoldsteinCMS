import { useLocation } from "react-router-dom";
import CmsContent from "../components/CmsContent";
import PageLayout from "../components/PageLayout";
import { useContentFields } from "../context/ContentFields";
import { site } from "../siteConfig";

export default function About() {
  const { getStringField } = useContentFields();
  const location = useLocation();
  const page = site.pages?.[location.pathname];
  const slug = location.pathname.replace(/^\//, "") || "about";
  const content = getStringField(`pages.${slug}.html`) || getStringField("pages.about.mainHtml");

  return (
    <PageLayout title={page?.title || "Seite"}>
      <CmsContent
        html={content}
        className="max-w-none text-text leading-relaxed mb-8
          [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-text [&_h2]:mt-6 [&_h2]:mb-3
          [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text--primary [&_h3]:mt-6 [&_h3]:mb-3
          [&_p]:mb-4
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2
          [&_li]:text-text
          [&_a]:text--primary [&_a]:underline"
      />
    </PageLayout>
  );
}
