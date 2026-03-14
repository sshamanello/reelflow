import { useEffect, useMemo, useState } from "react";
import SectionCard from "../components/SectionCard";
import { useAppToast } from "../components/Layout";
import { api } from "../lib/api";
import { buildGoogleOAuthUrl, buildTikTokOAuthUrl } from "../lib/oauth";

const TikTokIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.72a4.85 4.85 0 0 1-1.02-.03z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
  </svg>
);

function badgeClass(connected) {
  return connected ? "badge badge-success" : "badge badge-gray";
}

export default function Accounts() {
  const { showToast } = useAppToast();
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

  const cards = useMemo(() => {
    const tiktok = profiles.tiktok;
    const youtube = profiles.youtube;
    return [
      {
        key: "tiktok",
        name: "TikTok",
        icon: <TikTokIcon />,
        iconStyle: { background: "#010101", color: "white" },
        connected: !!tiktok,
        account: tiktok?.handle || tiktok?.display_name || "—",
        auth: "TikTok OAuth 2.0",
        scope: "video.upload, user.info.basic",
        token: tiktok ? "Активен" : "Не подключён",
      },
      {
        key: "youtube",
        name: "YouTube Shorts",
        icon: <YouTubeIcon />,
        iconStyle: { background: "#FF0000", color: "white" },
        connected: !!youtube,
        account: youtube?.title || "—",
        auth: "Google OAuth 2.0",
        scope: "youtube.upload, youtube.readonly",
        token: youtube ? "Активен" : "Не подключён",
      },
    ];
  }, [profiles]);

  function connect(platform) {
    try {
      const url = platform === "tiktok" ? buildTikTokOAuthUrl() : buildGoogleOAuthUrl();
      window.location.href = url;
    } catch (e) {
      showToast(e.message);
    }
  }

  async function disconnect(platform) {
    try {
      await api.disconnectPlatform(platform);
      showToast(`Отключено: ${platform}`);
      await loadProfiles();
    } catch (e) {
      showToast(e?.payload?.error || "Не удалось отключить");
    }
  }

  return (
    <>
      <h1 className="page-title">Аккаунты</h1>
      <p className="page-subtitle">Управление OAuth-подключениями к платформам.</p>

      <SectionCard title="Как работает подключение">
        <div className="notice notice-info">
          ReelFlow использует официальные OAuth 2.0 API. После подключения ваши токены
          хранятся в зашифрованном Cloudflare KV. Мы никогда не запрашиваем пароли.
        </div>
      </SectionCard>

      {loading ? (
        <div className="panel">
          <div className="muted">Загрузка профилей...</div>
        </div>
      ) : (
        <section className="account-grid">
          {cards.map((item) => (
            <article key={item.key} className="account-card">
              <div className="account-head">
                <div className="account-icon" style={item.iconStyle}>
                  {item.icon}
                </div>
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>{item.name}</h3>
                  <span className={badgeClass(item.connected)}>
                    {item.connected ? "Подключено" : "Не подключено"}
                  </span>
                </div>
              </div>

              <div className="kv" style={{ marginBottom: 16 }}>
                <div><strong>Аккаунт</strong><span>{item.account}</span></div>
                <div><strong>Тип доступа</strong><span>{item.auth}</span></div>
                <div><strong>Права</strong><span style={{ fontSize: 12, color: "var(--muted)" }}>{item.scope}</span></div>
                <div><strong>Токен</strong><span>{item.token}</span></div>
              </div>

              <div className="inline-actions">
                {!item.connected ? (
                  <button className="btn btn-sm btn-dark" onClick={() => connect(item.key)}>
                    Подключить через OAuth
                  </button>
                ) : (
                  <>
                    <button className="btn btn-sm btn-ghost" onClick={() => connect(item.key)}>
                      Переподключить
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => disconnect(item.key)}>
                      Отключить
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
