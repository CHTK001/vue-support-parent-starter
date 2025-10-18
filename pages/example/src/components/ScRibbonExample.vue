<template>
  <div class="ribbon-example">
    <h3 class="section-title">基础徽带（Badge）</h3>
    <div class="row">
      <ScRibbon text="默认" variant="badge" />
      <ScRibbon text="成功" variant="badge" color="var(--el-color-success)" />
      <ScRibbon text="警告" variant="badge" color="var(--el-color-warning)" />
      <ScRibbon text="危险" variant="badge" color="var(--el-color-danger)" />
      <ScRibbon text="信息" variant="badge" color="var(--el-color-info)" />
      <ScRibbon text="带图标" variant="badge" icon="mdi:star" />
    </div>

    <h3 class="section-title">角标（Corner）</h3>
    <div class="grid">
      <div class="card">
        <div class="card-body">
          <p>左上角</p>
        </div>
        <ScRibbon text="NEW" variant="corner" position="lt" icon="mdi:flash" />
      </div>
      <div class="card">
        <div class="card-body">
          <p>右上角</p>
        </div>
        <ScRibbon text="HOT" variant="corner" position="rt" color="var(--el-color-danger)" />
      </div>
      <div class="card">
        <div class="card-body">
          <p>左下角</p>
        </div>
        <ScRibbon text="SALE" variant="corner" position="lb" color="var(--el-color-success)" />
      </div>
      <div class="card">
        <div class="card-body">
          <p>右下角</p>
        </div>
        <ScRibbon text="PRO" variant="corner" position="rb" color="var(--el-color-warning)" />
      </div>
    </div>

    <h3 class="section-title">对角带（Diagonal）</h3>
    <div class="grid">
      <div class="card">
        <div class="card-body">
          <p>LT</p>
        </div>
        <ScRibbon text="BETA" variant="diagonal" position="lt" />
      </div>
      <div class="card">
        <div class="card-body">
          <p>RT</p>
        </div>
        <ScRibbon text="ALPHA" variant="diagonal" position="rt" color="var(--el-color-info)" />
      </div>
      <div class="card">
        <div class="card-body">
          <p>LB</p>
        </div>
        <ScRibbon text="DEV" variant="diagonal" position="lb" color="var(--el-color-success)" />
      </div>
      <div class="card">
        <div class="card-body">
          <p>RB</p>
        </div>
        <ScRibbon text="VIP" variant="diagonal" position="rb" color="var(--el-color-warning)" />
      </div>
    </div>

    <h3 class="section-title">横幅带（Banner）</h3>
    <div class="grid">
      <div class="card">
        <div class="card-body large">
          <ScRibbon text="活动进行中" variant="banner" width="80%" icon="mdi:ticket-percent" />
        </div>
      </div>
      <div class="card">
        <div class="card-body large">
          <ScRibbon text="维护窗口" variant="banner" width="60%" color="var(--el-color-warning)" icon="mdi:tools" />
        </div>
      </div>
    </div>

    <h3 class="section-title">尺寸（size）</h3>
    <div class="row">
      <ScRibbon text="SM" variant="badge" size="sm" />
      <ScRibbon text="MD" variant="badge" size="md" />
      <ScRibbon text="LG" variant="badge" size="lg" />
    </div>

    <h3 class="section-title">搭配卡片示例</h3>
    <div class="grid">
      <div class="card">
        <div class="card-body">
          <p>商品卡片</p>
        </div>
        <ScRibbon text="满减" variant="corner" position="lt" color="var(--el-color-success)" />
        <ScRibbon text="热卖" variant="diagonal" position="rt" color="var(--el-color-danger)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ScRibbon from "@repo/components/ScRibbon/index.vue";
</script>

<style scoped>
.ribbon-example { padding: 8px; }
.section-title { margin: 20px 0 12px; font-weight: 600; }
.row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 16px; }
.card { position: relative; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; background: var(--el-bg-color-overlay); }
.card-body { height: 120px; display: flex; align-items: center; justify-content: center; color: var(--el-text-color-regular); }
.card-body.large { height: 160px; }
</style>