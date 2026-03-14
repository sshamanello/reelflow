import { useEffect, useState } from "react";
import SectionCard from "../components/SectionCard";
import { api } from "../lib/api";

function statusBadge(type) {
  if (type === "published") return <span className="badge badge-success">Опубликовано</span>;
  if (type === "uploaded") return <span className="badge badge-warning">Загружено</span>;
  if (type === "scheduled") return <span className="badge badge-warning">Запланировано</span>;
  return <span className="badge badge-danger">Ошибка</span>;
}

export default function History() {
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState(null);

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
      <h1 className="page-title">История</h1>
      <p className="page-subtitle">Лента публикаций и статусов задач.</p>

      <section className="grid-4">
        <div className="stat-card">
          <div className="stat-label">Загружено</div>
          <div className="stat-value">{stats?.uploaded ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Опубликовано</div>
          <div className="stat-value">{stats?.published ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Запланировано</div>
          <div className="stat-value">{stats?.scheduled ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ошибки</div>
          <div className="stat-value">{stats?.errors ?? 0}</div>
        </div>
      </section>

      <div style={{ height: 16 }} />

      <SectionCard title="Последние публикации">
        <div className="list">
          {!videos.length ? (
            <div className="empty-state" style={{ padding: "32px 0" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block", color: "var(--muted)", opacity: 0.4 }}>
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <h3>Нет публикаций</h3>
              <p>Загрузите первое видео — оно появится здесь</p>
            </div>
          ) : (
            videos
              .slice()
              .reverse()
              .map((item) => (
                <article key={item.id} className="history-card">
                  <div className="row-between">
                    <strong style={{ fontSize: 15 }}>{item.name || "Без названия"}</strong>
                    {statusBadge(item.status)}
                  </div>
                  <div className="history-meta">
                    {item.publishId && <span>ID: {item.publishId}</span>}
                    {item.projectId && <span>Проект: {item.projectId}</span>}
                    {item.createdAt && <span>{new Date(item.createdAt).toLocaleDateString("ru-RU")}</span>}
                  </div>
                </article>
              ))
          )}
        </div>
      </SectionCard>
    </>
  );
}
