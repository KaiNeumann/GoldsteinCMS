import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faAngleRight, faAnglesLeft, faAnglesRight, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useContent } from "../context/ContentContext";
import { formatDate } from "../content/defaultContent";

const POSTS_PER_PAGE = 10;
const ALWAYS_SHOW_PAGINATION = true;

export default function Activities() {
  const { content } = useContent();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(content.posts.length / POSTS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const visiblePosts = content.posts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const postId = query.get("post");
    if (postId) {
      const postIndex = content.posts.findIndex((p) => p.id === postId);
      if (postIndex !== -1) {
        const targetPage = Math.floor(postIndex / POSTS_PER_PAGE) + 1;
        setPage(targetPage);

        const timer = setTimeout(() => {
          const element = document.getElementById(`post-${postId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [location.search, content.posts]);

  return (
    <div>
      <div className="bg-gradient-to-r from-[#2d6a1e] to-[#4a8c34] rounded-t-xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
          Aktivitäten & Beiträge
        </h1>
        <p className="text-green-100 mt-2">Neuigkeiten und Termine der Goldsteinfreunde</p>
      </div>

      <div className="bg-white rounded-b-xl shadow-md">
        {content.posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg">Noch keine Beiträge vorhanden.</p>
          </div>
        ) : (
          visiblePosts.map((post, index) => (
            <article
              key={post.id}
              id={`post-${post.id}`}
              className={`p-6 md:p-8 ${index < visiblePosts.length - 1 ? "border-b-2 border-gray-300 mb-6" : ""}`}
            >
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <time>{formatDate(post.date)}</time>
                <span className="text-gray-300">|</span>
                <span>von {post.author}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                {post.title}
              </h2>
              <div
                className="prose prose-green max-w-none text-gray-700 leading-relaxed
                  [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[#2d6a1e] [&_h3]:mt-6 [&_h3]:mb-3
                  [&_p]:mb-4
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1
                  [&_a]:text-[#2d6a1e] [&_a]:underline [&_a]:hover:text-[#1a4d0f]
                  [&_strong]:text-gray-900"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="mt-4 text-sm text-gray-500 hover:text-[#2d6a1e] transition-colors flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faArrowUp} className="w-3 h-3" />
                Nach oben
              </button>
            </article>
          ))
        )}
        {content.posts.length > 0 && (ALWAYS_SHOW_PAGINATION || totalPages > 1) && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 md:px-8 py-5 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <p className="text-sm text-gray-500">
              Seite {currentPage} von {totalPages} · {content.posts.length} Beiträge
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="w-8 h-8 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Erste Seite"
              >
                <FontAwesomeIcon icon={faAnglesLeft} />
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Vorherige Seite"
              >
                <FontAwesomeIcon icon={faAngleLeft} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => goToPage(pageNumber)}
                  className={`w-8 h-8 text-sm rounded-lg border transition-colors ${pageNumber === currentPage ? "bg-[#2d6a1e] border-[#2d6a1e] text-white" : "border-gray-300 text-gray-700 hover:bg-white"}`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Nächste Seite"
              >
                <FontAwesomeIcon icon={faAngleRight} />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Letzte Seite"
              >
                <FontAwesomeIcon icon={faAnglesRight} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
