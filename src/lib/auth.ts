// Logica di autenticazione: hashing password e gestione token sessione
// INF-05: password mai salvate in chiaro, sempre hashate con bcrypt
// INF-09: ogni richiesta protetta verifica il token sessione

import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SALT_ROUNDS = 12;
const DURATA_SESSIONE_ORE = 24;
export const STATO_ACCOUNT_SOSPESO = "SOSPESO";

// Hasha la password prima di salvarla nel DB
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Confronta la password inserita con quella hashata nel DB
export async function verificaPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Genera un token univoco per la sessione
export function generaToken(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}-${randomPart2}`;
}

// Crea una nuova sessione nel DB per l'utente autenticato
export async function creaSessione(utenteId: number): Promise<string> {
  const token = generaToken();
  const scadeAt = new Date();
  scadeAt.setHours(scadeAt.getHours() + DURATA_SESSIONE_ORE);

  await prisma.sessione.create({
    data: {
      token,
      utenteId,
      scadeAt,
    },
  });

  return token;
}

// Verifica che il token esista, non sia scaduto e restituisce l'utente
export async function verificaSessione(token: string) {
  const sessione = await prisma.sessione.findUnique({
    where: { token },
    include: { utente: true },
  });

  if (!sessione) return null;
  if (sessione.scadeAt < new Date()) {
    await prisma.sessione.delete({ where: { token } });
    return null;
  }

  // Se l'account e stato sospeso da un operatore invalidiamo subito tutte le
  // sessioni attive, cosi il blocco non resta limitato al solo prossimo login.
  if (sessione.utente.stato === STATO_ACCOUNT_SOSPESO) {
    await prisma.sessione.deleteMany({
      where: {
        utenteId: sessione.utenteId,
      },
    });
    return null;
  }

  return sessione.utente;
}

// Elimina la sessione dal DB (logout)
export async function eliminaSessione(token: string): Promise<void> {
  await prisma.sessione.deleteMany({ where: { token } });
}
