import { useState } from "react";
import { NavLink } from "react-router-dom";
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
            <svg
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="search"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
    </div>
  );
}
