"use client";

import { useState } from "react";
import { CareerGame } from "@/components/features/career/CareerGame";
import { CoachCareerGame } from "@/components/features/coach/CoachCareerGame";

type Mode = "player" | "coach";

export default function Home() {
  const [mode, setMode] = useState<Mode>("player");

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden">
      {mode === "player" ? (
        <CareerGame onCoachCareer={() => setMode("coach")} />
      ) : (
        <div className="mx-auto flex w-full max-w-[88rem] min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-2 sm:gap-3 sm:py-3 lg:overflow-hidden">
          <CoachCareerGame onBack={() => setMode("player")} />
        </div>
      )}
    </main>
  );
}
