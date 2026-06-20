-- Allarga la colonna stato delle segnalazioni mezzo per supportare
-- workflow operativi piu espliciti come RIMESSA_IN_SERVIZIO_PROGRAMMATA.
ALTER TABLE `segnalazioni_mezzo`
  MODIFY `stato` VARCHAR(50) NOT NULL DEFAULT 'APERTA';
