import { useState } from "react";
import SectionCard from "../components/SectionCard";
import PlatformBubble from "../components/PlatformBubble";
import { useAppToast } from "../components/Layout";

const targetPlatforms = [
  { code: "TT", suffix: "TikTok", active: true },
  { code: "YT", suffix: "Shorts", active: true },
  { code: "IG", suffix: "Reels", active: false },
  { code: "FB", suffix: "FB", active: false },
  { code: "X", suffix: "X", active: false },
];

export default function Repost() {
  const { showToast } = useAppToast();
  const [platforms, setPlatforms] = useState(targetPlatforms);

  const togglePlatform = (index) => {
    setPlatforms((prev) =>
      prev.map((item, i) => (i === index ? { ...item, active: !item.active } : item))
    );
  };

  return (
    <>
      <h1 className="page-title">Репост</h1>
      <p className="page-subtitle">Перераспределение собственного контента между подключёнными платформами.</p>

      <SectionCard title="Схема репоста">
        <div className="flow-box">
          <div className="flow-line">
            <div className="plus-chip">+</div>
            <div className="flow-arrow">→</div>
            <div className="platform-chip">RF<small>source</small></div>
            <div className="plus-chip">+</div>
            <div className="platform-chip">IG<small>Reels</small></div>
            <div className="plus-chip">+</div>
            <div className="platform-chip">TT<small>TikTok</small></div>
            <div className="plus-chip">+</div>
            <div className="platform-chip">YT<small>Shorts</small></div>
            <div className="plus-chip">+</div>
            <div className="platform-chip">X<small>X</small></div>
            <div className="platform-chip">FB<small>FB</small></div>
          </div>

          <div className="row-between">
            <div className="helper">
              Выбирай только те связки, которые реально существуют в продукте.
            </div>
            <button className="btn" onClick={() => showToast("Правило авторепоста добавлено")}>
              Добавить авторепост
            </button>
          </div>
        </div>
      </SectionCard>

      <section className="grid-2">
        <SectionCard title="Источник">
          <div className="column">
            <div>
              <label className="label">Источник контента</label>
              <select className="select">
                <option>Медиатека ReelFlow</option>
                <option>Instagram Reels</option>
                <option>YouTube Shorts</option>
                <option>TikTok</option>
              </select>
            </div>

            <div>
              <label className="label">Аккаунт-источник</label>
              <select className="select">
                <option>@reelflow.demo</option>
                <option>@brand.team</option>
              </select>
            </div>

            <div>
              <label className="label">Видео</label>
              <select className="select">
                <option>Весенний запуск — 15 сек</option>
                <option>Распаковка продукта</option>
                <option>Закулисье съёмки</option>
              </select>
            </div>

            <div className="notice">
              <strong>Ключевой момент:</strong><br />
              Пиши не “льём всё подряд”, а “репост собственного контента пользователя или команды”.
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Назначение">
          <div className="column">
            <div>
              <label className="label">Куда отправить</label>
              <div className="platform-row">
                {platforms.map((item, index) => (
                  <PlatformBubble
                    key={`${item.code}-${index}`}
                    code={item.code}
                    suffix={item.suffix}
                    active={item.active}
                    onClick={() => togglePlatform(index)}
                  />
                ))}
              </div>
            </div>

            <div className="form-grid">
              <div>
                <label className="label">Дата</label>
                <input className="field" type="date" />
              </div>
              <div>
                <label className="label">Время</label>
                <input className="field" type="time" />
              </div>
            </div>

            <div>
              <label className="label">Описание задачи</label>
              <input className="field" type="text" placeholder="Например: Автоматический перенос лучших роликов" />
            </div>

            <div className="inline-actions">
              <button className="btn btn-dark" onClick={() => showToast("Правило репоста создано")}>
                Создать правило
              </button>
              <button className="btn" onClick={() => showToast("Разовый репост запущен")}>
                Запустить разово
              </button>
            </div>
          </div>
        </SectionCard>
      </section>
    </>
  );
}
