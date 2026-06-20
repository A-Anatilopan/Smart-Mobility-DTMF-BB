-- Separa in modo pulito le note di apertura e chiusura della sessione operativa.
ALTER TABLE `sessioni_operative_mezzo`
  ADD COLUMN `noteApertura` TEXT NULL,
  ADD COLUMN `noteChiusura` TEXT NULL;

UPDATE `sessioni_operative_mezzo`
SET `noteApertura` = `note`
WHERE `note` IS NOT NULL;

ALTER TABLE `sessioni_operative_mezzo`
  DROP COLUMN `note`;
