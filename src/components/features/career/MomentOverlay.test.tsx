import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MomentOverlay } from "./MomentOverlay";

const AUTO_DISMISS_MS = 6000;

vi.mock("@/hooks/useMotion", () => ({
  usePrefersReducedMotion: () => mockPrefersReducedMotion,
}));

let mockPrefersReducedMotion = false;

describe("MomentOverlay", () => {
  beforeEach(() => {
    mockPrefersReducedMotion = false;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("si chiude da solo dopo AUTO_DISMISS_MS se lasciato inattivo", () => {
    const onContinue = vi.fn();
    render(<MomentOverlay moment={{ kind: "callup" }} onContinue={onContinue} />);

    vi.advanceTimersByTime(AUTO_DISMISS_MS);

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("mette in pausa il timer durante l'hover e riprende dal tempo residuo al mouse-leave", () => {
    const onContinue = vi.fn();
    render(<MomentOverlay moment={{ kind: "callup" }} onContinue={onContinue} />);
    const panel = screen.getByTestId("moment-panel");

    vi.advanceTimersByTime(2000);
    fireEvent.mouseEnter(panel);
    vi.advanceTimersByTime(AUTO_DISMISS_MS);
    expect(onContinue).not.toHaveBeenCalled();

    fireEvent.mouseLeave(panel);
    vi.advanceTimersByTime(AUTO_DISMISS_MS - 2000 - 1);
    expect(onContinue).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("il click su Continua avanza subito indipendentemente dal timer", () => {
    const onContinue = vi.fn();
    render(<MomentOverlay moment={{ kind: "callup" }} onContinue={onContinue} />);

    fireEvent.click(screen.getByRole("button", { name: /continua/i }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("Escape avanza subito indipendentemente dal timer", () => {
    const onContinue = vi.fn();
    render(<MomentOverlay moment={{ kind: "callup" }} onContinue={onContinue} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("non si chiude mai da solo se prefers-reduced-motion è attivo", () => {
    mockPrefersReducedMotion = true;
    const onContinue = vi.fn();
    render(<MomentOverlay moment={{ kind: "callup" }} onContinue={onContinue} />);

    vi.advanceTimersByTime(AUTO_DISMISS_MS * 10);
    expect(onContinue).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /continua/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("mostra il moment obiettivo con il label esatto", () => {
    render(
      <MomentOverlay
        moment={{ kind: "objective", label: "Segna almeno 10 gol" }}
        onContinue={vi.fn()}
      />,
    );

    expect(screen.getByText("Segna almeno 10 gol")).toBeInTheDocument();
    expect(screen.getByText(/obiettivo raggiunto/i)).toBeInTheDocument();
  });

  it("mostra la copy specifica per soglia sul traguardo OVR", () => {
    render(<MomentOverlay moment={{ kind: "milestone", ovr: 85 }} onContinue={vi.fn()} />);

    expect(screen.getByText("Fuoriclasse")).toBeInTheDocument();
  });
});
