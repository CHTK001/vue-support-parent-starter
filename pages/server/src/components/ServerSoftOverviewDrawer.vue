<template>
  <ScDrawer
    v-model="visible"
    size="620px"
    destroy-on-close
    :title="host ? `${host.serverName} 的软件驾驶舱` : '软件驾驶舱'"
  >
    <ScScrollbar v-loading="loading" class="soft-drawer__scroll">
      <template v-if="host && softEnabled">
        <section class="soft-drawer__hero">
          <div>
            <p class="soft-drawer__eyebrow">Software Deck</p>
            <h3>把安装、服务、操作记录收口到同一个操作面板</h3>
            <p class="soft-drawer__hint">
              这里保留服务器视角，适合快速判断当前机器的软件密度、服务状态和最近动作。
            </p>
          </div>
          <div class="server-action-row soft-drawer__toolbar">
            <el-button type="primary" plain @click="$emit('open-install')">
              <IconifyIconOnline icon="ri:download-cloud-2-line" />
              <span>安装软件</span>
            </el-button>
          </div>
        </section>

        <div class="soft-drawer__stats">
          <div class="soft-drawer__stat">
            <strong>{{ targetCount }}</strong>
            <span>绑定目标</span>
          </div>
          <div class="soft-drawer__stat">
            <strong>{{ installationCount }}</strong>
            <span>软件实例</span>
          </div>
          <div class="soft-drawer__stat">
            <strong>{{ serviceCount }}</strong>
            <span>服务器服务</span>
          </div>
          <div class="soft-drawer__stat">
            <strong>{{ operationCount }}</strong>
            <span>最近操作</span>
          </div>
          <div class="soft-drawer__stat">
            <strong>{{ backupCount }}</strong>
            <span>备份点</span>
          </div>
          <div class="soft-drawer__stat">
            <strong>{{ upgradeableCount }}</strong>
            <span>可升级</span>
          </div>
        </div>

        <article class="soft-drawer__card">
          <header>
            <h3>软件实例</h3>
            <p>实例名称、版本状态和备份 / 升级信息在这里直接呈现。</p>
          </header>
          <div v-if="installationCards.length" class="soft-drawer__list">
            <button
              v-for="card in installationCards"
              :key="card.item.softInstallationId"
              type="button"
              class="soft-drawer__item"
              @click="$emit('open-installation-detail', card.item)"
            >
              <div>
                <strong>{{ card.title }}</strong>
                <p>{{ card.subtitle }}</p>
                <div class="soft-drawer__item-chips">
                  <el-tag
                    class="server-inline-tag"
                    effect="plain"
                    round
                    size="small"
                  >
                    备份点 {{ card.backupCount }}
                  </el-tag>
                  <el-tag
                    class="server-inline-tag"
                    effect="plain"
                    round
                    size="small"
                  >
                    {{ card.upgradeText }}
                  </el-tag>
                </div>
              </div>
              <div class="soft-drawer__item-meta">
                <span>{{ card.statusText }}</span>
                <small>{{ card.metaText }}</small>
              </div>
            </button>
          </div>
          <el-empty v-else description="当前服务器还没有 soft 安装实例" />
        </article>

        <article class="soft-drawer__card">
          <header>
            <h3>服务器服务</h3>
            <p>服务主档按动作拆成紧凑操作区，避免在一个卡片里塞过多文字。</p>
          </header>
          <div v-if="serviceCards.length" class="soft-drawer__list">
            <div
              v-for="card in serviceCards"
              :key="card.item.serverServiceId || card.item.serviceCode || card.item.serviceName"
              class="soft-drawer__item soft-drawer__item--static soft-drawer__service-card"
            >
              <div class="soft-drawer__service-body">
                <div>
                  <strong>{{ card.title }}</strong>
                  <p>{{ card.subtitle }}</p>
                  <div class="soft-drawer__item-chips">
                    <el-tag
                      class="server-inline-tag"
                      effect="plain"
                      round
                      size="small"
                    >
                      {{ card.primaryChip }}
                    </el-tag>
                    <el-tag
                      v-if="card.secondaryChip"
                      class="server-inline-tag"
                      effect="plain"
                      round
                      size="small"
                    >
                      {{ card.secondaryChip }}
                    </el-tag>
                  </div>
                </div>
                <div class="soft-drawer__item-meta">
                  <span>{{ card.statusText }}</span>
                  <small>{{ card.metaText }}</small>
                </div>
              </div>
              <div class="soft-drawer__service-actions">
                <el-tooltip content="状态检查">
                  <el-button
                    circle
                    plain
                    :loading="card.loadingStatus"
                    @click="emitServiceAction(card.item, 'status')"
                  >
                    <IconifyIconOnline icon="ri:pulse-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip :content="card.running ? '停止服务' : '启动服务'">
                  <el-button
                    circle
                    plain
                    :type="card.running ? 'danger' : 'success'"
                    :loading="card.loadingStartStop"
                    @click="
                      emitServiceAction(card.item, card.running ? 'stop' : 'start')
                    "
                  >
                    <IconifyIconOnline
                      :icon="
                        card.running
                          ? 'ri:stop-circle-line'
                          : 'ri:play-circle-line'
                      "
                    />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="重启服务">
                  <el-button
                    circle
                    plain
                    :loading="card.loadingRestart"
                    @click="emitServiceAction(card.item, 'restart')"
                  >
                    <IconifyIconOnline icon="ri:restart-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip v-if="card.canRegister" content="注册服务">
                  <el-button
                    circle
                    plain
                    :loading="card.loadingRegister"
                    @click="emitServiceAction(card.item, 'register')"
                  >
                    <IconifyIconOnline icon="ri:shield-check-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip v-if="card.canUnregister" content="取消注册">
                  <el-button
                    circle
                    plain
                    type="warning"
                    :loading="card.loadingUnregister"
                    @click="emitServiceAction(card.item, 'unregister')"
                  >
                    <IconifyIconOnline icon="ri:shield-cross-line" />
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </div>
          <el-empty v-else description="当前服务器没有已绑定的服务器服务" />
        </article>

        <article class="soft-drawer__card">
          <header>
            <h3>最近操作</h3>
            <p>保留最近 8 条软件动作，便于快速回看安装、启动和升级轨迹。</p>
          </header>
          <div v-if="operationCards.length" class="soft-drawer__list">
            <div
              v-for="card in operationCards"
              :key="card.item.softOperationLogId"
              class="soft-drawer__item soft-drawer__item--static"
            >
              <div>
                <strong>{{ card.title }}</strong>
                <p>{{ card.message }}</p>
              </div>
              <div class="soft-drawer__item-meta">
                <span>{{ card.statusText }}</span>
                <small>{{ card.timeText }}</small>
              </div>
            </div>
          </div>
          <el-empty v-else description="当前服务器没有相关操作记录" />
        </article>
      </template>

      <el-empty
        v-else
        description="soft 模块未启用，无法展示服务器的软件与服务"
      />
    </ScScrollbar>
  </ScDrawer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ServerHost, ServerService, ServerSoftInstallation } from "../api";
