import { useRef, useState } from "react";

export type SubmitStatus = "idle" | "loading" | "success" | "error";

interface UseFormSubmissionOptions<T> {
  validate: (data: T) => Record<string, string>;
  submit: (data: T) => Promise<void>;
  errorMessage: string;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function useFormSubmission<T>({ validate, submit, errorMessage }: UseFormSubmissionOptions<T>) {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const submittedAtRef = useRef<number>(Date.now());

  async function submitForm(data: T): Promise<void> {
    const errors = validate(data);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setStatus("loading");

    try {
      await submit(data);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : errorMessage);
      setStatus("error");
    }
  }

  return { status, errorMsg, fieldErrors, submittedAt: submittedAtRef.current, submitForm };
}
