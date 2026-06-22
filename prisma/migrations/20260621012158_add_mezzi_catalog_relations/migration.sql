-- M-02 / M-03 / M-05
-- Introduce il catalogo persistito dei mezzi e collega i riferimenti gia
-- esistenti (prenotazioni, corse, segnalazioni e sessioni operative) alla
-- nuova entita Mezzo senza cambiare gli id stringa gia adottati nel progetto.

CREATE TABLE `mezzi` (
    `id` VARCHAR(50) NOT NULL,
    `codice` VARCHAR(50) NOT NULL,
    `tipo` VARCHAR(20) NOT NULL,
    `modello` VARCHAR(100) NOT NULL,
    `stato` VARCHAR(30) NOT NULL,
    `batteria` INTEGER NOT NULL,
    `latitudine` DECIMAL(10, 7) NOT NULL,
    `longitudine` DECIMAL(10, 7) NOT NULL,
    `posti` INTEGER NOT NULL,
    `patenteRichiesta` VARCHAR(20) NOT NULL,
    `areaServizioId` VARCHAR(50) NOT NULL,
    `areaServizioNome` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mezzi_codice_key`(`codice`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `mezzi` (
    `id`,
    `codice`,
    `tipo`,
    `modello`,
    `stato`,
    `batteria`,
    `latitudine`,
    `longitudine`,
    `posti`,
    `patenteRichiesta`,
    `areaServizioId`,
    `areaServizioNome`,
    `createdAt`,
    `updatedAt`
) VALUES
    ('mezzo-001', 'EB-1001', 'E-Bike', 'Urban Glide One', 'DISPONIBILE', 92, 41.1219800, 16.8730500, 1, 'Nessuna', 'area-bari-urbana', 'Area urbana di Bari', NOW(3), NOW(3)),
    ('mezzo-002', 'ES-2044', 'E-Scooter', 'Volt Street X', 'DISPONIBILE', 67, 41.1218200, 16.8732200, 1, 'AM', 'area-bari-urbana', 'Area urbana di Bari', NOW(3), NOW(3)),
    ('mezzo-003', 'EC-3007', 'E-Car', 'City Move Mini', 'DISPONIBILE', 54, 41.1219400, 16.8731600, 4, 'B', 'area-bari-urbana', 'Area urbana di Bari', NOW(3), NOW(3)),
    ('mezzo-004', 'ES-2051', 'E-Scooter', 'Volt Street X', 'DISPONIBILE', 43, 41.1187000, 16.8709000, 1, 'AM', 'area-bari-urbana', 'Area urbana di Bari', NOW(3), NOW(3)),
    ('mezzo-005', 'EB-1026', 'E-Bike', 'Urban Glide Plus', 'DISPONIBILE', 81, 41.1169000, 16.8759000, 1, 'Nessuna', 'area-bari-urbana', 'Area urbana di Bari', NOW(3), NOW(3)),
    ('mezzo-006', 'EC-3014', 'E-Car', 'Eco Drive Compact', 'DISPONIBILE', 74, 41.1089000, 16.8786000, 2, 'B', 'area-bari-urbana', 'Area urbana di Bari', NOW(3), NOW(3)),
    ('mezzo-007', 'EB-1034', 'E-Bike', 'Urban Glide Lite', 'DISPONIBILE', 88, 41.1256000, 16.8708000, 1, 'Nessuna', 'area-bari-urbana', 'Area urbana di Bari', NOW(3), NOW(3)),
    ('mezzo-008', 'ES-2062', 'E-Scooter', 'Volt Street Pro', 'DISPONIBILE', 58, 41.1234000, 16.8677000, 1, 'AM', 'area-bari-urbana', 'Area urbana di Bari', NOW(3), NOW(3)),
    ('mezzo-009', 'EC-3021', 'E-Car', 'City Move Mini', 'DISPONIBILE', 63, 41.1124000, 16.8661000, 4, 'B', 'area-bari-urbana', 'Area urbana di Bari', NOW(3), NOW(3)),
    ('mezzo-010', 'EB-1047', 'E-Bike', 'Urban Glide Tour', 'DISPONIBILE', 77, 41.1049000, 16.8711000, 1, 'Nessuna', 'area-bari-urbana', 'Area urbana di Bari', NOW(3), NOW(3)),
    ('mezzo-012', 'EC-3030', 'E-Car', 'Eco Drive Compact', 'IN_USO', 46, 41.1191000, 16.8844000, 2, 'B', 'area-bari-urbana', 'Area urbana di Bari', NOW(3), NOW(3)),
    ('mezzo-013', 'EB-1058', 'E-Bike', 'Urban Glide Plus', 'IN_MANUTENZIONE', 19, 41.1117000, 16.8578000, 1, 'Nessuna', 'area-bari-urbana', 'Area urbana di Bari', NOW(3), NOW(3)),
    ('mezzo-014', 'ES-2084', 'E-Scooter', 'Volt Street Pro', 'IN_PAUSA', 34, 41.1086000, 16.8892000, 1, 'AM', 'area-bari-urbana', 'Area urbana di Bari', NOW(3), NOW(3)),
    ('mezzo-015', 'EC-3042', 'E-Car', 'Eco Drive Urban', 'NON_DISPONIBILE', 11, 41.0988000, 16.8682000, 2, 'B', 'area-bari-urbana', 'Area urbana di Bari', NOW(3), NOW(3)),
    ('mezzo-016', 'ES-2091', 'E-Scooter', 'Volt Street Lite', 'DISPONIBILE', 71, 41.1221200, 16.8733600, 1, 'AM', 'area-bari-urbana', 'Area urbana di Bari', NOW(3), NOW(3));

ALTER TABLE `prenotazioni`
    ADD CONSTRAINT `prenotazioni_mezzoId_fkey`
    FOREIGN KEY (`mezzoId`) REFERENCES `mezzi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `corse`
    ADD CONSTRAINT `corse_mezzoId_fkey`
    FOREIGN KEY (`mezzoId`) REFERENCES `mezzi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `segnalazioni_mezzo`
    ADD CONSTRAINT `segnalazioni_mezzo_mezzoId_fkey`
    FOREIGN KEY (`mezzoId`) REFERENCES `mezzi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
