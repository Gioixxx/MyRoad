import type { Club } from "@/types/career";
import type { Confederation } from "@/data/countries";

export interface League {
  id: string;
  name: string;
  country: string;
  /** 1 = massima divisione, 2 = seconda, 3 = terza. */
  tier: number;
  confederation: Confederation;
  /** undefined se il paese non ha (più) una coppa nazionale attiva (es. Messico, Copa MX sospesa). */
  cup?: string;
}

/** Nome reale della coppa continentale per confederazione — assegnata ai club di tier 1. */
export const CONTINENTAL_CUP: Record<Confederation, string> = {
  UEFA: "Champions League",
  CONMEBOL: "Copa Libertadores",
  CONCACAF: "CONCACAF Champions Cup",
  CAF: "CAF Champions League",
  AFC: "AFC Champions League Elite",
};

const UEFA_EUROPA_LEAGUE = "Europa League";
/** Prestige minimo per la Champions League — sotto questa soglia i club UEFA giocano l'Europa League. */
const UEFA_CHAMPIONS_LEAGUE_PRESTIGE_THRESHOLD = 2;

/** Coppa continentale per un club di tier 1: UEFA distingue Champions/Europa League in base al prestige. */
export function continentalCompetition(league: League, prestige: Club["prestige"]): string | undefined {
  if (league.tier !== 1) return undefined;
  if (league.confederation === "UEFA") {
    return prestige >= UEFA_CHAMPIONS_LEAGUE_PRESTIGE_THRESHOLD
      ? CONTINENTAL_CUP.UEFA
      : UEFA_EUROPA_LEAGUE;
  }
  return CONTINENTAL_CUP[league.confederation];
}

export const leagues: League[] = [
  { id: "ita-serie-a", name: "Serie A", country: "Italy", tier: 1, confederation: "UEFA", cup: "Coppa Italia" },
  { id: "ita-serie-b", name: "Serie B", country: "Italy", tier: 2, confederation: "UEFA", cup: "Coppa Italia" },
  { id: "ita-serie-c", name: "Serie C", country: "Italy", tier: 3, confederation: "UEFA", cup: "Coppa Italia" },
  { id: "eng-premier-league", name: "Premier League", country: "England", tier: 1, confederation: "UEFA", cup: "FA Cup" },
  { id: "eng-championship", name: "Championship", country: "England", tier: 2, confederation: "UEFA", cup: "FA Cup" },
  { id: "esp-la-liga", name: "La Liga", country: "Spain", tier: 1, confederation: "UEFA", cup: "Copa del Rey" },
  { id: "esp-laliga2", name: "LaLiga 2", country: "Spain", tier: 2, confederation: "UEFA", cup: "Copa del Rey" },
  { id: "bra-serie-a", name: "Brasileirão Série A", country: "Brazil", tier: 1, confederation: "CONMEBOL", cup: "Copa do Brasil" },
  { id: "bra-serie-b", name: "Brasileirão Série B", country: "Brazil", tier: 2, confederation: "CONMEBOL", cup: "Copa do Brasil" },
  { id: "por-primeira-liga", name: "Primeira Liga", country: "Portugal", tier: 1, confederation: "UEFA", cup: "Taça de Portugal" },
  { id: "fra-ligue-1", name: "Ligue 1", country: "France", tier: 1, confederation: "UEFA", cup: "Coupe de France" },
  { id: "ger-bundesliga", name: "Bundesliga", country: "Germany", tier: 1, confederation: "UEFA", cup: "DFB-Pokal" },
  { id: "ned-eredivisie", name: "Eredivisie", country: "Netherlands", tier: 1, confederation: "UEFA", cup: "KNVB Beker" },
  { id: "arg-liga-profesional", name: "Liga Profesional", country: "Argentina", tier: 1, confederation: "CONMEBOL", cup: "Copa Argentina" },
  { id: "mex-liga-mx", name: "Liga MX", country: "Mexico", tier: 1, confederation: "CONCACAF" },
  { id: "usa-mls", name: "MLS", country: "United States", tier: 1, confederation: "CONCACAF", cup: "US Open Cup" },
  { id: "can-premier-league", name: "Canadian Premier League", country: "Canada", tier: 1, confederation: "CONCACAF", cup: "Canadian Championship" },
  { id: "mar-botola-pro", name: "Botola Pro", country: "Morocco", tier: 1, confederation: "CAF", cup: "Coupe du Trône" },
  { id: "sen-ligue-1", name: "Ligue 1 Sénégalaise", country: "Senegal", tier: 1, confederation: "CAF", cup: "Coupe du Sénégal" },
  { id: "nga-npfl", name: "NPFL", country: "Nigeria", tier: 1, confederation: "CAF", cup: "Nigeria Federation Cup" },
  { id: "gha-premier-league", name: "Ghana Premier League", country: "Ghana", tier: 1, confederation: "CAF", cup: "Ghana FA Cup" },
  { id: "egy-premier-league", name: "Egyptian Premier League", country: "Egypt", tier: 1, confederation: "CAF", cup: "Egypt Cup" },
  { id: "civ-ligue-1", name: "Ligue 1 Côte d'Ivoire", country: "Ivory Coast", tier: 1, confederation: "CAF", cup: "Coupe de Côte d'Ivoire" },
  { id: "jpn-j1-league", name: "J1 League", country: "Japan", tier: 1, confederation: "AFC", cup: "Emperor's Cup" },
  { id: "kor-k-league-1", name: "K League 1", country: "South Korea", tier: 1, confederation: "AFC", cup: "Korea Cup" },
  { id: "aus-a-league", name: "A-League Men", country: "Australia", tier: 1, confederation: "AFC", cup: "Australia Cup" },
];

const leagueById = new Map(leagues.map((league) => [league.id, league]));

function club(
  id: string,
  name: string,
  leagueId: string,
  prestige: Club["prestige"],
  crestUrl: string,
): Club {
  const league = leagueById.get(leagueId);
  if (!league) {
    throw new Error(`Lega sconosciuta: ${leagueId}`);
  }
  return {
    id,
    name,
    country: league.country,
    tier: league.tier,
    prestige,
    competitions: {
      league: league.name,
      cup: league.cup,
      continental: continentalCompetition(league, prestige),
    },
    crestUrl,
  };
}

