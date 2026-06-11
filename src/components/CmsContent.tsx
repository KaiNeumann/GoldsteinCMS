import { useEffect, useRef } from "react";
import { enhanceCmsContent } from "./cms-enhance";

export default function CmsContent({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      enhanceCmsContent(ref.current);
    }
  }, [html]);

  return (
    <div
      ref={ref}
      className={`prose ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
