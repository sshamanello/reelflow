import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Главная", icon: "⌂", end: true },
  { to: "/history", label: "История", icon: "☰" },
  { to: "/post", label: "Пост", icon: "+" },
  { to: "/repost", label: "Репост", icon: "↻" },
  { to: "/accounts", label: "Аккаунты", icon: "◌" },
  { to: "/settings", label: "Настройки", icon: "⚙" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">ReelFlow</div>
        <div className="brand-caption">Добро пожаловать,</div>
        <div className="brand-email">nikolay@reelflow.app</div>
      </div>

      <nav className="nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="nav-ico">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-footer">
        <a href="#"><span className="nav-ico">🌐</span><span>Русский</span></a>
        <a href="#"><span className="nav-ico">◎</span><span>Подписка</span></a>
        <a href="#"><span className="nav-ico">◔</span><span>Помощь</span></a>
        <button type="button"><span className="nav-ico">⇠</span><span>Выйти</span></button>
      </div>
    </aside>
  );
}
