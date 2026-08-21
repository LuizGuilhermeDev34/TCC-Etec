import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigationType } from "react-router-dom";
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { PoliticosPage } from "./pages/PoliticosPage";
import { DeputadoProfilePage } from "./pages/DeputadoProfilePage";
import { SenadorProfilePage } from "./pages/SenadorProfilePage";
import { PartidosPage } from "./pages/PartidosPage";
import { PartidoProfilePage } from "./pages/PartidoProfilePage";
import { LeisPage } from "./pages/LeisPage";
import { CompararPage } from "./pages/CompararPage";
import { NotFoundPage } from "./pages/NotFoundPage";

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
          {/* Escopo do TCC é federal (Câmara, Senado, TSE) — estaduais foi
              descartado. DeputadoEstadualProfilePage.tsx e o backend seguem no
              repo (não roteados), caso o grupo retome depois da banca. */}
          <Route path="/politicos/estadual/:id" element={<Navigate to="/politicos" replace />} />
          <Route path="/politicos/senador/:codigo" element={<SenadorProfilePage />} />
          <Route path="/partidos" element={<PartidosPage />} />
          <Route path="/partidos/:id" element={<PartidoProfilePage />} />
          <Route path="/leis" element={<LeisPage />} />
          {/* Atividades foi incorporada em Leis e votos (filtro + HUD + voto por
              partido). Redirect para não quebrar link/print antigo do grupo. */}
          <Route path="/atividades" element={<Navigate to="/leis" replace />} />
          <Route path="/comparar" element={<CompararPage />} />
          <Route path="*" element={<NotFoundPage />} />
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
