export default function SectionCard({ title, subtitle, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      {title && <h2 className="section-title">{title}</h2>}
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
      {children}
    </section>
  );
}
