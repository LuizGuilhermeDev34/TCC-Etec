import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from "react-router-dom";
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { PoliticosPage } from "./pages/PoliticosPage";
import { DeputadoProfilePage } from "./pages/DeputadoProfilePage";
import { DeputadoEstadualProfilePage } from "./pages/DeputadoEstadualProfilePage";
import { SenadorProfilePage } from "./pages/SenadorProfilePage";
import { PartidosPage } from "./pages/PartidosPage";
import { PartidoProfilePage } from "./pages/PartidoProfilePage";
import { LeisPage } from "./pages/LeisPage";
import { AtividadesPage } from "./pages/AtividadesPage";
import { CompararPage } from "./pages/CompararPage";

/**
 * Componente que gerencia rotas com animações de transição
 * Usa AnimatePresence para sincronizar saída/entrada de páginas
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    if (navType !== "POP") window.scrollTo(0, 0);
  }, [pathname, navType]);
  return null;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <Layout>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/politicos" element={<PoliticosPage />} />
          <Route path="/politicos/deputado/:id" element={<DeputadoProfilePage />} />
          <Route path="/politicos/estadual/:id" element={<DeputadoEstadualProfilePage />} />
          <Route path="/politicos/senador/:codigo" element={<SenadorProfilePage />} />
          <Route path="/partidos" element={<PartidosPage />} />
          <Route path="/partidos/:id" element={<PartidoProfilePage />} />
          <Route path="/leis" element={<LeisPage />} />
          <Route path="/atividades" element={<AtividadesPage />} />
          <Route path="/comparar" element={<CompararPage />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

/**
 * Aplicação raiz com roteador
 */
function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
