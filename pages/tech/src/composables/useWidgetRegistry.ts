import type { WidgetTypeDefinition, WidgetCategory, WidgetTypeKey } from "../types/widget";

const registry = new Map<WidgetTypeKey, WidgetTypeDefinition>();

export function registerWidgetType(def: WidgetTypeDefinition): void {
  registry.set(def.type, def);
}

export function getWidgetType(type: WidgetTypeKey): WidgetTypeDefinition | undefined {
  return registry.get(type);
}

export function getAllWidgetTypes(): WidgetTypeDefinition[] {
  return Array.from(registry.values());
}

export function getWidgetTypesByCategory(category: WidgetCategory): WidgetTypeDefinition[] {
  return Array.from(registry.values()).filter((d) => d.category === category);
}

export function getWidgetCategories(): WidgetCategory[] {
  const cats = new Set<WidgetCategory>();
  registry.forEach((d) => cats.add(d.category));
  return Array.from(cats);
}

export function useWidgetRegistry() {
  return {
    registerWidgetType,
    getWidgetType,
    getAllWidgetTypes,
    getWidgetTypesByCategory,
    getWidgetCategories,
  };
}
