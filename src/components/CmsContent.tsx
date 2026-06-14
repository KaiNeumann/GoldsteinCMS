import { useEffect, useRef } from "react";
import { enhanceCmsContent, cleanupCmsContent } from "./cms-enhance";
import { renderContent } from "../content/renderContent";
import { useContent } from "../context/ContentContext";

export default function CmsContent({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { content } = useContent();
  const renderedHtml = renderContent(html, content.components || {}, content.images || []);

  useEffect(() => {
    if (ref.current) {
      enhanceCmsContent(ref.current);
    }

    return () => {
      if (ref.current) {
        cleanupCmsContent(ref.current);
      }
    };
  }, [renderedHtml]);

  return (
    <div
      ref={ref}
      className={`prose ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
