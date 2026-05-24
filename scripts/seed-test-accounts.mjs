import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD_CHIARA = "Password123!";
const SALT_ROUNDS = 12;

// Questo seed prepara i tre profili minimi necessari per completare
// i test multi-ruolo dello Sprint 1 senza dipendere da inserimenti manuali.
const ACCOUNT_DI_TEST = [
  {
    nome: "Giulia",
    cognome: "Test",
    email: "utente.test@esmart.local",
    dataNascita: "1995-01-15",
    codiceFiscale: "TSTNTE95A15H501Z",
    numeroPatente: "UT1234567",
    categoriaPatente: "B",
    ruolo: "Utente",
  },
  {
    nome: "Marco",
    cognome: "Servizio",
    email: "operatore.test@esmart.local",
    dataNascita: "1990-02-20",
    codiceFiscale: "TSTOPR90B20H501Y",
    numeroPatente: "OP7654321",
    categoriaPatente: "B",
    ruolo: "Operatore",
  },
  {
    nome: "Laura",
    cognome: "Comune",
    email: "pa.test@esmart.local",
    dataNascita: "1988-03-10",
    codiceFiscale: "TSTPAM88C10H501X",
    numeroPatente: null,
    categoriaPatente: null,
    ruolo: "Pubblica Amministrazione",
  },
];

async function creaOAggiornaAccount(account, passwordHash) {
  const utenteEsistente = await prisma.utente.findFirst({
    where: {
      OR: [
        { email: account.email.toLowerCase() },
        { codiceFiscale: account.codiceFiscale.toUpperCase() },
      ],
    },
    select: {
      id: true,
      email: true,
    },
  });

  const dataComune = {
    nome: account.nome,
    cognome: account.cognome,
    email: account.email.toLowerCase(),
    passwordHash,
    dataNascita: new Date(account.dataNascita),
    codiceFiscale: account.codiceFiscale.toUpperCase(),
    numeroPatente: account.numeroPatente,
    categoriaPatente: account.categoriaPatente,
    ruolo: account.ruolo,
    stato: "ATTIVO",
    codiceAttivazione: null,
    tentativiFalliti: 0,
    bloccatoFinoA: null,
  };

  if (!utenteEsistente) {
    const creato = await prisma.utente.create({
      data: dataComune,
      select: {
        id: true,
        email: true,
        ruolo: true,
      },
    });

    return { azione: "creato", utente: creato };
  }

  const aggiornato = await prisma.utente.update({
    where: { id: utenteEsistente.id },
    data: dataComune,
    select: {
      id: true,
      email: true,
      ruolo: true,
    },
  });

  // Puliamo eventuali sessioni precedenti per evitare test falsati
  // dopo modifiche di ruolo o vecchi login rimasti aperti.
  await prisma.sessione.deleteMany({
    where: { utenteId: utenteEsistente.id },
  });

  return { azione: "aggiornato", utente: aggiornato };
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD_CHIARA, SALT_ROUNDS);
  const risultati = [];

  for (const account of ACCOUNT_DI_TEST) {
    const risultato = await creaOAggiornaAccount(account, passwordHash);
    risultati.push(risultato);
  }

  console.log("");
  console.log("Account di test pronti per lo Sprint 1:");
  console.log(`Password comune: ${PASSWORD_CHIARA}`);
  console.log("");

  for (const risultato of risultati) {
    console.log(
      `- ${risultato.utente.ruolo}: ${risultato.utente.email} (${risultato.azione})`
    );
  }
}

main()
  .catch((error) => {
    console.error("Errore durante la preparazione degli account di test.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
