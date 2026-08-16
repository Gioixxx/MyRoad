"use client";

import { useState } from "react";
import type { PlayerIdentity, Position, PreferredFoot } from "@/types/career";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { countries } from "@/data/countries";
import { loadLastIdentity } from "@/lib/last-identity";
import { checkNicknameAvailable, isLeaderboardConfigured } from "@/lib/leaderboard/client";
import { isValidNickname } from "@/lib/leaderboard/settings";
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
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <div className="grid min-h-0 min-w-0 flex-1 gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-stretch lg:gap-6">
        <div className="flex justify-center lg:row-span-2 lg:h-full lg:items-center lg:justify-start">
          <JerseyCard lastName={lastName} number={number} country={country} />
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:gap-5">
          <div className="grid grid-cols-[1fr_4.5rem] gap-2.5 sm:gap-3">
            <Field label="Cognome" htmlFor="last-name" error={errors.lastName}>
              <input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={15}
                placeholder="Es. Rossi"
                className="input-recessed rounded-md px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Numero" htmlFor="number" error={errors.number}>
              <input
                id="number"
                type="number"
                min={1}
                max={99}
                value={number ?? ""}
                onChange={(e) => setNumber(e.target.value ? Number(e.target.value) : null)}
                className="input-recessed rounded-md px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <Field label="Piede preferito">
            <SegmentedControl
              name="Piede preferito"
              value={foot}
              onChange={setFoot}
              className="w-full"
              options={[
                { value: "left", label: "Sinistro" },
                { value: "right", label: "Destro" },
              ]}
            />
          </Field>

          <Field label="Nazionalità" htmlFor="nationality" error={errors.nationality}>
            <NationalitySelect id="nationality" value={nationality} onChange={setNationality} />
          </Field>

          {isLeaderboardConfigured() ? (
            <Field label="Nickname (classifica globale)" htmlFor="nickname" error={errors.nickname}>
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
                className="input-recessed rounded-md px-3 py-2 text-sm"
              />
              {!errors.nickname && nicknameAvailability === "checking" ? (
                <p className="mt-1 text-xs text-(--color-text-muted)">Controllo disponibilità…</p>
              ) : null}
              {!errors.nickname && nicknameAvailability === "taken" ? (
                <p className="mt-1 text-xs text-(--color-error)">Nickname già in uso da un altro giocatore.</p>
              ) : null}
              {!errors.nickname && nicknameAvailability === "available" ? (
                <p className="mt-1 text-xs text-(--color-success)">Nickname disponibile.</p>
              ) : null}
            </Field>
          ) : null}
        </div>

        <Field
          label="Ruolo in campo"
          error={errors.position}
          className="flex min-w-0 flex-col gap-1.5 lg:row-span-2 lg:h-full lg:min-h-0 lg:w-[15rem]"
        >
          <PositionPicker
            value={position}
            onChange={setPosition}
            className="min-h-[12rem] lg:min-h-0 lg:flex-1"
          />
        </Field>

        <Button
          onClick={handleSubmit}
          className="mt-1 self-center lg:col-start-2 lg:row-start-2 lg:mt-0 lg:self-start"
        >
          Conferma identità
        </Button>
      </div>
    </div>
  );
}
