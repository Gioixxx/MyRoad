export type Rng = () => number;

/** Estrae un elemento pesato tra `items` — idioma "peso → roll → somma cumulativa → pick"
 * condiviso da entrambi i motori di carriera (calciatore e allenatore), invece di essere
 * reimplementato localmente in ognuno. */
export function pickWeighted<T>(items: T[], weightOf: (item: T) => number, rng: Rng = Math.random): T {
  if (items.length === 0) {
    throw new Error("pickWeighted richiede almeno un elemento");
  }
  const totalWeight = items.reduce((sum, item) => sum + weightOf(item), 0);
  const roll = rng() * totalWeight;
  let cumulative = 0;
  for (const item of items) {
    cumulative += weightOf(item);
    if (roll < cumulative) return item;
  }
  return items[items.length - 1];
}
