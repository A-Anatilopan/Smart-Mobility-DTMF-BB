-- M-05 / Sprint 4 / OP.11
-- Traccia quale operatore ha preso in carico la segnalazione, cosi il caso
-- resta assegnato in modo chiaro e non puo essere preso in carico da altri.

ALTER TABLE `segnalazioni_mezzo`
  ADD COLUMN `operatorePresaInCaricoId` INT NULL;

ALTER TABLE `segnalazioni_mezzo`
  ADD INDEX `segnalazioni_mezzo_operatorePresaInCaricoId_idx` (`operatorePresaInCaricoId`);

ALTER TABLE `segnalazioni_mezzo`
  ADD CONSTRAINT `segnalazioni_mezzo_operatorePresaInCaricoId_fkey`
    FOREIGN KEY (`operatorePresaInCaricoId`) REFERENCES `utenti`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
