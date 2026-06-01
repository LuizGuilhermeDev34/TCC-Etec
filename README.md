# 🗳️ Democratização de Dados

> Plataforma web que reúne e apresenta dados públicos de políticos brasileiros de forma clara e acessível — sem partido, sem agenda.

🔗 **[tcc-etec-alpha.vercel.app](https://tcc-etec-alpha.vercel.app)**

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)

---

## O problema

Os dados sobre políticos brasileiros são públicos por lei — mas os sites oficiais do governo são construídos de forma técnica e fragmentada, tornando essas informações praticamente inacessíveis ao cidadão comum.

- A **API da Câmara** retorna campos técnicos sem explicação (o que é um "REQ"? E um "PROC"?)
- O **TSE** distribui dados de patrimônio em arquivos ZIP com CSVs de centenas de megabytes
- O **Senado** usa XML de outra era

**Complexidade é uma forma de opacidade.** Este projeto foi criado para quebrar essa barreira.

---

## O que você pode fazer aqui

| Funcionalidade | Descrição |
|---|---|
| 👤 **Perfil completo** | Biografia, patrimônio declarado, gastos CEAP, votações e proposições de cada deputado ou senador |
| ⚖️ **Comparar políticos** | Dois deputados lado a lado: proposições, patrimônio, gastos e índice de atividade legislativa |
| 🏛️ **Partidos em detalhe** | Votações por bancada, gastos coletivos, lideranças e popularidade |
| 📋 **Leis e votações** | Proposições em tramitação e votações do plenário em tempo real |
| 📡 **Atividades recentes** | Feed ao vivo com votações e proposições da Câmara, atualizado automaticamente a cada 15 minutos |

### Destaques de UX
- **Glossário integrado** — cada sigla (PL, PEC, MPV, PROC, MSC...) tem tooltip explicando o que significa em linguagem simples
- **Badge de resultado** — votações mostram "Aprovado" ou "Rejeitado" com a sigla do tipo de lei identificada automaticamente
- **Voto procedural** — votações sem projeto de lei vinculado são identificadas e explicadas separadamente

---

## Fontes de dados

| Fonte | Dados utilizados |
|---|---|
| API da Câmara dos Deputados | Lista dos 513 deputados, proposições, votações, gastos CEAP, perfil completo |
| API do Senado Federal | Lista de senadores, votações, fotos individuais |
| TSE — Tribunal Superior Eleitoral | Patrimônio declarado por candidato (eleições 2022), bens por categoria |
| Wikipedia REST API | Biografias resumidas, fotos de perfil, popularidade por pageviews |
| Assembleias Legislativas Estaduais | Deputados estaduais em exercício por UF |

---

## Tecnologias

**Frontend**
- React + TypeScript
- Tailwind CSS
- Framer Motion — animações de transição entre páginas e cards
- React Router DOM — navegação client-side
- Vite — bundler e servidor de desenvolvimento

**Backend**
- Python + FastAPI
- httpx — requisições HTTP assíncronas paralelas para múltiplas APIs simultaneamente
- Pydantic + Pydantic-Settings — validação e modelagem dos dados
- Cache em memória com TTL — respostas cacheadas para reduzir carga nas APIs públicas

**Deploy**
- Frontend: [Vercel](https://vercel.com)
- Backend: [Railway](https://railway.app)
- Keep-alive: UptimeRobot — pinga o backend a cada 5 minutos para evitar sleep no plano gratuito

---

## Decisões técnicas

O principal desafio foi integrar 5 fontes de dados com formatos completamente diferentes — JSON, XML e CSV — e normalizá-los em uma API coerente.

**Requisições assíncronas paralelas** com `httpx` foram essenciais para performance: em vez de chamadas sequenciais às APIs do governo (que têm alta latência), múltiplas requisições são disparadas simultaneamente, reduzindo significativamente o tempo de resposta.

**Cache em dois níveis:** dados estáticos (lista de deputados, partidos) são cacheados por mais tempo; dados dinâmicos (votações recentes, atividades) usam TTL de 2 minutos para manter o feed sempre atualizado sem sobrecarregar as APIs.

**Variáveis de ambiente em build time:** o frontend usa `VITE_API_URL` para apontar para o backend correto em produção, configurada via `src/.env.production` e `vercel.json`.

---

## Como rodar localmente

```bash
# Clone o repositório
git clone https://github.com/LuizGuilhermeDev34/TCC-Etec.git
cd TCC-Etec

# Frontend
npm install
npm run dev

# Backend (em outro terminal)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

O frontend sobe em `http://localhost:5173` e o backend em `http://localhost:8000`.

---

## Autor

**Luiz Guilherme da Silva**
[LinkedIn](https://www.linkedin.com/in/luizguilhermedev/) · [GitHub](https://github.com/LuizGuilhermeDev34)

---

*Projeto de TCC — ETEC, curso Técnico em Informática.*
*Todos os dados exibidos são 100% públicos e oficiais. Nenhuma informação é inventada ou editorializada.*
