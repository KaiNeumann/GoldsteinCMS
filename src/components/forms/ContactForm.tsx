import type { FormEvent } from "react";
import { useContent } from "../../context/ContentContext";
import { useContentFields } from "../../context/ContentFields";
import { site } from "../../siteConfig";
import { FormError, FormSuccess } from "./FormStatus";
import { isValidEmail, useFormSubmission } from "./useFormSubmission";

interface ContactFormProps {
  formId?: string;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  privacyAccepted: boolean;
  website: string;
  submittedAt: number;
}

export default function ContactForm({ formId = "default" }: ContactFormProps) {
  const { content } = useContent();
  const { getStringField } = useContentFields();
  const contactEmail = getStringField("contact.email");

  const formConfig = site.forms?.contact;
  const privacyText = (content?.fields?.["forms.contact.privacyText"] as string) || "";
  const datenschutzPath = "/datenschutz";

  function validate(form: FormState): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Bitte geben Sie Ihren Namen ein.";
    if (!form.email.trim()) {
      errors.email = "Bitte geben Sie Ihre E-Mail-Adresse ein.";
    } else if (!isValidEmail(form.email)) {
      errors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
    }
    if (!form.message.trim()) {
      errors.message = "Bitte geben Sie eine Nachricht ein.";
    } else if (formConfig?.maxMessageLength && form.message.length > formConfig.maxMessageLength) {
      errors.message = `Die Nachricht darf maximal ${formConfig.maxMessageLength} Zeichen lang sein.`;
    }
    if (formConfig?.requirePrivacyConsent && !form.privacyAccepted) {
      errors.privacyAccepted = "Bitte akzeptieren Sie die Datenschutzbestimmungen.";
    }
    return errors;
  }

  async function submitContact(data: FormState) {
    const strategy = formConfig?.strategy || "mailto";

    if (strategy === "mailto") {
      const subjectText = data.subject || "Kontaktanfrage";
      const body = `Name: ${data.name}\nE-Mail: ${data.email}\nTelefon: ${data.phone || "nicht angegeben"}\n\n${data.message}`;
      const mailtoUrl = `mailto:${contactEmail}?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;
      return;
    }

    const res = await fetch("/api/forms/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formId, ...data }),
    });

    if (!res.ok) {
      throw new Error("Die Nachricht konnte nicht gesendet werden.");
    }
  }

  const { status, errorMsg, fieldErrors, submittedAt, submitForm } = useFormSubmission<FormState>({
    validate,
    submit: submitContact,
    errorMessage: "Ein unbekannter Fehler ist aufgetreten.",
  });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const data: FormState = {
      name: (formData.get("name") as string) || "",
      email: (formData.get("email") as string) || "",
      phone: (formData.get("phone") as string) || "",
      subject: (formData.get("subject") as string) || "",
      message: (formData.get("message") as string) || "",
      privacyAccepted: formData.get("privacyAccepted") === "on",
      website: (formData.get("website") as string) || "",
      submittedAt,
    };

    await submitForm(data);
  }

  if (status === "success") {
    return <FormSuccess title="Vielen Dank für Ihre Nachricht!" message="Wir melden uns schnellstmöglich bei Ihnen." />;
  }

  return (
    <div className="gf-contact-form-wrapper bg-surface-card rounded-xl shadow-md overflow-hidden">
      {status === "error" && (
        <FormError message={errorMsg} />
      )}

      <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="gf-honeypot" aria-hidden="true" />
        <input type="hidden" name="submittedAt" value={submittedAt} />

        <div>
          <label htmlFor={`contact-name-${formId}`} className="block text-sm font-medium text-text mb-1">
            Name *
          </label>
          <input
            type="text"
            id={`contact-name-${formId}`}
            name="name"
            required
            autoComplete="name"
            className={`gf-form-input w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm ${
              fieldErrors.name ? "border-red-400" : "border-border"
            }`}
          />
          {fieldErrors.name && <p className="gf-form-error text-red-600 text-xs mt-1" role="alert">{fieldErrors.name}</p>}
        </div>

        <div>
          <label htmlFor={`contact-email-${formId}`} className="block text-sm font-medium text-text mb-1">
            E-Mail *
          </label>
          <input
            type="email"
            id={`contact-email-${formId}`}
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
          <label htmlFor={`contact-phone-${formId}`} className="block text-sm font-medium text-text mb-1">
            Telefon <span className="text-text-muted text-xs">(optional)</span>
          </label>
          <input
            type="tel"
            id={`contact-phone-${formId}`}
            name="phone"
            autoComplete="tel"
            className="gf-form-input w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
          />
        </div>

        <div>
          <label htmlFor={`contact-subject-${formId}`} className="block text-sm font-medium text-text mb-1">
            Betreff <span className="text-text-muted text-xs">(optional)</span>
          </label>
          <input
            type="text"
            id={`contact-subject-${formId}`}
            name="subject"
            className="gf-form-input w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm"
          />
        </div>

        <div>
          <label htmlFor={`contact-message-${formId}`} className="block text-sm font-medium text-text mb-1">
            Nachricht *
          </label>
          <textarea
            id={`contact-message-${formId}`}
            name="message"
            required
            rows={5}
            className={`gf-form-input w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none text-sm resize-y ${
              fieldErrors.message ? "border-red-400" : "border-border"
            }`}
          />
          {fieldErrors.message && <p className="gf-form-error text-red-600 text-xs mt-1" role="alert">{fieldErrors.message}</p>}
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
                Ich stimme der Verarbeitung meiner Daten gemäß der{" "}
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
          {status === "loading" ? "Wird gesendet..." : "Nachricht senden"}
        </button>
      </form>
    </div>
  );
}
