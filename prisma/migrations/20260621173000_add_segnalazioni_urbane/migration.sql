-- M-06
-- Crea la base persistente per le segnalazioni urbane della Pubblica
-- Amministrazione, con categoria, stato e coordinate opzionali.

CREATE TABLE `segnalazioni_urbane` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codice` VARCHAR(50) NOT NULL,
    `amministrazioneId` INTEGER NOT NULL,
    `categoria` VARCHAR(30) NOT NULL,
    `titolo` VARCHAR(120) NOT NULL,
    `descrizione` TEXT NOT NULL,
    `indirizzo` VARCHAR(160) NULL,
    `latitudine` DECIMAL(10, 7) NULL,
    `longitudine` DECIMAL(10, 7) NULL,
    `stato` VARCHAR(30) NOT NULL DEFAULT 'APERTA',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `segnalazioni_urbane_codice_key`(`codice`),
    INDEX `segnalazioni_urbane_amministrazioneId_stato_idx`(`amministrazioneId`, `stato`),
    INDEX `segnalazioni_urbane_stato_createdAt_idx`(`stato`, `createdAt`),
    INDEX `segnalazioni_urbane_categoria_stato_idx`(`categoria`, `stato`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `segnalazioni_urbane`
ADD CONSTRAINT `segnalazioni_urbane_amministrazioneId_fkey`
FOREIGN KEY (`amministrazioneId`) REFERENCES `utenti`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
