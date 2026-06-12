-- M-03: struttura minima per prenotazioni e corse.
-- Questa migration apre il dominio noleggio senza introdurre ancora la flotta
-- completa in database; il mezzo resta quindi referenziato da mezzoId testuale.

CREATE TABLE `prenotazioni` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `codice` VARCHAR(36) NOT NULL,
  `utenteId` INTEGER NOT NULL,
  `mezzoId` VARCHAR(50) NOT NULL,
  `stato` VARCHAR(30) NOT NULL DEFAULT 'ATTIVA',
  `prenotataAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `scadeAt` DATETIME(3) NOT NULL,
  `annullataAt` DATETIME(3) NULL,
  `convertitaInCorsaAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `prenotazioni_codice_key`(`codice`),
  INDEX `prenotazioni_utenteId_stato_idx`(`utenteId`, `stato`),
  INDEX `prenotazioni_mezzoId_stato_idx`(`mezzoId`, `stato`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `corse` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `codice` VARCHAR(36) NOT NULL,
  `utenteId` INTEGER NOT NULL,
  `mezzoId` VARCHAR(50) NOT NULL,
  `prenotazioneId` INTEGER NULL,
  `stato` VARCHAR(30) NOT NULL DEFAULT 'ATTIVA',
  `iniziataAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `pausaIniziataAt` DATETIME(3) NULL,
  `terminataAt` DATETIME(3) NULL,
  `latitudineInizio` DECIMAL(10, 7) NULL,
  `longitudineInizio` DECIMAL(10, 7) NULL,
  `latitudineFine` DECIMAL(10, 7) NULL,
  `longitudineFine` DECIMAL(10, 7) NULL,
  `costoSbloccoCent` INTEGER NOT NULL DEFAULT 0,
  `costoUtilizzoCent` INTEGER NOT NULL DEFAULT 0,
  `costoPausaCent` INTEGER NOT NULL DEFAULT 0,
  `costoTotaleCent` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `corse_codice_key`(`codice`),
  UNIQUE INDEX `corse_prenotazioneId_key`(`prenotazioneId`),
  INDEX `corse_utenteId_stato_idx`(`utenteId`, `stato`),
  INDEX `corse_mezzoId_stato_idx`(`mezzoId`, `stato`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `prenotazioni`
  ADD CONSTRAINT `prenotazioni_utenteId_fkey`
  FOREIGN KEY (`utenteId`) REFERENCES `utenti`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `corse`
  ADD CONSTRAINT `corse_utenteId_fkey`
  FOREIGN KEY (`utenteId`) REFERENCES `utenti`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `corse`
  ADD CONSTRAINT `corse_prenotazioneId_fkey`
  FOREIGN KEY (`prenotazioneId`) REFERENCES `prenotazioni`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
