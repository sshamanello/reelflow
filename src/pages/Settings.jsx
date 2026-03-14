import SectionCard from "../components/SectionCard";
import { useAppToast } from "../components/Layout";
import { useState } from "react";

export default function Settings() {
  const { showToast } = useAppToast();
  const [apiKey, setApiKey] = useState("");

  const generateKey = () => {
    const key =
      "rf_" +
      Math.random().toString(36).slice(2, 12) +
      "_" +
      Math.random().toString(36).slice(2, 12);

    setApiKey(key);
    showToast("Локальный API-ключ сгенерирован");
  };

  const copyText = async (text) => {
    if (!text) {
      showToast("Нечего копировать");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast("Скопировано");
    } catch {
      showToast("Не удалось скопировать");
    }
  };

  return (
    <>
      <h1 className="page-title">Настройки</h1>

      <SectionCard title="Информация об аккаунте">
        <div className="kv">
          <div><strong>Продукт:</strong><span>ReelFlow</span></div>
          <div><strong>Backend:</strong><span>Cloudflare Worker</span></div>
          <div><strong>Сессия:</strong><span>Cookie / SameSite=None / Secure</span></div>
        </div>
      </SectionCard>

      <SectionCard title="API-ключ">
        <label className="label">API-ключ</label>
        <input
          className="field"
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="API-ключ не сгенерирован"
        />

        <div style={{ height: 14 }} />
        <div className="inline-actions">
          <button className="btn btn-dark" onClick={generateKey}>
            Сгенерировать API-ключ
          </button>
          <button className="btn btn-ghost" onClick={() => copyText(apiKey)}>
            Скопировать
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Конфиденциальность и данные">
        <div className="kv">
          <div>
            <strong>Данные аккаунта</strong>
            <span>Хранятся в зашифрованном Cloudflare KV</span>
          </div>
          <div>
            <strong>OAuth токены</strong>
            <span>Только на серверной стороне, никогда в браузере</span>
          </div>
          <div>
            <strong>Удаление данных</strong>
            <span>Отключите аккаунты на странице Аккаунты для очистки токенов</span>
          </div>
        </div>
        <div style={{ marginTop: 16 }} className="notice notice-info">
          ReelFlow запрашивает только необходимые права: загрузка видео и базовая информация профиля.
          Мы не читаем и не храним ваш контент.
        </div>
      </SectionCard>
    </>
  );
}
