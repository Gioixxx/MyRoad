/** Filtro leggero (non sicurezza vera — il sorgente è pubblico su GitHub) per tenere la modalità
 * allenatore, ancora in test, fuori dalla portata dei giocatori occasionali mentre si rilasciano
 * migliorie. Cambiare qui per aggiornare la password. */
const COACH_MODE_PASSWORD = "coach2026";

export function isCoachModePasswordCorrect(input: string): boolean {
  return input === COACH_MODE_PASSWORD;
}
