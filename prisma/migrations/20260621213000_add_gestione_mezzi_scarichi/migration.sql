-- M-05 / Sprint 4 / OP.09
-- Apre la base persistente del workflow logistico dei mezzi scarichi senza
-- alterare lo stato principale del mezzo oltre la normale NON_DISPONIBILITA.

CREATE TABLE `gestioni_mezzi_scarichi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codice` VARCHAR(50) NOT NULL,
    `operatoreId` INTEGER NOT NULL,
    `mezzoId` VARCHAR(50) NOT NULL,
    `stato` VARCHAR(50) NOT NULL DEFAULT 'RITIRO_PROGRAMMATO_MEZZO_SCARICO',
    `batteriaRilevata` INTEGER NOT NULL,
    `noteOperative` TEXT NULL,
    `ritiroProgrammatoAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `mezzoRitiratoAt` DATETIME(3) NULL,
    `caricaIniziataAt` DATETIME(3) NULL,
    `caricaCompletataAt` DATETIME(3) NULL,
    `rimessaProgrammataAt` DATETIME(3) NULL,
    `rimessaCompletataAt` DATETIME(3) NULL,
    `chiusaAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `gestioni_mezzi_scarichi_codice_key`(`codice`),
    INDEX `gestioni_mezzi_scarichi_operatoreId_idx`(`operatoreId`),
    INDEX `gestioni_mezzi_scarichi_mezzoId_idx`(`mezzoId`),
    INDEX `gestioni_mezzi_scarichi_stato_idx`(`stato`),
    INDEX `gestioni_mezzi_scarichi_chiusaAt_idx`(`chiusaAt`),
    INDEX `gestioni_mezzi_scarichi_mezzoId_chiusaAt_idx`(`mezzoId`, `chiusaAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `gestioni_mezzi_scarichi`
    ADD CONSTRAINT `gestioni_mezzi_scarichi_operatoreId_fkey`
    FOREIGN KEY (`operatoreId`) REFERENCES `utenti`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `gestioni_mezzi_scarichi`
    ADD CONSTRAINT `gestioni_mezzi_scarichi_mezzoId_fkey`
    FOREIGN KEY (`mezzoId`) REFERENCES `mezzi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
