import Home from "./pages/Home";
import About from "./pages/About";
import Activities from "./pages/Activities";
import Huettennutzung from "./pages/Huettennutzung";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import Admin from "./pages/Admin";

export const pageRegistry: Record<string, React.ComponentType> = {
  Home,
  About,
  Activities,
  Huettennutzung,
  Impressum,
  Datenschutz,
  Admin,
};
