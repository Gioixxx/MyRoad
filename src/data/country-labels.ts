/**
 * Nomi italiani dei paesi, solo per la visualizzazione. `Country.name`/`Club.country` restano in
 * inglese perché sono chiavi persistite (save, archivio, classifica Supabase) e confrontate con
 * `===` nel motore — stesso principio di `POSITION_LABELS` (vedi conventions in memoria).
 */
export const COUNTRY_LABELS: Record<string, string> = {
  Italy: "Italia",
  Spain: "Spagna",
  France: "Francia",
  Germany: "Germania",
  Portugal: "Portogallo",
  Netherlands: "Paesi Bassi",
  Belgium: "Belgio",
  England: "Inghilterra",
  Scotland: "Scozia",
  Wales: "Galles",
  Ireland: "Irlanda",
  Switzerland: "Svizzera",
  Austria: "Austria",
  Poland: "Polonia",
  Sweden: "Svezia",
  Norway: "Norvegia",
  Denmark: "Danimarca",
  Croatia: "Croazia",
  Serbia: "Serbia",
  Ukraine: "Ucraina",
  Turkey: "Turchia",
  Brazil: "Brasile",
  Argentina: "Argentina",
  Uruguay: "Uruguay",
  Colombia: "Colombia",
  Chile: "Cile",
  Paraguay: "Paraguay",
  Peru: "Perù",
  Ecuador: "Ecuador",
  Mexico: "Messico",
  "United States": "Stati Uniti",
  Canada: "Canada",
  Morocco: "Marocco",
  Senegal: "Senegal",
  Nigeria: "Nigeria",
  Ghana: "Ghana",
  Egypt: "Egitto",
  "Ivory Coast": "Costa d'Avorio",
  Japan: "Giappone",
  "South Korea": "Corea del Sud",
  Australia: "Australia",
  "Saudi Arabia": "Arabia Saudita",
  Qatar: "Qatar",
};

/** Nome italiano del paese; ripiega sul nome originale se manca dalla mappa. */
export function countryLabel(name: string): string {
  return COUNTRY_LABELS[name] ?? name;
}
