import { useContent } from "../../context/ContentContext";

export default function BankAccountWidget() {
  const { content } = useContent();
  const { siteConfig: cfg } = content;

  return (
    <div className="bg-surface-card rounded-xl shadow-md overflow-hidden">
      <div className="bg--primary px-5 py-3">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Spendenkonto</h3>
      </div>
      <div className="p-5 text-sm text-text space-y-1.5">
        <p className="font-semibold">{cfg.bankAccount.bank}</p>
        <p>Kto. Nr.: {cfg.bankAccount.accountNumber}</p>
        <p>BLZ: {cfg.bankAccount.blz}</p>
        <p className="text-xs text-text-muted mt-2">IBAN: {cfg.bankAccount.iban}</p>
        <p className="text-xs text-text-muted">BIC: {cfg.bankAccount.bic}</p>
      </div>
    </div>
  );
}