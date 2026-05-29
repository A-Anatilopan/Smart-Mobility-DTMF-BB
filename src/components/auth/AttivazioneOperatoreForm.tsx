import AttivazioneAccountForm from "@/components/auth/AttivazioneAccountForm";

// Wrapper dedicato all'attivazione Operatore: mantiene la pagina leggibile
// e delega la logica comune al form riusabile.
export default function AttivazioneOperatoreForm() {
  return (
    <AttivazioneAccountForm
      apiEndpoint="/api/auth/attivazione-operatore"
      emailLabel="Email operatore"
      emailPlaceholder="operatore@email.it"
      codicePlaceholder="OPTEST2026"
      messaggioSuccessoFallback="Account operatore attivato. Ora puoi accedere all'area riservata."
    />
  );
}
