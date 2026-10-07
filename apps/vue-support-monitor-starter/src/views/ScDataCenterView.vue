<script setup lang="ts">
/**
 * 数据源中心（监控台宿主视图）
 *
 * 数据源中心本体是共享包 @pages/datasource 的 ScDataSourceView，采集台也在用，
 * 因此它不能认识监控台自己的页面。「数据库管理器并入数据源中心」这件事由本视图完成：
 * 通过 extraTabs 追加一个「数据表」页签，再用同名插槽把 DatabaseManagerView 注入进去。
 * 插槽能拿到宿主页面上当前选中的数据源，于是「左栏换一个数据源 → 右侧表结构跟着换」
 * 在同一页内完成，不必再跳到独立的 /db-manager 页面。
 *
 * 独立路由 /db-manager 保留：外链、书签、其它系统的深链仍指向它。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed } from "vue";
import ReEmpty from "@repo/ui/re-empty";
import ScDataSourceView from "@pages/datasource/src/views/ScDataSourceView.vue";
import DatabaseManagerView from "@pages/datasource/src/views/console/DatabaseManagerView.vue";
import type { DataSourceInfo } from "@pages/datasource";
import type { ReTabItem } from "@repo/ui/re-tab";

/** 注入数据源中心的宿主页签；页签名同时就是插槽名 */
const EXTRA_TABS: ReTabItem[] = [{ name: "browse", label: "数据表", icon: "Grid" }];

/**
 * 「数据表」页签是否可用。
 *
 * 只有 JDBC 数据源才有库/表/视图的概念；Redis、Nginx 这类选中时给出明确说明，
 * 而不是把浏览器默默退回到默认主数据源 —— 那会让用户以为自己在看别的库。
 */
const isJdbc = (ds: DataSourceInfo | null): boolean => ds?.type === "jdbc";
</script>

<template>
  <ScDataSourceView :extra-tabs="EXTRA_TABS">
    <template #browse="{ datasource }">
      <DatabaseManagerView v-if="isJdbc(datasource)" :datasource-id="datasource!.id" embedded />
      <div v-else class="dsc-browse-empty">
        <ReEmpty
          :description="
            datasource
              ? `「${datasource.name}」是 ${datasource.type} 类型，没有库/表可浏览。请在左侧选择一个 JDBC 数据源。`
              : '请先在左侧选择一个 JDBC 数据源。'
          "
          :image-size="80"
        />
      </div>
    </template>
  </ScDataSourceView>
</template>

<style scoped>
/* 占位块要吃满页签面板高度，否则空状态会贴在顶部、与上方页签脱节 */
.dsc-browse-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  height: 100%;
}
</style>
