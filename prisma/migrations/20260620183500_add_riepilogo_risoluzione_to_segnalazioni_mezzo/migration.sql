-- M-05 / Sprint 4 / OP.11
-- Aggiunge il riepilogo obbligatorio della risoluzione, cosi la chiusura di
-- una segnalazione conserva una traccia chiara dell'intervento effettuato.

ALTER TABLE `segnalazioni_mezzo`
  ADD COLUMN `riepilogoRisoluzione` TEXT NULL;
