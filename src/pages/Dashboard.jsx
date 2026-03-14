import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionCard from "../components/SectionCard";
import { api } from "../lib/api";

export default function Dashboard() {
  const [profiles, setProfiles] = useState({});
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, statsRes, projectsRes] = await Promise.all([
          api.getMe(),
          api.getStats(),
          api.getProjects(),
        ]);
        setProfiles(meRes?.profiles || {});
        setStats(statsRes || null);
        setProjects(projectsRes?.projects || []);
      } catch {
        setProfiles({});
        setStats(null);
        setProjects([]);
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
            Официальные OAuth-подключения
          </span>

          <h1>Автозагрузка видео на TikTok и YouTube Shorts</h1>

          <p>
            Загрузите видео один раз — ReelFlow опубликует его на всех подключённых платформах
            через официальные API. Никаких сторонних сервисов.
          </p>

          <div className="mini-users">
            <div className="mini-avatars">
              <span /><span /><span /><span /><span />
            </div>
            <strong>{stats?.published ?? 0}</strong>
            <span className="muted">успешных публикаций</span>
          </div>

          <div className="inline-actions">
            <Link to="/post" className="btn btn-dark">Опубликовать видео</Link>
            <Link to="/accounts" className="btn btn-ghost">Подключить аккаунты</Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="phone-card a" />
          <div className="phone-card b" />
          <div className="phone-card c" />
          <div className="phone-card d" />
          <div className="phone-stage" />
          <div className="visual-pill">Live · {connectedCount} платформ</div>
        </div>
      </section>

      <div style={{ height: 16 }} />

      <section className="grid-4">
        <div className="stat-card">
          <div className="stat-label">Платформ</div>
          <div className="stat-value">{connectedCount}</div>
          <div className="stat-change">подключено</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Проектов</div>
          <div className="stat-value">{projects.length}</div>
          <div className="stat-change">активных</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Загружено</div>
          <div className="stat-value">{stats?.uploaded ?? 0}</div>
          <div className="stat-change">видео</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Опубликовано</div>
          <div className="stat-value">{stats?.published ?? 0}</div>
          <div className="stat-change">публикаций</div>
        </div>
      </section>

      <div style={{ height: 16 }} />

      <section className="grid-3">
        <SectionCard title="Как это работает">
          <div className="kv">
            <div>
              <strong>Шаг 1</strong>
              <span>Подключите TikTok и YouTube через OAuth</span>
            </div>
            <div>
              <strong>Шаг 2</strong>
              <span>Загрузите видео и заполните описание</span>
            </div>
            <div>
              <strong>Шаг 3</strong>
              <span>ReelFlow опубликует видео на всех платформах</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Подключённые платформы">
          {connectedCount === 0 ? (
            <div className="empty-state" style={{ padding: "20px 0" }}>
              <p>Нет подключённых аккаунтов</p>
              <div style={{ marginTop: 12 }}>
                <Link to="/accounts" className="btn btn-sm btn-dark">Подключить</Link>
              </div>
            </div>
          ) : (
            <div className="kv">
              {profiles.tiktok && (
                <div>
                  <strong>TikTok</strong>
                  <span className="badge badge-success">Активен</span>
                </div>
              )}
              {profiles.youtube && (
                <div>
                  <strong>YouTube</strong>
                  <span className="badge badge-success">Активен</span>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Быстрые действия">
          <div className="column">
            <Link to="/post" className="btn btn-dark">
              Новая публикация
            </Link>
            <Link to="/repost" className="btn btn-ghost">
              Запустить репост
            </Link>
            <Link to="/history" className="btn btn-ghost">
              Посмотреть историю
            </Link>
          </div>
        </SectionCard>
      </section>
    </>
  );
}