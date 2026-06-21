# E-SMART MOBILITY

Web application universitaria per la gestione di un sistema integrato di sharing mobility nella citta di Zootropolis, sviluppata con Next.js, React, TypeScript, Prisma e MySQL locale.

Il progetto supporta tre ruoli principali:
- Utente
- Operatore del Servizio
- Pubblica Amministrazione

Questa guida serve a far partire il sistema in locale con una base dati gia pronta per le prove.

## Stack reale del progetto

- Next.js `16.2.6`
- React `19.2.4`
- TypeScript
- Prisma `6.19.3`
- MySQL locale
- Tailwind CSS v4
- Leaflet / React Leaflet per la mappa

## Requisiti

Prima di iniziare servono:
- Node.js installato
- npm installato insieme a Node.js
- MySQL Server installato e avviato
- un database MySQL locale chiamato `esmartmobility`

### Importante: React, Next.js, Prisma e librerie non vanno installati a mano

Non bisogna installare manualmente `react`, `next`, `prisma`, `@prisma/client`,
`leaflet` o altre librerie una per una.

Basta eseguire:

```bash
npm install
```

perche il progetto scarica automaticamente le versioni corrette gia fissate nel repository.

Le versioni attualmente usate dal progetto sono:

- `next`: `16.2.6`
- `react`: `19.2.4`
- `react-dom`: `19.2.4`
- `prisma`: `^6.19.3`
- `@prisma/client`: `^6.19.3`
- `leaflet`: `^1.9.4`
- `react-leaflet`: `^5.0.0`
- `typescript`: `^5`
- `tailwindcss`: `^4`

## Guida completa per Windows

Questa e la procedura consigliata se il progetto viene aperto su un PC Windows.

### 1. Installare Node.js

1. Scaricare e installare **Node.js LTS** dal sito ufficiale.
2. Durante l'installazione lasciare attiva anche l'installazione di `npm`.
3. Al termine aprire un terminale e controllare che tutto sia disponibile:

```bash
node -v
npm -v
```

### 2. Installare MySQL Server

1. Installare **MySQL Server 8.x**.
2. Annotare la password dell'utente `root` scelta durante il setup.
3. Avviare MySQL.
4. Creare un database locale chiamato `esmartmobility`.

Se si usa MySQL Workbench o un altro client SQL, basta creare quel database vuoto.

### 3. Scaricare o clonare il progetto

Aprire la cartella del progetto sul proprio PC.

### 4. Installare tutte le dipendenze del progetto

Nel terminale, dentro la cartella del progetto, eseguire:

```bash
npm install
```

Questo comando installa automaticamente anche:
- React
- React DOM
- Next.js
- Prisma
- Prisma Client
- Leaflet
- React Leaflet
- TypeScript

### 5. Creare il file `.env`

Nel progetto e presente il file [`.env.example`](C:/Users/angel/Desktop/ing%20s/Smart-Mobility-DTMF-BB/.env.example).  
Copiare il contenuto dentro un nuovo file `.env` e inserire la password reale del proprio MySQL locale.

Contenuto di esempio:

```env
DATABASE_URL="mysql://root:LA_TUA_PASSWORD@localhost:3306/esmartmobility"
```

### 6. Applicare le migration del database

Nel terminale eseguire:

```bash
npx prisma migrate deploy
```

### 7. Rigenerare il client Prisma

```bash
npx prisma generate
```

### 8. Popolare il database con i dati demo

Su Windows, se PowerShell blocca `npm.ps1`, usare questo comando:

```bash
cmd /c npm run seed:demo
```

Se invece il terminale consente `npm` normalmente, va bene anche:

```bash
npm run seed:demo
```

### 9. Avviare Prisma Studio se si vuole vedere il database

```bash
npx prisma studio
```

### 10. Avviare l'applicazione

Su Windows, se PowerShell blocca `npm.ps1`, usare:

```bash
cmd /c npm run dev
```

Altrimenti:

```bash
npm run dev
```

### 11. Aprire il progetto nel browser

Aprire:

