/**
 * Numero di cicli distinti trascorsi in un dato club, non di stint — dal wiring "Due classifiche"
 * `ClubStint`/`CoachStint` sono una riga per **stagione**, non più una per ciclo, quindi
 * `clubHistory.filter(...).length` non è più un proxy corretto di "cicli allo stesso club" (usato
 * per soglie di spawn del rivale, record di tenure, reveal del chip archetipo). Conta le stint per
 * `cycleId` quando presente; le stint pre-migrazione (senza `cycleId`, dove una stint = un ciclo
 * per definizione) contano ciascuna per un ciclo a sé tramite un indice negativo che non collide
 * mai con un vero `cycleId` (sempre >= 0).
 */
export function cyclesAtClub<T extends { club: { id: string }; cycleId?: number }>(
  stints: T[],
  clubId: string,
): number {
  const cycleKeys = new Set<number>();
  stints.forEach((stint, index) => {
    if (stint.club.id !== clubId) return;
    cycleKeys.add(stint.cycleId ?? -(index + 1));
  });
  return cycleKeys.size;
}
