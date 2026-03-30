import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../hooks/useI18n";
import { useAuth } from "../context/AuthContext";
import { apiRegister } from "../lib/auth";

export default function Register() {
  const { t, lang, setLang } = useI18n();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t("auth_error_short_password"));
      return;
    }

    setLoading(true);
    try {
      const data = await apiRegister({ email, password, name });
      setUser(data.user);
      navigate("/");
    } catch (err) {
      const code = err?.payload?.error || err?.message || "";
      if (code === "email_taken") {
        setError(t("auth_error_email_taken"));
      } else if (code === "password_too_short") {
        setError(t("auth_error_short_password"));
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
        <h1 className="auth-title">{t("auth_register_title")}</h1>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label className="label">{t("auth_name")}</label>
            <input
              className="field"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">{t("auth_email")}</label>
            <input
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            {loading ? t("auth_registering") : t("auth_register")}
          </button>
        </form>

        <div className="auth-switch">
          {t("auth_have_account")}{" "}
          <Link to="/login">{t("auth_login")}</Link>
        </div>
      </div>
    </div>
  );
}
