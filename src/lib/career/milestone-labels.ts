import { OVR_MILESTONES } from "./satisfaction";

export type OvrMilestoneThreshold = (typeof OVR_MILESTONES)[number];

interface MilestoneCopy {
  title: string;
  detail: string;
}

export const MILESTONE_COPY: Record<OvrMilestoneThreshold, MilestoneCopy> = {
  60: {
    title: "Titolare inamovibile",
    detail: "Non sei più una scommessa: la squadra costruisce su di te.",
  },
  70: {
    title: "Talento riconosciuto",
    detail: "Il tuo nome inizia a girare tra gli addetti ai lavori.",
  },
  80: {
    title: "Classe internazionale",
    detail: "Sei tra i migliori nel tuo ruolo in Europa.",
  },
  85: {
    title: "Fuoriclasse",
    detail: "Le grandi squadre ti seguono: giochi per i titoli.",
  },
  90: {
    title: "Leggenda vivente",
    detail: "Pochissimi al mondo giocano al tuo livello.",
  },
};

/** Fallback difensivo se un OVR non corrisponde a nessuna soglia nota (non dovrebbe accadere). */
export function getMilestoneCopy(ovr: number): MilestoneCopy {
  return (
    MILESTONE_COPY[ovr as OvrMilestoneThreshold] ?? {
      title: `OVR ${ovr}`,
      detail: "Sei entrato in una nuova fascia di prestigio.",
    }
  );
}
