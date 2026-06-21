-- Aggiunge la data di scadenza patente per supportare i controlli su
-- prenotazione e avvio corsa dei mezzi che richiedono un titolo valido.
ALTER TABLE `utenti`
  ADD COLUMN `scadenzaPatente` DATE NULL AFTER `categoriaPatente`;
