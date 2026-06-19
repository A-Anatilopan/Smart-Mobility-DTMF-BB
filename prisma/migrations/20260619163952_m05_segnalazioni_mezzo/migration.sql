-- M-05 / Sprint 4 / UT.09
-- Apre la base persistente delle segnalazioni mezzo senza modellare ancora
-- l'intera flotta in Prisma: il mezzo resta referenziato in modo logico.

CREATE TABLE `segnalazioni_mezzo` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `codice` VARCHAR(50) NOT NULL,
  `origine` VARCHAR(20) NOT NULL DEFAULT 'UTENTE',
  `utenteId` INTEGER NOT NULL,
  `mezzoId` VARCHAR(50) NOT NULL,
  `mezzoCodice` VARCHAR(50) NOT NULL,
  `categoria` VARCHAR(30) NOT NULL,
  `descrizione` TEXT NOT NULL,
  `stato` VARCHAR(30) NOT NULL DEFAULT 'APERTA',
  `presaInCaricoAt` DATETIME(3) NULL,
  `risoltaAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `segnalazioni_mezzo_codice_key`(`codice`),
  INDEX `segnalazioni_mezzo_utenteId_idx`(`utenteId`),
  INDEX `segnalazioni_mezzo_mezzoId_idx`(`mezzoId`),
  INDEX `segnalazioni_mezzo_stato_idx`(`stato`),
  INDEX `segnalazioni_mezzo_mezzoId_stato_idx`(`mezzoId`, `stato`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `segnalazioni_mezzo`
  ADD CONSTRAINT `segnalazioni_mezzo_utenteId_fkey`
  FOREIGN KEY (`utenteId`) REFERENCES `utenti`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
