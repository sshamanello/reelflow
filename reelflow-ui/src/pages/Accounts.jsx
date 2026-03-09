import { useEffect, useMemo, useState } from "react";
import SectionCard from "../components/SectionCard";
import { useAppToast } from "../components/Layout";
import { api } from "../lib/api";
import { buildGoogleOAuthUrl, buildTikTokOAuthUrl } from "../lib/oauth";

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
        code: "TT",
        connected: !!tiktok,
        account: tiktok?.handle || tiktok?.display_name || "—",
        auth: "OAuth 2.0",
        token: tiktok ? "Активен" : "Не подключён",
      },
      {
        key: "youtube",
        name: "YouTube Shorts",
        code: "YT",
        connected: !!youtube,
        account: youtube?.title || "—",
        auth: "Google OAuth",
        token: youtube ? "Активен" : "Не подключён",
      },
    ];
  }, [profiles]);

  function connect(platform) {
    try {
      const url =
        platform === "tiktok" ? buildTikTokOAuthUrl() : buildGoogleOAuthUrl();

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
      <p className="page-subtitle">
        Подключение и управление авторизованными профилями.
      </p>

      <SectionCard
        title="Подключённые платформы"
        subtitle="Показывай только те OAuth-подключения, которые реально живут в backend."
      >
        <div className="platform-row" style={{ marginBottom: 18 }}>
          <div className="platform-chip">RF<small>hub</small></div>
          <div className="plus-chip">+</div>
          <div className="platform-chip">TT<small>TT</small></div>
          <div className="plus-chip">+</div>
          <div className="platform-chip">YT<small>YT</small></div>
        </div>

        {loading ? <div className="muted">Загрузка профилей...</div> : null}
      </SectionCard>

      <section className="account-grid">
        {cards.map((item) => (
          <article key={item.key} className="account-card">
            <div className="account-head">
              <div className="account-icon">{item.code}</div>
              <div>
                <h3 style={{ margin: "0 0 6px" }}>{item.name}</h3>
                <span className={badgeClass(item.connected)}>
                  {item.connected ? "Подключено" : "Не подключено"}
                </span>
              </div>
            </div>

            <div className="kv">
              <div><strong>Аккаунт:</strong><span>{item.account}</span></div>
              <div><strong>Тип доступа:</strong><span>{item.auth}</span></div>
              <div><strong>Статус токена:</strong><span>{item.token}</span></div>
            </div>

            <div style={{ height: 14 }} />

            <div className="inline-actions">
              {!item.connected ? (
                <button
                  className="btn btn-sm"
                  onClick={() => connect(item.key)}
                >
                  Подключить
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-sm"
                    onClick={() => connect(item.key)}
                  >
                    Переподключить
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => disconnect(item.key)}
                  >
                    Отключить
                  </button>
                </>
              )}
            </div>
          </article>
        ))}

        <article className="account-card">
          <div className="account-head">
            <div className="account-icon">+</div>
            <div>
              <h3 style={{ margin: "0 0 6px" }}>Новое подключение</h3>
              <span className="badge badge-gray">Доступно</span>
            </div>
          </div>

          <p className="muted">
            Не показывай тут Instagram/X/Facebook, пока backend реально не умеет их OAuth и операции.
          </p>

          <div style={{ height: 14 }} />
          <div className="inline-actions">
            <button className="btn btn-sm" onClick={() => connect("tiktok")}>
              Подключить TikTok
            </button>
            <button className="btn btn-sm" onClick={() => connect("youtube")}>
              Подключить YouTube
            </button>
          </div>
        </article>
      </section>
    </>
  );
}
