export default function PlatformBubble({
  code,
  label,
  active = false,
  small = false,
  onClick,
  suffix,
}) {
  const className = small
    ? `platform-chip ${active ? "active" : ""}`
    : `selectable-platform ${active ? "active" : ""}`;

  return (
    <button type="button" className={className} onClick={onClick}>
      {code}
      {suffix ? <small>{suffix}</small> : null}
      {!suffix && label ? <small>{label}</small> : null}
    </button>
  );
}
