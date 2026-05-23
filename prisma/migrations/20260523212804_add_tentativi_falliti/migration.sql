-- AlterTable
ALTER TABLE `utenti` ADD COLUMN `bloccatoFinoA` DATETIME(3) NULL,
    ADD COLUMN `tentativiFalliti` INTEGER NOT NULL DEFAULT 0;
