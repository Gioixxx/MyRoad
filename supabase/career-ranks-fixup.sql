-- =====================================================================
-- Fixup post-verifica Fase 6 (2026-08-19) — da eseguire UNA VOLTA dopo career-ranks.sql,
-- solo se non già eseguito. Due cose distinte:
--
-- 1. Il backfill in career-ranks.sql ha copiato `position` (codice grezzo, es. "LW"/"CAM")
--    direttamente in `role_label` per le righe pre-esistenti — le nuove pubblicazioni dal
--    client usano invece l'etichetta italiana già tradotta (POSITION_LABELS, es. "AS"/"TRQ").
--    Trovato verificando la vista pubblica dal vivo dopo l'esecuzione di career-ranks.sql.
--    Idempotente: sui ruoli già tradotti (incluse le righe "Allenatore") il CASE cade
--    sempre sull'ELSE, nessun cambiamento.
-- 2. Righe di verifica REST (nickname "QARankVerify", entrambe le piste, device di test)
--    inserite durante la verifica manuale della RPC/upsert — vanno rimosse insieme alla
--    rivendicazione del nickname (altrimenti resta riservata per sempre a quel device di test,
--    vedi il commento in nickname-uniqueness.sql sul perché la rivendicazione non si libera mai
--    da sola).
-- =====================================================================

update public.myroad_career_ranks
set role_label = case role_label
  when 'GK' then 'POR' when 'CB' then 'DC' when 'LB' then 'TS' when 'RB' then 'TD'
  when 'CDM' then 'MED' when 'CM' then 'CC' when 'CAM' then 'TRQ' when 'LM' then 'ES'
  when 'RM' then 'ED' when 'LW' then 'AS' when 'RW' then 'AD' when 'ST' then 'ATT'
  else role_label
end
where track = 'player';

delete from public.myroad_career_ranks where nickname = 'QARankVerify';
delete from public.myroad_nickname_claims where nickname_key = 'qarankverify';
