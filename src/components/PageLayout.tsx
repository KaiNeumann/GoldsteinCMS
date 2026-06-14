import type { ReactNode } from "react";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  contentClassName?: string;
}

export default function PageLayout({ title, subtitle, children, contentClassName = "" }: PageLayoutProps) {
  return (
    <div>
      <div className="bg-gradient-to-r from--primary to--primary-light rounded-t-xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          {title}
        </h1>
        {subtitle && <p className="text-green-100 mt-2">{subtitle}</p>}
      </div>

      <div className={`bg-surface-card rounded-b-xl shadow-md p-6 md:p-8 ${contentClassName}`.trim()}>
        {children}
      </div>
    </div>
  );
}
