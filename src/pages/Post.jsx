import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SectionCard from "../components/SectionCard";
import { useAppToast } from "../components/Layout";
import { useI18n } from "../hooks/useI18n";
import { api } from "../lib/api";

export default function Post() {
  const { showToast } = useAppToast();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [thumbnail, setThumbnail] = useState(null); // { url, blob }
  const [uploading, setUploading] = useState(false);
  const [tiktokProfile, setTiktokProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const fileInputRef = useRef(null);
  const thumbInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    api.getMe().then(data => {
      setTiktokProfile(data?.profiles?.tiktok || null);
    }).catch(() => setTiktokProfile(null)).finally(() => setProfileLoading(false));
  }, []);

  function handleFileChange(f) {
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
    setThumbnail(null);
  }

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setThumbnail({ url, blob });
    }, "image/jpeg", 0.92);
  }

  function handleThumbUpload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (thumbnail?.url) URL.revokeObjectURL(thumbnail.url);
    setThumbnail({ url: URL.createObjectURL(f), blob: f });
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (thumbnail?.url) URL.revokeObjectURL(thumbnail.url);
    };
  }, []);

  async function handlePublishNow() {
    if (!file) { showToast(t("post_no_file")); return; }
    if (!tiktokProfile) { showToast(t("post_need_account")); return; }
    try {
      setUploading(true);
      const res = await api.uploadTikTok({ file });
      await api.saveVideo({
        videoName: title || file.name,
        publishId: res.publish_id,
        status: res.status === "published" ? "published" : "uploaded",
      });
      showToast(t("post_success"));
      handleFileChange(null);
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

            {/* Превью или зона загрузки */}
            {previewUrl ? (
              <div className="video-preview-wrap">
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  className="video-preview"
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <div className="video-preview-footer">
                  <span className="video-preview-name">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {file.name} · {(file.size / 1024 / 1024).toFixed(1)} МБ
                  </span>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => { handleFileChange(null); }}
                  >
                    {t("post_change_file")}
                  </button>
                </div>
              </div>
            ) : (
              <label className="upload-zone">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  style={{ display: "block", color: "var(--muted)", flexShrink: 0 }}>
                  <polyline points="16 16 12 12 8 16"/>
                  <line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
                <div className="upload-text">{t("post_drop_hint")}</div>
                <div className="upload-subtext">{t("post_drop_sub")}</div>
              </label>
            )}

            {/* Обложка */}
            {previewUrl && (
              <div>
                <label className="label">{t("post_thumbnail")}</label>
                <div className="thumbnail-row">
                  {thumbnail ? (
                    <div className="thumbnail-preview-wrap">
                      <img src={thumbnail.url} alt="thumbnail" className="thumbnail-preview" />
                      <button
                        className="thumbnail-remove"
                        onClick={() => { URL.revokeObjectURL(thumbnail.url); setThumbnail(null); }}
                        title="Удалить"
                      >×</button>
                    </div>
                  ) : (
                    <div className="thumbnail-empty">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                  <div className="thumbnail-actions">
                    <button className="btn btn-sm btn-ghost" onClick={captureFrame}>
                      {t("post_capture_frame")}
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => thumbInputRef.current?.click()}>
                      {t("post_upload_thumb")}
                    </button>
                    <input
                      ref={thumbInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleThumbUpload}
                    />
                  </div>
                </div>
              </div>
            )}

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
            </div>

            {profileLoading ? (
              <div className="notice notice-info">{t("loading")}</div>
            ) : tiktokProfile ? (
              <div className="account-status-row">
                {tiktokProfile.avatar_url ? (
                  <img src={tiktokProfile.avatar_url} alt="avatar" className="account-avatar-sm" />
                ) : (
                  <div className="account-avatar-sm account-avatar-placeholder">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.72a4.85 4.85 0 0 1-1.02-.03z"/>
                    </svg>
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{tiktokProfile.display_name || tiktokProfile.handle}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("acc_connected")}</div>
                </div>
                <span className="badge badge-success" style={{ marginLeft: "auto" }}>✓</span>
              </div>
            ) : (
              <div className="notice notice-warn">
                {t("post_need_account")}
                <button
                  className="btn btn-sm btn-dark"
                  style={{ marginTop: 8, display: "block" }}
                  onClick={() => navigate("/accounts")}
                >
                  {t("acc_connect")}
                </button>
              </div>
            )}

            <div className="notice notice-info" style={{ fontSize: 12 }}>
              {t("post_inbox_notice")}
            </div>

            <div className="inline-actions">
              <button
                className="btn btn-dark"
                disabled={uploading || !file || !tiktokProfile}
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
