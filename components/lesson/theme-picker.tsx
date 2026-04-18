import type { ThemeOption } from "@/lib/projects";

type ThemePickerProps = {
  themes: ThemeOption[];
  selectedThemeId: string;
  onSelect: (id: string) => void;
};

export function ThemePicker({
  themes,
  selectedThemeId,
  onSelect,
}: ThemePickerProps) {
  return (
    <div className="picker-grid">
      {themes.map((theme) => (
        <button
          key={theme.id}
          type="button"
          className={`theme-card ${selectedThemeId === theme.id ? "active" : ""}`}
          onClick={() => onSelect(theme.id)}
        >
          <div className="swatch-row">
            {theme.swatches.map((swatch) => (
              <span
                key={swatch}
                className="swatch"
                style={{ background: swatch }}
              />
            ))}
          </div>
          <strong>{theme.name}</strong>
          <p className="muted">{theme.description}</p>
        </button>
      ))}
    </div>
  );
}
