<template>
  <div class="dsm-flex-col">
    <!-- KPI 卡片 -->
    <div class="dsm-grid-6 gap-6">
      <div class="dsm-stat-card">
        <div class="dsm-stat-label">总目标</div>
        <div class="dsm-stat-value">{{ data?.targetTotal ?? '—' }}</div>
      </div>
      <div class="dsm-stat-card">
        <div class="dsm-stat-label">在线</div>
        <div class="dsm-stat-value is-up">{{ data?.targetUp ?? '—' }}</div>
      </div>
      <div class="dsm-stat-card">
        <div class="dsm-stat-label">离线</div>
        <div class="dsm-stat-value is-down">{{ data?.targetDown ?? '—' }}</div>
      </div>
      <div class="dsm-stat-card">
        <div class="dsm-stat-label">未知</div>
        <div class="dsm-stat-value">{{ data?.targetUnknown ?? '—' }}</div>
      </div>
      <div class="dsm-stat-card">
        <div class="dsm-stat-label">活跃告警</div>
        <div class="dsm-stat-value is-alarm">{{ data?.activeAlerts ?? '—' }}</div>
      </div>
      <div class="dsm-stat-card">
        <div class="dsm-stat-label">规则数</div>
        <div class="dsm-stat-value">{{ data?.ruleCount ?? '—' }}</div>
      </div>
    </div>

    <!-- 版本与连接信息 -->
    <div class="dsm-section">
      <div class="dsm-section-title">实例信息</div>
      <div class="dsm-info-grid">
        <span class="dsm-info-key">数据源</span><span class="dsm-info-val">{{ data?.datasourceName }}</span>
        <span class="dsm-info-key">Prometheus 地址</span><span class="dsm-info-val">{{ data?.prometheusUrl }}</span>
        <span class="dsm-info-key">版本</span><span class="dsm-info-val">{{ data?.version ?? '—' }}</span>
        <span class="dsm-info-key">Revisions</span><span class="dsm-info-val">{{ data?.revision ?? '—' }}</span>
        <span class="dsm-info-key">配置根目录</span><span class="dsm-info-val">{{ data?.configRoot ?? '—' }}</span>
        <span class="dsm-info-key">主配置文件</span><span class="dsm-info-val">{{ data?.configPath ?? '—' }}</span>
        <span class="dsm-info-key">配置存在</span>
        <span class="dsm-info-val">
          <span v-if="data?.configExists === true" class="dsm-tag is-ok">是</span>
          <span v-else-if="data?.configExists === false" class="dsm-tag is-warn">否</span>
          <span v-else>—</span>
          <span v-if="data?.configCheckError" class="dsm-tag is-error" :title="data.configCheckError">配置错误</span>
        </span>
      </div>
    </div>

    <!-- 采集任务分布 -->
    <div class="dsm-section">
      <div class="dsm-section-title">采集任务</div>
      <table v-if="data?.jobs?.length" class="dsm-table">
        <thead>
          <tr>
            <th>Job</th>
            <th>在线</th>
            <th>离线</th>
            <th>未知</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="j in data.jobs" :key="j.job">
            <td class="dsm-table-name">{{ j.job }}</td>
            <td><span class="dsm-badge is-up">{{ j.up }}</span></td>
            <td><span class="dsm-badge is-down">{{ j.down }}</span></td>
            <td><span class="dsm-badge">{{ j.unknown }}</span></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="dsm-hint">无采集任务数据</div>
    </div>
  </div>
</template>

<script setup lang="ts" name="PromOverviewPanel">
import type { PromOverview } from "../../../api/prometheus/api";

defineProps<{
  loading?: boolean;
  data: PromOverview | null;
}>();
</script>

<style scoped lang="scss">
.dsm-flex-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dsm-grid-6 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.gap-6 { gap: 6px; }
.dsm-stat-card {
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 14px 16px;
}
.dsm-stat-label {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 4px;
}
.dsm-stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  &.is-up { color: var(--status-success); }
  &.is-down { color: var(--status-error); }
  &.is-alarm { color: var(--status-warning); }
}
.dsm-section {
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 14px 16px;
}
.dsm-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-subtle);
}
.dsm-info-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 16px;
  font-size: 12px;
}
.dsm-info-key { color: var(--text-tertiary); white-space: nowrap; }
.dsm-info-val { color: var(--text-primary); }
.dsm-tag {
  display: inline-block;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  &.is-ok { background: color-mix(in srgb, var(--status-success) 14%, transparent); color: var(--status-success); }
  &.is-warn { background: color-mix(in srgb, var(--status-warning) 14%, transparent); color: var(--status-warning); }
  &.is-error { background: color-mix(in srgb, var(--status-error) 14%, transparent); color: var(--status-error); }
}
.dsm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  th, td { padding: 5px 8px; text-align: left; border-bottom: 1px solid var(--border-subtle); }
  th { color: var(--text-tertiary); font-weight: 600; position: sticky; top: 0; }
  td { color: var(--text-primary); }
}
.dsm-table-name { max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
.dsm-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--bg-fill);
  &.is-up { background: color-mix(in srgb, var(--status-success) 14%, transparent); color: var(--status-success); }
  &.is-down { background: color-mix(in srgb, var(--status-error) 14%, transparent); color: var(--status-error); }
}
.dsm-hint { font-size: 12px; color: var(--text-tertiary); text-align: center; padding: 24px 0; }
</style>