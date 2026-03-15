import { useEffect, useState } from "react";
import SectionCard from "../components/SectionCard";
import { useAppToast } from "../components/Layout";
import { useI18n } from "../hooks/useI18n";
import { api } from "../lib/api";
import { buildTikTokOAuthUrl } from "../lib/oauth";

const TikTokIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.72a4.85 4.85 0 0 1-1.02-.03z"/>
  </svg>
);

function badgeClass(connected) {
  return connected ? "badge badge-success" : "badge badge-gray";
}

export default function Accounts() {
  const { showToast } = useAppToast();
  const { t } = useI18n();
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);

  async function loadProfiles() {
    try {
      setLoading(true);
      const data = await api.getMe();
      setProfiles(data?.profiles || {});
    } catch {
      setProfiles({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  const tiktok = profiles.tiktok;

  async function connect() {
    try {
      const url = await buildTikTokOAuthUrl();
      window.location.href = url;
    } catch (e) {
      showToast(e.message);
    }
  }

  async function disconnect() {
    try {
      await api.disconnectPlatform("tiktok");
      showToast(t("acc_disconnected") + ": TikTok");
      await loadProfiles();
    } catch (e) {
      showToast(e?.payload?.error || t("acc_disconnect_error"));
    }
  }

  return (
    <>
      <h1 className="page-title">{t("acc_title")}</h1>
      <p className="page-subtitle">{t("acc_subtitle")}</p>

      <SectionCard title={t("acc_how_works")}>
        <div className="notice notice-info">
          {t("acc_security_note")}
        </div>
      </SectionCard>

      {loading ? (
        <div className="panel">
          <div className="muted">{t("acc_loading")}</div>
        </div>
      ) : (
        <section className="account-grid">
          <article className="account-card">
            <div className="account-head">
              <div className="account-icon" style={{ background: "#010101", color: "white", overflow: "hidden" }}>
                {tiktok?.avatar_url ? (
                  <img src={tiktok.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
                ) : (
                  <TikTokIcon />
                )}
              </div>
              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>TikTok</h3>
                <span className={badgeClass(!!tiktok)}>
                  {tiktok ? t("acc_connected") : t("acc_not_connected")}
                </span>
              </div>
            </div>

            <div className="kv" style={{ marginBottom: 16 }}>
              <div>
                <strong>{t("acc_account")}</strong>
                <span>{tiktok?.handle || tiktok?.display_name || "—"}</span>
              </div>
              <div>
                <strong>{t("acc_access_type")}</strong>
                <span>TikTok OAuth 2.0</span>
              </div>
              <div>
                <strong>{t("acc_rights")}</strong>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>video.upload, user.info.basic</span>
              </div>
              <div>
                <strong>{t("acc_token")}</strong>
                <span>{tiktok ? t("acc_token_active") : t("acc_token_inactive")}</span>
              </div>
            </div>

            <div className="inline-actions">
              {!tiktok ? (
                <button className="btn btn-sm btn-dark" onClick={connect}>
                  {t("acc_connect")}
                </button>
              ) : (
                <>
                  <button className="btn btn-sm btn-ghost" onClick={connect}>
                    {t("acc_reconnect")}
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={disconnect}>
                    {t("acc_disconnect")}
                  </button>
                </>
              )}
            </div>
          </article>
        </section>
      )}
    </>
  );
}
