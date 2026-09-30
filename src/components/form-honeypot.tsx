/**
 * Web3Forms honeypot. A person never sees or tabs into it; a bot that autofills
 * it has told us it is a bot. The form drops the submission before POSTing and
 * answers with the normal confirmation, so the bot learns nothing about which
 * field caught it.
 */
export function FormHoneypot() {
  return (
    <input
      className="form-honeypot"
      type="text"
      name="botcheck"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
    />
  );
}
