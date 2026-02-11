# Product Dev Tools

Internal toolkit for the product team. Includes Products Parser, Prompts Parser, Prompt Configurator, and **Writing Overseer**.

## Writing Overseer

LLM-powered writing coach with inline feedback on clarity, verbosity, structure, and tone.

### Setup

1. Copy `.env.local.example` to `.env.local`
2. Add `LLM_API_KEY` (and optionally `LLM_BASE_URL`, `LLM_MODEL`) — same as Life/jarvis
3. For local dev with API: run `vercel dev` (installs Vercel CLI if needed). Or use `npm run dev` for frontend-only (API calls will fail locally)

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
