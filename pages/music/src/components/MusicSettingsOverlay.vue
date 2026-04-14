<template>
  <ScOverlayPage
    :model-value="visible"
    title="系统设置"
    subtitle="音源控制与显示偏好"
    eyebrow="Settings"
    theme="music"
    append-to-body
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="settings-shell">
      <section class="settings-card">
        <div class="settings-head">
          <div>
            <p class="settings-kicker">Display</p>
            <h3>显示偏好</h3>
          </div>
          <span>控制歌曲列表中的补充信息展示。</span>
        </div>

        <label class="preference-row">
          <div>
            <strong>在歌曲列表中显示来源</strong>
            <p>在专辑信息下方补充音源标签，便于区分当前歌曲来自哪个平台。</p>
          </div>
          <el-switch
            :model-value="showTrackSource"
            inline-prompt
            active-text="开"
            inactive-text="关"
            @update:model-value="emit('update:show-track-source', Boolean($event))"
          />
        </label>
      </section>

      <section class="settings-card">
        <div class="settings-head">
          <div>
            <p class="settings-kicker">Sources</p>
            <h3>音源开关</h3>
          </div>
          <span>{{ sources.length }} 个音源，可按需启停。</span>
        </div>

        <div class="source-list">
          <article v-for="source in sources" :key="source.code" class="source-item">
            <div class="source-copy">
              <div class="source-line">
                <strong>{{ source.name }}</strong>
                <span class="source-badge" :class="{ off: !source.enabled }">
                  {{ source.enabled ? "运行中" : "已停用" }}
                </span>
              </div>
              <p>{{ source.description || "暂无描述" }}</p>
            </div>

            <div class="source-actions">
              <code>{{ source.code }}</code>
              <el-switch
                :model-value="source.enabled"
                :loading="savingCodes.includes(source.code)"
                inline-prompt
                active-text="开"
                inactive-text="关"
                @update:model-value="emit('toggle-source', source.code, Boolean($event))"
              />
            </div>
          </article>
        </div>
      </section>
    </div>
  </ScOverlayPage>
</template>

<script setup lang="ts">
import ScOverlayPage from "@repo/components/ScOverlayPage";
import type { MusicSourceOption } from "../types";

defineProps<{
  visible: boolean;
  sources: MusicSourceOption[];
  savingCodes: string[];
  showTrackSource: boolean;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "update:show-track-source", value: boolean): void;
  (e: "toggle-source", sourceCode: string, enabled: boolean): void;
}>();
</script>

<style scoped lang="scss">
.settings-shell {
  display: grid;
  gap: 24px;
  padding-bottom: 140px;
}

.settings-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03)),
    rgba(22, 10, 10, 0.42);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.18);
  padding: 24px;
}

.settings-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
}

.settings-kicker {
  margin: 0 0 8px;
  color: rgba(255, 205, 160, 0.72);
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.settings-head h3 {
  margin: 0;
  color: #fff7ed;
  font-size: 32px;
  line-height: 1.05;
}

.settings-head span,
.preference-row p,
.source-copy p,
.source-actions code {
  color: rgba(255, 234, 214, 0.74);
}

.preference-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
  padding: 18px 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.04);
}

.preference-row strong,
.source-copy strong {
  display: block;
  color: #fff8ef;
}

.preference-row p {
  margin: 8px 0 0;
  line-height: 1.7;
}

.source-list {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}

.source-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.04);
}

.source-copy {
  min-width: 0;
}

.source-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.source-copy p {
  margin: 8px 0 0;
  line-height: 1.7;
}

.source-actions {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.source-actions code {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-family: "Consolas", "Courier New", monospace;
}

.source-badge {
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(24, 148, 82, 0.12);
  color: #82e3ab;
  font-size: 12px;
  font-weight: 700;
}

.source-badge.off {
  background: rgba(146, 28, 45, 0.14);
  color: #ffb7c7;
}

@media (max-width: 860px) {
  .settings-card {
    padding: 18px;
  }

  .settings-head,
  .preference-row,
  .source-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .source-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
