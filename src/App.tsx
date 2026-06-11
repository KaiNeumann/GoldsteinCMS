import { HashRouter, Routes, Route } from "react-router-dom";
import { ContentProvider } from "./context/ContentContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Activities from "./pages/Activities";
import Huettennutzung from "./pages/Huettennutzung";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <ContentProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ueber-uns" element={<About />} />
            <Route path="/aktivitaeten" element={<Activities />} />
            <Route path="/huettennutzung" element={<Huettennutzung />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/datenschutz" element={<Datenschutz />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>
      </HashRouter>
    </ContentProvider>
  );
}
