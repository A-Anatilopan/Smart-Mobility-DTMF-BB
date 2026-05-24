# Sprint 1 Report - E-Smart Mobility

## Stato

Sprint 1 completato sul modulo **M-01 - Autenticazione e Gestione Account**.

## Funzionalita completate

- Registrazione utente con validazioni principali
- Login multi-ruolo per `Utente`, `Operatore` e `Pubblica Amministrazione`
- Blocco temporaneo dopo troppi tentativi falliti
- Creazione e verifica sessione con cookie HTTP-only
- Redirect post-login verso la dashboard corretta in base al ruolo
- Dashboard base separate per i tre stakeholder
- Logout frontend completo con chiusura sessione
- Protezione centralizzata delle aree riservate tramite `src/proxy.ts`
- Seed locale per creare o aggiornare gli account di test dello Sprint 1

## Copertura tracciata

- **UC-07** - Registrazione Utente
- **UC-08** - Login
- **UT.11a** - Registrazione utente
- **UT.11b** - Login utente
- **OP.12b** - Login operatore
- **AP.07b** - Login Pubblica Amministrazione
- **INF-05** - Gestione sicura password
- **INF-09** - Autenticazione obbligatoria per aree riservate

## Test finali da confermare

### Flussi positivi

- Registrazione di un nuovo utente con dati validi
- Login `Utente` con redirect a `/dashboard`
- Login `Operatore` con redirect a `/operatore`
- Login `Pubblica Amministrazione` con redirect a `/admin`
- Logout corretto da tutte e tre le dashboard

### Flussi di protezione

- Accesso senza sessione a `/dashboard` -> redirect a `/login`
- Accesso senza sessione a `/operatore` -> redirect a `/login`
- Accesso senza sessione a `/admin` -> redirect a `/login`
- Accesso autenticato alla dashboard sbagliata -> redirect verso l'area corretta
- Dopo logout, riapertura di una rotta protetta -> redirect a `/login`

### Controlli tecnici

- `npm run lint`
- `npx prisma validate`
- `npm run seed:test-accounts`
- Verifica account da Prisma Studio

## Account di test Sprint 1

- `utente.test@esmart.local`
- `operatore.test@esmart.local`
- `pa.test@esmart.local`

Password comune:

```text
Password123!
```

## Backlog residuo di M-01

- **OP.12a** - Attivare account Operatore con codice identificativo
- **AP.07a** - Attivare account Pubblica Amministrazione con codice identificativo
- **OP.06 / UC-19** - Sospendere account utente

## Nota tecnica importante

Il progetto usa **Next.js 16.2.6** e per la protezione centralizzata delle rotte
la convenzione aggiornata da seguire e `src/proxy.ts`, non il vecchio
`middleware.ts`.
