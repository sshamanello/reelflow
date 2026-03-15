import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionCard from "../components/SectionCard";
import { useI18n } from "../hooks/useI18n";
import { api } from "../lib/api";

export default function Dashboard() {
  const { t } = useI18n();
  const [profiles, setProfiles] = useState({});
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, statsRes] = await Promise.all([
          api.getMe(),
          api.getStats(),
        ]);
        setProfiles(meRes?.profiles || {});
        setStats(statsRes || null);
      } catch {
        setProfiles({});
        setStats(null);
      }
    }
    load();
  }, []);

  const connectedCount = Object.keys(profiles).length;

  return (
    <>
      <section className="hero">
        <div>
          <span className="badge badge-green" style={{ marginBottom: 18, display: "inline-flex" }}>
            TikTok OAuth 2.0
          </span>

          <h1>{t("dash_subtitle")}</h1>
          <p>{t("dash_connect_hint")}</p>

          <div className="inline-actions">
            <Link to="/post" className="btn btn-dark">{t("nav_post")}</Link>
            <Link to="/accounts" className="btn btn-ghost">{t("nav_accounts")}</Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="phone-card a" />
          <div className="phone-card b" />
          <div className="phone-card c" />
          <div className="phone-card d" />
          <div className="phone-stage" />
          <div className="visual-pill">Live · {connectedCount}</div>
        </div>
      </section>

      <div style={{ height: 16 }} />

      <section className="grid-3">
        <div className="stat-card">
          <div className="stat-label">{t("acc_connected")}</div>
          <div className="stat-value">{connectedCount}</div>
          <div className="stat-change">TikTok</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t("dash_uploaded")}</div>
          <div className="stat-value">{stats?.uploaded ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t("dash_errors")}</div>
          <div className="stat-value">{stats?.errors ?? 0}</div>
        </div>
      </section>

      <div style={{ height: 16 }} />

      <section className="grid-2">
        <SectionCard title="TikTok">
          {connectedCount === 0 ? (
            <div className="empty-state" style={{ padding: "20px 0" }}>
              <p>{t("dash_connect_hint")}</p>
              <div style={{ marginTop: 12 }}>
                <Link to="/accounts" className="btn btn-sm btn-dark">{t("acc_connect")}</Link>
              </div>
            </div>
          ) : (
            <div className="kv">
              {profiles.tiktok && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {profiles.tiktok.avatar_url && (
                    <img src={profiles.tiktok.avatar_url} alt="avatar" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                  )}
                  <div>
                    <strong>{profiles.tiktok.display_name || profiles.tiktok.handle}</strong>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("acc_connected")}</div>
                  </div>
                  <span className="badge badge-success" style={{ marginLeft: "auto" }}>✓</span>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard title={t("dash_quick_actions")}>
          <div className="column">
            <Link to="/post" className="btn btn-dark">
              {t("nav_post")}
            </Link>
            <Link to="/history" className="btn btn-ghost">
              {t("nav_history")}
            </Link>
          </div>
        </SectionCard>
      </section>
    </>
  );
}
