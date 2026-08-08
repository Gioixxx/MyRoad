/**
 * Hotlink alle immagini reali del trofeo fisico (TheSportsDB, campo `strTrophy` — distinto dal
 * campo `strBadge` già usato in competition-badges.ts), mai scaricate/salvate nel repo. Stessa
 * chiave pubblica "123", stesse condizioni d'uso "as is" già validate per gli stemmi club. Copre
 * le stesse chiavi di COMPETITION_BADGES tranne dove TheSportsDB non espone un `strTrophy` (vedi
 * TROPHY_KNOWN_GAP) — usata solo nell'overlay celebrativo (MomentOverlay), accanto al badge
 * esistente, non ovunque il badge compare. Vedi .claude/research/team-crests.md per la ricerca.
 */
export const COMPETITION_TROPHIES: Record<string, string> = {
  "Serie A": "https://r2.thesportsdb.com/images/media/league/trophy/83l94y1684416466.png",
  "Serie B": "https://r2.thesportsdb.com/images/media/league/trophy/2xmgql1778366833.png",
  "Coppa Italia": "https://r2.thesportsdb.com/images/media/league/trophy/6pewpq1701383911.png",
  "Premier League": "https://r2.thesportsdb.com/images/media/league/trophy/9a6kw51689108793.png",
  Championship: "https://r2.thesportsdb.com/images/media/league/trophy/dl1l3m1688629871.png",
  "FA Cup": "https://r2.thesportsdb.com/images/media/league/trophy/a7r8r71777395539.png",
  "La Liga": "https://r2.thesportsdb.com/images/media/league/trophy/vc2z6q1684416521.png",
  "LaLiga 2": "https://r2.thesportsdb.com/images/media/league/trophy/nh2xon1709099775.png",
  "Copa del Rey": "https://r2.thesportsdb.com/images/media/league/trophy/skezda1544978155.png",
  "Brasileirão Série A": "https://r2.thesportsdb.com/images/media/league/trophy/02ftjh1684945323.png",
  "Brasileirão Série B": "https://r2.thesportsdb.com/images/media/league/trophy/s6a14o1778446984.png",
  "Copa do Brasil": "https://r2.thesportsdb.com/images/media/league/trophy/jv27c41776553182.png",
  "Champions League": "https://r2.thesportsdb.com/images/media/league/trophy/31y13d1747884950.png",
  "Europa League": "https://r2.thesportsdb.com/images/media/league/trophy/czo8tz1747884321.png",
  "Copa Libertadores": "https://r2.thesportsdb.com/images/media/league/trophy/oev42h1696615691.png",
  Mondiale: "https://r2.thesportsdb.com/images/media/league/trophy/mmyv4f1724782185.png",
  Europei: "https://r2.thesportsdb.com/images/media/league/trophy/zaomgo1549535961.png",
  "Copa América": "https://r2.thesportsdb.com/images/media/league/trophy/9xlcbn1701101277.png",
  "AFC Asian Cup": "https://r2.thesportsdb.com/images/media/league/trophy/9zysg71701099946.png",
  "Africa Cup of Nations": "https://r2.thesportsdb.com/images/media/league/trophy/a02gac1701102618.png",
  "CONCACAF Gold Cup": "https://r2.thesportsdb.com/images/media/league/trophy/efr5us1702273097.png",
  "Primeira Liga": "https://r2.thesportsdb.com/images/media/league/trophy/3v5npc1726462062.png",
  "Taça de Portugal": "https://r2.thesportsdb.com/images/media/league/trophy/vzfp6k1549461835.png",
  "Ligue 1": "https://r2.thesportsdb.com/images/media/league/trophy/ygfgeq1684416349.png",
  "Coupe de France": "https://r2.thesportsdb.com/images/media/league/trophy/ge50231779493990.png",
  Bundesliga: "https://r2.thesportsdb.com/images/media/league/trophy/0o56hs1684416407.png",
  "DFB-Pokal": "https://r2.thesportsdb.com/images/media/league/trophy/ndkh4l1689575720.png",
  Eredivisie: "https://r2.thesportsdb.com/images/media/league/trophy/wx9n831722781060.png",
  "KNVB Beker": "https://r2.thesportsdb.com/images/media/league/trophy/mfvzr81611677287.png",
  "Liga Profesional": "https://r2.thesportsdb.com/images/media/league/trophy/9sj4611777273081.png",
  "Copa Argentina": "https://r2.thesportsdb.com/images/media/league/trophy/qaas1x1735693766.png",
  "Liga MX": "https://r2.thesportsdb.com/images/media/league/trophy/rpqwss1422012934.png",
  MLS: "https://r2.thesportsdb.com/images/media/league/trophy/k50lm81684415987.png",
  "US Open Cup": "https://r2.thesportsdb.com/images/media/league/trophy/8qs1ya1749724650.png",
  "Canadian Premier League": "https://www.thesportsdb.com/images/media/league/trophy/xhb8ae1784004623.png",
  "Canadian Championship": "https://www.thesportsdb.com/images/media/league/trophy/hpmz1l1784004504.png",
  "Botola Pro": "https://r2.thesportsdb.com/images/media/league/trophy/5fjhsc1551439097.png",
  "Ghana Premier League": "https://r2.thesportsdb.com/images/media/league/trophy/5p82xy1758093176.png",
  "Egyptian Premier League": "https://r2.thesportsdb.com/images/media/league/trophy/x34anj1713893913.png",
  "J1 League": "https://r2.thesportsdb.com/images/media/league/trophy/mbbzjn1750168223.png",
  "Emperor's Cup": "https://r2.thesportsdb.com/images/media/league/trophy/mqxhib1751166276.png",
  "K League 1": "https://r2.thesportsdb.com/images/media/league/trophy/y5ah3s1711189638.png",
  "Korea Cup": "https://r2.thesportsdb.com/images/media/league/trophy/p1ewzn1782063303.png",
  "A-League Men": "https://r2.thesportsdb.com/images/media/league/trophy/uxssyx1422266419.png",
  "Australia Cup": "https://r2.thesportsdb.com/images/media/league/trophy/du068i1782340613.png",
  "CONCACAF Champions Cup": "https://r2.thesportsdb.com/images/media/league/trophy/upac7t1780186383.png",
  "CAF Champions League": "https://www.thesportsdb.com/images/media/league/trophy/oimgad1782708694.png",
  "AFC Champions League Elite": "https://r2.thesportsdb.com/images/media/league/trophy/5dzvma1747117869.png",
};

/**
 * Competizioni con badge (COMPETITION_BADGES) ma senza `strTrophy` su TheSportsDB (campo
 * esplicitamente `null` nel payload, non un errore di rete — verificato 2026-08-08), o senza
 * badge affatto (CUP_BADGES_KNOWN_GAP, Serie C) — nessun trofeo reale disponibile per queste
 * chiavi. Usato da competition-trophies.test.ts per non trattarle come regressione.
 */
export const TROPHY_KNOWN_GAP: readonly string[] = [
  "Ligue 1 Sénégalaise",
  "NPFL",
  "Ligue 1 Côte d'Ivoire",
  "Coupe du Trône",
  "Coupe du Sénégal",
  "Nigeria Federation Cup",
  "Ghana FA Cup",
  "Egypt Cup",
  "Coupe de Côte d'Ivoire",
];

export function getCompetitionTrophy(competition: string): string | undefined {
  return COMPETITION_TROPHIES[competition];
}
