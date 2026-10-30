"use client";

import { useState, type ReactNode } from "react";
import type { PlayerIdentity, Position, PreferredFoot } from "@/types/career";
import { countries } from "@/data/countries";
import { POSITION_LABELS, POSITION_NAMES } from "@/lib/career/position-labels";
import { loadLastIdentity } from "@/lib/last-identity";
import { checkNicknameAvailable, isLeaderboardConfigured } from "@/lib/leaderboard/client";
import { isValidNickname } from "@/lib/leaderboard/settings";
import { cn } from "@/lib/utils";
import { JerseyCard } from "./JerseyCard";
import { NationalitySelect } from "./NationalitySelect";
import { PositionPicker } from "./PositionPicker";

interface IdentityFormProps {
  onSubmit: (identity: PlayerIdentity) => void;
  /** Nickname per la classifica globale — obbligatorio se la classifica è configurata. */
  nickname: string;
  onNicknameChange: (nickname: string) => void;
  /** Identità anonima per-dispositivo, per il controllo di disponibilità del nickname. */
  deviceId: string;
}

interface FormErrors {
  lastName?: string;
  number?: string;
  nationality?: string;
  position?: string;
  nickname?: string;
}

type NicknameAvailability = "idle" | "checking" | "available" | "taken" | "unknown";

const LABEL_CLASS = "md-label mb-1.5 block text-sm text-(--color-text-muted)";

const FOOT_OPTIONS: { value: PreferredFoot; label: string }[] = [
  { value: "left", label: "Sinistro" },
  { value: "right", label: "Destro" },
];

