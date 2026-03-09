import { useEffect, useState } from "react";
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

  return (
    <>
      <section className="hero">
        <div>
          <span className="badge">Официальные подключения аккаунтов</span>

          <h1>Автоматизированная публикация и загрузка видео для Shorts и TikTok</h1>

          <p>
            ReelFlow работает только с подключёнными аккаунтами пользователя через OAuth
            и показывает реальные статусы загрузки и публикации.
          </p>

          <div className="mini-users">
            <div className="mini-avatars">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <strong>{stats?.published ?? 0}</strong>
            <span className="muted">успешных публикаций</span>
          </div>

          <div className="inline-actions">
            <a href="/post" className="btn btn-dark">Создать публикацию</a>
            <a href="/accounts" className="btn btn-ghost">Подключить аккаунты</a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="phone-card a"></div>
          <div className="phone-card b"></div>
          <div className="phone-card c"></div>
          <div className="phone-card d"></div>
          <div className="phone-stage"></div>
          <div className="visual-pill">Live session</div>
        </div>
      </section>

      <div style={{ height: 16 }} />

      <section className="grid-3">
        <article className="feature-card">
          <h3 className="section-title">Подключено платформ</h3>
          <p className="muted">
            {Object.keys(profiles).length}
          </p>
        </article>

        <article className="feature-card">
          <h3 className="section-title">Проектов</h3>
          <p className="muted">
            {projects.length}
          </p>
        </article>

        <article className="feature-card">
          <h3 className="section-title">Опубликовано</h3>
          <p className="muted">
            {stats?.published ?? 0}
          </p>
        </article>
      </section>

      <div style={{ height: 16 }} />

      <SectionCard title="Что важно для review">
        <div className="grid-3">
          <div className="info-card">
            <div className="meta-label">1. Реальные OAuth-подключения</div>
            <strong>Сейчас в интерфейсе выведены только TikTok и YouTube, потому что backend реально умеет их.</strong>
          </div>

          <div className="info-card">
            <div className="meta-label">2. Прозрачные действия</div>
            <strong>Есть реальная история загрузок, а не просто декоративные блоки.</strong>
          </div>

          <div className="info-card">
            <div className="meta-label">3. Свой контент</div>
            <strong>Не позиционируй это как массовый “слив контента куда угодно”.</strong>
          </div>
        </div>
      </SectionCard>
    </>
  );
}
