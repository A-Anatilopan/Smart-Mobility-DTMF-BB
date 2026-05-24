-- Allarga la colonna ruolo per supportare il naming ufficiale
-- "Pubblica Amministrazione" senza errori di lunghezza.
ALTER TABLE `utenti`
MODIFY `ruolo` VARCHAR(50) NOT NULL DEFAULT 'Utente';
