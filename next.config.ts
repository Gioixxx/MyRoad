import type { NextConfig } from "next";

// Solo il workflow di deploy su GitHub Pages imposta questa variabile — build per l'exe
// desktop (scripts/build-launcher.ps1) e per l'APK Android (npx cap sync) restano root-relative,
// così l'export statico funziona sia servito da un WebView locale sia da una project page
// GitHub sotto /MyRoad/.
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? "/MyRoad" : "";

const nextConfig: NextConfig = {
  // Export statico: il gioco è interamente client-side (nessuna API route/middleware),
  // serve a produrre gli asset per il launcher desktop (vedi launcher/) e per GitHub Pages.
  output: "export",
  ...(isGithubPages ? { basePath, assetPrefix: `${basePath}/` } : {}),
  // Esposto ai componenti client per prefissare i riferimenti hardcoded a public/ (audio,
  // jersey) che basePath/assetPrefix non riscrivono automaticamente — un'unica fonte di verità
  // invece di duplicare "/MyRoad" anche nel workflow di deploy.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