// Stemmi: hotlink a TheSportsDB (chiave pubblica "123"), mai scaricati/salvati nel repo —
// vedi .claude/research/team-crests.md per la ricerca completa (termini d'uso, id squadra, note).
export const clubs: Club[] = [
  // --- Italia — Serie A ---
  club("juventus", "Juventus", "ita-serie-a", 3, "https://r2.thesportsdb.com/images/media/team/badge/uxf0gr1742983727.png"),
  club("inter", "Inter", "ita-serie-a", 3, "https://r2.thesportsdb.com/images/media/team/badge/ryhu6d1617113103.png"),
  club("ac-milan", "AC Milan", "ita-serie-a", 3, "https://r2.thesportsdb.com/images/media/team/badge/wvspur1448806617.png"),
  club("napoli", "Napoli", "ita-serie-a", 3, "https://r2.thesportsdb.com/images/media/team/badge/l8qyxv1742982541.png"),
  club("roma", "Roma", "ita-serie-a", 2, "https://r2.thesportsdb.com/images/media/team/badge/jwro2s1760820674.png"),
  club("atalanta", "Atalanta", "ita-serie-a", 2, "https://r2.thesportsdb.com/images/media/team/badge/qix5ku1780561327.png"),
  club("fiorentina", "Fiorentina", "ita-serie-a", 2, "https://r2.thesportsdb.com/images/media/team/badge/hc8nhu1656098030.png"),
  club("lazio", "Lazio", "ita-serie-a", 2, "https://r2.thesportsdb.com/images/media/team/badge/rwqyvs1448806608.png"),
  club("bologna", "Bologna", "ita-serie-a", 1, "https://r2.thesportsdb.com/images/media/team/badge/2qi1u31655592366.png"),
  club("torino", "Torino", "ita-serie-a", 1, "https://r2.thesportsdb.com/images/media/team/badge/xxprty1448806802.png"),
  club("como", "Como", "ita-serie-a", 2, "https://r2.thesportsdb.com/images/media/team/badge/02x81t1627405841.png"),
  club("genoa", "Genoa", "ita-serie-a", 1, "https://r2.thesportsdb.com/images/media/team/badge/52s8dn1655553600.png"),
  club("udinese", "Udinese", "ita-serie-a", 1, "https://r2.thesportsdb.com/images/media/team/badge/vwvstr1448806811.png"),
  club("sassuolo", "Sassuolo", "ita-serie-a", 1, "https://r2.thesportsdb.com/images/media/team/badge/xystvp1448806138.png"),
  club("parma", "Parma", "ita-serie-a", 1, "https://r2.thesportsdb.com/images/media/team/badge/6yiaxs1627406063.png"),
  club("cagliari", "Cagliari", "ita-serie-a", 0, "https://r2.thesportsdb.com/images/media/team/badge/wvsvxt1447534471.png"),
  club("lecce", "Lecce", "ita-serie-a", 0, "https://r2.thesportsdb.com/images/media/team/badge/j4vznr1567365249.png"),
  club("monza", "Monza", "ita-serie-a", 0, "https://r2.thesportsdb.com/images/media/team/badge/bxearg1603170113.png"),
  club("venezia", "Venezia", "ita-serie-a", 0, "https://r2.thesportsdb.com/images/media/team/badge/vbiget1781026964.png"),
  club("frosinone", "Frosinone", "ita-serie-a", 0, "https://r2.thesportsdb.com/images/media/team/badge/a7xa151603170120.png"),

  // --- Italia — Serie B ---
  club("sampdoria", "Sampdoria", "ita-serie-b", 1, "https://r2.thesportsdb.com/images/media/team/badge/pr6co21655592769.png"),
  club("palermo", "Palermo", "ita-serie-b", 1, "https://r2.thesportsdb.com/images/media/team/badge/zi1tb01579708939.png"),
  club("bari", "Bari", "ita-serie-b", 1, "https://r2.thesportsdb.com/images/media/team/badge/isfrtg1579724972.png"),
  club("cesena", "Cesena", "ita-serie-b", 1, "https://r2.thesportsdb.com/images/media/team/badge/9l00zr1677256723.png"),
  club("modena", "Modena", "ita-serie-b", 0, "https://r2.thesportsdb.com/images/media/team/badge/93n2wm1656015823.png"),
  club("reggiana", "Reggiana", "ita-serie-b", 0, "https://r2.thesportsdb.com/images/media/team/badge/dffx6o1600266770.png"),
  club("cremonese", "Cremonese", "ita-serie-b", 1, "https://r2.thesportsdb.com/images/media/team/badge/6ng2vy1579708291.png"),
  club("catanzaro", "Catanzaro", "ita-serie-b", 0, "https://r2.thesportsdb.com/images/media/team/badge/byrc5e1691995858.png"),
  club("carrarese", "Carrarese", "ita-serie-b", 0, "https://r2.thesportsdb.com/images/media/team/badge/njh6tl1651779724.png"),
  club("pisa-sc", "Pisa", "ita-serie-b", 0, "https://r2.thesportsdb.com/images/media/team/badge/2eso9w1579708309.png"),

  // --- Italia — Serie C ---
  club("padova", "Padova", "ita-serie-c", 0, "https://r2.thesportsdb.com/images/media/team/badge/hklo0i1579724992.png"),
  club("pescara", "Pescara", "ita-serie-c", 0, "https://r2.thesportsdb.com/images/media/team/badge/uywyxr1426869511.png"),
  club("virtus-entella", "Virtus Entella", "ita-serie-c", 0, "https://r2.thesportsdb.com/images/media/team/badge/c7yb5u1693457662.png"),
  club("gubbio", "Gubbio", "ita-serie-c", 0, "https://r2.thesportsdb.com/images/media/team/badge/el7zx61680802664.png"),
  club("pontedera", "Pontedera", "ita-serie-c", 0, "https://r2.thesportsdb.com/images/media/team/badge/emkgc41651779179.png"),
  club("novara", "Novara", "ita-serie-c", 0, "https://r2.thesportsdb.com/images/media/team/badge/urbkrr1675352937.png"),
  club("triestina", "Triestina", "ita-serie-c", 0, "https://r2.thesportsdb.com/images/media/team/badge/13hyc21533752996.png"),

  // --- England — Premier League ---
  club("manchester-city", "Manchester City", "eng-premier-league", 3, "https://r2.thesportsdb.com/images/media/team/badge/vwpvry1467462651.png"),
  club("liverpool", "Liverpool", "eng-premier-league", 3, "https://r2.thesportsdb.com/images/media/team/badge/kfaher1737969724.png"),
  club("arsenal", "Arsenal", "eng-premier-league", 3, "https://r2.thesportsdb.com/images/media/team/badge/uyhbfe1612467038.png"),
  club("manchester-united", "Manchester United", "eng-premier-league", 3, "https://r2.thesportsdb.com/images/media/team/badge/xzqdr11517660252.png"),
  club("chelsea", "Chelsea", "eng-premier-league", 2, "https://www.thesportsdb.com/images/media/team/badge/pbf4ul1782638263.png"),
  club("tottenham", "Tottenham Hotspur", "eng-premier-league", 2, "https://r2.thesportsdb.com/images/media/team/badge/dfyfhl1604094109.png"),
  club("newcastle", "Newcastle United", "eng-premier-league", 2, "https://r2.thesportsdb.com/images/media/team/badge/lhwuiz1621593302.png"),
  club("aston-villa", "Aston Villa", "eng-premier-league", 1, "https://www.thesportsdb.com/images/media/team/badge/97mehy1784645865.png"),
  club("brighton", "Brighton & Hove Albion", "eng-premier-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/ywypts1448810904.png"),
  club("everton", "Everton", "eng-premier-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/eqayrf1523184794.png"),
  club("sunderland", "Sunderland", "eng-premier-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/tprtus1448813498.png"),
  club("leeds-united", "Leeds United", "eng-premier-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/jcgrml1756649030.png"),
  club("coventry-city", "Coventry City", "eng-premier-league", 0, "https://r2.thesportsdb.com/images/media/team/badge/uxyqys1424033798.png"),
  club("crystal-palace", "Crystal Palace", "eng-premier-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/ia6i3m1656014992.png"),
  club("fulham", "Fulham", "eng-premier-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/xwwvyt1448811086.png"),
  club("nottingham-forest", "Nottingham Forest", "eng-premier-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/sar2y41781740886.png"),
  club("bournemouth", "Bournemouth", "eng-premier-league", 0, "https://r2.thesportsdb.com/images/media/team/badge/y08nak1534071116.png"),
  club("brentford", "Brentford", "eng-premier-league", 0, "https://r2.thesportsdb.com/images/media/team/badge/grv1aw1546453779.png"),
  club("hull-city", "Hull City", "eng-premier-league", 0, "https://r2.thesportsdb.com/images/media/team/badge/fbqqda1601726113.png"),
  club("ipswich-town", "Ipswich Town", "eng-premier-league", 0, "https://r2.thesportsdb.com/images/media/team/badge/mdj1ey1634670785.png"),

  // --- England — Championship ---
  club("southampton", "Southampton", "eng-championship", 1, "https://r2.thesportsdb.com/images/media/team/badge/ggqtd01621593274.png"),
  club("norwich-city", "Norwich City", "eng-championship", 0, "https://r2.thesportsdb.com/images/media/team/badge/pabczm1679951464.png"),
  club("west-brom", "West Bromwich Albion", "eng-championship", 0, "https://r2.thesportsdb.com/images/media/team/badge/rsvuxw1448813527.png"),
  club("preston", "Preston North End", "eng-championship", 0, "https://r2.thesportsdb.com/images/media/team/badge/wqtwvw1448811512.png"),
  club("middlesbrough", "Middlesbrough", "eng-championship", 0, "https://r2.thesportsdb.com/images/media/team/badge/advjg71780068902.png"),
  club("west-ham", "West Ham United", "eng-championship", 1, "https://r2.thesportsdb.com/images/media/team/badge/yutyxs1467459956.png"),
  club("wolves", "Wolverhampton Wanderers", "eng-championship", 1, "https://r2.thesportsdb.com/images/media/team/badge/u9qr031621593327.png"),

  // --- Spagna — La Liga ---
  club("real-madrid", "Real Madrid", "esp-la-liga", 3, "https://r2.thesportsdb.com/images/media/team/badge/vwvwrw1473502969.png"),
  club("barcelona", "Barcelona", "esp-la-liga", 3, "https://r2.thesportsdb.com/images/media/team/badge/wq9sir1639406443.png"),
  club("atletico-madrid", "Atlético Madrid", "esp-la-liga", 3, "https://r2.thesportsdb.com/images/media/team/badge/0ulh3q1719984315.png"),
  club("sevilla", "Sevilla", "esp-la-liga", 2, "https://r2.thesportsdb.com/images/media/team/badge/vpsqqx1473502977.png"),
  club("real-sociedad", "Real Sociedad", "esp-la-liga", 2, "https://r2.thesportsdb.com/images/media/team/badge/vptvpr1473502986.png"),
  club("real-betis", "Real Betis", "esp-la-liga", 2, "https://r2.thesportsdb.com/images/media/team/badge/2oqulv1663245386.png"),
  club("villarreal", "Villarreal", "esp-la-liga", 2, "https://r2.thesportsdb.com/images/media/team/badge/vrypqy1473503073.png"),
  club("athletic-bilbao", "Athletic Bilbao", "esp-la-liga", 2, "https://r2.thesportsdb.com/images/media/team/badge/68w7fe1639408210.png"),
  club("valencia", "Valencia", "esp-la-liga", 1, "https://r2.thesportsdb.com/images/media/team/badge/dm8l6o1655594864.png"),
  club("levante", "Levante", "esp-la-liga", 0, "https://r2.thesportsdb.com/images/media/team/badge/xwtxsx1473503739.png"),
  club("malaga", "Málaga", "esp-la-liga", 1, "https://r2.thesportsdb.com/images/media/team/badge/upqyvr1473502952.png"),
  club("racing-santander", "Racing Santander", "esp-la-liga", 0, "https://r2.thesportsdb.com/images/media/team/badge/97kkiq1536575158.png"),
  club("celta-vigo", "Celta Vigo", "esp-la-liga", 1, "https://r2.thesportsdb.com/images/media/team/badge/xfjtku1690436219.png"),
  club("espanyol", "Espanyol", "esp-la-liga", 1, "https://r2.thesportsdb.com/images/media/team/badge/867nzz1681703222.png"),
  club("osasuna", "Osasuna", "esp-la-liga", 1, "https://r2.thesportsdb.com/images/media/team/badge/rvspvt1473502960.png"),
  club("alaves", "Alavés", "esp-la-liga", 0, "https://r2.thesportsdb.com/images/media/team/badge/mfn99h1734673842.png"),
  club("deportivo-la-coruna", "Deportivo La Coruña", "esp-la-liga", 0, "https://www.thesportsdb.com/images/media/team/badge/62bvwv1783013156.png"),
  club("elche", "Elche", "esp-la-liga", 0, "https://r2.thesportsdb.com/images/media/team/badge/e4vaw51655594332.png"),
  club("getafe", "Getafe", "esp-la-liga", 0, "https://r2.thesportsdb.com/images/media/team/badge/eyh2891655594452.png"),
  club("rayo-vallecano", "Rayo Vallecano", "esp-la-liga", 0, "https://r2.thesportsdb.com/images/media/team/badge/nzhu941655595465.png"),

  // --- Spagna — LaLiga 2 ---
  club("las-palmas", "Las Palmas", "esp-laliga2", 0, "https://r2.thesportsdb.com/images/media/team/badge/mmhyb11616443601.png"),
  club("real-oviedo", "Real Oviedo", "esp-laliga2", 0, "https://r2.thesportsdb.com/images/media/team/badge/yuwqus1447590681.png"),
  club("sporting-gijon", "Sporting Gijón", "esp-laliga2", 0, "https://r2.thesportsdb.com/images/media/team/badge/xxrtqx1473503054.png"),
  club("eibar", "Eibar", "esp-laliga2", 0, "https://r2.thesportsdb.com/images/media/team/badge/hccive1680933599.png"),
  club("albacete", "Albacete", "esp-laliga2", 0, "https://r2.thesportsdb.com/images/media/team/badge/17oqja1616436316.png"),
  club("girona", "Girona", "esp-laliga2", 1, "https://r2.thesportsdb.com/images/media/team/badge/kfu7zu1659897499.png"),

  // --- Brasile — Série A ---
  club("flamengo", "Flamengo", "bra-serie-a", 3, "https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png"),
  club("palmeiras", "Palmeiras", "bra-serie-a", 3, "https://r2.thesportsdb.com/images/media/team/badge/vsqwqp1473538105.png"),
  club("sao-paulo", "São Paulo", "bra-serie-a", 2, "https://r2.thesportsdb.com/images/media/team/badge/sxpupx1473538135.png"),
  club("corinthians", "Corinthians", "bra-serie-a", 2, "https://r2.thesportsdb.com/images/media/team/badge/vvuvps1473538042.png"),
  club("gremio", "Grêmio", "bra-serie-a", 2, "https://r2.thesportsdb.com/images/media/team/badge/uvpwyt1473538089.png"),
  club("internacional", "Internacional", "bra-serie-a", 2, "https://r2.thesportsdb.com/images/media/team/badge/yprvxx1473538097.png"),
  club("fluminense", "Fluminense", "bra-serie-a", 2, "https://r2.thesportsdb.com/images/media/team/badge/stvvwp1473538082.png"),
  club("atletico-mineiro", "Atlético Mineiro", "bra-serie-a", 2, "https://r2.thesportsdb.com/images/media/team/badge/x5lixs1743742872.png"),
  club("cruzeiro", "Cruzeiro", "bra-serie-a", 1, "https://r2.thesportsdb.com/images/media/team/badge/upsvvu1473538059.png"),
  club("botafogo", "Botafogo", "bra-serie-a", 1, "https://r2.thesportsdb.com/images/media/team/badge/bs5mbw1733004596.png"),

  // --- Brasile — Série B ---
  club("remo", "Remo", "bra-serie-b", 0, "https://r2.thesportsdb.com/images/media/team/badge/u36jfy1579341655.png"),
  club("coritiba", "Coritiba", "bra-serie-b", 1, "https://r2.thesportsdb.com/images/media/team/badge/ywwsyu1473538050.png"),
  club("chapecoense", "Chapecoense", "bra-serie-b", 0, "https://r2.thesportsdb.com/images/media/team/badge/wy0e1i1765900601.png"),
  club("vila-nova", "Vila Nova", "bra-serie-b", 0, "https://r2.thesportsdb.com/images/media/team/badge/nwd4ns1740851638.png"),
  club("ponte-preta", "Ponte Preta", "bra-serie-b", 0, "https://r2.thesportsdb.com/images/media/team/badge/wbss4d1644929547.png"),
  club("nautico", "Náutico", "bra-serie-b", 0, "https://r2.thesportsdb.com/images/media/team/badge/wywuwv1464886832.png"),
  club("crb", "CRB", "bra-serie-b", 0, "https://r2.thesportsdb.com/images/media/team/badge/vpypuq1472069179.png"),
  club("avai", "Avaí", "bra-serie-b", 0, "https://r2.thesportsdb.com/images/media/team/badge/bblkat1766506007.png"),

  // --- Portogallo — Primeira Liga ---
  club("benfica", "Benfica", "por-primeira-liga", 3, "https://r2.thesportsdb.com/images/media/team/badge/hj4kyc1781152436.png"),
  club("porto", "FC Porto", "por-primeira-liga", 3, "https://r2.thesportsdb.com/images/media/team/badge/xu47rb1628855600.png"),
  club("sporting-cp", "Sporting CP", "por-primeira-liga", 2, "https://www.thesportsdb.com/images/media/team/badge/5hiuk71783137875.png"),
  club("braga", "Sporting Braga", "por-primeira-liga", 2, "https://www.thesportsdb.com/images/media/team/badge/skbiwo1785775946.png"),
  club("vitoria-guimaraes", "Vitória de Guimarães", "por-primeira-liga", 1, "https://r2.thesportsdb.com/images/media/team/badge/af52z61628855707.png"),
  club("boavista", "Boavista", "por-primeira-liga", 1, "https://r2.thesportsdb.com/images/media/team/badge/usi98v1628853974.png"),
  club("famalicao", "Famalicão", "por-primeira-liga", 0, "https://r2.thesportsdb.com/images/media/team/badge/a3f4er1563653256.png"),
  club("rio-ave", "Rio Ave", "por-primeira-liga", 0, "https://r2.thesportsdb.com/images/media/team/badge/ngbklq1628851239.png"),

  // --- Francia — Ligue 1 ---
  club("psg", "Paris Saint-Germain", "fra-ligue-1", 3, "https://r2.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png"),
  club("marseille", "Marseille", "fra-ligue-1", 3, "https://r2.thesportsdb.com/images/media/team/badge/c6bazh1779212287.png"),
  club("monaco", "Monaco", "fra-ligue-1", 2, "https://r2.thesportsdb.com/images/media/team/badge/exjf5l1678808044.png"),
  club("lyon", "Lyon", "fra-ligue-1", 2, "https://r2.thesportsdb.com/images/media/team/badge/blk9771656932845.png"),
  club("lille", "Lille", "fra-ligue-1", 1, "https://r2.thesportsdb.com/images/media/team/badge/2giize1534005340.png"),
  club("nice", "Nice", "fra-ligue-1", 1, "https://r2.thesportsdb.com/images/media/team/badge/msy7ly1621593859.png"),
  club("rennes", "Rennes", "fra-ligue-1", 0, "https://r2.thesportsdb.com/images/media/team/badge/ypturx1473504818.png"),
  club("lens", "Lens", "fra-ligue-1", 0, "https://r2.thesportsdb.com/images/media/team/badge/3pxoum1598797195.png"),
  club("strasbourg", "Strasbourg", "fra-ligue-1", 1, "https://r2.thesportsdb.com/images/media/team/badge/b8k77w1766625501.png"),
  club("toulouse", "Toulouse", "fra-ligue-1", 1, "https://r2.thesportsdb.com/images/media/team/badge/17eqox1688449282.png"),
  club("angers", "Angers", "fra-ligue-1", 0, "https://r2.thesportsdb.com/images/media/team/badge/ix6q4w1678808069.png"),
  club("auxerre", "Auxerre", "fra-ligue-1", 0, "https://r2.thesportsdb.com/images/media/team/badge/lzdtbf1658753355.png"),
  club("brest", "Brest", "fra-ligue-1", 0, "https://r2.thesportsdb.com/images/media/team/badge/z69be41598797026.png"),
  club("le-havre", "Le Havre", "fra-ligue-1", 0, "https://r2.thesportsdb.com/images/media/team/badge/aikowk1546475003.png"),
  club("le-mans", "Le Mans", "fra-ligue-1", 0, "https://r2.thesportsdb.com/images/media/team/badge/wjhziv1700145026.png"),
  club("lorient", "Lorient", "fra-ligue-1", 0, "https://r2.thesportsdb.com/images/media/team/badge/sxsttw1473504748.png"),
  club("paris-fc", "Paris FC", "fra-ligue-1", 0, "https://r2.thesportsdb.com/images/media/team/badge/yuvtsy1447594254.png"),
  club("troyes", "Troyes", "fra-ligue-1", 0, "https://r2.thesportsdb.com/images/media/team/badge/sl5kzg1766617559.png"),

  // --- Germania — Bundesliga ---
  club("bayern-munich", "Bayern Munich", "ger-bundesliga", 3, "https://r2.thesportsdb.com/images/media/team/badge/01ogkh1716960412.png"),
  club("borussia-dortmund", "Borussia Dortmund", "ger-bundesliga", 3, "https://r2.thesportsdb.com/images/media/team/badge/tqo8ge1716960353.png"),
  club("rb-leipzig", "RB Leipzig", "ger-bundesliga", 2, "https://r2.thesportsdb.com/images/media/team/badge/zjgapo1594244951.png"),
  club("bayer-leverkusen", "Bayer Leverkusen", "ger-bundesliga", 2, "https://r2.thesportsdb.com/images/media/team/badge/3x9k851726760113.png"),
  club("eintracht-frankfurt", "Eintracht Frankfurt", "ger-bundesliga", 1, "https://r2.thesportsdb.com/images/media/team/badge/rurwpy1473453269.png"),
  club("vfb-stuttgart", "VfB Stuttgart", "ger-bundesliga", 1, "https://r2.thesportsdb.com/images/media/team/badge/yppyux1473454085.png"),
  club("borussia-monchengladbach", "Borussia Mönchengladbach", "ger-bundesliga", 0, "https://r2.thesportsdb.com/images/media/team/badge/sysurw1473453380.png"),
  club("werder-bremen", "Werder Bremen", "ger-bundesliga", 0, "https://r2.thesportsdb.com/images/media/team/badge/tkvqan1716960454.png"),
  club("schalke-04", "Schalke 04", "ger-bundesliga", 1, "https://r2.thesportsdb.com/images/media/team/badge/hnci291621593978.png"),
  club("hamburger-sv", "Hamburger SV", "ger-bundesliga", 1, "https://r2.thesportsdb.com/images/media/team/badge/tvtppt1473453296.png"),
  club("freiburg", "SC Freiburg", "ger-bundesliga", 1, "https://r2.thesportsdb.com/images/media/team/badge/urwtup1473453288.png"),
  club("koln", "1. FC Köln", "ger-bundesliga", 1, "https://r2.thesportsdb.com/images/media/team/badge/2j1sc91566049407.png"),
  club("augsburg", "Augsburg", "ger-bundesliga", 0, "https://r2.thesportsdb.com/images/media/team/badge/xqyyvq1473453233.png"),
  club("union-berlin", "Union Berlin", "ger-bundesliga", 0, "https://r2.thesportsdb.com/images/media/team/badge/q0o5001599679795.png"),
  club("elversberg", "Elversberg", "ger-bundesliga", 0, "https://r2.thesportsdb.com/images/media/team/badge/z079go1677573926.png"),
  club("hoffenheim", "Hoffenheim", "ger-bundesliga", 0, "https://r2.thesportsdb.com/images/media/team/badge/9hwvb21621593919.png"),
  club("mainz-05", "Mainz 05", "ger-bundesliga", 0, "https://r2.thesportsdb.com/images/media/team/badge/fhm9v51552134916.png"),
  club("paderborn", "Paderborn", "ger-bundesliga", 0, "https://r2.thesportsdb.com/images/media/team/badge/kddvva1566048058.png"),

  // --- Paesi Bassi — Eredivisie ---
  club("ajax", "Ajax", "ned-eredivisie", 3, "https://r2.thesportsdb.com/images/media/team/badge/zg9tii1755495289.png"),
  club("psv", "PSV Eindhoven", "ned-eredivisie", 3, "https://r2.thesportsdb.com/images/media/team/badge/xfsz6i1721297428.png"),
  club("feyenoord", "Feyenoord", "ned-eredivisie", 2, "https://r2.thesportsdb.com/images/media/team/badge/uturtx1473534803.png"),
  club("az-alkmaar", "AZ Alkmaar", "ned-eredivisie", 2, "https://r2.thesportsdb.com/images/media/team/badge/wtqwvv1473534757.png"),
  club("fc-utrecht", "FC Utrecht", "ned-eredivisie", 1, "https://r2.thesportsdb.com/images/media/team/badge/yuhha71625167104.png"),
  club("fc-twente", "FC Twente", "ned-eredivisie", 1, "https://r2.thesportsdb.com/images/media/team/badge/rsrxrt1473534783.png"),
  club("vitesse", "Vitesse", "ned-eredivisie", 0, "https://r2.thesportsdb.com/images/media/team/badge/wrptxp1473534864.png"),
  club("willem-ii", "Willem II", "ned-eredivisie", 0, "https://r2.thesportsdb.com/images/media/team/badge/ushlnc1666107465.png"),

  // --- Argentina — Liga Profesional ---
  club("boca-juniors", "Boca Juniors", "arg-liga-profesional", 3, "https://r2.thesportsdb.com/images/media/team/badge/bm7krb1775741582.png"),
  club("river-plate", "River Plate", "arg-liga-profesional", 3, "https://r2.thesportsdb.com/images/media/team/badge/03dmi31645539717.png"),
  club("racing-club", "Racing Club", "arg-liga-profesional", 2, "https://r2.thesportsdb.com/images/media/team/badge/vi4mu41695734959.png"),
  club("independiente", "Independiente", "arg-liga-profesional", 2, "https://r2.thesportsdb.com/images/media/team/badge/eki4nd1580842605.png"),
  club("san-lorenzo", "San Lorenzo", "arg-liga-profesional", 1, "https://r2.thesportsdb.com/images/media/team/badge/jih7hv1582229717.png"),
  club("estudiantes", "Estudiantes de La Plata", "arg-liga-profesional", 1, "https://r2.thesportsdb.com/images/media/team/badge/pf08dq1760634366.png"),
  club("velez-sarsfield", "Vélez Sarsfield", "arg-liga-profesional", 0, "https://r2.thesportsdb.com/images/media/team/badge/jo98m71517769587.png"),
  club("newells-old-boys", "Newell's Old Boys", "arg-liga-profesional", 0, "https://r2.thesportsdb.com/images/media/team/badge/23aftf1580842633.png"),

  // --- Messico — Liga MX ---
  club("america", "América", "mex-liga-mx", 3, "https://r2.thesportsdb.com/images/media/team/badge/amy1xs1581857392.png"),
  club("cruz-azul", "Cruz Azul", "mex-liga-mx", 3, "https://r2.thesportsdb.com/images/media/team/badge/wcd2yi1781543370.png"),
  club("guadalajara", "CD Guadalajara (Chivas)", "mex-liga-mx", 2, "https://r2.thesportsdb.com/images/media/team/badge/mp1box1593452087.png"),
  club("toluca", "Toluca", "mex-liga-mx", 2, "https://r2.thesportsdb.com/images/media/team/badge/y64wy91523913186.png"),
  club("tigres-uanl", "Tigres UANL", "mex-liga-mx", 1, "https://r2.thesportsdb.com/images/media/team/badge/lh80fx1701423708.png"),
  club("monterrey", "Monterrey", "mex-liga-mx", 1, "https://r2.thesportsdb.com/images/media/team/badge/yglj911721542561.png"),
  club("necaxa", "Necaxa", "mex-liga-mx", 0, "https://r2.thesportsdb.com/images/media/team/badge/tqdk9e1779772432.png"),
  club("puebla", "Puebla", "mex-liga-mx", 0, "https://r2.thesportsdb.com/images/media/team/badge/h0jgg51593451845.png"),

  // --- Stati Uniti — MLS ---
  club("la-galaxy", "LA Galaxy", "usa-mls", 3, "https://r2.thesportsdb.com/images/media/team/badge/ysyysr1420227188.png"),
  club("dc-united", "D.C. United", "usa-mls", 3, "https://r2.thesportsdb.com/images/media/team/badge/uwvsyt1467462609.png"),
  club("columbus-crew", "Columbus Crew", "usa-mls", 2, "https://r2.thesportsdb.com/images/media/team/badge/dzs8cp1629059854.png"),
  club("seattle-sounders", "Seattle Sounders FC", "usa-mls", 2, "https://r2.thesportsdb.com/images/media/team/badge/2dy5cx1706711036.png"),
  club("atlanta-united", "Atlanta United FC", "usa-mls", 1, "https://r2.thesportsdb.com/images/media/team/badge/ej091x1602103070.png"),
  club("lafc", "Los Angeles FC", "usa-mls", 1, "https://r2.thesportsdb.com/images/media/team/badge/7nbj2a1602103638.png"),
  club("new-york-red-bulls", "New York Red Bulls", "usa-mls", 0, "https://r2.thesportsdb.com/images/media/team/badge/suytvy1473536462.png"),
  club("philadelphia-union", "Philadelphia Union", "usa-mls", 0, "https://r2.thesportsdb.com/images/media/team/badge/gyznyo1602103682.png"),

  // --- Canada — Canadian Premier League ---
  club("forge-fc", "Forge FC", "can-premier-league", 3, "https://r2.thesportsdb.com/images/media/team/badge/48dk0h1582572865.png"),
  club("cavalry-fc", "Cavalry FC", "can-premier-league", 3, "https://r2.thesportsdb.com/images/media/team/badge/gpi5qj1583351269.png"),
  club("atletico-ottawa", "Atlético Ottawa", "can-premier-league", 2, "https://r2.thesportsdb.com/images/media/team/badge/k5gzuw1583351260.png"),
  club("pacific-fc", "Pacific FC", "can-premier-league", 2, "https://r2.thesportsdb.com/images/media/team/badge/6qzhpj1583351283.png"),
  club("inter-toronto", "Inter Toronto FC", "can-premier-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/kevy591770133070.png"),
  club("hfx-wanderers", "HFX Wanderers FC", "can-premier-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/uqkf0n1583351277.png"),
  club("vancouver-fc", "Vancouver FC", "can-premier-league", 0, "https://r2.thesportsdb.com/images/media/team/badge/map6vh1770132710.png"),
  club("fc-supra-quebec", "FC Supra du Québec", "can-premier-league", 0, "https://www.thesportsdb.com/images/media/team/badge/lm3a4f1784038568.png"),

  // --- Marocco — Botola Pro ---
  club("wydad-casablanca", "Wydad Casablanca", "mar-botola-pro", 3, "https://r2.thesportsdb.com/images/media/team/badge/vio4271750784379.png"),
  club("raja-casablanca", "Raja Casablanca", "mar-botola-pro", 3, "https://r2.thesportsdb.com/images/media/team/badge/1cg64m1551428003.png"),
  club("far-rabat", "FAR Rabat", "mar-botola-pro", 2, "https://r2.thesportsdb.com/images/media/team/badge/jkjp961777421509.png"),
  club("rs-berkane", "RS Berkane", "mar-botola-pro", 2, "https://r2.thesportsdb.com/images/media/team/badge/f296p91743053568.png"),
  club("fus-rabat", "FUS Rabat", "mar-botola-pro", 1, "https://r2.thesportsdb.com/images/media/team/badge/vxk3aj1551518378.png"),
  club("difaa-el-jadidi", "Difaâ Hassani El Jadidi", "mar-botola-pro", 1, "https://r2.thesportsdb.com/images/media/team/badge/v8y3qa1638560041.png"),
  club("kawkab-marrakech", "Kawkab Marrakech", "mar-botola-pro", 0, "https://r2.thesportsdb.com/images/media/team/badge/7qfuus1551898115.png"),
  club("chabab-mohammedia", "Chabab Mohammédia", "mar-botola-pro", 0, "https://r2.thesportsdb.com/images/media/team/badge/5evxcx1609193564.png"),

  // --- Senegal — Ligue 1 Sénégalaise ---
  club("asc-jaraaf", "Jaraaf", "sen-ligue-1", 3, "https://r2.thesportsdb.com/images/media/team/badge/p25tdp1720157205.png"),
  club("casa-sport", "Casa Sport", "sen-ligue-1", 3, "https://r2.thesportsdb.com/images/media/team/badge/0cqkoc1673938919.png"),
  club("teungueth-fc", "Teungueth FC", "sen-ligue-1", 2, "https://r2.thesportsdb.com/images/media/team/badge/i6s10n1720157496.png"),
  club("generation-foot", "Génération Foot", "sen-ligue-1", 2, "https://r2.thesportsdb.com/images/media/team/badge/i5glvd1720156796.png"),
  club("diambars", "Diambars FC", "sen-ligue-1", 1, "https://r2.thesportsdb.com/images/media/team/badge/3ci0k01720156622.png"),
  club("as-pikine", "AS Pikine", "sen-ligue-1", 1, "https://r2.thesportsdb.com/images/media/team/badge/xgrkyp1720157272.png"),
  club("us-ouakam", "US Ouakam", "sen-ligue-1", 0, "https://r2.thesportsdb.com/images/media/team/badge/qbyvf91727194024.png"),
  club("guediawaye-fc", "Guédiawaye FC", "sen-ligue-1", 0, "https://r2.thesportsdb.com/images/media/team/badge/vul8d71720157041.png"),

  // --- Nigeria — NPFL ---
  club("enyimba", "Enyimba International", "nga-npfl", 3, "https://r2.thesportsdb.com/images/media/team/badge/27km6p1720154537.png"),
  club("kano-pillars", "Kano Pillars", "nga-npfl", 3, "https://r2.thesportsdb.com/images/media/team/badge/bgleh01589375519.png"),
  club("rangers-international", "Rangers International", "nga-npfl", 2, "https://r2.thesportsdb.com/images/media/team/badge/j6uqt31720154917.png"),
  club("rivers-united", "Rivers United", "nga-npfl", 2, "https://r2.thesportsdb.com/images/media/team/badge/4atnuh1720155248.png"),
  club("plateau-united", "Plateau United", "nga-npfl", 1, "https://r2.thesportsdb.com/images/media/team/badge/2z80yh1720154812.png"),
  club("akwa-united", "Akwa United", "nga-npfl", 1, "https://r2.thesportsdb.com/images/media/team/badge/e087l51590183336.png"),
  club("sunshine-stars", "Sunshine Stars", "nga-npfl", 0, "https://r2.thesportsdb.com/images/media/team/badge/9s5g3t1590183469.png"),
  club("shooting-stars", "Shooting Stars (3SC)", "nga-npfl", 0, "https://r2.thesportsdb.com/images/media/team/badge/uk3c7q1720155122.png"),

  // --- Ghana — Ghana Premier League ---
  club("asante-kotoko", "Asante Kotoko", "gha-premier-league", 3, "https://r2.thesportsdb.com/images/media/team/badge/u1mppc1578401554.png"),
  club("hearts-of-oak", "Accra Hearts of Oak", "gha-premier-league", 3, "https://r2.thesportsdb.com/images/media/team/badge/v3eyvw1617287212.png"),
  club("aduana-stars", "Aduana Stars", "gha-premier-league", 2, "https://r2.thesportsdb.com/images/media/team/badge/5qeyq71617287049.png"),
  club("medeama-sc", "Medeama SC", "gha-premier-league", 2, "https://r2.thesportsdb.com/images/media/team/badge/p8p3jr1617287252.png"),
  club("bechem-united", "Bechem United", "gha-premier-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/y3uo7z1720155733.png"),
  club("berekum-chelsea", "Berekum Chelsea", "gha-premier-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/tu3hvi1694900545.png"),
  club("king-faisal", "King Faisal Babes", "gha-premier-league", 0, "https://r2.thesportsdb.com/images/media/team/badge/tzfizy1617287235.png"),
  club("karela-united", "Karela United", "gha-premier-league", 0, "https://r2.thesportsdb.com/images/media/team/badge/wx2ydh1617287231.png"),

  // --- Egitto — Egyptian Premier League ---
  club("al-ahly", "Al Ahly", "egy-premier-league", 3, "https://r2.thesportsdb.com/images/media/team/badge/x8753q1751421890.png"),
  club("zamalek", "Zamalek", "egy-premier-league", 3, "https://r2.thesportsdb.com/images/media/team/badge/tgekj81580930027.png"),
  club("pyramids-fc", "Pyramids FC", "egy-premier-league", 2, "https://r2.thesportsdb.com/images/media/team/badge/8liy611607352549.png"),
  club("ismaily", "Ismaily SC", "egy-premier-league", 2, "https://r2.thesportsdb.com/images/media/team/badge/1g46qo1589807617.png"),
  club("al-masry", "Al Masry", "egy-premier-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/3aw86h1589807260.png"),
  club("enppi", "ENPPI", "egy-premier-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/uht79n1589807327.png"),
  club("ceramica-cleopatra", "Ceramica Cleopatra", "egy-premier-league", 0, "https://r2.thesportsdb.com/images/media/team/badge/xy4shs1751422167.png"),
  club("smouha", "Smouha SC", "egy-premier-league", 0, "https://r2.thesportsdb.com/images/media/team/badge/qq4pkd1589807413.png"),

  // --- Costa d'Avorio — Ligue 1 ---
  club("asec-mimosas", "ASEC Mimosas", "civ-ligue-1", 3, "https://r2.thesportsdb.com/images/media/team/badge/b9e1cr1589312301.png"),
  club("stade-abidjan", "Stade d'Abidjan", "civ-ligue-1", 3, "https://r2.thesportsdb.com/images/media/team/badge/zr19ao1776292889.png"),
  club("fc-san-pedro", "FC San Pédro", "civ-ligue-1", 2, "https://r2.thesportsdb.com/images/media/team/badge/3hjar61708390704.png"),
  club("rc-abidjan", "Racing Club Abidjan", "civ-ligue-1", 2, "https://www.thesportsdb.com/images/media/team/badge/ou01i81784654220.png"),
  club("afad-djekanou", "AFAD Djékanou", "civ-ligue-1", 1, "https://r2.thesportsdb.com/images/media/team/badge/j0le3l1649203762.png"),
  club("isca", "ISCA", "civ-ligue-1", 1, "https://r2.thesportsdb.com/images/media/team/badge/u4i9c91755367271.png"),
  club("bouake", "Bouaké", "civ-ligue-1", 0, "https://r2.thesportsdb.com/images/media/team/badge/98rmfk1649204189.png"),
  club("es-agboville", "ES Agboville", "civ-ligue-1", 0, "https://r2.thesportsdb.com/images/media/team/badge/icb4qq1755367665.png"),

  // --- Giappone — J1 League ---
  club("kashima-antlers", "Kashima Antlers", "jpn-j1-league", 3, "https://r2.thesportsdb.com/images/media/team/badge/2s8ady1578238881.png"),
  club("urawa-red-diamonds", "Urawa Red Diamonds", "jpn-j1-league", 3, "https://r2.thesportsdb.com/images/media/team/badge/ce3lhk1578239741.png"),
  club("yokohama-f-marinos", "Yokohama F. Marinos", "jpn-j1-league", 2, "https://r2.thesportsdb.com/images/media/team/badge/rgeshm1578240000.png"),
  club("kawasaki-frontale", "Kawasaki Frontale", "jpn-j1-league", 2, "https://r2.thesportsdb.com/images/media/team/badge/c6pot51578239112.png"),
  club("gamba-osaka", "Gamba Osaka", "jpn-j1-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/tq9edk1638813311.png"),
  club("vissel-kobe", "Vissel Kobe", "jpn-j1-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/2axjch1578239819.png"),
  club("fc-tokyo", "FC Tokyo", "jpn-j1-league", 0, "https://r2.thesportsdb.com/images/media/team/badge/9ls6lr1698754779.png"),
  club("nagoya-grampus", "Nagoya Grampus", "jpn-j1-league", 0, "https://r2.thesportsdb.com/images/media/team/badge/a1ucr01706244426.png"),

  // --- Corea del Sud — K League 1 ---
  club("jeonbuk-hyundai-motors", "Jeonbuk Hyundai Motors", "kor-k-league-1", 3, "https://r2.thesportsdb.com/images/media/team/badge/8jif3b1747853225.png"),
  club("ulsan-hd", "Ulsan HD", "kor-k-league-1", 3, "https://r2.thesportsdb.com/images/media/team/badge/0wooic1706533767.png"),
  club("pohang-steelers", "Pohang Steelers", "kor-k-league-1", 2, "https://r2.thesportsdb.com/images/media/team/badge/63jst01769097748.png"),
  club("fc-seoul", "FC Seoul", "kor-k-league-1", 2, "https://r2.thesportsdb.com/images/media/team/badge/31z1zf1579473186.png"),
  club("jeju-sk", "Jeju SK", "kor-k-league-1", 1, "https://r2.thesportsdb.com/images/media/team/badge/hna7ae1736207131.png"),
  club("gangwon-fc", "Gangwon FC", "kor-k-league-1", 1, "https://r2.thesportsdb.com/images/media/team/badge/c4igx71579729617.png"),
  club("daegu-fc", "Daegu FC", "kor-k-league-1", 0, "https://r2.thesportsdb.com/images/media/team/badge/xzjzn11579473073.png"),
  club("gwangju-fc", "Gwangju FC", "kor-k-league-1", 0, "https://r2.thesportsdb.com/images/media/team/badge/uuzr4x1579473084.png"),

  // --- Australia — A-League Men ---
  club("sydney-fc", "Sydney FC", "aus-a-league", 3, "https://r2.thesportsdb.com/images/media/team/badge/utgq8z1546110747.png"),
  club("melbourne-victory", "Melbourne Victory", "aus-a-league", 3, "https://r2.thesportsdb.com/images/media/team/badge/wwvsqx1473454564.png"),
  club("melbourne-city", "Melbourne City", "aus-a-league", 2, "https://r2.thesportsdb.com/images/media/team/badge/rkeqme1603301840.png"),
  club("western-sydney-wanderers", "Western Sydney Wanderers", "aus-a-league", 2, "https://r2.thesportsdb.com/images/media/team/badge/yotugj1759632879.png"),
  club("brisbane-roar", "Brisbane Roar", "aus-a-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/sypxsu1473454634.png"),
  club("central-coast-mariners", "Central Coast Mariners", "aus-a-league", 1, "https://r2.thesportsdb.com/images/media/team/badge/ncdx4p1759642161.png"),
  club("adelaide-united", "Adelaide United", "aus-a-league", 0, "https://r2.thesportsdb.com/images/media/team/badge/wpyuwv1473454602.png"),
  club("perth-glory", "Perth Glory", "aus-a-league", 0, "https://r2.thesportsdb.com/images/media/team/badge/2c9k5p1679114095.png"),
];

export function getLeague(id: string): League | undefined {
  return leagueById.get(id);
}

export function getClub(id: string): Club | undefined {
  return clubs.find((c) => c.id === id);
}

export function clubsByCountry(country: string): Club[] {
  return clubs.filter((c) => c.country === country);
}

export function clubsByTier(country: string, tier: number): Club[] {
  return clubs.filter((c) => c.country === country && c.tier === tier);
}

/** La lega di un dato paese/tier, se esiste — usato per promozione/retrocessione. */
export function leagueForTier(country: string, tier: number): League | undefined {
  return leagues.find((l) => l.country === country && l.tier === tier);
}
