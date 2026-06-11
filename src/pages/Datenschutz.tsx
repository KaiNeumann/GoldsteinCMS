import { useContent } from "../context/ContentContext";

export default function Datenschutz() {
  const { content } = useContent();
  const { siteConfig: cfg } = content;

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from--primary to--primary-light rounded-t-xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          Datenschutzerklärung
        </h1>
        <p className="text-green-100 mt-2">
          Datenschutzinformationen der Goldsteinfreunde Bad Nauheim e.V.
        </p>
      </div>

      <div
        className="bg-surface-card rounded-b-xl shadow-md p-6 md:p-8 prose prose-green max-w-none text-text leading-relaxed
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-text [&_h2]:mt-6 [&_h2]:mb-3
          [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-text [&_h3]:mt-5 [&_h3]:mb-2
          [&_p]:mb-4
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
          [&_a]:text--primary [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: cfg.pageContent.datenschutzHtml }}
      />
    </div>
  );
}
