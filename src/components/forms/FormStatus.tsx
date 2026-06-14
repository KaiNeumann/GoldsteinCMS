interface FormErrorProps {
  message: string;
}

interface FormSuccessProps {
  title: string;
  message: string;
}

export function FormError({ message }: FormErrorProps) {
  return (
    <div className="gf-form-error px-5 py-3 bg-red-50 border-b border-red-200" role="alert">
      <p className="text-red-700 text-sm font-medium">{message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut."}</p>
    </div>
  );
}

export function FormSuccess({ title, message }: FormSuccessProps) {
  return (
    <div className="gf-form-success p-6 rounded-xl bg-green-50 border border-green-200 text-center" role="status">
      <p className="text-green-800 font-semibold text-lg">{title}</p>
      <p className="text-green-700 text-sm mt-2">{message}</p>
    </div>
  );
}