import type {
  ServerSoftInstallationCard,
  ServerSoftOperationCard,
  ServerSoftServiceCard,
} from "./server-types";

type ServiceAction =
  | "register"
  | "unregister"
  | "start"
  | "stop"
  | "restart"
  | "status";

const props = defineProps<{
  modelValue: boolean;
  host: ServerHost | null;
  softEnabled: boolean;
  loading: boolean;
  targetCount: number;
  installationCount: number;
  serviceCount: number;
  operationCount: number;
  backupCount: number;
  upgradeableCount: number;
  installationCards: ServerSoftInstallationCard[];
  serviceCards: ServerSoftServiceCard[];
  operationCards: ServerSoftOperationCard[];
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "open-install"): void;
  (event: "open-installation-detail", value: ServerSoftInstallation): void;
  (event: "service-action", payload: { item: ServerService; action: ServiceAction }): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const emitServiceAction = (item: ServerService, action: ServiceAction) => {
  emit("service-action", { item, action });
};
</script>

<style scoped lang="scss">
.soft-drawer__scroll,
.soft-drawer__list {
  display: grid;
  gap: 12px;
}

.soft-drawer__hero {
  display: grid;
  gap: 14px;
  padding: 20px 22px;
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 36%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
}

.soft-drawer__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #2563eb;
}

.soft-drawer__hero h3,
.soft-drawer__card h3 {
  margin: 0;
  color: #0f172a;
}

.soft-drawer__hint,
.soft-drawer__card header p,
.soft-drawer__item p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.7;
}

.soft-drawer__toolbar {
  justify-content: flex-start;
}

.soft-drawer__card {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.84);
}

.soft-drawer__stats {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
}

.soft-drawer__stat {
  display: grid;
  gap: 2px;
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.88);
}

.soft-drawer__stat strong {
  color: #0f172a;
  font-size: 20px;
  line-height: 1;
}

.soft-drawer__stat span {
  color: #64748b;
  font-size: 12px;
}

.soft-drawer__item {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.92);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.soft-drawer__item:hover {
  transform: translateY(-2px);
  border-color: rgba(14, 165, 233, 0.26);
  box-shadow: 0 16px 26px rgba(14, 165, 233, 0.1);
}

.soft-drawer__item--static,
.soft-drawer__service-card {
  cursor: default;
}

.soft-drawer__item--static:hover,
.soft-drawer__service-card:hover {
  transform: none;
}

.soft-drawer__service-body {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.soft-drawer__item-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.soft-drawer__item-meta {
  display: grid;
  gap: 4px;
  justify-items: end;
  text-align: right;
}

.soft-drawer__item-meta span {
  color: #0f172a;
  font-weight: 600;
}

.soft-drawer__item-meta small {
  color: #64748b;
}

.soft-drawer__service-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
}

.server-inline-tag {
  --el-tag-border-color: rgba(148, 163, 184, 0.18);
  --el-tag-bg-color: rgba(255, 255, 255, 0.82);
  --el-tag-text-color: #475569;
  font-weight: 500;
}

@media (max-width: 760px) {
  .soft-drawer__service-body,
  .soft-drawer__item-meta {
    grid-template-columns: 1fr;
    justify-items: start;
    text-align: left;
  }

  .soft-drawer__item-meta {
    display: grid;
  }
}
</style>
