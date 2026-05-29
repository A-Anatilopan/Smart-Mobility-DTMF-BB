import AttivazioneAccountForm from "@/components/auth/AttivazioneAccountForm";

// Wrapper dedicato alla Pubblica Amministrazione: riusa il form comune
// cambiando solo endpoint e testi mostrati all'utente.
export default function AttivazioneAmministrazioneForm() {
  return (
    <AttivazioneAccountForm
      apiEndpoint="/api/auth/attivazione-amministrazione"
      emailLabel="Email istituzionale"
      emailPlaceholder="ufficio@comune.it"
      codicePlaceholder="APTEST2026"
      messaggioSuccessoFallback="Account Pubblica Amministrazione attivato. Ti stiamo portando alla pagina di accesso."
    />
  );
}
