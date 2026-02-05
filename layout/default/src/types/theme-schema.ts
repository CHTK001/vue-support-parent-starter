export interface ThemeColorPalette {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export interface ThemeSurfaceColors {
  primary: string; // Main background
  secondary: string; // Sidebar, cards
  tertiary: string; // Inputs, nested areas
  navbar: string; // Navbar specific
}

export interface ThemeTextColors {
  primary: string;
  secondary: string;
  disabled: string;
  inverse: string;
}

export interface ThemeBorderColors {
  base: string;
  light: string;
  lighter: string;
}

export interface ThemeTokens {
  colors: {
    palette: ThemeColorPalette;
    surface: ThemeSurfaceColors;
    text: ThemeTextColors;
    border: ThemeBorderColors;
  };
  // Can be extended with typography, spacing, etc.
}

export interface ThemeStyleDefinition {
  id: string;
  name: string;
  type: 'light' | 'dark'; // Base type for browser fallback
  tokens: ThemeTokens;
}

/**
 * JSON Schema for Theme Style Definition
 * (Simplified representation for runtime validation if needed)
 */
export const themeStyleSchema = {
  type: "object",
  required: ["id", "name", "type", "tokens"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    type: { type: "string", enum: ["light", "dark"] },
    tokens: {
      type: "object",
      required: ["colors"],
      properties: {
        colors: {
          type: "object",
          required: ["palette", "surface", "text", "border"],
          // ... further nesting
        }
      }
    }
  }
};
