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

      <SectionCard title="Последние действия">
        <div className="list">
          {!videos.length ? (
            <div className="muted">Пока нет записей.</div>
          ) : (
            videos
              .slice()
              .reverse()
              .map((item) => (
                <article key={item.id} className="history-card">
                  <div className="row-between">
                    <strong>{item.name || "Untitled"}</strong>
                    {statusBadge(item.status)}
                  </div>
                  <div className="history-meta">
                    <span>ID: {item.publishId || "—"}</span>
                    <span>Проект: {item.projectId || "—"}</span>
                    <span>Дата: {item.createdAt || "—"}</span>
                  </div>
                </article>
              ))
          )}
        </div>
      </SectionCard>
    </>
  );
}
