-- Traccia il metodo di pagamento associato alla corsa e l'esito mock
-- dell'addebito finale, mantenendo lo storico anche se il metodo viene
-- eliminato successivamente dal profilo utente.

ALTER TABLE `corse`
  ADD COLUMN `metodoPagamentoCircuito` VARCHAR(30) NULL,
  ADD COLUMN `metodoPagamentoUltime4` VARCHAR(4) NULL,
  ADD COLUMN `metodoPagamentoAlias` VARCHAR(80) NULL,
  ADD COLUMN `pagamentoStato` VARCHAR(30) NULL,
  ADD COLUMN `pagamentoAutorizzatoAt` DATETIME(3) NULL,
  ADD COLUMN `pagamentoAddebitatoAt` DATETIME(3) NULL,
  ADD COLUMN `codiceAddebitoMock` VARCHAR(50) NULL;
