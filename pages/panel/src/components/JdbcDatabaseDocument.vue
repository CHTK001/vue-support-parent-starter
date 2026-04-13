<template>
  <section class="database-document">
    <header class="database-document__hero">
      <div class="database-document__title">
        <small>DATABASE DOCUMENT</small>
        <strong>{{ document?.panelCatalogName || "未命名数据库" }}</strong>
        <span>生成时间 {{ formatGeneratedAt }}</span>
      </div>

      <div class="database-document__stats">
        <article>
          <small>表数量</small>
          <strong>{{ document?.panelTableCount || 0 }}</strong>
        </article>
        <article>
          <small>Schema</small>
          <strong>{{ document?.panelSchemaCount || 0 }}</strong>
        </article>
      </div>
    </header>

    <ElEmpty
      v-if="!document?.panelTables?.length"
      description="当前数据库还没有可展示的表文档。"
    />

    <div v-else class="database-document__sections">
      <article
        v-for="table in document.panelTables"
        :key="`${table.panelSchemaName || 'default'}::${table.panelTableName}`"
        class="table-doc-card"
      >
        <header class="table-doc-card__head">
          <div>
            <small>{{ table.panelSchemaName || "default" }}</small>
            <strong>{{ table.panelTableName }}</strong>
            <span>{{ table.panelTableComment || "暂无表备注" }}</span>
          </div>

          <div class="table-doc-card__chips">
            <ScTag class="table-doc-card__chip" effect="plain">
              PK {{ (table.panelPrimaryKeys || []).length }}
            </ScTag>
            <ScTag class="table-doc-card__chip" effect="plain">
              列 {{ (table.panelColumns || []).length }}
            </ScTag>
            <ScTag class="table-doc-card__chip" effect="plain">
              索引 {{ (table.panelIndexes || []).length }}
            </ScTag>
          </div>
        </header>

        <ElTable :data="table.panelColumns || []" border>
          <ElTableColumn label="字段" min-width="180">
            <template #default="{ row }">
              <div class="column-name">
                <strong>{{ row.name || "-" }}</strong>
                <ScTag
                  v-if="
                    (table.panelPrimaryKeys || []).includes(
                      String(row.name || '')
                    )
                  "
                  class="table-doc-card__chip"
                  effect="plain"
                  size="small"
                  type="warning"
                >
                  PK
                </ScTag>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn label="类型" min-width="140">
            <template #default="{ row }">{{ row.type || "-" }}</template>
          </ElTableColumn>
          <ElTableColumn label="长度" min-width="88">
            <template #default="{ row }">{{ row.size ?? "-" }}</template>
          </ElTableColumn>
          <ElTableColumn label="允许空" min-width="88">
            <template #default="{ row }">{{
              row.nullable ? "YES" : "NO"
            }}</template>
          </ElTableColumn>
          <ElTableColumn label="默认值" min-width="140">
            <template #default="{ row }">{{
              row.defaultValue ?? "-"
            }}</template>
          </ElTableColumn>
          <ElTableColumn label="备注" min-width="220">
            <template #default="{ row }">{{ row.comment || "-" }}</template>
          </ElTableColumn>
        </ElTable>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ElEmpty, ElTable, ElTableColumn } from "element-plus";
import { computed } from "vue";
import type { PanelDatabaseDocumentView } from "../api";
import ScTag from "@repo/components/ScTag/src/index.vue";

const props = defineProps<{
  document: PanelDatabaseDocumentView | null;
}>();

const formatGeneratedAt = computed(() => {
  if (!props.document?.panelGeneratedAt) {
    return "-";
  }
  const parsed = new Date(props.document.panelGeneratedAt);
  return Number.isNaN(parsed.getTime())
    ? props.document.panelGeneratedAt
    : parsed.toLocaleString();
});
</script>

<style scoped lang="scss">
.database-document {
  display: grid;
  gap: 14px;
  min-height: 100%;
  padding: 14px;
  overflow: auto;
}

.database-document__hero {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border: 1px solid rgba(123, 138, 149, 0.14);
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98),
    rgba(238, 245, 249, 0.96)
  );
}

.database-document__title {
  display: grid;
  gap: 4px;
}

.database-document__title small {
  color: #708695;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.database-document__title strong {
  color: #112736;
  font-size: 20px;
}

.database-document__title span {
  color: #728797;
  font-size: 12px;
}

.database-document__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(100px, 1fr));
  gap: 10px;
}

.database-document__stats article {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(18, 39, 54, 0.04);
}

.database-document__stats small {
  color: #748a99;
  font-size: 11px;
}

.database-document__stats strong {
  color: #112736;
  font-size: 20px;
}

.database-document__sections {
  display: grid;
  gap: 12px;
}

.table-doc-card {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(123, 138, 149, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
}

.table-doc-card__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.table-doc-card__head small {
  display: block;
  color: #708695;
  font-size: 11px;
}

.table-doc-card__head strong {
  display: block;
  margin-top: 2px;
  color: #112736;
  font-size: 16px;
}

.table-doc-card__head span {
  display: block;
  margin-top: 4px;
  color: #738999;
  font-size: 12px;
}

.table-doc-card__chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.column-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.column-name strong {
  color: #112736;
  font-size: 13px;
}

@media (max-width: 960px) {
  .database-document__hero,
  .table-doc-card__head {
    flex-direction: column;
  }

  .database-document__stats {
    grid-template-columns: 1fr;
  }
}
</style>
