import { useContentFields } from "../../context/ContentFields";

export default function BankAccountWidget() {
  const { getStringField } = useContentFields();
  const bank = getStringField("bankAccount.bank");
  const accountNumber = getStringField("bankAccount.accountNumber");
  const blz = getStringField("bankAccount.blz");
  const iban = getStringField("bankAccount.iban");
  const bic = getStringField("bankAccount.bic");

  return (
    <div className="bg-surface-card rounded-xl shadow-md overflow-hidden">
      <div className="bg--primary px-5 py-3">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Spendenkonto</h3>
      </div>
      <div className="p-5 text-sm text-text space-y-1.5">
        <p className="font-semibold">{bank}</p>
        <p>Kto. Nr.: {accountNumber}</p>
        <p>BLZ: {blz}</p>
        <p className="text-xs text-text-muted mt-2">IBAN: {iban}</p>
        <p className="text-xs text-text-muted">BIC: {bic}</p>
      </div>
    </div>
  );
}
