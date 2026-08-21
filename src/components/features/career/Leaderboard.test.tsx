import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { LeaderboardListItem } from "@/lib/leaderboard/types";
import { Leaderboard } from "./Leaderboard";

const { isLeaderboardConfigured, fetchLeaderboard } = vi.hoisted(() => ({
  isLeaderboardConfigured: vi.fn(),
  fetchLeaderboard: vi.fn(),
}));

vi.mock("@/lib/leaderboard/client", () => ({
  isLeaderboardConfigured,
  fetchLeaderboard,
  DEFAULT_LIMIT: 20,
}));

function sampleItem(overrides: Partial<LeaderboardListItem> = {}): LeaderboardListItem {
  return {
    id: "row-1",
    nickname: "Fenomeno99",
    lastName: "Rossi",
    nationality: "Italy",
    roleLabel: "ATT",
    peakRating: 88,
    trophyCount: 3,
    awardCount: 1,
    finalSavingsEur: 5_000_000,
    careerTitle: "Campione",
    archetypeId: undefined,
    careerScore: 2100,
    trophyBreakdown: [{ competition: "Serie A", count: 2, isNational: false }],
    awardBreakdown: [{ type: "top-scorer", count: 1 }],
    ...overrides,
  };
}

describe("Leaderboard", () => {
  beforeEach(() => {
    isLeaderboardConfigured.mockReset();
    fetchLeaderboard.mockReset();
  });

  it("mostra lo stato 'non disponibile' quando non configurata", () => {
    isLeaderboardConfigured.mockReturnValue(false);
    render(<Leaderboard onBack={vi.fn()} />);
    expect(screen.getByText(/classifica non disponibile/i)).toBeInTheDocument();
    expect(fetchLeaderboard).not.toHaveBeenCalled();
  });

  it("mostra 'Carico la classifica…' mentre la richiesta è in corso", async () => {
    isLeaderboardConfigured.mockReturnValue(true);
    fetchLeaderboard.mockReturnValue(new Promise(() => {})); // mai risolta
    render(<Leaderboard onBack={vi.fn()} />);
    expect(screen.getByText(/carico la classifica/i)).toBeInTheDocument();
  });

  it("mostra lo stato vuoto quando non ci sono voci", async () => {
    isLeaderboardConfigured.mockReturnValue(true);
    fetchLeaderboard.mockResolvedValue({ ok: true, value: [] });
    render(<Leaderboard onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/sii il primo/i)).toBeInTheDocument());
  });

  it("mostra un messaggio di errore con bottone Riprova", async () => {
    isLeaderboardConfigured.mockReturnValue(true);
    fetchLeaderboard.mockResolvedValue({ ok: false, error: "network" });
    render(<Leaderboard onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/impossibile caricare/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /riprova/i })).toBeInTheDocument();
  });

  it("elenca le voci ricevute con nickname e punteggio", async () => {
    isLeaderboardConfigured.mockReturnValue(true);
    fetchLeaderboard.mockResolvedValue({ ok: true, value: [sampleItem()] });
    render(<Leaderboard onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Fenomeno99")).toBeInTheDocument());
    // Non `toLocaleString("it-IT")` esatto (2.100): l'ambiente Node/jsdom di test non ha sempre
    // i dati ICU per il locale it-IT, il separatore delle migliaia può mancare — verificare solo
    // che il numero (2100) compaia, non la sua punteggiatura.
    expect(screen.getByText(/2.?100/)).toBeInTheDocument();
  });

  it("cambiare pista rifà la fetch con la nuova pista", async () => {
    isLeaderboardConfigured.mockReturnValue(true);
    fetchLeaderboard.mockResolvedValue({ ok: true, value: [] });
    render(<Leaderboard onBack={vi.fn()} />);
    await waitFor(() => expect(fetchLeaderboard).toHaveBeenCalledWith("player"));

    fireEvent.click(screen.getByRole("button", { name: /allenatori/i }));
    await waitFor(() => expect(fetchLeaderboard).toHaveBeenCalledWith("coach"));
  });

  it("chiama onBack quando si clicca 'Torna'", () => {
    isLeaderboardConfigured.mockReturnValue(false);
    const onBack = vi.fn();
    render(<Leaderboard onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: /torna/i }));
    expect(onBack).toHaveBeenCalled();
  });

  it("il dettaglio trofei/premi è nascosto finché non si espande la riga", async () => {
    isLeaderboardConfigured.mockReturnValue(true);
    fetchLeaderboard.mockResolvedValue({ ok: true, value: [sampleItem()] });
    render(<Leaderboard onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Fenomeno99")).toBeInTheDocument());

    expect(screen.queryByText(/2× Serie A/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /mostra dettaglio trofei/i }));
    expect(screen.getByText(/2× Serie A/)).toBeInTheDocument();
    expect(screen.getByText(/1× Capocannoniere/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /nascondi dettaglio trofei/i }));
    expect(screen.queryByText(/2× Serie A/)).not.toBeInTheDocument();
  });

  it("mostra 'Dettaglio non disponibile' per una voce senza breakdown (pubblicata prima della migrazione)", async () => {
    isLeaderboardConfigured.mockReturnValue(true);
    fetchLeaderboard.mockResolvedValue({
      ok: true,
      value: [sampleItem({ trophyBreakdown: [], awardBreakdown: [] })],
    });
    render(<Leaderboard onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Fenomeno99")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /mostra dettaglio trofei/i }));
    expect(screen.getByText(/dettaglio non disponibile/i)).toBeInTheDocument();
  });

  it("usa le etichette premio dell'allenatore quando la pista è 'coach'", async () => {
    isLeaderboardConfigured.mockReturnValue(true);
    fetchLeaderboard.mockResolvedValue({
      ok: true,
      value: [
        sampleItem({
          awardBreakdown: [{ type: "manager-of-the-year", count: 1 }],
          roleLabel: "Allenatore",
        }),
      ],
    });
    render(<Leaderboard onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /allenatori/i }));
    await waitFor(() => expect(screen.getByText("Fenomeno99")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /mostra dettaglio trofei/i }));
    expect(screen.getByText(/1× Allenatore dell'anno/)).toBeInTheDocument();
  });
});
