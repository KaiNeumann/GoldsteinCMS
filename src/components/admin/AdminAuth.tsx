import { useEffect, useState } from "react";
import { useContent } from "../../context/ContentContext";

interface AdminAuthProps {
  children: (onLogout: () => void) => React.ReactNode;
}

export default function AdminAuth({ children }: AdminAuthProps) {
  const { validateAdminPassword, checkAdminSession, logoutAdminSession } = useContent();
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem("gf_admin_auth") === "true"
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const verifyExistingSession = async () => {
      if (!sessionStorage.getItem("gf_admin_auth")) return;
      const status = await checkAdminSession();
      if (cancelled) return;
      if (!status.success || !status.authenticated) {
        sessionStorage.removeItem("gf_admin_auth");
        setAuthenticated(false);
      }
    };

    verifyExistingSession();
    const interval = window.setInterval(verifyExistingSession, 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [checkAdminSession]);

  const handleLogout = () => {
    sessionStorage.removeItem("gf_admin_auth");
    logoutAdminSession();
    setAuthenticated(false);
  };

  if (authenticated) return <>{children(handleLogout)}</>;

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="bg-surface-card rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from--primary to--primary-light p-6 text-center">
          <svg className="w-12 h-12 text-white/80 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h1 className="text-2xl font-bold text-white">Admin-Bereich</h1>
          <p className="text-green-100 text-sm mt-1">Bitte melden Sie sich an</p>
        </div>
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsLoggingIn(true);
              const result = await validateAdminPassword(password);
              setIsLoggingIn(false);
              if (result.success) {
                setAuthenticated(true);
                sessionStorage.setItem("gf_admin_auth", "true");
                setError("");
              } else {
                setError(result.error || "Falsches Passwort");
              }
            }}
          >
            <label className="block text-sm font-medium text-text mb-2">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring--primary focus:border-transparent outline-none"
              placeholder="Passwort eingeben…"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-4 bg--primary text-white py-3 rounded-lg font-semibold hover:bg--primary-dark transition-colors"
            >
              {isLoggingIn ? "Prüfe..." : "Anmelden"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
