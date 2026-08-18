import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IdentityForm } from "./IdentityForm";

describe("IdentityForm", () => {
  it("dovrebbe mostrare errori di validazione se si conferma con campi mancanti", () => {
    const onSubmit = vi.fn();
    render(<IdentityForm onSubmit={onSubmit} nickname="" onNicknameChange={vi.fn()} deviceId="device-test" />);

    fireEvent.click(screen.getByRole("button", { name: /conferma identità/i }));

    expect(screen.getByText(/inserisci un cognome/i)).toBeInTheDocument();
    expect(screen.getByText(/seleziona una nazionalità/i)).toBeInTheDocument();
    expect(screen.getByText(/seleziona un ruolo/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("dovrebbe segnalare un numero di maglia fuori dal range 1-99", () => {
    const onSubmit = vi.fn();
    render(<IdentityForm onSubmit={onSubmit} nickname="" onNicknameChange={vi.fn()} deviceId="device-test" />);

    fireEvent.change(screen.getByLabelText(/^numero$/i), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: /conferma identità/i }));

    expect(screen.getByText(/il numero deve essere tra 1 e 99/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("dovrebbe chiamare onSubmit con l'identità corretta quando tutti i campi sono validi", () => {
    const onSubmit = vi.fn();
    render(<IdentityForm onSubmit={onSubmit} nickname="" onNicknameChange={vi.fn()} deviceId="device-test" />);

    fireEvent.change(screen.getByLabelText(/cognome/i), { target: { value: "Rossi" } });
    fireEvent.change(screen.getByLabelText(/^numero$/i), { target: { value: "9" } });

    fireEvent.click(screen.getByRole("radio", { name: /sinistro/i }));

    fireEvent.click(screen.getByRole("button", { name: /^nazionalità$/i }));
    fireEvent.change(screen.getByPlaceholderText(/cerca…/i), { target: { value: "Italy" } });
    fireEvent.click(screen.getByRole("option", { name: /italy/i }));

    fireEvent.click(screen.getByRole("radio", { name: "ATT" }));

    fireEvent.click(screen.getByRole("button", { name: /conferma identità/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      lastName: "Rossi",
      number: 9,
      foot: "left",
      nationality: "Italy",
      position: "ST",
    });
  });
});

describe("IdentityForm — con classifica configurata (env stubbate, modulo reimportato)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("mostra il campo nickname e blocca la conferma senza un nickname valido", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.resetModules();
    const { IdentityForm: FreshIdentityForm } = await import("./IdentityForm");

    const onSubmit = vi.fn();
    render(<FreshIdentityForm onSubmit={onSubmit} nickname="" onNicknameChange={vi.fn()} deviceId="device-test" />);

    expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /conferma identità/i }));

    expect(screen.getByText(/inserisci un nickname/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("conferma con successo quando il nickname è valido", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.resetModules();
    const { IdentityForm: FreshIdentityForm } = await import("./IdentityForm");

    const onSubmit = vi.fn();
    render(
      <FreshIdentityForm onSubmit={onSubmit} nickname="Fenomeno99" onNicknameChange={vi.fn()} deviceId="device-test" />,
    );

    fireEvent.change(screen.getByLabelText(/cognome/i), { target: { value: "Rossi" } });
    fireEvent.change(screen.getByLabelText(/^numero$/i), { target: { value: "9" } });
    fireEvent.click(screen.getByRole("button", { name: /^nazionalità$/i }));
    fireEvent.change(screen.getByPlaceholderText(/cerca…/i), { target: { value: "Italy" } });
    fireEvent.click(screen.getByRole("option", { name: /italy/i }));
    fireEvent.click(screen.getByRole("radio", { name: "ATT" }));

    fireEvent.click(screen.getByRole("button", { name: /conferma identità/i }));

    expect(screen.queryByText(/inserisci un nickname/i)).not.toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalled();
  });
});
