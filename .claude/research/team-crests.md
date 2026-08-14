# Stemmi club e competizioni — URL hotlink (TheSportsDB)

> Ricerca di sola lettura. Nessuna immagine è stata scaricata: tutti i valori sotto sono URL
> pubblici testuali pensati per l'uso in `<img src="...">` (hotlink). Fonte primaria:
> [TheSportsDB](https://www.thesportsdb.com/api.php) — API JSON pubblica.
> Dati raccolti il 2026-08-04 interrogando `https://www.thesportsdb.com/api/v1/json/123/...`.

## 1. Termini d'uso — riepilogo e citazioni

Fonti lette direttamente: [Terms of Use](https://www.thesportsdb.com/docs_terms_of_use.php),
[api.php](https://www.thesportsdb.com/api.php), [free_sports_api](https://www.thesportsdb.com/free_sports_api),
[documentation](https://www.thesportsdb.com/documentation).

- **Chiave API pubblica di test**: la doc attuale (agosto 2026) dichiara esplicitamente
  *"The current free API key is: **123**"*. La chiave `3` citata in vecchie guide/esempi in giro
  per il web **non è più quella corrente** — usare `123` (o registrarsi per una chiave dedicata,
  vedi sotto). Non risulta un obbligo di account per usare la chiave pubblica `123` sugli endpoint
  v1 di lettura.
- **Rate limit**: *"Free users 30 requests per minute."* Nessun limite giornaliero dichiarato sulla
  pagina.
- **Uso gratuito — cosa è permesso**: *"You may use our API to lookup data and artwork for your
  development projects."* → hotlink di badge/artwork in un progetto in sviluppo è coperto.
- **Vincolo importante sulla pubblicazione**: *"You cannot publish apps to an appstore unless you
  are a paid subscriber."* Questo vincolo parla esplicitamente di pubblicazione su **app store**
  (Apple/Google). Non è chiaro se un'app web/browser-based (non distribuita su store) rientri in
  questa restrizione — la formulazione letterale la esclude, ma è un'area grigia che l'utente
  dovrebbe valutare prima di lanciare pubblicamente il progetto. Se in futuro l'app verrà
  impacchettata per uno store, serve l'abbonamento a pagamento ($9/mese via Patreon, che dà anche
  "a dedicated production API key" e accesso alla V2 API).
- **Artwork e attribuzione**: per artwork "custom" del sito, *"you must not pass it off as your
  own and should link back to our website where appropriate."* Per i loghi sportivi ufficiali
  (marchi registrati, cioè esattamente il caso degli stemmi club): *"Any trademarked sports logos
  must be used 'As is' and should not be modifed in any way."* — quindi niente ricolorazioni/crop
  dei badge dei club.
- **Copyright/trademark notice**: *"You also cannot remove or alter any copyright or trademark
  notices."*
- **Scraping**: *"You can scrape, copy and modify any content returned from the API, as long as
  you use the official end points. Please do not scrape our website."* — quindi va bene leggere i
  JSON degli endpoint ufficiali, non va bene fare scraping HTML del sito.
- **Rivendita**: *"You cannot resell our API in any way without specific permission."*
- **Licenza per-immagine**: esiste un tag `strCreativeCommons` sull'artwork dei giocatori per
  verificarne la licenza CC — non presente sui badge dei club nei payload controllati qui.

**In sintesi per l'utente**: per un progetto hobbistico/fan-made in sviluppo, in hotlink, non
pubblicato su app store, l'uso della chiave pubblica `123` per leggere badge di squadre e leghe
sembra coperto dai termini attuali. Da tenere a mente: rate limit 30 req/min, badge "as is" senza
modifiche, link di attribuzione "where appropriate", e la clausola sull'app store se in futuro si
distribuisce l'app tramite store.

## 2. Club — URL stemma

Tutti gli 84 club di `src/data/clubs.ts` sono stati trovati su TheSportsDB. Endpoint usato:
`GET https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=<nome>`.
Colonna "TSDB idTeam" = id squadra su TheSportsDB (utile per richieste future, es. lookup diretto).

### Italia — Serie A

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| juventus | Juventus | 133676 | https://r2.thesportsdb.com/images/media/team/badge/uxf0gr1742983727.png |
| inter | Inter | 133681 | https://r2.thesportsdb.com/images/media/team/badge/ryhu6d1617113103.png |
| ac-milan | AC Milan | 133667 | https://r2.thesportsdb.com/images/media/team/badge/wvspur1448806617.png |
| napoli | Napoli | 133670 | https://r2.thesportsdb.com/images/media/team/badge/l8qyxv1742982541.png |
| roma | Roma | 133682 | https://r2.thesportsdb.com/images/media/team/badge/jwro2s1760820674.png |
| atalanta | Atalanta | 134782 | https://r2.thesportsdb.com/images/media/team/badge/qix5ku1780561327.png |
| fiorentina | Fiorentina | 133674 | https://r2.thesportsdb.com/images/media/team/badge/hc8nhu1656098030.png |
| lazio | Lazio | 133668 | https://r2.thesportsdb.com/images/media/team/badge/rwqyvs1448806608.png |
| bologna | Bologna | 134781 | https://r2.thesportsdb.com/images/media/team/badge/2qi1u31655592366.png |
| torino | Torino | 133687 | https://r2.thesportsdb.com/images/media/team/badge/xxprty1448806802.png |
| como | Como | 134243 | https://r2.thesportsdb.com/images/media/team/badge/02x81t1627405841.png |
| genoa | Genoa | 133675 | https://r2.thesportsdb.com/images/media/team/badge/52s8dn1655553600.png |
| udinese | Udinese | 133679 | https://r2.thesportsdb.com/images/media/team/badge/vwvstr1448806811.png |
| sassuolo | Sassuolo | 133701 | https://r2.thesportsdb.com/images/media/team/badge/xystvp1448806138.png |
| parma | Parma | 135728 | https://r2.thesportsdb.com/images/media/team/badge/6yiaxs1627406063.png |
| cagliari | Cagliari | 134783 | https://r2.thesportsdb.com/images/media/team/badge/wvsvxt1447534471.png |
| lecce | Lecce | 133678 | https://r2.thesportsdb.com/images/media/team/badge/j4vznr1567365249.png |
| monza | Monza | 134270 | https://r2.thesportsdb.com/images/media/team/badge/bxearg1603170113.png |
| venezia | Venezia | 134234 | https://r2.thesportsdb.com/images/media/team/badge/vbiget1781026964.png |
| frosinone | Frosinone | 133818 | https://r2.thesportsdb.com/images/media/team/badge/a7xa151603170120.png |

### Italia — Serie B

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| sampdoria | Sampdoria | 133683 | https://r2.thesportsdb.com/images/media/team/badge/pr6co21655592769.png |
| palermo | Palermo | 138166 | https://r2.thesportsdb.com/images/media/team/badge/zi1tb01579708939.png |
| bari | Bari | 133688 | https://r2.thesportsdb.com/images/media/team/badge/isfrtg1579724972.png |
| cesena | Cesena | 133669 | https://r2.thesportsdb.com/images/media/team/badge/9l00zr1677256723.png |
| modena | Modena | 133700 | https://r2.thesportsdb.com/images/media/team/badge/93n2wm1656015823.png |
| reggiana | Reggiana | 137121 | https://r2.thesportsdb.com/images/media/team/badge/dffx6o1600266770.png |
| cremonese | Cremonese | 134224 | https://r2.thesportsdb.com/images/media/team/badge/6ng2vy1579708291.png |
| catanzaro | Catanzaro | 134223 | https://r2.thesportsdb.com/images/media/team/badge/byrc5e1691995858.png |
| carrarese | Carrarese | 134666 | https://r2.thesportsdb.com/images/media/team/badge/njh6tl1651779724.png |
| pisa-sc | Pisa | 133859 | https://r2.thesportsdb.com/images/media/team/badge/2eso9w1579708309.png |

### Italia — Serie C

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| padova | Padova | 135950 | https://r2.thesportsdb.com/images/media/team/badge/hklo0i1579724992.png |
| pescara | Pescara | 133685 | https://r2.thesportsdb.com/images/media/team/badge/uywyxr1426869511.png |
| virtus-entella | Virtus Entella | 134633 | https://r2.thesportsdb.com/images/media/team/badge/c7yb5u1693457662.png |
| gubbio | Gubbio | 133698 | https://r2.thesportsdb.com/images/media/team/badge/el7zx61680802664.png |
| pontedera | Pontedera | 134675 | https://r2.thesportsdb.com/images/media/team/badge/emkgc41651779179.png |
| novara | Novara | 133673 | https://r2.thesportsdb.com/images/media/team/badge/urbkrr1675352937.png |
| triestina | Triestina | 133821 | https://r2.thesportsdb.com/images/media/team/badge/13hyc21533752996.png |

### Inghilterra — Premier League

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| manchester-city | Manchester City | 133613 | https://r2.thesportsdb.com/images/media/team/badge/vwpvry1467462651.png |
| liverpool | Liverpool | 133602 | https://r2.thesportsdb.com/images/media/team/badge/kfaher1737969724.png |
| arsenal | Arsenal | 133604 | https://r2.thesportsdb.com/images/media/team/badge/uyhbfe1612467038.png |
| manchester-united | Manchester United | 133612 | https://r2.thesportsdb.com/images/media/team/badge/xzqdr11517660252.png |
| chelsea | Chelsea | 133610 | https://www.thesportsdb.com/images/media/team/badge/pbf4ul1782638263.png |
| tottenham | Tottenham Hotspur | 133616 | https://r2.thesportsdb.com/images/media/team/badge/dfyfhl1604094109.png |
| newcastle | Newcastle United | 134777 | https://r2.thesportsdb.com/images/media/team/badge/lhwuiz1621593302.png |
| aston-villa | Aston Villa | 133601 | https://www.thesportsdb.com/images/media/team/badge/97mehy1784645865.png |
| brighton | Brighton & Hove Albion | 133619 | https://r2.thesportsdb.com/images/media/team/badge/ywypts1448810904.png |
| everton | Everton | 133615 | https://r2.thesportsdb.com/images/media/team/badge/eqayrf1523184794.png |
| sunderland | Sunderland | 133603 | https://r2.thesportsdb.com/images/media/team/badge/tprtus1448813498.png |
| leeds-united | Leeds United | 133635 | https://r2.thesportsdb.com/images/media/team/badge/jcgrml1756649030.png |
| coventry-city | Coventry City | 133625 | https://r2.thesportsdb.com/images/media/team/badge/uxyqys1424033798.png |
| crystal-palace | Crystal Palace | 133632 | https://r2.thesportsdb.com/images/media/team/badge/ia6i3m1656014992.png |
| fulham | Fulham | 133600 | https://r2.thesportsdb.com/images/media/team/badge/xwwvyt1448811086.png |
| nottingham-forest | Nottingham Forest | 133720 | https://r2.thesportsdb.com/images/media/team/badge/sar2y41781740886.png |
| bournemouth | Bournemouth | 134301 | https://r2.thesportsdb.com/images/media/team/badge/y08nak1534071116.png |
| brentford | Brentford | 134355 | https://r2.thesportsdb.com/images/media/team/badge/grv1aw1546453779.png |
| hull-city | Hull City | 133617 | https://r2.thesportsdb.com/images/media/team/badge/fbqqda1601726113.png |
| ipswich-town | Ipswich Town | 133622 | https://r2.thesportsdb.com/images/media/team/badge/mdj1ey1634670785.png |

### Inghilterra — Championship

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| southampton | Southampton | 134778 | https://r2.thesportsdb.com/images/media/team/badge/ggqtd01621593274.png |
| norwich-city | Norwich City | 133608 | https://r2.thesportsdb.com/images/media/team/badge/pabczm1679951464.png |
| west-brom | West Bromwich Albion | 133611 | https://r2.thesportsdb.com/images/media/team/badge/rsvuxw1448813527.png |
| preston | Preston North End | 133809 | https://r2.thesportsdb.com/images/media/team/badge/wqtwvw1448811512.png |
| middlesbrough | Middlesbrough | 133628 | https://r2.thesportsdb.com/images/media/team/badge/advjg71780068902.png |
| west-ham | West Ham United | 133636 | https://r2.thesportsdb.com/images/media/team/badge/yutyxs1467459956.png |
| wolves | Wolverhampton Wanderers | 133599 | https://r2.thesportsdb.com/images/media/team/badge/u9qr031621593327.png |

### Spagna — La Liga

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| real-madrid | Real Madrid | 133738 | https://r2.thesportsdb.com/images/media/team/badge/vwvwrw1473502969.png |
| barcelona | Barcelona | 133739 | https://r2.thesportsdb.com/images/media/team/badge/wq9sir1639406443.png |
| atletico-madrid | Atlético Madrid | 133729 | https://r2.thesportsdb.com/images/media/team/badge/0ulh3q1719984315.png |
| sevilla | Sevilla | 133735 | https://r2.thesportsdb.com/images/media/team/badge/vpsqqx1473502977.png |
| real-sociedad | Real Sociedad | 133724 | https://r2.thesportsdb.com/images/media/team/badge/vptvpr1473502986.png |
| real-betis | Real Betis | 133722 | https://r2.thesportsdb.com/images/media/team/badge/2oqulv1663245386.png |
| villarreal | Villarreal | 133740 | https://r2.thesportsdb.com/images/media/team/badge/vrypqy1473503073.png |
| athletic-bilbao | Athletic Bilbao | 133727 | https://r2.thesportsdb.com/images/media/team/badge/68w7fe1639408210.png |
| valencia | Valencia | 133725 | https://r2.thesportsdb.com/images/media/team/badge/dm8l6o1655594864.png |
| levante | Levante | 133732 | https://r2.thesportsdb.com/images/media/team/badge/xwtxsx1473503739.png |
| malaga | Málaga | 133736 | https://r2.thesportsdb.com/images/media/team/badge/upqyvr1473502952.png |
| racing-santander | Racing Santander | 133726 | https://r2.thesportsdb.com/images/media/team/badge/97kkiq1536575158.png |
| celta-vigo | Celta Vigo | 133937 | https://r2.thesportsdb.com/images/media/team/badge/xfjtku1690436219.png |
| espanyol | Espanyol | 133734 | https://r2.thesportsdb.com/images/media/team/badge/867nzz1681703222.png |
| osasuna | Osasuna | 133730 | https://r2.thesportsdb.com/images/media/team/badge/rvspvt1473502960.png |
| alaves | Alavés | 134221 | https://r2.thesportsdb.com/images/media/team/badge/mfn99h1734673842.png |
| deportivo-la-coruna | Deportivo La Coruña | 133816 | https://www.thesportsdb.com/images/media/team/badge/62bvwv1783013156.png |
| elche | Elche | 134384 | https://r2.thesportsdb.com/images/media/team/badge/e4vaw51655594332.png |
| getafe | Getafe | 133731 | https://r2.thesportsdb.com/images/media/team/badge/eyh2891655594452.png |
| rayo-vallecano | Rayo Vallecano | 133728 | https://r2.thesportsdb.com/images/media/team/badge/nzhu941655595465.png |

### Spagna — LaLiga 2

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| las-palmas | Las Palmas | 134259 | https://r2.thesportsdb.com/images/media/team/badge/mmhyb11616443601.png |
| real-oviedo | Real Oviedo | 135455 | https://r2.thesportsdb.com/images/media/team/badge/yuwqus1447590681.png |
| sporting-gijon | Sporting Gijón | 133723 | https://r2.thesportsdb.com/images/media/team/badge/xxrtqx1473503054.png |
| eibar | Eibar | 134626 | https://r2.thesportsdb.com/images/media/team/badge/hccive1680933599.png |
| albacete | Albacete | 134232 | https://r2.thesportsdb.com/images/media/team/badge/17oqja1616436316.png |
| girona | Girona | 134700 | https://r2.thesportsdb.com/images/media/team/badge/kfu7zu1659897499.png |

> Nota: cercando "Sporting Gijon" senza accento, TheSportsDB restituiva prima "Sporting Atlético"
> (la squadra riserve/B del club) invece del club principale. Risolto cercando "Sporting de Gijón",
> che dà idTeam 133723 (prima squadra, milita in Segunda División). Verificare comunque a vista
> prima dell'uso in app.

### Brasile — Série A

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| flamengo | Flamengo | 134287 | https://r2.thesportsdb.com/images/media/team/badge/syptwx1473538074.png |
| palmeiras | Palmeiras | 134465 | https://r2.thesportsdb.com/images/media/team/badge/vsqwqp1473538105.png |
| sao-paulo | São Paulo | 134291 | https://r2.thesportsdb.com/images/media/team/badge/sxpupx1473538135.png |
| corinthians | Corinthians | 134284 | https://r2.thesportsdb.com/images/media/team/badge/vvuvps1473538042.png |
| gremio | Grêmio | 134288 | https://r2.thesportsdb.com/images/media/team/badge/uvpwyt1473538089.png |
| internacional | Internacional | 134281 | https://r2.thesportsdb.com/images/media/team/badge/yprvxx1473538097.png |
| fluminense | Fluminense | 134296 | https://r2.thesportsdb.com/images/media/team/badge/stvvwp1473538082.png |
| atletico-mineiro | Atlético Mineiro | 134299 | https://r2.thesportsdb.com/images/media/team/badge/x5lixs1743742872.png |
| cruzeiro | Cruzeiro | 134294 | https://r2.thesportsdb.com/images/media/team/badge/upsvvu1473538059.png |
| botafogo | Botafogo | 134285 | https://r2.thesportsdb.com/images/media/team/badge/bs5mbw1733004596.png |

### Brasile — Série B

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| remo | Remo | 137818 | https://r2.thesportsdb.com/images/media/team/badge/u36jfy1579341655.png |
| coritiba | Coritiba | 134298 | https://r2.thesportsdb.com/images/media/team/badge/ywwsyu1473538050.png |
| chapecoense | Chapecoense | 134464 | https://r2.thesportsdb.com/images/media/team/badge/wy0e1i1765900601.png |
| vila-nova | Vila Nova | 134734 | https://r2.thesportsdb.com/images/media/team/badge/nwd4ns1740851638.png |
| ponte-preta | Ponte Preta | 134290 | https://r2.thesportsdb.com/images/media/team/badge/wbss4d1644929547.png |
| nautico | Náutico | 134289 | https://r2.thesportsdb.com/images/media/team/badge/wywuwv1464886832.png |
| crb | CRB | 135680 | https://r2.thesportsdb.com/images/media/team/badge/vpypuq1472069179.png |
| avai | Avaí | 134738 | https://r2.thesportsdb.com/images/media/team/badge/bblkat1766506007.png |

**Copertura club: 84/84 trovati.** Nessun club mancante.

### Marocco — Botola Pro

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| wydad-casablanca | Wydad Casablanca | 136402 | https://r2.thesportsdb.com/images/media/team/badge/vio4271750784379.png |
| raja-casablanca | Raja Casablanca | 136404 | https://r2.thesportsdb.com/images/media/team/badge/1cg64m1551428003.png |
| far-rabat | FAR Rabat | 136403 | https://r2.thesportsdb.com/images/media/team/badge/jkjp961777421509.png |
| rs-berkane | RS Berkane | 137425 | https://r2.thesportsdb.com/images/media/team/badge/f296p91743053568.png |
| fus-rabat | FUS Rabat | 136410 | https://r2.thesportsdb.com/images/media/team/badge/vxk3aj1551518378.png |
| difaa-el-jadidi | Difaâ Hassani El Jadidi | 137426 | https://r2.thesportsdb.com/images/media/team/badge/v8y3qa1638560041.png |
| kawkab-marrakech | Kawkab Marrakech | 136407 | https://r2.thesportsdb.com/images/media/team/badge/7qfuus1551898115.png |
| chabab-mohammedia | Chabab Mohammédia | 136418 | https://r2.thesportsdb.com/images/media/team/badge/5evxcx1609193564.png |

> Prestige suggerito (3/3/2/2/1/1/0/0): Wydad (3, 22 titoli, il più decorato) e Raja (3, "il club
> del popolo", 12 titoli + 3x CAF Champions League) come big-two; FAR Rabat (2, 13 titoli storici)
> e RS Berkane (2, vincitore CAF Confederation Cup) come secondo livello; FUS Rabat (1, campione
> 2015-16) e Difaâ El Jadidi (1) come terzo; Kawkab Marrakech (0) e Chabab Mohammédia (0) come
> club minori. "AS FAR" (nome ufficiale completo, cercato per esteso) non trovato su TSDB con
> quella dicitura — risolto cercando "FAR Rabat", stesso club (Association Sportive des Forces
> Armées Royales). "Olympique Safi" cercato in due varianti, non trovato su TSDB — sostituito con
> Chabab Mohammédia (club reale, storico, verificato).

### Senegal — Ligue 1 Sénégalaise

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| asc-jaraaf | Jaraaf (ASC Jeanne d'Arc) | 139287 | https://r2.thesportsdb.com/images/media/team/badge/p25tdp1720157205.png |
| casa-sport | Casa Sport | 139294 | https://r2.thesportsdb.com/images/media/team/badge/0cqkoc1673938919.png |
| teungueth-fc | Teungueth FC | 139285 | https://r2.thesportsdb.com/images/media/team/badge/i6s10n1720157496.png |
| generation-foot | Génération Foot | 139286 | https://r2.thesportsdb.com/images/media/team/badge/i5glvd1720156796.png |
| diambars | Diambars FC | 139291 | https://r2.thesportsdb.com/images/media/team/badge/3ci0k01720156622.png |
| as-pikine | AS Pikine | 139292 | https://r2.thesportsdb.com/images/media/team/badge/xgrkyp1720157272.png |
| us-ouakam | US Ouakam | 149363 | https://r2.thesportsdb.com/images/media/team/badge/qbyvf91727194024.png |
| guediawaye-fc | Guédiawaye FC | 144163 | https://r2.thesportsdb.com/images/media/team/badge/vul8d71720157041.png |

> Prestige suggerito: Jaraaf (3, record 13-14 titoli) e Casa Sport (3, storico club di Ziguinchor,
> 2 titoli) come big-two; Teungueth FC (2, campione 2025-26, miglior difesa) e Génération Foot (2,
> famosa accademia — Sadio Mané —, miglior attacco 2025-26) come secondo livello; Diambars FC (1)
> e AS Pikine (1) come terzo; US Ouakam (0) e Guédiawaye FC (0) come club minori. TSDB restituisce
> nomi leggermente abbreviati rispetto al nome ufficiale completo (es. "Jaraaf" invece di "ASC
> Jeanne d'Arc/Jaraaf", "Casa Sport" al singolare invece di "Casa Sports", "Pikine" invece di "AS
> Pikine") — normale per l'API, non un problema per l'hotlink.

### Nigeria — Nigeria Professional Football League (NPFL)

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| enyimba | Enyimba International | 139746 | https://r2.thesportsdb.com/images/media/team/badge/27km6p1720154537.png |
| kano-pillars | Kano Pillars | 139751 | https://r2.thesportsdb.com/images/media/team/badge/bgleh01589375519.png |
| rangers-international | Rangers International (Enugu Rangers) | 139911 | https://r2.thesportsdb.com/images/media/team/badge/j6uqt31720154917.png |
| rivers-united | Rivers United | 139914 | https://r2.thesportsdb.com/images/media/team/badge/4atnuh1720155248.png |
| plateau-united | Plateau United | 139910 | https://r2.thesportsdb.com/images/media/team/badge/2z80yh1720154812.png |
| akwa-united | Akwa United | 139905 | https://r2.thesportsdb.com/images/media/team/badge/e087l51590183336.png |
| sunshine-stars | Sunshine Stars | 139917 | https://r2.thesportsdb.com/images/media/team/badge/9s5g3t1590183469.png |
| shooting-stars | Shooting Stars (3SC) | 144674 | https://r2.thesportsdb.com/images/media/team/badge/uk3c7q1720155122.png |

> Prestige suggerito: Enyimba (3, 9 titoli, 2x CAF Champions League 2003/2004) e Kano Pillars (3,
> rivalità storica con Enyimba, entrambi mai fuori dalla top-8 per 12 stagioni consecutive) come
> big-two; Rangers International (2, 9 titoli storici come Enugu Rangers) e Rivers United (2,
> presenza CAF costante) come secondo livello; Plateau United (1) e Akwa United (1) come terzo;
> Sunshine Stars (0) e Shooting Stars/3SC (0) come club minori.

### Ghana — Ghana Premier League

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| asante-kotoko | Asante Kotoko | 137741 | https://r2.thesportsdb.com/images/media/team/badge/u1mppc1578401554.png |
| hearts-of-oak | Accra Hearts of Oak | 141199 | https://r2.thesportsdb.com/images/media/team/badge/v3eyvw1617287212.png |
| aduana-stars | Aduana Stars | 141190 | https://r2.thesportsdb.com/images/media/team/badge/5qeyq71617287049.png |
| medeama-sc | Medeama SC | 141205 | https://r2.thesportsdb.com/images/media/team/badge/p8p3jr1617287252.png |
| bechem-united | Bechem United | 141192 | https://r2.thesportsdb.com/images/media/team/badge/y3uo7z1720155733.png |
| berekum-chelsea | Berekum Chelsea | 141193 | https://r2.thesportsdb.com/images/media/team/badge/tu3hvi1694900545.png |
| king-faisal | King Faisal Babes | 141202 | https://r2.thesportsdb.com/images/media/team/badge/tzfizy1617287235.png |
| karela-united | Karela United | 141201 | https://r2.thesportsdb.com/images/media/team/badge/wx2ydh1617287231.png |

> Prestige suggerito: Asante Kotoko (3, 21 titoli, 2x CAF Champions League) e Hearts of Oak (3, 21
> titoli, rivalità "Super Clash") come big-two; Aduana Stars (2) e Medeama SC (2, ha tenuto Kotoko
> e Hearts fuori dal vertice in stagioni recenti) come secondo livello; Bechem United (1) e
> Berekum Chelsea (1) come terzo; King Faisal Babes (0) e Karela United (0) come club minori.

### Egitto — Egyptian Premier League

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| al-ahly | Al Ahly | 138995 | https://r2.thesportsdb.com/images/media/team/badge/x8753q1751421890.png |
| zamalek | Zamalek | 138997 | https://r2.thesportsdb.com/images/media/team/badge/tgekj81580930027.png |
| pyramids-fc | Pyramids FC | 139838 | https://r2.thesportsdb.com/images/media/team/badge/8liy611607352549.png |
| ismaily | Ismaily SC | 139843 | https://r2.thesportsdb.com/images/media/team/badge/1g46qo1589807617.png |
| al-masry | Al Masry | 139844 | https://r2.thesportsdb.com/images/media/team/badge/3aw86h1589807260.png |
| enppi | ENPPI | 139841 | https://r2.thesportsdb.com/images/media/team/badge/uht79n1589807327.png |
| ceramica-cleopatra | Ceramica Cleopatra | 140795 | https://r2.thesportsdb.com/images/media/team/badge/xy4shs1751422167.png |
| smouha | Smouha SC | 139840 | https://r2.thesportsdb.com/images/media/team/badge/qq4pkd1589807413.png |

> Prestige suggerito: Al Ahly (3, 45 titoli, club più decorato d'Africa) e Zamalek (3, 14 titoli,
> acerrimo rivale) come big-two; Pyramids FC (2, club recente/ambizioso, molto competitivo) e
> Ismaily SC (2, storicamente la "terza forza" del calcio egiziano) come secondo livello; Al Masry
> (1) e ENPPI (1) come terzo; Ceramica Cleopatra (0, campione Egyptian League Cup 2024, ma ancora
> minore in campionato) e Smouha SC (0) come club minori.

### Costa d'Avorio — Ligue 1 (Côte d'Ivoire)

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| asec-mimosas | ASEC Mimosas | 139744 | https://r2.thesportsdb.com/images/media/team/badge/b9e1cr1589312301.png |
| stade-abidjan | Stade d'Abidjan | 146972 | https://r2.thesportsdb.com/images/media/team/badge/zr19ao1776292889.png |
| fc-san-pedro | FC San Pédro | 142431 | https://r2.thesportsdb.com/images/media/team/badge/3hjar61708390704.png |
| rc-abidjan | Racing Club Abidjan | 140649 | https://www.thesportsdb.com/images/media/team/badge/ou01i81784654220.png |
| afad-djekanou | AFAD Djékanou | 145378 | https://r2.thesportsdb.com/images/media/team/badge/j0le3l1649203762.png |
| isca | ISCA | 152897 | https://r2.thesportsdb.com/images/media/team/badge/u4i9c91755367271.png |
| bouake | Bouaké | 145380 | https://r2.thesportsdb.com/images/media/team/badge/98rmfk1649204189.png |
| es-agboville | ES Agboville | 152899 | https://r2.thesportsdb.com/images/media/team/badge/icb4qq1755367665.png |

> **Copertura TSDB debole su questo paese**: "Africa Sports d'Abidjan" (storico rivale di ASEC
> Mimosas, il candidato naturale per il secondo posto "prestige 3") e "Séwé Sport" **non sono
> stati trovati** su TheSportsDB nonostante diverse varianti di nome tentate (con/senza "d'",
> "Abidjan"/"National", ecc.) — sostituiti rispettivamente con Stade d'Abidjan (club reale,
> storico: 6 titoli 1962-1969 + titolo 2025 dopo 56 anni di attesa, verificato) e FC San Pédro
> (già scelto). Gli altri 5 club (AFAD Djékanou/RC Abidjan/ISCA/Bouaké/ES Agboville) sono stati
> trovati tramite il roster corrente della lega (`search_all_teams.php?l=Ivory Coast Ligue 1`,
> senza `&s=Soccer` — con quel parametro l'endpoint dava errore "Invalid League ID passed" per
> tutti i paesi di questa ricerca, risolto omettendolo), non tramite ricerca nominale mirata: sono
> club reali e verificati, ma meno "di richiamo" per un giocatore rispetto ai big storici — accettato
> per via della copertura debole. Prestige suggerito: ASEC Mimosas (3, 29 titoli, unico club
> ivoriano a vincere la CAF Champions League nel 1998) e Stade d'Abidjan (3, storico, titolo 2025)
> come big-two; FC San Pédro (2, qualificazione CAF Confederation Cup 2020-21) e Racing Club
> Abidjan (2, club di lunga presenza in Ligue 1) come secondo livello; AFAD Djékanou (1) e ISCA (1)
> come terzo; Bouaké (0) e ES Agboville (0) come club minori.

**Copertura club Marocco/Senegal/Nigeria/Ghana/Egitto/Costa d'Avorio: 48/48 trovati** (6 paesi ×
8 club), tutti con `crestUrl` verificato live su TheSportsDB il 2026-08-06. 3 sostituzioni rispetto
alla rosa inizialmente ipotizzata per assenza di copertura TSDB (Olympique Safi → Chabab
Mohammédia; Africa Sports d'Abidjan → Stade d'Abidjan; Séwé Sport → non necessario, sostituito da
FC San Pédro già in lista) — vedi note sopra per il dettaglio.

## 2bis. Club — Messico, Stati Uniti, Canada (CONCACAF) — ricerca 2026-08-06

> Estensione per dare club reali a Messico, Stati Uniti, Canada (nazionalità già presenti in
> `src/data/countries.ts` ma con 0 club in `src/data/clubs.ts`). Stesso metodo delle sezioni sopra:
> `searchteams.php?t=<nome>` per i club, `lookupleague.php?id=<id>` per leghe/coppe, chiave
> pubblica `123`. Ogni URL verificato individualmente con una richiesta diretta (HTTP 200,
> `image/png`) prima di essere riportato qui — non solo letto dal payload JSON.
>
> **Nota tecnica**: il campo badge nel payload `searchteams.php` si chiama `strBadge` (non
> `strTeamBadge`) — stesso dato delle sezioni precedenti, nome campo corretto per chi rifà questa
> ricerca in futuro.
> **Nota rate limit**: durante questa sessione TheSportsDB ha restituito ripetuti errori Cloudflare
> `1015` (rate limit edge, più aggressivo del "30 richieste/minuto" dichiarato nei Termini) —
> risolto spaziando le richieste di ~5-8s l'una dall'altra con retry automatico, nessun impatto sui
> dati riportati (solo sul tempo impiegato).

### Messico — Liga MX

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| america | América | 134193 | https://r2.thesportsdb.com/images/media/team/badge/amy1xs1581857392.png |
| cruz-azul | Cruz Azul | 134196 | https://r2.thesportsdb.com/images/media/team/badge/wcd2yi1781543370.png |
| guadalajara | CD Guadalajara (Chivas) | 134206 | https://r2.thesportsdb.com/images/media/team/badge/mp1box1593452087.png |
| toluca | Toluca | 134204 | https://r2.thesportsdb.com/images/media/team/badge/y64wy91523913186.png |
| tigres-uanl | Tigres UANL | 134197 | https://r2.thesportsdb.com/images/media/team/badge/lh80fx1701423708.png |
| monterrey | Monterrey | 134198 | https://r2.thesportsdb.com/images/media/team/badge/yglj911721542561.png |
| necaxa | Necaxa | 135662 | https://r2.thesportsdb.com/images/media/team/badge/tqdk9e1779772432.png |
| puebla | Puebla | 134199 | https://r2.thesportsdb.com/images/media/team/badge/h0jgg51593451845.png |

Prestige assegnato (0-3, distribuzione 3/3/2/2/1/1/0/0 per stature/storia trofei reali — América 42
trofei complessivi e Cruz Azul 27 sono i due maggiori tra gli 8 scelti, Necaxa e Puebla i due
minori): **america 3, cruz-azul 3, guadalajara 2, toluca 2, tigres-uanl 1, monterrey 1, necaxa 0,
puebla 0.**

**Coppa nazionale**: **nessuna coppa nazionale attiva.** La Copa MX è stata sospesa dopo l'edizione
2019-20 (calendario compresso per le qualificazioni al Mondiale 2026 co-ospitato dal Messico) e non
risulta rivista al 2026 — confermato sia da ricerca web (nessuna edizione successiva alla 2019-20,
futuro "incerto" secondo le fonti consultate) sia dall'assenza della lega in
`search_all_leagues.php?c=Mexico&s=Soccer` su TheSportsDB (solo 4 competizioni messicane presenti:
Liga MX, Liga de Expansión MX, Liga Femenil, Campeón de Campeones — nessuna Copa MX). La "Leagues
Cup" (Liga MX vs MLS) esiste ma è una competizione internazionale incrociata con gli USA, non una
coppa nazionale messicana — fuori scope qui.

### Stati Uniti — MLS

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| la-galaxy | LA Galaxy | 134153 | https://r2.thesportsdb.com/images/media/team/badge/ysyysr1420227188.png |
| dc-united | D.C. United | 134145 | https://r2.thesportsdb.com/images/media/team/badge/uwvsyt1467462609.png |
| columbus-crew | Columbus Crew | 134152 | https://r2.thesportsdb.com/images/media/team/badge/dzs8cp1629059854.png |
| seattle-sounders | Seattle Sounders FC | 134149 | https://r2.thesportsdb.com/images/media/team/badge/2dy5cx1706711036.png |
| atlanta-united | Atlanta United FC | 135851 | https://r2.thesportsdb.com/images/media/team/badge/ej091x1602103070.png |
| lafc | Los Angeles FC | 136050 | https://r2.thesportsdb.com/images/media/team/badge/7nbj2a1602103638.png |
| new-york-red-bulls | New York Red Bulls | 134156 | https://r2.thesportsdb.com/images/media/team/badge/suytvy1473536462.png |
| philadelphia-union | Philadelphia Union | 134142 | https://r2.thesportsdb.com/images/media/team/badge/gyznyo1602103682.png |

Prestige assegnato (basato sui titoli MLS Cup all-time: LA Galaxy 6 e D.C. United 4 sono i due
maggiori tra gli 8 scelti; New York Red Bulls e Philadelphia Union non hanno mai vinto una MLS Cup
nonostante siano club storici/molto seguiti, i due minori qui): **la-galaxy 3, dc-united 3,
columbus-crew 2 (3 MLS Cup), seattle-sounders 2 (2 MLS Cup + CONCACAF Champions Cup 2022),
atlanta-united 1 (1 MLS Cup 2018, record di affluenza MLS), lafc 1 (1 MLS Cup 2022 + CONCACAF
Champions Cup 2023), new-york-red-bulls 0, philadelphia-union 0.**

**Coppa nazionale**: **Lamar Hunt US Open Cup**, tuttora attiva (edizione 2026 in corso, 111ª
edizione, 48 squadre professionistiche + qualificazioni, finale 21 ottobre 2026), confermata sia da
ricerca web sia da TheSportsDB (`lookupleague.php?id=5199`, `strLeague` = "US Open Cup").

### Canada — Canadian Premier League

> **Scelta di lega — nota esplicita**: il calcio canadese è diviso tra 3 club canadesi che giocano
> nella MLS (lega statunitense — Toronto FC, CF Montréal, Vancouver Whitecaps FC) e la **Canadian
> Premier League** (CPL), il campionato di prima divisione **sanzionato da Canada Soccer** con sole
> squadre canadesi. Scelta: **CPL**, per due motivi — (1) è la lega che la federazione nazionale
> riconosce come massima divisione del paese, mentre i 3 club MLS giocano nel campionato di un
> altro paese; (2) la CPL ha esattamente 8 squadre nella stagione 2026, un fit naturale per il
> numero di club richiesto da questa ricerca, mentre i soli 3 club MLS canadesi non sarebbero
> bastati. Il roster scelto sotto **coincide con le 8 squadre della stagione CPL 2026** confermata
> via ricerca web (Wikipedia/Northern Tribune): Atlético Ottawa, Cavalry FC, Forge FC, HFX
> Wanderers FC, Inter Toronto FC (ex York United/York9, ribattezzata per il 2026), Pacific FC, FC
> Supra du Québec (nuovo club, esordio 2026, Laval QC), Vancouver FC. **Valour FC** (Winnipeg,
> socio fondatore CPL) è stato escluso perché ha sospeso le attività a novembre 2025 (confermato
> anche da TheSportsDB: il suo `strLeague` è ora `"_No League Soccer"` invece di `"Canadian
> Premier League"`) — sostituito nel roster 2026 da FC Supra du Québec, il suo rimpiazzo effettivo
> nella lega.

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| forge-fc | Forge FC | 139321 | https://r2.thesportsdb.com/images/media/team/badge/48dk0h1582572865.png |
| cavalry-fc | Cavalry FC | 139462 | https://r2.thesportsdb.com/images/media/team/badge/gpi5qj1583351269.png |
| atletico-ottawa | Atlético Ottawa | 139461 | https://r2.thesportsdb.com/images/media/team/badge/k5gzuw1583351260.png |
| pacific-fc | Pacific FC | 139464 | https://r2.thesportsdb.com/images/media/team/badge/6qzhpj1583351283.png |
| inter-toronto | Inter Toronto FC (ex York United/York9) | 139466 | https://r2.thesportsdb.com/images/media/team/badge/kevy591770133070.png |
| hfx-wanderers | HFX Wanderers FC | 139463 | https://r2.thesportsdb.com/images/media/team/badge/uqkf0n1583351277.png |
| vancouver-fc | Vancouver FC | 147076 | https://r2.thesportsdb.com/images/media/team/badge/map6vh1770132710.png |
| fc-supra-quebec | FC Supra du Québec | 154611 | https://www.thesportsdb.com/images/media/team/badge/lm3a4f1784038568.png |

Prestige assegnato (basato su titoli CPL all-time + stature attuale: Forge FC, 4 titoli
2019/2020/2021/2023, è il più decorato; Cavalry FC campione 2024 + più volte finalista; Atlético
Ottawa campione 2025 [finale nella neve, 2-1 su Cavalry] + sostegno finanziario Atlético Madrid;
Pacific FC campione 2021; Inter Toronto/York United socio fondatore ma mai campione; HFX Wanderers
socio fondatore; Vancouver FC identità più recente, rebrand 2023 di Valley FC; FC Supra du Québec
esordiente 2026, zero storia): **forge-fc 3, cavalry-fc 3, atletico-ottawa 2, pacific-fc 2,
inter-toronto 1, hfx-wanderers 1, vancouver-fc 0, fc-supra-quebec 0.**

**Coppa nazionale**: **Canadian Championship** (Voyageurs Cup), tuttora attiva (edizione 2026, 19ª,
15 squadre da 6 leghe incluse le 8 CPL + le 3 MLS canadesi, 5 maggio–21 ottobre 2026), confermata
sia da ricerca web sia da TheSportsDB (`lookupleague.php?id=5922`, `strLeague` = "Canadian
Championship"). Nota: il badge CONCACAF Champions Cup (competizione per club a livello di
confederazione) è **fuori scope di questa ricerca** — va aggiunto separatamente da chi cabla la
coppa confederale.

**Copertura club: 24/24 trovati** (8 Messico + 8 Stati Uniti + 8 Canada). Nessun club mancante.

## 2ter. Club — Giappone, Corea del Sud, Australia (AFC) — ricerca 2026-08-06

> Estensione per dare club reali a Giappone, Corea del Sud, Australia (nazionalità già presenti in
> `src/data/countries.ts` ma con 0 club in `src/data/clubs.ts`). Stesso metodo delle sezioni sopra.
> **Arabia Saudita e Qatar restano fuori scope di questa sessione** (ricerca interrotta su
> richiesta esplicita, dati parziali/non verificati — vedi [[backlog]] per il follow-up):
> Arabia Saudita aveva solo 4/8 club verificati (mancavano proprio i big Al-Hilal/Al-Ittihad/
> Al-Ahli/Al-Shabab, cioè gli slot di prestige 3/2), Qatar aveva 7/8 club trovati ma **nessuno
> con `crestUrl` verificato live** (solo letto dal payload JSON, mai richiesto direttamente) — nessun
> dato per questi due paesi è stato trascritto in `clubs.ts`.

### Giappone — J1 League

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| kashima-antlers | Kashima Antlers | 137707 | https://r2.thesportsdb.com/images/media/team/badge/2s8ady1578238881.png |
| urawa-red-diamonds | Urawa Red Diamonds | 137716 | https://r2.thesportsdb.com/images/media/team/badge/ce3lhk1578239741.png |
| yokohama-f-marinos | Yokohama F. Marinos | 137719 | https://r2.thesportsdb.com/images/media/team/badge/rgeshm1578240000.png |
| kawasaki-frontale | Kawasaki Frontale | 137709 | https://r2.thesportsdb.com/images/media/team/badge/c6pot51578239112.png |
| gamba-osaka | Gamba Osaka | 137705 | https://r2.thesportsdb.com/images/media/team/badge/tq9edk1638813311.png |
| vissel-kobe | Vissel Kobe | 137717 | https://r2.thesportsdb.com/images/media/team/badge/2axjch1578239819.png |
| fc-tokyo | FC Tokyo | 137704 | https://r2.thesportsdb.com/images/media/team/badge/9ls6lr1698754779.png |
| nagoya-grampus | Nagoya Grampus | 137710 | https://r2.thesportsdb.com/images/media/team/badge/a1ucr01706244426.png |

Prestige assegnato (3/3/2/2/1/1/0/0): Kashima Antlers (3, 8 titoli J1, il più decorato) e Urawa
Red Diamonds (3, tifoseria più imponente del Giappone, AFC Champions League 2007/2017) come
big-two; Yokohama F. Marinos (2, 5 titoli) e Kawasaki Frontale (2, 4 titoli recenti, dominante
2017-2021) come secondo livello; Gamba Osaka (1) e Vissel Kobe (1, Iniesta 2018-2024) come terzo;
FC Tokyo (0, mai campione J1) e Nagoya Grampus (0) come club minori.

**Coppa nazionale**: **Emperor's Cup** (Japan Emperor's Cup), coppa nazionale storica giapponese
(dal 1921), tuttora attiva — confermata via TheSportsDB (`lookupleague.php?id=5637`).

### Corea del Sud — K League 1

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| jeonbuk-hyundai-motors | Jeonbuk Hyundai Motors | 138111 | https://r2.thesportsdb.com/images/media/team/badge/8jif3b1747853225.png |
| ulsan-hd | Ulsan HD | 138117 | https://r2.thesportsdb.com/images/media/team/badge/0wooic1706533767.png |
| pohang-steelers | Pohang Steelers | 138112 | https://r2.thesportsdb.com/images/media/team/badge/63jst01769097748.png |
| fc-seoul | FC Seoul | 138115 | https://r2.thesportsdb.com/images/media/team/badge/31z1zf1579473186.png |
| jeju-sk | Jeju SK | 139078 | https://r2.thesportsdb.com/images/media/team/badge/hna7ae1736207131.png |
| gangwon-fc | Gangwon FC | 138108 | https://r2.thesportsdb.com/images/media/team/badge/c4igx71579729617.png |
| daegu-fc | Daegu FC | 138107 | https://r2.thesportsdb.com/images/media/team/badge/xzjzn11579473073.png |
| gwangju-fc | Gwangju FC | 138109 | https://r2.thesportsdb.com/images/media/team/badge/uuzr4x1579473084.png |

Prestige assegnato (3/3/2/2/1/1/0/0): Jeonbuk Hyundai Motors (3, 9 titoli K League, il più
decorato) e Ulsan HD (3, 2x AFC Champions League, campione 2022/2023/2024) come big-two; Pohang
Steelers (2, club fondatore, 5 titoli + prima squadra coreana a vincere l'Asian Champions League)
e FC Seoul (2, club della capitale, 6 titoli) come secondo livello; Jeju SK (1) e Gangwon FC (1)
come terzo; Daegu FC (0) e Gwangju FC (0) come club minori.

**Coppa nazionale**: **Korea Cup** (rinominata dalla precedente "Korean FA Cup" nel 2024) —
confermata via TheSportsDB (`lookupleague.php?id=5635`).

### Australia — A-League Men

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| sydney-fc | Sydney FC | 134473 | https://r2.thesportsdb.com/images/media/team/badge/utgq8z1546110747.png |
| melbourne-victory | Melbourne Victory | 134477 | https://r2.thesportsdb.com/images/media/team/badge/wwvsqx1473454564.png |
| melbourne-city | Melbourne City | 134634 | https://r2.thesportsdb.com/images/media/team/badge/rkeqme1603301840.png |
| western-sydney-wanderers | Western Sydney Wanderers | 134480 | https://r2.thesportsdb.com/images/media/team/badge/yotugj1759632879.png |
| brisbane-roar | Brisbane Roar | 134476 | https://r2.thesportsdb.com/images/media/team/badge/sypxsu1473454634.png |
| central-coast-mariners | Central Coast Mariners | 134479 | https://r2.thesportsdb.com/images/media/team/badge/ncdx4p1759642161.png |
| adelaide-united | Adelaide United | 134472 | https://r2.thesportsdb.com/images/media/team/badge/wpyuwv1473454602.png |
| perth-glory | Perth Glory | 134481 | https://r2.thesportsdb.com/images/media/team/badge/2c9k5p1679114095.png |

Prestige assegnato (3/3/2/2/1/1/0/0): Sydney FC (3, 4 titoli A-League + record punti) e Melbourne
Victory (3, 4 titoli, più titoli AFC Champions League tra i due) come big-two; Melbourne City (2,
gruppo City Football Group, campione 2021) e Western Sydney Wanderers (2, unico club australiano
a vincere l'AFC Champions League, 2014) come secondo livello; Brisbane Roar (1, 3 titoli storici)
e Central Coast Mariners (1, 2 titoli) come terzo; Adelaide United (0) e Perth Glory (0, mai
campione A-League nonostante tifoseria numerosa) come club minori.

**Coppa nazionale**: **Australia Cup**, coppa nazionale aperta a club di ogni livello (sistema
piramidale) — confermata via TheSportsDB (`lookupleague.php?id=5180`).

**Copertura club Giappone/Corea del Sud/Australia: 24/24 trovati** (3 paesi × 8 club), tutti con
`crestUrl` e badge lega/coppa verificati live su TheSportsDB il 2026-08-06 (badge lega/coppa
verificati con una richiesta HTTP diretta dall'orchestratore di sessione, non dall'agente di
ricerca — l'agente aveva verificato solo i crest club per Corea del Sud/Australia).

### Big 5 — espansione roster 2026/27 (44 club nuovi)

Ricerca 2026-08-14. Stemmi verificati HTTP 200 individualmente (HEAD, `image/png`).
`searchteams.php?t=` ha fallito o ha matchato il club sbagliato in 5 casi — risolti via
`lookupteam.php?id=` o query disambiguata:

- Nottingham Forest: `searchteams.php?t=Nottingham Forest` restituisce solo il club di netball;
  prima squadra soccer = idTeam **133720**.
- Deportivo La Coruña: "Deportivo La Coruna" matcha Deportivo Fabril (squadra B); prima squadra
  = idTeam **133816** (`Deportivo de A Coruña`).
- Alavés: "Alaves" matcha Alavés Gloriosas (Liga F); query `Deportivo Alaves` → idTeam **134221**.
- Hamburger SV: "Hamburger SV" matcha solo l'hockey; query `Hamburg` → idTeam **133651**.
- Mainz 05: "Mainz 05" matcha Mainz 05 Women; query `FSV Mainz` → idTeam **133665**.

### Germania — Bundesliga (club aggiunti 2026/27)

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| schalke-04 | Schalke 04 | 133661 | https://r2.thesportsdb.com/images/media/team/badge/hnci291621593978.png |
| hamburger-sv | Hamburger SV | 133651 | https://r2.thesportsdb.com/images/media/team/badge/tvtppt1473453296.png |
| freiburg | SC Freiburg | 133653 | https://r2.thesportsdb.com/images/media/team/badge/urwtup1473453288.png |
| koln | 1. FC Köln | 133654 | https://r2.thesportsdb.com/images/media/team/badge/2j1sc91566049407.png |
| augsburg | Augsburg | 133652 | https://r2.thesportsdb.com/images/media/team/badge/xqyyvq1473453233.png |
| union-berlin | Union Berlin | 134690 | https://r2.thesportsdb.com/images/media/team/badge/q0o5001599679795.png |
| elversberg | Elversberg | 138411 | https://r2.thesportsdb.com/images/media/team/badge/z079go1677573926.png |
| hoffenheim | Hoffenheim | 133657 | https://r2.thesportsdb.com/images/media/team/badge/9hwvb21621593919.png |
| mainz-05 | Mainz 05 | 133665 | https://r2.thesportsdb.com/images/media/team/badge/fhm9v51552134916.png |
| paderborn | Paderborn | 134551 | https://r2.thesportsdb.com/images/media/team/badge/kddvva1566048058.png |

### Francia — Ligue 1 (club aggiunti 2026/27)

| id club | Nome | TSDB idTeam | URL stemma |
|---|---|---|---|
| strasbourg | Strasbourg | 133882 | https://r2.thesportsdb.com/images/media/team/badge/b8k77w1766625501.png |
| toulouse | Toulouse | 133703 | https://r2.thesportsdb.com/images/media/team/badge/17eqox1688449282.png |
| angers | Angers | 134709 | https://r2.thesportsdb.com/images/media/team/badge/ix6q4w1678808069.png |
| auxerre | Auxerre | 134788 | https://r2.thesportsdb.com/images/media/team/badge/lzdtbf1658753355.png |
| brest | Brest | 133704 | https://r2.thesportsdb.com/images/media/team/badge/z69be41598797026.png |
| le-havre | Le Havre | 133862 | https://r2.thesportsdb.com/images/media/team/badge/aikowk1546475003.png |
| le-mans | Le Mans | 133848 | https://r2.thesportsdb.com/images/media/team/badge/wjhziv1700145026.png |
| lorient | Lorient | 133715 | https://r2.thesportsdb.com/images/media/team/badge/sxsttw1473504748.png |
| paris-fc | Paris FC | 135465 | https://r2.thesportsdb.com/images/media/team/badge/yuvtsy1447594254.png |
| troyes | Troyes | 134789 | https://r2.thesportsdb.com/images/media/team/badge/sl5kzg1766617559.png |

## 3. Competizioni — URL badge

Endpoint usati: `search_all_leagues.php?c=<paese>&s=Soccer` per scoprire gli id, poi
`lookupleague.php?id=<id>` per confermare nome/badge esatti (la lista completa per paese viene
troncata dal fetcher quando il paese ha molte leghe minori, quindi il lookup puntuale per id è
la fonte affidabile qui).

| Competizione (clubs.ts) | TSDB strLeague | TSDB idLeague | URL badge |
|---|---|---|---|
| Serie A (Italia) | Italian Serie A | 4332 | https://r2.thesportsdb.com/images/media/league/badge/67q3q21679951383.png |
| Serie B (Italia) | Italian Serie B | 4394 | https://r2.thesportsdb.com/images/media/league/badge/uf5kph1598011132.png |
| Serie C (Italia) | *(vedi nota sotto — 3 gironi)* | 5340 / 5339 / 4398 | vedi riga sotto |
| Coppa Italia | Coppa Italia | 4506 | https://r2.thesportsdb.com/images/media/league/badge/hrm1vo1692679408.png |
| Premier League (Inghilterra) | English Premier League | 4328 | https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png |
| Championship (Inghilterra) | English League Championship | 4329 | https://r2.thesportsdb.com/images/media/league/badge/ty5a681688770169.png |
| FA Cup | FA Cup | 4482 | https://r2.thesportsdb.com/images/media/league/badge/vk7isd1598802862.png |
| La Liga (Spagna) | Spanish La Liga | 4335 | https://r2.thesportsdb.com/images/media/league/badge/ja4it51687628717.png |
| LaLiga 2 (Spagna) | Spanish La Liga 2 | 4400 | https://r2.thesportsdb.com/images/media/league/badge/r7u6821688425700.png |
| Copa del Rey | Copa del Rey | 4483 | https://r2.thesportsdb.com/images/media/league/badge/2ikh3a1671782958.png |
| Brasileirão Série A | Brazilian Serie A | 4351 | https://r2.thesportsdb.com/images/media/league/badge/lywv7t1766787179.png |
| Brasileirão Série B | Brazilian Serie B | 4404 | https://r2.thesportsdb.com/images/media/league/badge/iiz0gf1778446845.png |
| Copa do Brasil | Copa do Brasil | 4725 | https://r2.thesportsdb.com/images/media/league/badge/h38dax1582151151.png |
| Champions League (UEFA) | UEFA Champions League | 4480 | https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png |
| Copa Libertadores | Copa Libertadores | 4501 | https://r2.thesportsdb.com/images/media/league/badge/9shr931685425181.png |
| Liga MX (Messico) | Mexican Liga MX | 4350 | https://r2.thesportsdb.com/images/media/league/badge/mav5rx1686157960.png |
| MLS (Stati Uniti) | American Major League Soccer | 4346 | https://r2.thesportsdb.com/images/media/league/badge/dqo6r91549878326.png |
| US Open Cup (Stati Uniti) | US Open Cup | 5199 | https://r2.thesportsdb.com/images/media/league/badge/nda9e31726722125.png |
| Canadian Premier League (Canada) | Canadian Premier League | 4820 | https://r2.thesportsdb.com/images/media/league/badge/oxb08k1769615518.png |
| Canadian Championship (Canada) | Canadian Championship | 5922 | https://www.thesportsdb.com/images/media/league/badge/mux94s1784004460.png |
| Botola Pro (Marocco) | Moroccan Championship | 4520 | https://r2.thesportsdb.com/images/media/league/badge/bhuork1638558615.png |
| Ligue 1 Sénégalaise (Senegal) | Senegal Ligue 1 | 4754 | https://r2.thesportsdb.com/images/media/league/badge/r2m5o11583947531.png |
| NPFL (Nigeria) | Nigerian NPFL | 4827 | https://r2.thesportsdb.com/images/media/league/badge/k4hgin1590183498.png |
| Ghana Premier League (Ghana) | Ghanaian Premier League | 4974 | https://r2.thesportsdb.com/images/media/league/badge/fk51ll1691567032.png |
| Egyptian Premier League (Egitto) | Egyptian Premier League | 4829 | https://r2.thesportsdb.com/images/media/league/badge/air7qk1715766146.png |
| Ligue 1 (Costa d'Avorio) | Ivory Coast Ligue 1 | 5241 | https://r2.thesportsdb.com/images/media/league/badge/fhrsyb1645300539.png |
| J1 League (Giappone) | Japanese J1 League | 4633 | https://r2.thesportsdb.com/images/media/league/badge/3j8bni1675170553.png |
| Emperor's Cup (Giappone) | Japan Emperor's Cup | 5637 | https://r2.thesportsdb.com/images/media/league/badge/nd13o11750442580.png |
| K League 1 (Corea del Sud) | South Korean K League 1 | 4689 | https://r2.thesportsdb.com/images/media/league/badge/zaw2cj1628430843.png |
| Korea Cup (Corea del Sud) | Korea Cup | 5635 | https://www.thesportsdb.com/images/media/league/badge/lu5cbf1782691118.png |
| A-League Men (Australia) | Australian A-League | 4356 | https://r2.thesportsdb.com/images/media/league/badge/2u78lm1638459575.png |
| Australia Cup (Australia) | Australia Cup | 5180 | https://r2.thesportsdb.com/images/media/league/badge/bjqd291645454828.png |

> Messico non ha una riga "coppa nazionale": la Copa MX è sospesa dal 2019-20 e non risulta
> rivista al 2026 — vedi sezione 2bis per il dettaglio.

> **Coppe nazionali di Marocco/Senegal/Nigeria/Ghana/Egitto/Costa d'Avorio — nomi reali verificati,
> nessun badge TSDB trovato.** `search_all_leagues.php?c=<paese>&s=Soccer` per questi 6 paesi
> restituisce solo il/i campionato/i (nessuna coppa), e un giro di verifica mirato (ricerca web
> `site:thesportsdb.com` per ciascun nome di coppa, più un tentativo di scansione di
> `all_leagues.php` per "Cup"/"Coupe" + paese) non ha trovato una pagina/voce TheSportsDB dedicata
> per nessuna delle 6 — copertura debole per le coppe domestiche africane su questa fonte, coerente
> col pattern già osservato per i club (vedi sezioni sopra). I nomi reali sotto sono comunque
> verificati via fonti web dirette (Wikipedia in italiano/francese/inglese), solo senza badge:
>
> | Paese | Coppa nazionale (nome reale) |
> |---|---|
> | Marocco | Coupe du Trône |
> | Senegal | Coupe du Sénégal (esiste anche una "Coupe de la Ligue" separata, aggiunta nel 2009 — Coupe du Sénégal è la coppa nazionale storica principale) |
> | Nigeria | Nigeria Federation Cup |
> | Ghana | Ghana FA Cup (sponsorizzata "MTN FA Cup") |
> | Egitto | Egypt Cup (distinta dalla "Egyptian League Cup"/WE League Cup, idLeague 5185, trovata su TSDB ma è una coppa diversa) |
> | Costa d'Avorio | Coupe de Côte d'Ivoire |

**Serie C — dettaglio gironi** (TheSportsDB non ha un'unica lega "Serie C", la modella come 3
gironi separati, coerente col fatto che è davvero organizzata così nella realtà):

| Girone | idLeague | URL badge |
|---|---|---|
| Italian Serie C Girone A | 5340 | https://r2.thesportsdb.com/images/media/league/badge/bj89ar1753593637.png |
| Italian Serie C Girone B | 5339 | https://r2.thesportsdb.com/images/media/league/badge/eerhwz1753593645.png |
| Italian Serie C Girone C | 4398 | https://r2.thesportsdb.com/images/media/league/badge/m450je1753593640.png |

**Copertura competizioni: 14/14 trovate come lega/coppa nominata**, più il caso particolare
Serie C risolto con 3 badge di girone invece di un badge unico (vedi sezione 4).

## 4. Cosa manca / da verificare manualmente

- **Nessun club dei 84 è mancante.**
- **Serie C non ha un badge unico su TheSportsDB**: se l'app ha bisogno di UN SOLO logo per
  "Serie C" generico, va scelto arbitrariamente uno dei 3 gironi (o disegnato un badge proprio),
  perché la fonte non offre un badge "Lega Pro" complessivo — solo i 3 gironi.
- **Sporting Gijón**: la ricerca semplice per nome ambigua (vedi nota nella tabella LaLiga 2) —
  usato l'idTeam 133723 dopo verifica esplicita, ma vale la pena un controllo visivo del badge
  prima di integrarlo in app, dato il rischio di confusione con la squadra B.
- **Nomi non ufficiali/abbreviati restituiti da TheSportsDB**: alcuni strTeam sono abbreviati
  rispetto al nome ufficiale (es. "Roma" invece di "AS Roma", "Inter Milan" invece di "Inter",
  "Racing de Santander" invece di "Racing Santander") — normale per l'API, non è un problema per
  l'hotlink ma i nomi vanno mappati/ignorati e si deve usare l'id club interno di clubs.ts come
  chiave primaria (cosa che questo documento già fa).
- **Volatilità dei roster di lega su TheSportsDB**: le query `search_all_teams.php?l=<lega>`
  usate in fase esplorativa mostravano roster della stagione corrente (es. Frosinone elencato
  ancora in Serie A, squadre già retrocesse/promosse) — non è stato un problema per il deliverable
  finale perché ogni club è stato verificato singolarmente via `searchteams.php?t=<nome>`
  (endpoint che restituisce il record squadra indipendentemente dalla lega corrente), ma se in
  futuro si userà `search_all_teams.php` per lega, ricordare che l'elenco riflette la stagione in
  corso su TheSportsDB, non necessariamente le leghe/tier assegnati in `clubs.ts`.
- **Host misto `r2.thesportsdb.com` / `www.thesportsdb.com`**: alcuni badge più recenti sono
  serviti da `www.thesportsdb.com/images/...` invece del CDN `r2.thesportsdb.com/images/...`
  (es. Chelsea, Aston Villa). Entrambi risultano host ufficiali del sito, quindi utilizzabili in
  hotlink; se si vuole uniformità si può normalizzare via redirect o accettare l'host così com'è.

## 5. Badge tornei nazionali

> Stesso metodo delle sezioni precedenti: `lookupleague.php?id=<id>` su TheSportsDB con la chiave
> pubblica `123`, verificato per ogni id (nessuno scraping HTML). Gli id sono stati localizzati
> partendo da un mirror JSON di terze parti dei nomi lega di TheSportsDB
> ([TralahM/thesportsdb leagues.json](https://raw.githubusercontent.com/TralahM/thesportsdb/master/leagues.json),
> dump della stessa API pubblica) e dalle pagine pubbliche `thesportsdb.com/league/<id>-<slug>` per
> i due tornei non presenti in quel mirror (AFC Asian Cup, CONCACAF Gold Cup), poi **ogni id è
> stato confermato individualmente** con una chiamata diretta a `lookupleague.php?id=<id>` per
> leggere `strLeague`/`strBadge` dal payload ufficiale prima di riportarlo qui.

Contesto dal dominio: `Trophy.competition` (vinto con la nazionale) oggi in `trophies.ts` genera
solo `"Mondiale"` o `"Europei"` (50/50, funzione `rollNationalTrophy`). Una sessione di ricerca
precedente sul gioco originale ha osservato anche `"Asian Cup"` come competizione possibile — la
tabella sotto copre le confederazioni corrispondenti alle 41 nazionalità in `src/data/countries.ts`
(UEFA per la maggioranza europea, CONMEBOL per BR/AR/UY/CO/CL/PY/PE/EC, CONCACAF per MX/US/CA,
CAF per MA/SN/NG/GH/EG/CI, AFC per JP/KR/AU/SA/QA).

| Torneo | Confederazione | TSDB strLeague | TSDB idLeague | URL badge |
|---|---|---|---|---|
| FIFA World Cup (Mondiale) | FIFA (tutte) | FIFA World Cup | 4429 | https://r2.thesportsdb.com/images/media/league/badge/e7er5g1696521789.png |
| UEFA European Championship (Europei) | UEFA | European Championships | 4502 | https://r2.thesportsdb.com/images/media/league/badge/bivzlu1635869135.png |
| Copa América | CONMEBOL | Copa America | 4499 | https://r2.thesportsdb.com/images/media/league/badge/n78hen1718080720.png |
| AFC Asian Cup | AFC | AFC Asian Cup | 4866 | https://r2.thesportsdb.com/images/media/league/badge/0a86rp1710997941.png |
| Africa Cup of Nations (AFCON) | CAF | African Cup of Nations | 4496 | https://r2.thesportsdb.com/images/media/league/badge/rhu61x1738628727.png |
| CONCACAF Gold Cup | CONCACAF | CONCACAF Gold Cup | 4873 | https://r2.thesportsdb.com/images/media/league/badge/pfx34h1621878481.png |

**Copertura: 6/6 tornei richiesti trovati e verificati.** Stesso host CDN (`r2.thesportsdb.com`)
delle competizioni di club già raccolte in sezione 3, stessi termini d'uso della sezione 1
(uso hobbistico/sviluppo in hotlink coperto; badge "as is" senza modifiche; non pubblicabile su
app store senza abbonamento a pagamento).

**Nota su come mappare in codice**: oggi `rollNationalTrophy` restituisce solo la stringa
`"Mondiale"` o `"Europei"` senza informazione sulla confederazione del giocatore — per collegare
un badge specifico servirebbe o (a) derivare la confederazione dalla nazionalità del giocatore al
momento del render (mapping `country.code` → confederazione, non ancora presente in
`countries.ts`), oppure (b) estendere `rollNationalTrophy` a scegliere tra il torneo "proprio"
della confederazione del giocatore invece del 50/50 fisso Mondiale/Europei attuale — quest'ultimo
tocca la logica di dominio in `trophies.ts`, non solo la UI, quindi è una decisione da prendere a
parte (vedi [[backlog]]) e non è nello scope di questa sola ricerca.

## 6. Immagini premi individuali

Contesto dal dominio: `AwardType` in `src/types/career.ts` è `"player-of-the-season" |
"ballon-dor" | "top-scorer"`, generato da `rollAward` in `trophies.ts` con soglie di probabilità
deliberatamente più generose dell'originale (OVR ≥ 85 per qualunque award, ≥ 90 con 30% di chance
per `"ballon-dor"`). Il nostro `"ballon-dor"` è quindi un premio con **meccaniche nostre**, non il
vero Pallone d'Oro con licenza — il che rende il rischio di un'immagine del trofeo reale (di
proprietà France Football/L'Équipe) più delicato del caso degli stemmi club (dati sportivi
fattuali, coperti dai termini TheSportsDB per hobby project). Valutate due strade, con URL
verificati individualmente aprendo la pagina file su Wikimedia Commons (non solo dai risultati di
ricerca).

### Strada 1 — foto/immagini reali su Wikimedia Commons

| File | Cosa raffigura | Licenza (dalla pagina file) | URL diretto (upload.wikimedia.org) |
|---|---|---|---|
| Ballon d'Or.png | Icona stilizzata di una palla dorata (rappresentazione del trofeo, non foto) | **CC0 1.0** (pubblico dominio, dedica esplicita dell'autore) | https://upload.wikimedia.org/wikipedia/commons/3/3d/Ballon_d%27Or.png |
| Balón de oro.png | Icona/replica stilizzata del Pallone d'Oro, alta risoluzione (2529×2990) | **Pubblico dominio** — pagina file: *"this image of simple geometry is ineligible for copyright... consists entirely of information that is common property and contains no original authorship"* | https://upload.wikimedia.org/wikipedia/commons/0/0b/Bal%C3%B3n_de_oro.png |
| Icone ballon d'or.svg | Icona stilizzata SVG 512×512 del trofeo Ballon d'Or | CC BY-SA 4.0 | https://upload.wikimedia.org/wikipedia/commons/8/8d/Icone_ballon_d%27or.svg |
| Cristiano Ronaldo's 2008 Ballon d'Or trophy, Real Madrid Museum...jpg | **Foto reale** del trofeo fisico (edizione 2008) esposto al museo del Real Madrid | CC BY-SA 4.0 (autore: Ank Kumar / Ank gsx) | https://upload.wikimedia.org/wikipedia/commons/c/cc/Cristiano_Ronaldo%27s_2008_Ballon_d%27Or_trophy%2C_Real_Madrid_Museum%2C_Santiago_Bernab%C3%A9u%2C_Madrid%2C_Spain_%28Ank_Kumar%2C_Infosys_Limited%29_02.jpg |
| PremierLeagueGoldenBoot.png | Illustrazione del trofeo "Golden Boot" della Premier League (capocannoniere) — utile per `top-scorer` | CC BY-SA 4.0 (self-published, autore dichiara di essere titolare del copyright) | https://upload.wikimedia.org/wikipedia/commons/0/07/PremierLeagueGoldenBoot.png |

Verificate e **scartate** perché non pertinenti nonostante comparissero nei risultati di ricerca:
`File:Golden Booty (6857094337).jpg` (foto di un concerto della band Die Antwoord — coincidenza di
nome, nessun rapporto con il calcio) e `File:Golden Boot, Maidstone.jpg` (statua/oggetto locale a
Maidstone, UK, senza conferma che sia collegato a un premio calcistico — pagina file non ne chiarisce
il soggetto).

**Pro strada 1**: immagini "vere", più riconoscibili/evocative per l'utente; le licenze trovate per
le icone stilizzate (`Ballon d'Or.png` CC0, `Balón de oro.png` PD) sono le più sicure possibili sul
piano del copyright della *fotografia/illustrazione in sé*.
**Contro strada 1**: anche con foto/icona a licenza CC0/CC-BY-SA libera sul piano del copyright
dell'immagine, **la forma del trofeo Ballon d'Or e il nome "Ballon d'Or" restano potenzialmente
protetti da marchio/design registrato di France Football/L'Équipe** — la licenza Commons copre chi
ha scattato la foto o disegnato l'icona, non concede automaticamente il diritto di usare il design
del trofeo per rappresentare un premio proprio con meccaniche diverse dall'originale (il nostro
"ballon-dor" in-game). Nessuna delle pagine file controllate riporta un disclaimer di trademark
esplicito (a differenza dei loghi club su TheSportsDB, che dichiarano esplicitamente "as is, non
modificabili" proprio perché trademark) — il rischio quindi non è documentato/mitigato dalla fonte
stessa, va valutato dall'utente.

### Strada 2 — icone stilizzate generiche via CDN open-source

| Set icone | Licenza | Emoji/icona | URL CDN verificato |
|---|---|---|---|
| Twemoji (fork attivo [jdecked/twemoji](https://github.com/jdecked/twemoji) — il repo originale `twitter/twemoji` risulta abbandonato dopo l'acquisizione X Corp, il fork continua manutenzione/nuove emoji con la stessa licenza) | **CC BY 4.0** (grafica), attribuzione a Twemoji richiesta | 🏆 Trophy (U+1F3C6) | https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f3c6.svg |
| OpenMoji ([openmoji.org](https://openmoji.org)) | **CC BY-SA 4.0** — *"you are free to: Share... for any purpose, even commercially"*, richiede attribuzione + ShareAlike sulle modifiche | 🏆 Trophy (emoji-1F3C6) | https://openmoji.org/data/color/svg/1F3C6.svg |

Entrambi gli URL sono stati verificati fetchando il contenuto SVG grezzo e confermando che
raffigurano davvero una coppa/trofeo dorato stilizzato (non un'altra emoji). Nota tecnica: il
pattern jsDelivr `cdn.jsdelivr.net/gh/hfg-gmuend/openmoji/color/svg/<CODE>.svg` citato in alcune
fonti secondarie per OpenMoji **non ha funzionato in verifica** (403 con `@latest` sull'alias
`gh`); l'hosting diretto `openmoji.org/data/color/svg/<CODE>.svg` invece sì — usare quello se si
sceglie OpenMoji.

**Pro strada 2**: rischio zero di trademark — sono icone emoji generiche di "trofeo", non la
rappresentazione di un premio reale specifico con proprietario riconoscibile; licenze open
esplicitamente pensate per embed/hotlink; nessuna ambiguità sul design coperto da marchio.
**Contro strada 2**: meno "riconoscibile"/evocativo di una foto vera del trofeo — un'emoji trofeo
generica comunica "premio" ma non specificamente "Ballon d'Or".

### Raccomandazione

- **`ballon-dor`** (il caso delicato): **strada 2** (icona trofeo generica stilizzata, es. Twemoji
  o OpenMoji 🏆). Coerente con la logica già adottata nel progetto per gli stemmi club (dati
  fattuali/hotlink sì, ma "as is" e senza reinterpretazioni) — qui però il premio in-game *non è*
  il vero Pallone d'Oro (meccaniche proprie, soglie diverse), quindi rappresentarlo con
  un'immagine che imita il trofeo reale rischierebbe di implicare un'associazione con
  France Football/L'Équipe che non esiste. Un'icona generica evita il problema alla radice senza
  perdere leggibilità (il nome "Pallone d'Oro" nel testo italiano della UI comunica comunque il
  riferimento culturale, l'icona serve solo da rinforzo visivo).
- **`player-of-the-season`** e **`top-scorer`**: **strada 2 è adeguata**, sono concetti generici
  (non un singolo trofeo reale con un unico proprietario) — nessuna icona reale specifica è
  necessaria. Per `top-scorer` è stata comunque trovata un'alternativa di strada 1 pertinente
  (`PremierLeagueGoldenBoot.png`, CC BY-SA 4.0) nel caso si preferisca in futuro un'immagine più
  "reale" — ma anche qui vale la stessa cautela sul trademark Premier League (nome/design
  associato a una competizione specifica con licenza propria), quindi la raccomandazione resta
  un'icona generica (es. 🥇/🏆 stilizzata) anche per questi due award.
