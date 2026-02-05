import type { ThemeStyleDefinition, ThemeTokens } from "../types/theme-schema";

class ThemeManager {
  private styles: Map<string, ThemeStyleDefinition> = new Map();
  private activeStyleId: string = 'default-light';
  private storageKey = 'stitch-theme-style';

  constructor() {
    this.initDefaultStyles();
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored && this.styles.has(stored)) {
        this.setStyle(stored);
      } else {
        // Fallback or detect system preference?
        // For now, default to default-light
        this.setStyle(this.activeStyleId);
      }
    } catch (e) {
      console.warn('Failed to load theme style from storage', e);
      this.setStyle(this.activeStyleId);
    }
  }

  private initDefaultStyles() {
    // Register Default Light
    this.registerStyle({
      id: 'default-light',
      name: 'Default Light',
      type: 'light',
      tokens: {
        colors: {
          palette: {
            primary: '#409EFF',
            secondary: '#64748B',
            success: '#67C23A',
            warning: '#E6A23C',
            danger: '#F56C6C',
            info: '#909399'
          },
          surface: {
            primary: '#ffffff',
            secondary: '#f8fafc',
            tertiary: '#f1f5f9',
            navbar: 'rgba(255, 255, 255, 0.8)'
          },
          text: {
            primary: '#1e293b',
            secondary: '#64748b',
            disabled: '#cbd5e1',
            inverse: '#ffffff'
          },
          border: {
            base: '#e2e8f0',
            light: '#f1f5f9',
            lighter: '#f8fafc'
          }
        }
      }
    });

    // Register Default Dark
    this.registerStyle({
      id: 'default-dark',
      name: 'Default Dark',
      type: 'dark',
      tokens: {
        colors: {
          palette: {
            primary: '#409EFF',
            secondary: '#94a3b8',
            success: '#67C23A',
            warning: '#E6A23C',
            danger: '#F56C6C',
            info: '#909399'
          },
          surface: {
            primary: '#0f172a',
            secondary: '#1e293b',
            tertiary: '#334155',
            navbar: 'rgba(15, 23, 42, 0.8)'
          },
          text: {
            primary: '#f8fafc',
            secondary: '#cbd5e1',
            disabled: '#475569',
            inverse: '#0f172a'
          },
          border: {
            base: '#334155',
            light: '#1e293b',
            lighter: '#0f172a'
          }
        }
      }
    });
  }

  public registerStyle(style: ThemeStyleDefinition) {
    this.styles.set(style.id, style);
  }

  public setStyle(styleId: string) {
    const style = this.styles.get(styleId);
    if (!style) {
      console.warn(`Theme style '${styleId}' not found, falling back to default.`);
      return;
    }
    
    this.activeStyleId = styleId;
    this.applyTokens(style);
    this.updateDocumentClass(style.type);
    
    try {
      localStorage.setItem(this.storageKey, styleId);
    } catch (e) {
      console.warn('Failed to save theme style to storage', e);
    }
  }

  private applyTokens(style: ThemeStyleDefinition) {
    const root = document.documentElement;
    const { tokens } = style;

    // Flatten and set CSS variables
    // Palette
    Object.entries(tokens.colors.palette).forEach(([key, value]) => {
      root.style.setProperty(`--theme-palette-${key}`, value);
    });
    
    // Surface
    Object.entries(tokens.colors.surface).forEach(([key, value]) => {
      root.style.setProperty(`--theme-surface-${key}`, value);
    });

    // Text
    Object.entries(tokens.colors.text).forEach(([key, value]) => {
      root.style.setProperty(`--theme-text-${key}`, value);
    });

    // Border
    Object.entries(tokens.colors.border).forEach(([key, value]) => {
      root.style.setProperty(`--theme-border-${key}`, value);
    });
  }

  private updateDocumentClass(type: 'light' | 'dark') {
    if (type === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  public getAvailableStyles() {
    return Array.from(this.styles.values());
  }

  public getActiveStyleId() {
    return this.activeStyleId;
  }
}

export const themeManager = new ThemeManager();
