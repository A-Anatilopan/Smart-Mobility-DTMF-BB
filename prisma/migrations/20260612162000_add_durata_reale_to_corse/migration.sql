-- M-03 / correzione tariffazione reale
-- Memorizza il tempo reale cumulato di utilizzo e pausa per evitare
-- arrotondamenti per eccesso ad ogni singolo click di pausa/ripresa.

ALTER TABLE `corse`
ADD COLUMN `durataUtilizzoMs` INTEGER NOT NULL DEFAULT 0
AFTER `longitudineFine`,
ADD COLUMN `durataPausaMs` INTEGER NOT NULL DEFAULT 0
AFTER `durataUtilizzoMs`;
