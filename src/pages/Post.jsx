import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SectionCard from "../components/SectionCard";
import { useAppToast } from "../components/Layout";
import { useI18n } from "../hooks/useI18n";
import { api } from "../lib/api";

const PRIVACY_OPTIONS = [
  { value: "PUBLIC_TO_EVERYONE",    labelKey: "post_privacy_public" },
  { value: "MUTUAL_FOLLOW_FRIENDS", labelKey: "post_privacy_friends" },
  { value: "SELF_ONLY",             labelKey: "post_privacy_self" },
];

export default function Post() {
  const { showToast } = useAppToast();
  const { t } = useI18n();
  const navigate = useNavigate();

  // file
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile]             = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [thumbnail, setThumbnail]   = useState(null); // { url, blob, timestampMs }
  const [uploading, setUploading]   = useState(false);

  // tiktok account
  const [tiktokProfile, setTiktokProfile]   = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // creator info (privacy options, caps)
  const [creatorInfo, setCreatorInfo]         = useState(null);
  const [creatorInfoLoading, setCreatorInfoLoading] = useState(false);

  // publish settings
  const [privacyLevel, setPrivacyLevel]         = useState("");
  const [disableComment, setDisableComment]     = useState(false);
  const [disableDuet, setDisableDuet]           = useState(false);
  const [disableStitch, setDisableStitch]       = useState(false);
  const [brandContentToggle, setBrandContentToggle] = useState(false);
  const [brandOrganicToggle, setBrandOrganicToggle] = useState(false);

  // post processing
  const [processing, setProcessing]   = useState(false);
  const [publishId, setPublishId]     = useState(null);
  const [publishStatus, setPublishStatus] = useState(null);

  const fileInputRef  = useRef(null);
  const thumbInputRef = useRef(null);
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const pollRef       = useRef(null);

  // Load profile
  useEffect(() => {
    api.getMe()
      .then(data => setTiktokProfile(data?.profiles?.tiktok || null))
      .catch(() => setTiktokProfile(null))
      .finally(() => setProfileLoading(false));
  }, []);

  // Load creator info when profile is ready
  useEffect(() => {
    if (!tiktokProfile) return;
    setCreatorInfoLoading(true);
    api.getCreatorInfo()
      .then(info => {
        setCreatorInfo(info);
        // pre-fill defaults from creator caps
        if (info?.comment_disabled) setDisableComment(true);
        if (info?.duet_disabled)    setDisableDuet(true);
        if (info?.stitch_disabled)  setDisableStitch(true);
      })
      .catch(() => setCreatorInfo(null))
      .finally(() => setCreatorInfoLoading(false));
  }, [tiktokProfile]);

  // When brandContentToggle is on, branded content requires PUBLIC
  useEffect(() => {
    if (brandContentToggle) setPrivacyLevel("PUBLIC_TO_EVERYONE");
  }, [brandContentToggle]);

  // Poll publish status
  useEffect(() => {
    if (!processing || !publishId) return;
    let attempts = 0;
    const MAX_ATTEMPTS = 20;

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await api.getPublishStatus(publishId);
        const status = res?.status || res?.publish_status;
        setPublishStatus(status);

        const done = ["PUBLISHED", "FAILED", "SEND_TO_USER_INBOX"].includes(status);
        if (done || attempts >= MAX_ATTEMPTS) {
          clearInterval(pollRef.current);
          setProcessing(false);
          if (status === "PUBLISHED") {
            showToast(t("post_processing_done"));
          } else {
            showToast(t("post_success")); // inbox/drafts
          }
        }
      } catch {
        clearInterval(pollRef.current);
        setProcessing(false);
        showToast(t("post_success"));
      }
    }, 3000);

    return () => clearInterval(pollRef.current);
  }, [processing, publishId]);

  function handleFileChange(f) {
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
    setThumbnail(null);
    setProcessing(false);
    setPublishId(null);
    setPublishStatus(null);
  }

  function captureFrame() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const timestampMs = Math.floor((video.currentTime || 0) * 1000);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setThumbnail({ url, blob, timestampMs });
    }, "image/jpeg", 0.92);
  }

  function handleThumbUpload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (thumbnail?.url) URL.revokeObjectURL(thumbnail.url);
    setThumbnail({ url: URL.createObjectURL(f), blob: f, timestampMs: 0 });
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (thumbnail?.url) URL.revokeObjectURL(thumbnail.url);
      clearInterval(pollRef.current);
    };
  }, []);

  // Available privacy options: from creator info or all
  const availablePrivacy = creatorInfo?.privacy_level_options
    ? PRIVACY_OPTIONS.filter(o => creatorInfo.privacy_level_options.includes(o.value))
    : PRIVACY_OPTIONS;

  async function handlePublishNow() {
    if (!file)           { showToast(t("post_no_file"));        return; }
    if (!tiktokProfile)  { showToast(t("post_need_account"));   return; }
    if (!privacyLevel)   { showToast(t("post_privacy_required")); return; }

    try {
      setUploading(true);
      const res = await api.uploadTikTok({
        file,
        title: title || file.name,
        privacyLevel,
        disableComment,
        disableDuet,
        disableStitch,
        brandContentToggle,
        brandOrganicToggle,
        coverTimestampMs: thumbnail?.timestampMs ?? 0,
      });

      await api.saveVideo({
        videoName: title || file.name,
        publishId: res.publish_id,
        status: res.status === "published" ? "published" : "uploaded",
      });

      if (res.publish_id) {
        setPublishId(res.publish_id);
        setProcessing(true);
        showToast(t("post_processing"));
      } else {
        showToast(t("post_success"));
        handleFileChange(null);
        setTitle("");
        setDescription("");
      }
    } catch (e) {
      showToast(e?.payload?.message || e?.payload?.error || t("post_error"));
    } finally {
      setUploading(false);
    }
  }

  const canPublish = !uploading && !processing && !!file && !!tiktokProfile && !!privacyLevel;

  return (
    <>
      <h1 className="page-title">{t("post_title")}</h1>
      <p className="page-subtitle">{t("post_subtitle")}</p>

      <section className="grid-2">
        {/* LEFT: video file + thumbnail + title */}
        <SectionCard title={t("post_video_file")}>
          <div className="column">

            {previewUrl ? (
              <div className="video-preview-wrap">
                <video ref={videoRef} src={previewUrl} controls className="video-preview" />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <div className="video-preview-footer">
                  <span className="video-preview-name">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {file.name} · {(file.size / 1024 / 1024).toFixed(1)} МБ
                  </span>
                  <button className="btn btn-sm btn-ghost" onClick={() => handleFileChange(null)}>
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

            {/* Thumbnail */}
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
                    <input ref={thumbInputRef} type="file" accept="image/*"
                      style={{ display: "none" }} onChange={handleThumbUpload} />
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
                maxLength={150}
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

        {/* RIGHT: settings */}
        <SectionCard title={t("post_settings")}>
          <div className="column">

            {/* Platform */}
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

            {/* Account status */}
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
                <button className="btn btn-sm btn-dark" style={{ marginTop: 8, display: "block" }}
                  onClick={() => navigate("/accounts")}>
                  {t("acc_connect")}
                </button>
              </div>
            )}

            {/* Privacy level */}
            {tiktokProfile && (
              <div>
                <label className="label">{t("post_privacy")} *</label>
                {creatorInfoLoading ? (
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>{t("loading")}</div>
                ) : (
                  <select
                    className="select"
                    value={privacyLevel}
                    onChange={e => setPrivacyLevel(e.target.value)}
                    disabled={brandContentToggle}
                  >
                    <option value="" disabled>{t("post_privacy_select")}</option>
                    {availablePrivacy.map(opt => (
                      <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Interactions */}
            {tiktokProfile && (
              <div>
                <label className="label">{t("post_interactions")}</label>
                <div className="column" style={{ gap: 8 }}>
                  <PostToggle
                    label={t("post_allow_comments")}
                    checked={!disableComment}
                    disabled={creatorInfo?.comment_disabled}
                    onChange={v => setDisableComment(!v)}
                  />
                  <PostToggle
                    label={t("post_allow_duet")}
                    checked={!disableDuet}
                    disabled={creatorInfo?.duet_disabled}
                    onChange={v => setDisableDuet(!v)}
                  />
                  <PostToggle
                    label={t("post_allow_stitch")}
                    checked={!disableStitch}
                    disabled={creatorInfo?.stitch_disabled}
                    onChange={v => setDisableStitch(!v)}
                  />
                </div>
              </div>
            )}

            {/* Commercial content disclosure */}
            {tiktokProfile && (
              <div>
                <label className="label">{t("post_commercial")}</label>
                <div className="column" style={{ gap: 8 }}>
                  <PostToggle
                    label={t("post_your_brand")}
                    hint={t("post_commercial_hint")}
                    checked={brandOrganicToggle}
                    onChange={v => setBrandOrganicToggle(v)}
                  />
                  <PostToggle
                    label={t("post_branded_content")}
                    checked={brandContentToggle}
                    onChange={v => setBrandContentToggle(v)}
                  />
                  {brandContentToggle && (
                    <div className="notice notice-warn" style={{ fontSize: 12 }}>
                      {t("post_branded_content_note")}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Processing state */}
            {processing && (
              <div className="notice notice-info" style={{ fontSize: 13 }}>
                <span style={{ marginRight: 8 }}>⏳</span>
                {publishStatus ? `${t("post_processing")} (${publishStatus})` : t("post_processing")}
              </div>
            )}

            {/* Inbox notice (not processing) */}
            {!processing && (
              <div className="notice notice-info" style={{ fontSize: 12 }}>
                {t("post_inbox_notice")}
              </div>
            )}

            <div className="inline-actions">
              <button
                className="btn btn-dark"
                disabled={!canPublish}
                onClick={handlePublishNow}
              >
                {uploading ? t("post_uploading") : processing ? t("post_processing") : t("post_publish")}
              </button>
            </div>
          </div>
        </SectionCard>
      </section>
    </>
  );
}

/* ─── Toggle component ──────────────────────────────────── */
function PostToggle({ label, hint, checked, disabled, onChange }) {
  return (
    <label className={`post-toggle${disabled ? " post-toggle--disabled" : ""}`}>
      <span className="post-toggle-text">
        <span>{label}</span>
        {hint && <span className="post-toggle-hint">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        style={{ display: "none" }}
      />
      <span className={`post-toggle-track${checked ? " on" : ""}${disabled ? " disabled" : ""}`}>
        <span className="post-toggle-knob" />
      </span>
    </label>
  );
}
