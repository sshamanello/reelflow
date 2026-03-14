import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { validateOAuthState, getCodeVerifier } from "../lib/oauth";

const APP_BASE = import.meta.env.VITE_APP_BASE || window.location.origin;

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Обрабатываем авторизацию...");

  useEffect(() => {
    async function run() {
      const platform = searchParams.get("platform") || sessionStorage.getItem("rf_oauth_platform");
      sessionStorage.removeItem("rf_oauth_platform");
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        setStatus(`OAuth ошибка: ${error}`);
        return;
      }

      if (!platform || !code) {
        setStatus("Не хватает code или platform");
        return;
      }

      const isStateValid = validateOAuthState(platform, state);
      if (!isStateValid) {
        setStatus("Невалидный state. Авторизация отклонена.");
        return;
      }

      try {
        const redirect_uri = APP_BASE;
        const code_verifier = getCodeVerifier(platform);

        await api.exchangeCode({
          platform,
          code,
          redirect_uri,
          ...(code_verifier ? { code_verifier } : {}),
        });

        setStatus("Подключение успешно. Перенаправляем...");
        setTimeout(() => navigate("/accounts", { replace: true }), 800);
      } catch (e) {
        setStatus(
          `Ошибка обмена кода: ${e?.payload?.message || e?.payload?.error || e.message}`
        );
      }
    }

    run();
  }, [navigate, searchParams]);

  return (
    <div style={{ padding: 40 }}>
      <h1 className="page-title">OAuth callback</h1>
      <p className="page-subtitle">{status}</p>
    </div>
  );
}
