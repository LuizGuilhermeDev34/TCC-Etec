import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { path: "/politicos", label: "Políticos" },
  { path: "/partidos", label: "Partidos" },
  { path: "/leis", label: "Leis e votos" },
  { path: "/comparar", label: "Comparar" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // A busca aqui não tinha nenhum efeito — capturava o texto e não fazia
  // nada com ele (achado ao vivo: digitar, apertar Enter, nada acontecia).
  // Busca por nome de político já existe em /politicos (com aba
  // deputados/senadores); reaproveita a mesma chave de sessionStorage que
  // aquela página já lê ao montar, em vez de duplicar a lógica de busca
  // aqui. Busca por assunto/ementa (o que as pessoas realmente perguntam)
  // não existe ainda — fora de escopo desta correção pontual.
  function runSearch() {
    const termo = search.trim();
    if (!termo) return;
    // Deputados são filtrados por UF nessa página (achado relacionado: sem
    // "todos os estados" selecionado, a busca só vasculha o estado salvo da
    // visita anterior e "encontra" zero resultados pra gente de outro
    // estado). Força os dois de volta ao estado amplo antes de navegar.
    sessionStorage.setItem("politicos_query", termo);
    sessionStorage.setItem("politicos_tab", "deputados");
    sessionStorage.setItem("politicos_uf", "");
    navigate("/politicos");
    setSearch("");
    setMobileMenuOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-xs font-bold text-white">DD</span>
            </div>
            <span className="hidden text-sm font-semibold text-slate-900 sm:block">
              Democratização de Dados
            </span>
          </NavLink>

          {/* Tagline */}
          <span className="hidden flex-1 truncate text-center text-xs text-slate-400 lg:block">
            Não se trata de partido. É uma questão de transparência e confiança.
          </span>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "font-bold text-blue-600"
                      : "font-medium text-slate-600 hover:text-blue-500"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Search */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={runSearch}
              aria-label="Buscar político por nome"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>
            <input
              type="search"
              placeholder="Buscar político por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
              className="h-8 w-40 rounded-full border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>

          {/* Mobile button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="ml-auto p-2 text-slate-600 md:hidden"
            aria-label="Menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-slate-100 bg-white px-4 pb-3 md:hidden"
            >
              {navItems.map(({ path, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block py-2 text-sm ${
                      isActive ? "font-bold text-blue-600" : "font-medium text-slate-600"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-slate-400 sm:px-6 lg:px-8">
          <p>
            Dados públicos da Câmara dos Deputados, do Senado Federal e do TSE — sem partido, sem agenda, sem
            informação editorializada.
          </p>
        </div>
      </footer>
    </div>
  );
}
