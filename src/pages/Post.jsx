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
        results.push("TikTok: " + (res.status || "ok"));
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
        results.push("YouTube: " + (res.video_id || "ok"));
        await api.saveVideo({
          videoName: title || file.name,
          publishId: res.publish_id,
          status: "published",
        });
      }

      showToast("Готово: " + results.join(" | "));
    } catch (e) {
      showToast(e?.payload?.message || e?.payload?.error || "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <h1 className="page-title">Опубликовать видео</h1>
      <p className="page-subtitle">Загрузите видео один раз — опубликуем на всех подключённых платформах.</p>

      <section className="grid-2">
        <SectionCard title="Видеофайл">
          <div className="column">
            <div>
              {!file ? (
                <label className="upload-zone">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <svg
                    width="40" height="40" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{ margin: "0 auto 10px", display: "block", color: "var(--muted)" }}
                  >
                    <polyline points="16 16 12 12 8 16"/>
                    <line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                  <div className="upload-text">Нажмите для выбора файла</div>
                  <div className="upload-subtext">MP4, MOV, AVI · Макс. 4 ГБ</div>
                </label>
              ) : (
                <div>
                  <div className="upload-selected">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {file.name} ({(file.size / 1024 / 1024).toFixed(1)} МБ)
                  </div>
                  <button
                    className="btn btn-sm btn-ghost"
                    style={{ marginTop: 8 }}
                    onClick={() => setFile(null)}
                  >
                    Изменить файл
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="label">Название</label>
              <input
                className="field"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Весенний лаунч — Ролик 1"
              />
            </div>

            <div>
              <label className="label">Описание</label>
              <textarea
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Добавьте описание или хэштеги..."
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Настройки публикации">
          <div className="column">
            <div>
              <label className="label">Платформы</label>
              <div className="platform-row">
                {platforms.map((item, index) => (
                  <PlatformBubble
                    key={item.code + index}
                    code={item.code}
                    suffix={item.suffix}
                    active={item.active}
                    onClick={() => togglePlatform(index)}
                  />
                ))}
              </div>
              <div className="helper">Нажмите на платформу для выбора</div>
            </div>

            <div>
              <label className="label">Видимость (YouTube)</label>
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

            <div className="notice notice-info">
              Доступны платформы: <strong>TikTok</strong> и <strong>YouTube Shorts</strong>.
              Публикация через официальные API.
            </div>

            <div className="inline-actions">
              <button
                className="btn btn-dark"
                disabled={uploading || !file}
                onClick={handlePublishNow}
              >
                {uploading ? "Загрузка..." : "Опубликовать"}
              </button>
            </div>
          </div>
        </SectionCard>
      </section>
    </>
  );
}
