import { useEffect, useState } from "react";
import SectionCard from "../components/SectionCard";
import { useI18n } from "../hooks/useI18n";
import { api } from "../lib/api";

export default function History() {
  const { t } = useI18n();
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState(null);

  function statusBadge(type) {
    if (type === "published") return <span className="badge badge-success">{t("dash_published")}</span>;
    if (type === "uploaded") return <span className="badge badge-warning">{t("dash_uploaded")}</span>;
    if (type === "scheduled") return <span className="badge badge-warning">{t("dash_scheduled")}</span>;
    return <span className="badge badge-danger">{t("dash_errors")}</span>;
  }

  useEffect(() => {
    async function load() {
      try {
        const [videosRes, statsRes] = await Promise.all([
          api.getVideos(),
          api.getStats(),
        ]);
        setVideos(videosRes?.videos || []);
        setStats(statsRes || null);
      } catch {
        setVideos([]);
        setStats(null);
      }
    }

    load();
  }, []);

  return (
    <>
      <h1 className="page-title">{t("hist_title")}</h1>
      <p className="page-subtitle">{t("hist_subtitle")}</p>

      <section className="grid-4">
        <div className="stat-card">
          <div className="stat-label">{t("dash_uploaded")}</div>
          <div className="stat-value">{stats?.uploaded ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t("dash_published")}</div>
          <div className="stat-value">{stats?.published ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t("dash_scheduled")}</div>
          <div className="stat-value">{stats?.scheduled ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t("dash_errors")}</div>
          <div className="stat-value">{stats?.errors ?? 0}</div>
        </div>
      </section>

      <div style={{ height: 16 }} />

      <SectionCard title={t("hist_recent_videos") || t("hist_title")}>
        <div className="list">
          {!videos.length ? (
            <div className="empty-state" style={{ padding: "32px 0" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block", color: "var(--muted)", opacity: 0.4 }}>
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <h3>{t("hist_no_videos")}</h3>
            </div>
          ) : (
            videos
              .slice()
              .reverse()
              .map((item) => (
                <article key={item.id} className="history-card">
                  <div className="row-between">
                    <strong style={{ fontSize: 15 }}>{item.name || "—"}</strong>
                    {statusBadge(item.status)}
                  </div>
                  <div className="history-meta">
                    {item.publishId && <span>ID: {item.publishId}</span>}
                    {item.createdAt && <span>{new Date(item.createdAt).toLocaleDateString()}</span>}
                  </div>
                </article>
              ))
          )}
        </div>
      </SectionCard>
    </>
  );
}
