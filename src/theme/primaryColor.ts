export type PrimaryColorSlot = "default" | "custom";

export const DEFAULT_PRIMARY_COLOR = "#0b4a82";
// Starting custom colour: logo coral (#f37957) darkened until white text on it reads at 4.5:1.
export const INITIAL_CUSTOM_COLOR = "#c8502a";

const NAVY_HUE = 208;
const WHITE = "#ffffff";

type Hsl = { h: number; s: number; l: number };

export const isHexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

const hexToHsl = (hex: string): Hsl => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta === 0) return { h: 0, s: 0, l };
  const s = delta / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / delta + 6) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return { h: h * 60, s, l };
};

const hslToHex = ({ h, s, l }: Hsl): string => {
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const value = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
};

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const value = parseInt(hex.slice(i, i + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrastRatio = (a: string, b: string): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

/** Moves `hex` away from `against` (keeping its hue) until the ratio is met. */
export const ensureContrast = (hex: string, against: string, ratio: number): string => {
  const hsl = hexToHsl(hex);
  const step = luminance(against) > 0.5 ? -0.01 : 0.01;
  let result = hex;
  while (contrastRatio(result, against) < ratio) {
    const nextLightness = Math.max(0, Math.min(1, hsl.l + step));
    if (nextLightness === hsl.l) break;
    hsl.l = nextLightness;
    result = hslToHex(hsl);
  }
  return result;
};

const shiftLightness = (hex: string, amount: number): string => {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, l: Math.max(0, Math.min(1, hsl.l + amount)) });
};

const pickForeground = (background: string, darkText: string): string => {
  if (contrastRatio(background, WHITE) >= 4.5) return WHITE;
  return contrastRatio(background, darkText) > contrastRatio(background, WHITE) ? darkText : WHITE;
};

const toCss = (vars: Record<string, string>) =>
  Object.entries(vars).map(([name, value]) => `${name}:${value};`).join("");

/**
 * Theme overrides for a primary colour, or null for the stock navy (index.css
 * already holds its hand-tuned tokens). The blue-tinted neutrals keep their
 * Figma saturation and lightness and only take the new hue. The picked colour
 * is nudged when needed so text stays readable on it and it stays readable on cards.
 */
export const buildPrimaryColorCss = (hex: string): string | null => {
  const color = hex.toLowerCase();
  if (color === DEFAULT_PRIMARY_COLOR) return null;

  const { h, s } = hexToHsl(color);
  // Greys have no real hue, so they shouldn't tint the neutrals either.
  const tintStrength = Math.min(1, s / 0.25);
  const tint = (reference: string, strength = tintStrength) => {
    const base = hexToHsl(reference);
    return hslToHex({ h, s: base.s * strength, l: base.l });
  };
  // Dark surfaces fill the whole screen, so a full tint looks heavy on warm hues.
  const darkTint = (reference: string) => tint(reference, tintStrength * 0.5);
  const rgb = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)).join(" ");

  const primary = ensureContrast(color, WHITE, 3);
  // White text sits on the sidebar and featured cards.
  const brandSurface = ensureContrast(color, WHITE, 4.5);
  const darkPrimary = ensureContrast(color, darkTint("#111b2c"), 4.5);

  const light = {
    "--primary": primary,
    "--primary-hover": shiftLightness(primary, -0.05),
    "--primary-light": tint("#dbebfa"),
    "--primary-foreground": pickForeground(primary, "#0f172a"),
    "--primary-gradient-from": shiftLightness(primary, 0.08),
    "--background": tint("#f3f6fb"),
    "--surface-green": tint("#eef3f9"),
    "--secondary": tint("#eef3f9"),
    "--secondary-foreground": brandSurface,
    "--muted": tint("#f0f4f8"),
    "--accent": tint("#eef4fb"),
    "--accent-foreground": brandSurface,
    "--border": tint("#e2e9f2"),
    "--border-strong": tint("#ced8e4"),
    "--border-subtle": `rgb(${rgb} / 0.07)`,
    "--input": tint("#ced8e4"),
    "--ring": primary,
    "--chart-1": primary,
    "--chart-2": shiftLightness(primary, 0.08),
    "--chart-sales": primary,
    "--sidebar": brandSurface,
    "--sidebar-ring": tint("#dbebfa"),
    "--brand-panel": shiftLightness(brandSurface, -0.05),
    "--brand-hue-shift": `${Math.round(h - NAVY_HUE)}deg`,
    "--featured-from": shiftLightness(brandSurface, 0.05),
    "--featured-via": brandSurface,
    "--featured-to": shiftLightness(brandSurface, -0.07),
  };

  const dark = {
    "--primary": darkPrimary,
    "--primary-hover": shiftLightness(darkPrimary, 0.06),
    "--primary-light": darkTint("#12304f"),
    "--primary-foreground": pickForeground(darkPrimary, darkTint("#06182b")),
    "--background": darkTint("#0a1220"),
    "--surface": darkTint("#111b2c"),
    "--surface-green": darkTint("#16233a"),
    "--card": darkTint("#111b2c"),
    "--popover": darkTint("#111b2c"),
    "--secondary": darkTint("#16233a"),
    "--secondary-foreground": darkTint("#a8cdf2"),
    "--muted": darkTint("#16233a"),
    "--accent": darkTint("#16233a"),
    "--accent-foreground": darkTint("#a8cdf2"),
    "--border": darkTint("#1f2c42"),
    "--border-strong": darkTint("#2b3b55"),
    "--border-subtle": "rgb(255 255 255 / 0.07)",
    "--input": darkTint("#2b3b55"),
    "--ring": darkPrimary,
    "--chart-1": darkPrimary,
    "--chart-2": shiftLightness(darkPrimary, 0.08),
    "--chart-sales": darkPrimary,
    "--sidebar": darkTint("#0c1a2e"),
    "--sidebar-primary": darkTint("#1d3a5c"),
    "--sidebar-ring": darkPrimary,
  };

  // html:root / html.dark outrank index.css whichever stylesheet loads last.
  return `html:root{${toCss(light)}}@media screen{html.dark{${toCss(dark)}}}`;
};
