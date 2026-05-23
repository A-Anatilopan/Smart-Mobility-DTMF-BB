-- CreateTable
CREATE TABLE `utenti` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `cognome` VARCHAR(100) NOT NULL,
    `dataNascita` DATE NOT NULL,
    `codiceFiscale` VARCHAR(16) NOT NULL,
    `numeroPatente` VARCHAR(50) NULL,
    `categoriaPatente` VARCHAR(20) NULL,
    `ruolo` VARCHAR(20) NOT NULL DEFAULT 'UTENTE',
    `stato` VARCHAR(20) NOT NULL DEFAULT 'ATTIVO',
    `codiceAttivazione` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `utenti_email_key`(`email`),
    UNIQUE INDEX `utenti_codiceFiscale_key`(`codiceFiscale`),
    UNIQUE INDEX `utenti_codiceAttivazione_key`(`codiceAttivazione`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessioni` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(512) NOT NULL,
    `utenteId` INTEGER NOT NULL,
    `scadeAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sessioni_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessioni` ADD CONSTRAINT `sessioni_utenteId_fkey` FOREIGN KEY (`utenteId`) REFERENCES `utenti`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
