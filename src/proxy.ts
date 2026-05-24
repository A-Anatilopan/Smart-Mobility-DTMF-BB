import { NextResponse, type NextRequest } from "next/server";
import {
  leggiRuoloDaCookie,
  risolviPercorsoDashboard,
  RUOLI,
  type RuoloCanonico,
} from "@/lib/ruoli";

// In Next 16 il file convenzionale e `proxy.ts`.
// Lo usiamo per bloccare in anticipo l'accesso alle aree riservate
// quando manca la sessione o il ruolo non coincide con la pagina richiesta.

function ruoloRichiestoPerPath(pathname: string): RuoloCanonico | null {
  if (pathname.startsWith("/dashboard")) {
    return RUOLI.UTENTE;
  }

  if (pathname.startsWith("/operatore")) {
    return RUOLI.OPERATORE;
  }

  if (pathname.startsWith("/admin")) {
    return RUOLI.PUBBLICA_AMMINISTRAZIONE;
  }

  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ruoloRichiesto = ruoloRichiestoPerPath(pathname);

  if (!ruoloRichiesto) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("session_token")?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const ruoloDaCookie = leggiRuoloDaCookie(
    request.cookies.get("session_role")?.value
  );

  // Se il cookie ruolo non e disponibile lasciamo proseguire la request:
  // la pagina server-side effettua comunque la verifica completa sul database.
  if (!ruoloDaCookie) {
    return NextResponse.next();
  }

  if (ruoloDaCookie !== ruoloRichiesto) {
    return NextResponse.redirect(
      new URL(risolviPercorsoDashboard(ruoloDaCookie), request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/operatore/:path*", "/admin/:path*"],
};
