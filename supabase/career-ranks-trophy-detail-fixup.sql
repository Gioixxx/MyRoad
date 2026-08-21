-- =====================================================================
-- Fixup post-verifica career-ranks-trophy-detail.sql — da eseguire UNA VOLTA dopo quella
-- migrazione, solo se non già eseguito. Due cose distinte, trovate verificando dal vivo via
-- REST subito dopo l'esecuzione:
--
-- 1. `create or replace function` con parametri AGGIUNTI (p_trophy_breakdown/p_award_breakdown)
--    non sostituisce la funzione esistente: Postgres considera una lista di tipi argomento
--    diversa come una funzione NUOVA E DISTINTA, non un replace (vedi doc CREATE FUNCTION: "It
--    is not possible to change... the argument types of a function this way"). Risultato: sul
--    DB restano DUE overload di myroad_submit_career_rank (14 e 16 parametri), e PostgREST
--    rifiuta con PGRST203 "Could not choose the best candidate function" qualunque chiamata con
--    i soli 14 parametri vecchi (ambiguo tra match esatto e match-coi-default). Le chiamate con
--    tutti e 16 i parametri (quello che il client fa sempre da questo rilascio) risolvono senza
--    ambiguità e funzionano già — ma l'overload vecchio va comunque rimosso: era pensato come
--    rete di sicurezza per un client non ancora aggiornato durante il rollout, e in questa forma
--    fa l'opposto (rompe quel client con un errore invece di degradare silenziosamente).
-- 2. Riga di verifica REST (nickname "QATrophyDetail", pista player, device di test) inserita
--    durante la verifica manuale della RPC — va rimossa insieme alla rivendicazione del
--    nickname (stesso rituale già usato in career-ranks-fixup.sql per "QARankVerify").
-- =====================================================================

drop function if exists public.myroad_submit_career_rank(
  uuid, text, text, smallint, smallint, smallint, bigint, text, text, text, text, text, text, text
);

delete from public.myroad_career_ranks where nickname = 'QATrophyDetail';
delete from public.myroad_nickname_claims where nickname_key = 'qatrophydetail';

notify pgrst, 'reload schema';
