import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../hooks/useI18n";
import { useAuth } from "../context/AuthContext";
import { apiLogin } from "../lib/auth";

export default function Login() {
  const { t, lang, setLang } = useI18n();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiLogin({ email, password });
      setUser(data.user);
      navigate("/");
    } catch (err) {
      const code = err?.payload?.error || err?.message || "";
      if (code === "invalid_credentials") {
        setError(t("auth_error_invalid"));
      } else {
        setError(t("auth_error_server"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-header">
        <Link to="/" className="auth-brand">ReelFlow Studio</Link>
        <button className="lang-toggle" onClick={() => setLang(lang === "ru" ? "en" : "ru")}>
          {lang === "ru" ? "EN" : "RU"}
        </button>
      </div>

      <div className="auth-card">
        <h1 className="auth-title">{t("auth_login_title")}</h1>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label className="label">{t("auth_email")}</label>
            <input
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">{t("auth_password")}</label>
            <input
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button className="btn btn-dark btn-full" type="submit" disabled={loading}>
            {loading ? t("auth_signing_in") : t("auth_login")}
          </button>
        </form>

        <div className="auth-switch">
          {t("auth_no_account")}{" "}
          <Link to="/register">{t("auth_register")}</Link>
        </div>
      </div>
    </div>
  );
}
