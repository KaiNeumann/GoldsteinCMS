import type { FormEvent } from "react";
import { useContent } from "../../context/ContentContext";
import { site } from "../../siteConfig";
import { FormError, FormSuccess } from "./FormStatus";
import { isValidEmail, useFormSubmission } from "./useFormSubmission";

interface NewsletterSignupProps {
  formId?: string;
}

interface NewsletterFormState {
  email: string;
  name: string;
  privacyAccepted: boolean;
  website: string;
  submittedAt: number;
}

export default function NewsletterSignup({ formId = "default" }: NewsletterSignupProps) {
  const { content } = useContent();

  const formConfig = site.forms?.newsletter;
  const privacyText = (content?.fields?.["forms.newsletter.privacyText"] as string) || "";
  const datenschutzPath = "/datenschutz";

  function validate(form: NewsletterFormState): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!form.email.trim()) {
      errors.email = "Bitte geben Sie Ihre E-Mail-Adresse ein.";
    } else if (!isValidEmail(form.email)) {
      errors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
    }
    if (formConfig?.requirePrivacyConsent && !form.privacyAccepted) {
      errors.privacyAccepted = "Bitte akzeptieren Sie die Datenschutzbestimmungen.";
    }
    return errors;
  }

  async function submitNewsletter(data: NewsletterFormState) {
    const res = await fetch("/api/forms/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formId, ...data }),
    });

    if (!res.ok) {
      throw new Error("Die Anmeldung konnte nicht verarbeitet werden.");
    }
  }

  const { status, errorMsg, fieldErrors, submittedAt, submitForm } = useFormSubmission<NewsletterFormState>({
    validate,
    submit: submitNewsletter,
    errorMessage: "Ein unbekannter Fehler ist aufgetreten.",
  });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      email: (formData.get("email") as string) || "",
      name: (formData.get("name") as string) || "",
      privacyAccepted: formData.get("privacyAccepted") === "on",
      website: (formData.get("website") as string) || "",
      submittedAt,
    };

    await submitForm(data);
  }

  if (status === "success") {
    return <FormSuccess title="Vielen Dank für Ihre Anmeldung!" message="Bitte bestätigen Sie Ihre E-Mail-Adresse über den Bestätigungslink." />;
  }

  return (
    <div className="gf-newsletter-wrapper bg-surface-card rounded-xl shadow-md overflow-hidden">
      {status === "error" && (
        <FormError message={errorMsg} />
      )}

      <div className="bg--primary px-5 py-3">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Newsletter abonnieren</h3>
      </div>

      <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="gf-honeypot" aria-hidden="true" />
        <input type="hidden" name="submittedAt" value={submittedAt} />

        <div>
          <label htmlFor={`newsletter-email-${formId}`} className="block text-sm font-medium text-text mb-1">
            E-Mail *
          </label>
          <input
            type="email"
            id={`newsletter-email-${formId}`}
            name="email"
            required
            autoComplete="email"
            className={`gf-form-input w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm ${
              fieldErrors.email ? "border-red-400" : "border-border"
            }`}
          />
          {fieldErrors.email && <p className="gf-form-error text-red-600 text-xs mt-1" role="alert">{fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor={`newsletter-name-${formId}`} className="block text-sm font-medium text-text mb-1">
            Name <span className="text-text-muted text-xs">(optional)</span>
          </label>
          <input
            type="text"
            id={`newsletter-name-${formId}`}
            name="name"
            autoComplete="name"
            className="gf-form-input w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
          />
        </div>

        {formConfig?.requirePrivacyConsent !== false && (
          <div>
            <label className="flex items-start gap-2 text-sm text-text cursor-pointer">
              <input
                type="checkbox"
                name="privacyAccepted"
                className="gf-form-checkbox mt-0.5 h-4 w-4 rounded border-border text--primary focus:ring--primary"
              />
              <span>
                Ich möchte den Newsletter abonnieren und stimme der Verarbeitung meiner Daten gemäß der{" "}
                <a href={datenschutzPath} target="_blank" rel="noopener noreferrer" className="text--primary hover:underline">
                  Datenschutzerklärung
                </a>{" "}
                zu. {privacyText}
              </span>
            </label>
            {fieldErrors.privacyAccepted && (
              <p className="gf-form-error text-red-600 text-xs mt-1" role="alert">{fieldErrors.privacyAccepted}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="gf-form-submit w-full py-2.5 bg--primary text-white rounded-lg font-semibold hover:bg--primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "Wird gesendet..." : "Newsletter abonnieren"}
        </button>
      </form>
    </div>
  );
}
