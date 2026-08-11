"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { clampVolume, DEFAULT_AUDIO_SETTINGS, loadAudioSettings, saveAudioSettings } from "@/lib/audio-settings";

export interface UseBackgroundMusic {
  audioRef: RefObject<HTMLAudioElement | null>;
  volume: number;
  muted: boolean;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
}

/**
 * Musica di sottofondo in loop. Nel launcher desktop (WebView2, avviato con
 * `--autoplay-policy=no-user-gesture-required`, vedi MainForm.cs) `play()` riesce subito al
 * mount, quindi la musica parte insieme alla schermata del menu. In un browser normale (dev
 * server, o l'app aperta via URL invece che tramite l'exe) quel flag non c'è: i browser bloccano
 * `play()` con audio prima di un'interazione, quindi lì resta come fallback l'avvio al primo
 * gesto dell'utente (pointerdown/keydown ovunque nella pagina).
 */
export function useBackgroundMusic(): UseBackgroundMusic {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolumeState] = useState(DEFAULT_AUDIO_SETTINGS.volume);
  const [muted, setMutedState] = useState(DEFAULT_AUDIO_SETTINGS.muted);

  useEffect(() => {
    const settings = loadAudioSettings();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage non esiste in SSR
    setVolumeState(settings.volume);
    setMutedState(settings.muted);
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    let startedImmediately = false;
    const tryPlay = () => {
      audioRef.current?.play().then(
        () => {
          startedImmediately = true;
        },
        () => {
          // Best-effort: se il browser rifiuta ancora, resta silenzioso finché non arriva un
          // gesto valido successivo.
        },
      );
    };

    // Tentativo immediato: riesce nel launcher desktop (autoplay-policy disabilitata lato
    // WebView2), fallisce silenziosamente in un browser normale senza quel flag.
    tryPlay();

    const tryPlayOnGesture = () => {
      if (startedImmediately) return;
      tryPlay();
    };
    window.addEventListener("pointerdown", tryPlayOnGesture);
    window.addEventListener("keydown", tryPlayOnGesture);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        audioRef.current?.pause();
      } else if (startedImmediately) {
        tryPlay();
      }
    };
    const handlePageHide = () => {
      audioRef.current?.pause();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pointerdown", tryPlayOnGesture);
      window.removeEventListener("keydown", tryPlayOnGesture);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  const setVolume = useCallback(
    (next: number) => {
      const clamped = clampVolume(next);
      setVolumeState(clamped);
      saveAudioSettings({ volume: clamped, muted });
    },
    [muted],
  );

  const setMuted = useCallback(
    (next: boolean) => {
      setMutedState(next);
      saveAudioSettings({ volume, muted: next });
    },
    [volume],
  );

  return { audioRef, volume, muted, setVolume, setMuted };
}
