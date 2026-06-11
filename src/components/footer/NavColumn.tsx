import { Link } from "react-router-dom";
import { site } from "../../siteConfig";

export default function NavColumn() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div>
      <h4 className="font-bold mb-3 text-green-100">Navigation</h4>
      <ul className="space-y-2">
        {site.navigation.map((item) => (
          <li key={item.path}>
            <Link to={item.path} onClick={scrollToTop} className="text-green-200 hover:text-white transition-colors text-sm no-underline">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}