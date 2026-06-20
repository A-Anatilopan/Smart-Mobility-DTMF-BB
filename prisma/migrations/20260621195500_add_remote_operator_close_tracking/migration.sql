-- Traccia la chiusura remota assistita della corsa da parte dell'operatore.
ALTER TABLE `corse`
  ADD COLUMN `terminataDaOperatoreId` INTEGER NULL,
  ADD COLUMN `modalitaTerminazione` VARCHAR(30) NULL,
  ADD COLUMN `notaTerminazioneOperatore` TEXT NULL;

CREATE INDEX `corse_terminataDaOperatoreId_idx`
  ON `corse`(`terminataDaOperatoreId`);

ALTER TABLE `corse`
  ADD CONSTRAINT `corse_terminataDaOperatoreId_fkey`
  FOREIGN KEY (`terminataDaOperatoreId`) REFERENCES `utenti`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
