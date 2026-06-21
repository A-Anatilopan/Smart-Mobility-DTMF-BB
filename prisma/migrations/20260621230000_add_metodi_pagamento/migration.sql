-- M-04 / Sprint 4 / UT.10
-- Introduce la base persistente dei metodi di pagamento salvati dall'utente
-- senza memorizzare numero carta completo o CVV.

CREATE TABLE `metodi_pagamento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utenteId` INTEGER NOT NULL,
    `tipo` VARCHAR(20) NOT NULL DEFAULT 'CARTA',
    `circuito` VARCHAR(30) NOT NULL,
    `intestatario` VARCHAR(120) NOT NULL,
    `ultime4` VARCHAR(4) NOT NULL,
    `scadenzaMese` INTEGER NOT NULL,
    `scadenzaAnno` INTEGER NOT NULL,
    `alias` VARCHAR(80) NULL,
    `tokenMock` VARCHAR(80) NOT NULL,
    `stato` VARCHAR(20) NOT NULL DEFAULT 'ATTIVO',
    `predefinito` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `metodi_pagamento_tokenMock_key`(`tokenMock`),
    INDEX `metodi_pagamento_utenteId_stato_idx`(`utenteId`, `stato`),
    INDEX `metodi_pagamento_utenteId_predefinito_idx`(`utenteId`, `predefinito`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `metodi_pagamento`
    ADD CONSTRAINT `metodi_pagamento_utenteId_fkey`
    FOREIGN KEY (`utenteId`) REFERENCES `utenti`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
