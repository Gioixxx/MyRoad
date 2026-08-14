import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { LeaderboardListItem } from "@/lib/leaderboard/types";
import { Leaderboard } from "./Leaderboard";

const { isLeaderboardConfigured, fetchLeaderboardCategory } = vi.hoisted(() => ({
  isLeaderboardConfigured: vi.fn(),
  fetchLeaderboardCategory: vi.fn(),
}));

vi.mock("@/lib/leaderboard/client", () => ({
  isLeaderboardConfigured,
  fetchLeaderboardCategory,
  DEFAULT_LIMIT: 20,
}));

function sampleItem(overrides: Partial<LeaderboardListItem> = {}): LeaderboardListItem {
  return {
    id: "row-1",
    nickname: "Fenomeno99",
    lastName: "Rossi",
    nationality: "Italy",
    position: "ST",
    peakOvr: 88,
    trophyCount: 3,
    awardCount: 1,
    retiredAge: 38,
    finalSavingsEur: 5_000_000,
    finalPopularity: 70,
    careerTitle: "Campione",
    archetypeId: undefined,
    ...overrides,
  };
}

describe("Leaderboard", () => {
  beforeEach(() => {
    isLeaderboardConfigured.mockReset();
    fetchLeaderboardCategory.mockReset();
  });

  it("mostra lo stato 'non disponibile' quando non configurata", () => {
    isLeaderboardConfigured.mockReturnValue(false);
    render(<Leaderboard onBack={vi.fn()} />);
    expect(screen.getByText(/classifica non disponibile/i)).toBeInTheDocument();
    expect(fetchLeaderboardCategory).not.toHaveBeenCalled();
  });

  it("mostra 'Carico la classifica…' mentre la richiesta è in corso", async () => {
    isLeaderboardConfigured.mockReturnValue(true);
    fetchLeaderboardCategory.mockReturnValue(new Promise(() => {})); // mai risolta
    render(<Leaderboard onBack={vi.fn()} />);
    expect(screen.getByText(/carico la classifica/i)).toBeInTheDocument();
  });

  it("mostra lo stato vuoto quando non ci sono voci", async () => {
    isLeaderboardConfigured.mockReturnValue(true);
    fetchLeaderboardCategory.mockResolvedValue({ ok: true, value: [] });
    render(<Leaderboard onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/sii il primo/i)).toBeInTheDocument());
  });

  it("mostra un messaggio di errore con bottone Riprova", async () => {
    isLeaderboardConfigured.mockReturnValue(true);
    fetchLeaderboardCategory.mockResolvedValue({ ok: false, error: "network" });
    render(<Leaderboard onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/impossibile caricare/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /riprova/i })).toBeInTheDocument();
  });

  it("elenca le voci ricevute con nickname e statistiche", async () => {
    isLeaderboardConfigured.mockReturnValue(true);
    fetchLeaderboardCategory.mockResolvedValue({ ok: true, value: [sampleItem()] });
    render(<Leaderboard onBack={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Fenomeno99")).toBeInTheDocument());
    expect(screen.getByText("OVR 88")).toBeInTheDocument();
  });

  it("cambiare categoria rifà la fetch con la nuova categoria", async () => {
    isLeaderboardConfigured.mockReturnValue(true);
    fetchLeaderboardCategory.mockResolvedValue({ ok: true, value: [] });
    render(<Leaderboard onBack={vi.fn()} />);
    await waitFor(() => expect(fetchLeaderboardCategory).toHaveBeenCalledWith("highestOvr"));

    fireEvent.click(screen.getByRole("button", { name: /più trofei/i }));
    await waitFor(() => expect(fetchLeaderboardCategory).toHaveBeenCalledWith("mostTrophies"));
  });

  it("chiama onBack quando si clicca 'Torna'", () => {
    isLeaderboardConfigured.mockReturnValue(false);
    const onBack = vi.fn();
    render(<Leaderboard onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: /torna/i }));
    expect(onBack).toHaveBeenCalled();
  });
});