[http://localhost:3000](http://localhost:3000)

## Guida completa per macOS

Questa e la procedura consigliata se il progetto viene aperto su Mac.

### 1. Installare Node.js

1. Installare **Node.js LTS**.
2. Verificare che `node` e `npm` siano disponibili:

```bash
node -v
npm -v
```

### 2. Installare MySQL Server

1. Installare **MySQL Server**.
2. Avviare il servizio MySQL.
3. Creare un database chiamato `esmartmobility`.
4. Annotare la password dell'utente `root`.

### 3. Scaricare o clonare il progetto

Aprire il repository sul Mac.

### 4. Installare tutte le dipendenze del progetto

Dentro la cartella del progetto eseguire:

```bash
npm install
```

Anche su Mac questo comando installa automaticamente tutte le librerie del progetto, comprese React, Next.js e Prisma.

### 5. Creare il file `.env`

Nel progetto e presente il file [`.env.example`](C:/Users/angel/Desktop/ing%20s/Smart-Mobility-DTMF-BB/.env.example).  
Creare un file `.env` e inserire la connessione corretta al proprio MySQL locale:

```env
DATABASE_URL="mysql://root:LA_TUA_PASSWORD@localhost:3306/esmartmobility"
```

### 6. Applicare le migration del database

Applicare tutte le migration gia presenti:

```bash
npx prisma migrate deploy
```

### 7. Rigenerare il client Prisma

```bash
npx prisma generate
```

### 8. Popolare il database con i dati demo

```bash
npm run seed:demo
```

### 9. Avviare Prisma Studio se si vuole vedere il database

```bash
npx prisma studio
```

### 10. Avviare l'applicazione

```bash
npm run dev
```

### 11. Aprire il progetto nel browser

Aprire:

[http://localhost:3000](http://localhost:3000)

## Procedura rapida riassunta

### Windows

1. Installare Node.js
2. Installare MySQL Server
3. Creare il database `esmartmobility`
4. Aprire il progetto
5. Eseguire `npm install`
6. Creare `.env`
7. Eseguire `npx prisma migrate deploy`
8. Eseguire `npx prisma generate`
9. Eseguire `cmd /c npm run seed:demo`
10. Eseguire `cmd /c npm run dev`
11. Aprire `http://localhost:3000`

### macOS

1. Installare Node.js
2. Installare MySQL Server
3. Creare il database `esmartmobility`
4. Aprire il progetto
5. Eseguire `npm install`
6. Creare `.env`
7. Eseguire `npx prisma migrate deploy`
8. Eseguire `npx prisma generate`
9. Eseguire `npm run seed:demo`
10. Eseguire `npm run dev`
11. Aprire `http://localhost:3000`

## Comandi base del progetto

Client Prisma:

```bash
npx prisma generate
```

Database e dati demo:

```bash
npx prisma migrate deploy
npm run seed:demo
```

Visualizzazione database:

```bash
npx prisma studio
```

## Account demo principali

Questi tre account sono pensati apposta per le prove veloci:

| Ruolo | Email | Password |
|---|---|---|
| Utente | `utente@gmail.com` | `Prova1234` |
| Operatore | `operatore@gmail.com` | `Prova1234` |
| Pubblica Amministrazione | `pa@gmail.com` | `Prova1234` |

## Account storici aggiuntivi

| Ruolo | Email | Password |
|---|---|---|
| Utente | `utente.test@esmart.local` | `Password123!` |
| Operatore | `operatore.test@esmart.local` | `Password123!` |
| Pubblica Amministrazione | `pa.test@esmart.local` | `Password123!` |

## Cosa contiene il seed demo

Il seed inserisce:
- 12 account complessivi
- 15 mezzi
- corse terminate per alimentare i report
- una corsa attiva
- una corsa in pausa
- prenotazioni attive, scadute e annullate
- metodi di pagamento demo
- segnalazioni sui mezzi
- workflow operativi dell'operatore
- segnalazioni urbane della Pubblica Amministrazione

## Percorsi utili per la prova

Interfaccia pubblica e accesso:
- [http://localhost:3000](http://localhost:3000)
- [http://localhost:3000/login](http://localhost:3000/login)
- [http://localhost:3000/registrazione](http://localhost:3000/registrazione)

Attivazione account:
- [http://localhost:3000/attiva-operatore](http://localhost:3000/attiva-operatore)
- [http://localhost:3000/attiva-amministrazione](http://localhost:3000/attiva-amministrazione)

Aree riservate:
- [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- [http://localhost:3000/operatore](http://localhost:3000/operatore)
- [http://localhost:3000/admin](http://localhost:3000/admin)

## Comandi utili

Controllo TypeScript:

```bash
npx tsc --noEmit
```

Lint:

```bash
npm run lint
```

Seed storico minimo degli account test:

```bash
npm run seed:test-accounts
```

## Note importanti

- Il progetto usa MySQL locale, non servizi cloud.
- Le mappe usano cartografia OpenStreetMap tramite Leaflet.
- Se un terminale Windows blocca `npm`, il problema e il terminale, non il progetto: usare `cmd /c ...` oppure un prompt dei comandi tradizionale.
- Se il database e vuoto o incoerente dopo prove precedenti, rilanciare il seed demo.

## Stato del progetto

Il repository contiene gia una base funzionale con:
- autenticazione multi-ruolo
- attivazione account operatore e amministrazione
- mappa reale con mezzi e area di servizio
- prenotazione, avvio, pausa, ripresa e termine corsa
- gestione pagamenti demo
- pannelli operatore
- pannelli Pubblica Amministrazione
- report e segnalazioni gia navigabili

Questa guida e pensata per permettere una prova locale immediata senza dover ricostruire manualmente i dati.
