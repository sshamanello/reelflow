import { Link } from "react-router-dom";
import { useI18n } from "../hooks/useI18n";

const TikTokIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.72a4.85 4.85 0 0 1-1.02-.03z"/>
  </svg>
);

const IconLock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconUpload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

const IconList = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

export default function Landing() {
  const { t, lang, setLang } = useI18n();

  const features = [
    {
      icon: <IconLock />,
      title: t("landing_feature_1_title"),
      desc: t("landing_feature_1_desc"),
    },
    {
      icon: <IconUpload />,
      title: t("landing_feature_2_title"),
      desc: t("landing_feature_2_desc"),
    },
    {
      icon: <IconList />,
      title: t("landing_feature_3_title"),
      desc: t("landing_feature_3_desc"),
    },
  ];

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-brand">
          <div className="landing-logo">ReelFlow Studio</div>
        </div>
        <nav className="landing-nav">
          <button
            className="lang-toggle"
            onClick={() => setLang(lang === "ru" ? "en" : "ru")}
          >
            {lang === "ru" ? "EN" : "RU"}
          </button>
          <Link to="/login" className="btn btn-ghost btn-sm">
            {t("auth_login")}
          </Link>
          <Link to="/register" className="btn btn-dark btn-sm">
            {t("landing_cta_start")}
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-badge">
          <TikTokIcon />
          <span>TikTok API</span>
        </div>
        <h1 className="landing-hero-title">
          {t("landing_hero_title").split("\n").map((line, i) => (
            <span key={i}>{line}{i === 0 && <br />}</span>
          ))}
        </h1>
        <p className="landing-hero-subtitle">{t("landing_hero_subtitle")}</p>
        <div className="landing-hero-actions">
          <Link to="/register" className="btn btn-accent btn-lg">
            {t("landing_cta_start")}
          </Link>
          <Link to="/login" className="btn btn-ghost btn-lg">
            {t("landing_cta_login")}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <h2 className="landing-features-title">{t("landing_features_title")}</h2>
        <div className="landing-features-grid">
          {features.map((f, i) => (
            <div className="landing-feature-card" key={i}>
              <div className="landing-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security note */}
      <section className="landing-security">
        <div className="landing-security-inner">
          <IconLock />
          <p>{t("landing_security_note")}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <span>© 2025 ReelFlow Studio</span>
        <a href="https://www.sshamanello.ru/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
        <a href="https://www.sshamanello.ru/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
      </footer>
    </div>
  );
}
