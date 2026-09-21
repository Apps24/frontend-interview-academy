export function ScreenLoader({ label = "Loading your workspace…", overlay = false }: { label?: string; overlay?: boolean }) {
  return <div className={`screen-loader${overlay ? " screen-loader-overlay" : ""}`} role="status" aria-live="polite" aria-label={label}>
    <div className="screen-loader-mark" aria-hidden="true"><span>F</span><i /><i /><i /></div>
    <strong>{label}</strong>
    <span className="screen-loader-caption">FrontendPrep</span>
  </div>;
}