function FormField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className={cn(LABEL_CLASS, "mb-0")}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-(--color-error)" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function IdentityForm({ onSubmit, nickname, onNicknameChange, deviceId }: IdentityFormProps) {
  const [lastIdentity] = useState(() => loadLastIdentity());
  const [lastName, setLastName] = useState(lastIdentity?.lastName ?? "");
  const [number, setNumber] = useState<number | null>(lastIdentity?.number ?? 10);
  const [foot, setFoot] = useState<PreferredFoot>(lastIdentity?.foot ?? "right");
  const [nationality, setNationality] = useState<string | null>(lastIdentity?.nationality ?? null);
  const [position, setPosition] = useState<Position | null>(lastIdentity?.position ?? null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [nicknameAvailability, setNicknameAvailability] = useState<NicknameAvailability>("idle");

  const country = countries.find((c) => c.name === nationality);

  function handleNicknameBlur() {
    if (!isLeaderboardConfigured() || !isValidNickname(nickname)) return;
    setNicknameAvailability("checking");
    checkNicknameAvailable(nickname, deviceId).then((result) => {
      if (!result.ok) {
        setNicknameAvailability("unknown");
      } else {
        setNicknameAvailability(result.value ? "available" : "taken");
      }
    });
  }

  function handleSubmit() {
    const nextErrors: FormErrors = {};
    if (!lastName.trim()) nextErrors.lastName = "Inserisci un cognome.";
    if (!number || number < 1 || number > 99) {
      nextErrors.number = "Il numero deve essere tra 1 e 99.";
    }
    if (!nationality) nextErrors.nationality = "Seleziona una nazionalità.";
    if (!position) nextErrors.position = "Seleziona un ruolo in campo.";
    if (isLeaderboardConfigured() && !isValidNickname(nickname)) {
      nextErrors.nickname = "Inserisci un nickname (2-20 caratteri) per la classifica globale.";
    } else if (nicknameAvailability === "taken") {
      nextErrors.nickname = "Questo nickname è già usato da un altro giocatore. Scegline un altro.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      lastName: lastName.trim(),
      number: number as number,
      foot,
      nationality: nationality as string,
      position: position as Position,
    });
  }

  return (
    <div className="grid min-w-0 gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)_minmax(0,19rem)] lg:grid-rows-[1fr_auto] lg:gap-6">
      <JerseyCard
        lastName={lastName}
        number={number}
        country={country}
        position={position}
        foot={foot}
        className="lg:row-span-2"
      />

      <div className="md-panel flex min-w-0 flex-col gap-4 p-4 sm:p-6 lg:gap-5 lg:overflow-y-auto">
        <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-3 sm:grid-cols-[minmax(0,1fr)_7.5rem] sm:gap-4">
          <FormField label="Cognome" htmlFor="last-name" error={errors.lastName}>
            <input
              id="last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              maxLength={15}
              placeholder="Es. Rossi"
              className="md-input w-full px-3.5 text-base"
            />
          </FormField>
          <FormField label="Numero" htmlFor="number" error={errors.number}>
            <input
              id="number"
              type="number"
              min={1}
              max={99}
              value={number ?? ""}
              onChange={(e) => setNumber(e.target.value ? Number(e.target.value) : null)}
              className="md-input w-full px-3.5 text-base"
            />
          </FormField>
        </div>

        <fieldset className="m-0 border-0 p-0">
          <legend className={LABEL_CLASS}>Piede preferito</legend>
          <div role="radiogroup" aria-label="Piede preferito" className="grid grid-cols-2 gap-1.5">
            {FOOT_OPTIONS.map((option) => {
              const selected = option.value === foot;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setFoot(option.value)}
                  className={cn(
                    "md-heading min-h-12 text-[1.375rem] transition-colors duration-150",
                    "focus-visible:ring-2 focus-visible:ring-(--color-focus-glow) focus-visible:outline-none",
                    selected
                      ? "md-fill md-slant"
                      : "bg-(--color-text)/6 text-(--color-text) hover:bg-(--color-text)/10",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <FormField label="Nazionalità" htmlFor="nationality" error={errors.nationality}>
          <NationalitySelect
            id="nationality"
            value={nationality}
            onChange={setNationality}
            className="md-input px-3.5 text-base"
          />
          <p className="text-[13px] text-(--color-text-muted)">
            La maglia di anteprima prende i colori della nazionale scelta.
          </p>
        </FormField>

        {isLeaderboardConfigured() ? (
          <FormField label="Nickname (classifica globale)" htmlFor="nickname" error={errors.nickname}>
            <input
              id="nickname"
              value={nickname}
              onChange={(e) => {
                onNicknameChange(e.target.value);
                setNicknameAvailability("idle");
              }}
              onBlur={handleNicknameBlur}
              maxLength={20}
              placeholder="Es. Fenomeno99"
              className="md-input w-full px-3.5 text-base"
            />
            {!errors.nickname && nicknameAvailability === "checking" ? (
              <p className="text-xs text-(--color-text-muted)">Controllo disponibilità…</p>
            ) : null}
            {!errors.nickname && nicknameAvailability === "taken" ? (
              <p className="text-xs text-(--color-error)">Nickname già in uso da un altro giocatore.</p>
            ) : null}
            {!errors.nickname && nicknameAvailability === "available" ? (
              <p className="text-xs text-(--color-success)">Nickname disponibile.</p>
            ) : null}
          </FormField>
        ) : null}
      </div>

      <section
        aria-labelledby="position-heading"
        className="flex min-w-0 flex-col gap-3 lg:row-span-2 lg:min-h-0"
      >
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="position-heading" className="md-heading text-2xl text-(--color-text)">
            Ruolo in campo
          </h2>
          {position ? (
            <span className="md-label truncate text-base tracking-normal text-(--color-accent)">
              {POSITION_LABELS[position]} · {POSITION_NAMES[position]}
            </span>
          ) : null}
        </div>
        <PositionPicker
          value={position}
          onChange={setPosition}
          className="min-h-[22rem] lg:min-h-[26rem] lg:flex-1"
        />
        {errors.position ? (
          <p className="text-xs font-medium text-(--color-error)" role="alert">
            {errors.position}
          </p>
        ) : null}
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        className="md-heading md-slant min-h-15 w-full bg-(--color-text) text-[1.75rem] text-(--color-background) transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-(--color-focus-glow) focus-visible:outline-none lg:col-start-2 lg:row-start-2"
      >
        Conferma identità
      </button>
    </div>
  );
}
