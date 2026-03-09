import { useMemo, useState } from "react";
import SectionCard from "../components/SectionCard";
import PlatformBubble from "../components/PlatformBubble";
import { useAppToast } from "../components/Layout";
import { api } from "../lib/api";

const initialPlatforms = [
  { code: "TT", suffix: "TikTok", active: true },
  { code: "YT", suffix: "Shorts", active: false },
];

export default function Post() {
  const { showToast } = useAppToast();

  const [platforms, setPlatforms] = useState(initialPlatforms);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const activePlatforms = useMemo(
    () => platforms.filter((p) => p.active).map((p) => p.code),
    [platforms]
  );

  function togglePlatform(index) {
    setPlatforms((prev) =>
      prev.map((item, i) => (i === index ? { ...item, active: !item.active } : item))
    );
  }

  async function handlePublishNow() {
    if (!file) {
      showToast("Сначала выбери видеофайл");
      return;
    }

    if (!activePlatforms.length) {
      showToast("Выбери хотя бы одну платформу");
      return;
    }

    try {
      setUploading(true);

      const results = [];

      if (activePlatforms.includes("TT")) {
        const res = await api.uploadTikTok({ file });
        results.push(`TikTok: ${res.status || "ok"}`);
        await api.saveVideo({
          videoName: title || file.name,
          publishId: res.publish_id,
          status: res.status === "published" ? "published" : "uploaded",
        });
      }

      if (activePlatforms.includes("YT")) {
        const res = await api.uploadYouTube({
          file,
          title: title || file.name,
          description,
          privacy,
          tags: "",
        });

        results.push(`YouTube: ${res.video_id || "ok"}`);
        await api.saveVideo({
          videoName: title || file.name,
          publishId: res.publish_id,
          status: "published",
        });
      }

      showToast(`Готово: ${results.join(" | ")}`);
    } catch (e) {
      showToast(e?.payload?.message || e?.payload?.error || "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <h1 className="page-title">Пост</h1>
      <p className="page-subtitle">Создание новой публикации для подключённых аккаунтов.</p>

      <section className="grid-2">
        <SectionCard title="Контент">
          <div className="column">
            <div>
              <label className="label">Видео</label>
              <input
                className="field"
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="helper">
                Сейчас в backend реально есть только загрузка в TikTok и YouTube.
              </div>
            </div>

            <div>
              <label className="label">Название задачи</label>
              <input
                className="field"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Промо ролик март 01"
              />
            </div>

            <div>
              <label className="label">Описание / подпись</label>
              <textarea
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Добавьте описание"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Параметры публикации">
          <div className="column">
            <div>
              <label className="label">Платформы назначения</label>
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

            <div>
              <label className="label">Видимость для YouTube</label>
              <select
                className="select"
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
              >
                <option value="public">Публично</option>
                <option value="unlisted">По ссылке</option>
                <option value="private">Приватно</option>
              </select>
            </div>

            <div className="notice">
              <strong>Без вранья в UI:</strong><br />
              если backend не публикует в Instagram/X/Facebook — не рисуй это как готовую функцию.
            </div>

            <div className="inline-actions">
              <button
                className="btn btn-dark"
                disabled={uploading}
                onClick={handlePublishNow}
              >
                {uploading ? "Загрузка..." : "Опубликовать сейчас"}
              </button>
            </div>
          </div>
        </SectionCard>
      </section>
    </>
  );
}
