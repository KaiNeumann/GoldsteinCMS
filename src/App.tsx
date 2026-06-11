import { HashRouter, Routes, Route } from "react-router-dom";
import { ContentProvider } from "./context/ContentContext";
import Layout from "./components/Layout";
import { site } from "./siteConfig";
import { pageRegistry } from "./pageRegistry";
import { initTheme } from "./components/ThemeToggle";

initTheme();

export default function App() {
  return (
    <ContentProvider>
      <HashRouter>
        <Layout>
          <Routes>
            {Object.entries(site.pages).map(([path, { component }]) => {
              const Component = pageRegistry[component];
              return Component ? (
                <Route key={path} path={path} element={<Component />} />
              ) : null;
            })}
            <Route path="*" element={pageRegistry.Home ? <pageRegistry.Home /> : null} />
          </Routes>
        </Layout>
      </HashRouter>
    </ContentProvider>
  );
}
