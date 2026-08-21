import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "../components/PageTransition";

export function NotFoundPage() {
  return (
    <PageTransition direction="up">
      <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <p className="text-6xl font-extrabold text-slate-200">404</p>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Página não encontrada</h1>
          <p className="mt-2 text-sm text-slate-500">
            O endereço que você acessou não existe neste site.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Voltar para a página inicial
          </Link>
        </motion.div>
      </main>
    </PageTransition>
  );
}
