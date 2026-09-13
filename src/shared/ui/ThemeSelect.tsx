import { useTheme, type Theme } from './ThemeProvider.js';

const options: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <label htmlFor="theme" className="block text-sm font-medium">
        Theme
      </label>
      <select
        id="theme"
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-muted-foreground">
        Choose light, dark, or follow your system preference.
      </p>
    </div>
  );
}
