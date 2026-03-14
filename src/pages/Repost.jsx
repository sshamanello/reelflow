import { useState } from "react";
import SectionCard from "../components/SectionCard";
import PlatformBubble from "../components/PlatformBubble";
import { useAppToast } from "../components/Layout";

const targetPlatforms = [
  { code: "TT", suffix: "TikTok", active: true },
  { code: "YT", suffix: "Shorts", active: true },
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
            <div className="platform-chip">RF<small>src</small></div>
            <div className="flow-arrow">→</div>
            <div className="platform-chip">TT<small>TikTok</small></div>
            <div className="flow-arrow">+</div>
            <div className="platform-chip">YT<small>Shorts</small></div>
          </div>
          <div className="row-between">
            <div className="helper">
              Перенаправляйте собственный контент между подключёнными платформами
            </div>
            <button className="btn btn-dark" onClick={() => showToast("Правило авторепоста добавлено")}>
              Добавить правило
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
                <option>YouTube Shorts</option>
                <option>TikTok</option>
              </select>
            </div>

            <div>
              <label className="label">Видео</label>
              <select className="select">
                <option>— выберите видео —</option>
              </select>
              <div className="helper">Сначала подключите аккаунты на странице Аккаунты</div>
            </div>

            <div className="notice notice-info">
              Репост работает только с вашим собственным контентом через официальные API.
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
