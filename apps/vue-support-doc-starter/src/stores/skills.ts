import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { BUILTIN_SKILLS, type SkillInfo } from "@/resources/skills-list";
import { getClientConfig, saveClientConfig } from "@/api/tauri";

export const useSkillsStore = defineStore("skills", () => {
  const allSkills = ref<SkillInfo[]>([...BUILTIN_SKILLS]);
  const selectedIds = ref<Set<string>>(new Set());
  const searchQuery = ref("");
  const activeCategory = ref("all");

  const filteredSkills = computed(() => {
    return allSkills.value.filter((s) => {
      const matchCategory = activeCategory.value === "all" || s.category === activeCategory.value;
      const matchSearch = !searchQuery.value || s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.value.toLowerCase());
      return matchCategory && matchSearch;
    });
  });

  const selectedSkills = computed(() => allSkills.value.filter((s) => selectedIds.value.has(s.id)));
  const totalCount = computed(() => allSkills.value.length);
  const selectedCount = computed(() => selectedIds.value.size);

  function toggleSkill(id: string) { if (selectedIds.value.has(id)) selectedIds.value.delete(id); else selectedIds.value.add(id); }
  function selectAll() { filteredSkills.value.forEach((s) => selectedIds.value.add(s.id)); }
  function deselectAll() { filteredSkills.value.forEach((s) => selectedIds.value.delete(s.id)); }
  function isSelected(id: string) { return selectedIds.value.has(id); }

  function addSkills(skills: SkillInfo[]) {
    for (const skill of skills) { if (!allSkills.value.some((s) => s.id === skill.id)) allSkills.value.push(skill); }
  }

  function toggleEnabled(id: string) { const s = allSkills.value.find((sk) => sk.id === id); if (s) s.enabled = !s.enabled; }

  function generateSkillsJson(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const s of allSkills.value) {
      if (selectedIds.value.has(s.id)) result[s.name] = { description: s.description, path: s.path, enabled: s.enabled };
    }
    return result;
  }

  async function persistToClient(clientId: string) {
    const now = new Date().toISOString();
    const existing = await getClientConfig(clientId);
    const config = {
      id: clientId,
      name: clientId,
      mcpJson: existing?.mcpJson || "{}",
      skillsJson: JSON.stringify(selectedSkills.value),
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };
    await saveClientConfig(config);
  }

  async function loadFromClient(clientId: string) {
    const config = await getClientConfig(clientId);
    if (config?.skillsJson) {
      try {
        const skills = JSON.parse(config.skillsJson);
        if (Array.isArray(skills)) {
          selectedIds.value.clear();
          skills.forEach((s: SkillInfo) => {
            if (!allSkills.value.some((existing) => existing.id === s.id)) allSkills.value.push(s);
            selectedIds.value.add(s.id);
          });
        }
      } catch {}
    }
  }

  return {
    allSkills, selectedIds, searchQuery, activeCategory,
    filteredSkills, selectedSkills, totalCount, selectedCount,
    toggleSkill, selectAll, deselectAll, isSelected, addSkills, toggleEnabled,
    generateSkillsJson, persistToClient, loadFromClient
  };
});
