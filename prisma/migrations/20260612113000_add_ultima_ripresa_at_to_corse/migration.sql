-- M-03 / S3.15d
-- Aggiunge il timestamp dell'ultima ripresa reale della corsa per
-- distinguere correttamente minuti di utilizzo e minuti di pausa.

ALTER TABLE `corse`
ADD COLUMN `ultimaRipresaAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
AFTER `iniziataAt`;
