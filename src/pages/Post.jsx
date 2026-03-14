import { useState } from "react";
import SectionCard from "../components/SectionCard";
import { useAppToast } from "../components/Layout";
import { useI18n } from "../hooks/useI18n";
import { api } from "../lib/api";

export default function Post() {
  const { showToast } = useAppToast();
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function handlePublishNow() {
    if (!file) {
      showToast(t("post_no_file"));
      return;
    }
    try {
      setUploading(true);
      const res = await api.uploadTikTok({ file });
      await api.saveVideo({
        videoName: title || file.name,
        publishId: res.publish_id,
        status: res.status === "published" ? "published" : "uploaded",
      });
      showToast(t("post_done") + ": TikTok — " + (res.status || "ok"));
      setFile(null);
      setTitle("");
      setDescription("");
    } catch (e) {
      showToast(e?.payload?.message || e?.payload?.error || t("post_error"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <h1 className="page-title">{t("post_title")}</h1>
      <p className="page-subtitle">{t("post_subtitle")}</p>

      <section className="grid-2">
        <SectionCard title={t("post_video_file")}>
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
                    style={{ display: "block", color: "var(--muted)", flexShrink: 0 }}
                  >
                    <polyline points="16 16 12 12 8 16"/>
                    <line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                  <div className="upload-text">{t("post_drop_hint")}</div>
                  <div className="upload-subtext">{t("post_drop_sub")}</div>
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
                    {t("post_change_file")}
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="label">{t("post_video_title")}</label>
              <input
                className="field"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("post_video_title_ph")}
              />
            </div>

            <div>
              <label className="label">{t("post_description")}</label>
              <textarea
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("post_description_ph")}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t("post_settings")}>
          <div className="column">
            <div>
              <label className="label">{t("post_platforms")}</label>
              <div className="platform-row">
                <div className="platform-bubble active">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.72a4.85 4.85 0 0 1-1.02-.03z"/>
                  </svg>
                  TikTok
                </div>
              </div>
              <div className="helper">{t("post_click_platform")}</div>
            </div>

            <div className="notice notice-info">
              {t("post_tiktok_notice")}
            </div>

            <div className="inline-actions">
              <button
                className="btn btn-dark"
                disabled={uploading || !file}
                onClick={handlePublishNow}
              >
                {uploading ? t("post_uploading") : t("post_publish")}
              </button>
            </div>
          </div>
        </SectionCard>
      </section>
    </>
  );
}
