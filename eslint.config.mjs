import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Launcher desktop (.NET) e artefatti impacchettati — non è codice JS/TS del progetto.
    "launcher/**",
    "dist/**",
    // Progetto nativo Android (Capacitor) — include i bundle JS copiati dall'export Next.js.
    "android/**",
  ]),
]);

export default eslintConfig;
