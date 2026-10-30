"use client";

import type { Player } from "@/types/career";
import { clubPalette, readableOn } from "@/lib/career/club-colors";
import { clubKit } from "@/lib/career/kits";
import { POSITION_LABELS } from "@/lib/career/position-labels";
import { ClubCrest } from "./ClubCrest";
import { Jersey } from "./Jersey";
import { clubStyle } from "./club-style";

interface ResumeCareerCardProps {
  player: Player;
  onResume: () => void;
}

/** Card "Carriera in corso" del menu: maglia e dati del giocatore nei colori del suo club. */
export function ResumeCareerCard({ player, onResume }: ResumeCareerCardProps) {
  const club = player.club;
  const palette = clubPalette(club?.id);
  const lastStint = player.clubHistory.at(-1);
  const finish =
    club && lastStint?.leaguePosition !== undefined && lastStint.club.id === club.id
      ? `${club.competitions.league} · ${lastStint.leaguePosition}° posto`
      : club?.competitions.league;

  return (
    <section
      aria-labelledby="resume-career-title"
      style={clubStyle(club?.id)}
      className="md-panel flex flex-col overflow-hidden"
    >
      <div
        className="relative h-44 overflow-hidden sm:h-52"
        style={{
          backgroundColor: palette.secondary,
          backgroundImage:
            "linear-gradient(115deg, transparent 0 55%, rgb(255 255 255 / 0.08) 55% 70%, transparent 70%)",
        }}
      >
        <div
          className="absolute top-4 left-4 flex max-w-[55%] flex-col gap-1.5 sm:top-5 sm:left-5"
          style={{ color: readableOn(palette.secondary) }}
        >
          {club ? <ClubCrest crestUrl={club.crestUrl} clubName={club.name} size={40} /> : null}
          <span className="md-heading text-2xl leading-none sm:text-3xl">
            {club ? club.name : "Svincolato"}
          </span>
          {finish ? <span className="text-sm opacity-80">{finish}</span> : null}
        </div>
        <Jersey
          kit={clubKit(club?.id)}
          number={player.number}
          lastName={player.lastName}
          size="lg"
          className="absolute top-2 right-2 sm:top-4 sm:right-6"
        />
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="resume-career-title"
              className="md-heading truncate text-3xl leading-[0.95] text-(--color-text) sm:text-4xl"
            >
              {player.lastName}
            </h2>
            <p className="text-sm text-(--color-text-muted)">
              {POSITION_LABELS[player.position]} · {player.age} anni · stagione{" "}
              {player.clubHistory.length + 1}
            </p>
          </div>
          <div
            className="md-fill md-segment flex shrink-0 items-center gap-2 py-1 pr-4 pl-6"
            aria-label={`OVR ${player.ovr}`}
          >
            <span className="md-label text-sm" aria-hidden="true">
              OVR
            </span>
            <span className="md-heading text-4xl leading-none" aria-hidden="true">
              {player.ovr}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onResume}
          className="md-heading md-slant min-h-14 bg-(--color-text) text-2xl text-(--color-background) transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-(--color-focus-glow) focus-visible:outline-none"
        >
          Riprendi la carriera
        </button>
      </div>
    </section>
  );
}
