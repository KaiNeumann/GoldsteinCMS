import { useContent } from "../context/ContentContext";
import { formatDate } from "../content/defaultContent";
import { Link } from "react-router-dom";
import { site } from "../siteConfig";
import CmsContent from "../components/CmsContent";

export default function Home() {
  const { content } = useContent();
  const latestPost = content.posts[0];

  const WelcomeBlock = () => (
    <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg--primary rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <CmsContent
            html={content.siteConfig.pageContent.homeWelcomeHtml}
            className="prose-green max-w-none text-sm text-text leading-relaxed
              [&_h3]:font-bold [&_h3]:text--primary [&_h3]:mb-1
              [&_p]:mb-3 [&_p:last-child]:mb-0
              [&_a]:text--primary [&_a]:underline [&_a]:hover:text--primary-dark
              [&_strong]:text-text"
          />
          <Link
            to="/ueber-uns"
            className="inline-flex items-center gap-1 text-sm text--primary font-semibold hover:text--primary-dark mt-2 no-underline"
          >
            Mehr über uns erfahren
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );

  const LatestPostBlock = () => {
    if (!latestPost) {
      return (
        <div className="bg-surface-card rounded-xl shadow-md p-8 text-center text-text-muted">
          <p className="text-lg">Noch keine Beiträge vorhanden.</p>
          <p className="text-sm mt-2">Besuchen Sie den Admin-Bereich, um den ersten Beitrag zu erstellen.</p>
          <Link to="/admin" className="inline-block mt-4 text--primary font-semibold hover:underline">
            Zum Admin-Bereich →
          </Link>
        </div>
      );
    }
    return (
      <article className="bg-surface-card rounded-xl shadow-md overflow-hidden mb-8">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 text-sm text-text-muted mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <time>{formatDate(latestPost.date)}</time>
            <span className="text-border">|</span>
            <span>von {latestPost.author}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-text mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            {latestPost.title}
          </h2>
          <CmsContent
            html={latestPost.content}
            className="prose-green max-w-none text-text leading-relaxed
              [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text--primary [&_h3]:mt-6 [&_h3]:mb-3
              [&_p]:mb-4
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1
              [&_a]:text--primary [&_a]:underline [&_a]:hover:text--primary-dark
              [&_strong]:text-text"
          />
        </div>
      </article>
    );
  };

  const OlderPostsBlock = () => {
    if (content.posts.length <= 1) return null;
    return (
      <div className="bg-surface-card rounded-xl shadow-md overflow-hidden">
        <div className="bg--primary px-6 py-3">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Weitere Beiträge</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {content.posts.slice(1).map((post) => (
            <Link
              key={post.id}
              to={`/aktivitaeten?post=${post.id}`}
              className="block px-6 py-4 hover:bg-green-50 transition-colors no-underline"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-text hover:text--primary transition-colors">
                    {post.title}
                  </h4>
                  <p className="text-sm text-text-muted mt-1">
                    {formatDate(post.date)} · {post.author}
                  </p>
                </div>
                <svg className="w-5 h-5 text-text-muted flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  const homeBlockMap: Record<string, React.ComponentType> = {
    welcome: WelcomeBlock,
    latestPost: LatestPostBlock,
    olderPosts: OlderPostsBlock,
  };

  return (
    <div>
      {site.homeBlocks.map((block) => {
        const Component = homeBlockMap[block];
        return Component ? <Component key={block} /> : null;
      })}
    </div>
  );
}
