-- Crea la tabella che traccia le sessioni operative aperte dagli operatori
-- sui mezzi, mantenendo memoria dello stato originario del mezzo.

CREATE TABLE `sessioni_operative_mezzo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codice` VARCHAR(50) NOT NULL,
    `operatoreId` INTEGER NOT NULL,
    `mezzoId` VARCHAR(50) NOT NULL,
    `mezzoCodice` VARCHAR(50) NOT NULL,
    `statoMezzoOrigine` VARCHAR(30) NOT NULL,
    `modalita` VARCHAR(30) NOT NULL DEFAULT 'LOCALE',
    `stato` VARCHAR(20) NOT NULL DEFAULT 'ATTIVA',
    `motivo` VARCHAR(50) NOT NULL,
    `note` TEXT NULL,
    `apertaAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `chiusaAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sessioni_operative_mezzo_codice_key`(`codice`),
    INDEX `sessioni_operative_mezzo_operatoreId_idx`(`operatoreId`),
    INDEX `sessioni_operative_mezzo_mezzoId_idx`(`mezzoId`),
    INDEX `sessioni_operative_mezzo_stato_idx`(`stato`),
    INDEX `sessioni_operative_mezzo_mezzoId_stato_idx`(`mezzoId`, `stato`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `sessioni_operative_mezzo`
ADD CONSTRAINT `sessioni_operative_mezzo_operatoreId_fkey`
FOREIGN KEY (`operatoreId`) REFERENCES `utenti`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
