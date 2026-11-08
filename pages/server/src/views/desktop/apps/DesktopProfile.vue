<!--
  /**
   * 虚拟桌面 · 画像分区窗口
   *
   * <p>服务 / 存储 / 配置这三个窗口的数据面就是主机画像：与「主机资产」右侧
   * 那些页签走同一份接口、同一个渲染组件（{@link HostProfileView} 的单分区
   * 嵌入模式）。这里只多画一条分区切换条，不另写一套表格——两套表格迟早
   * 会在字段与空态上漂移。</p>
   *
   * <p>画像数据是采集通道落库的结果，主机离线也还能看最后一次采集，
   * 所以这些窗口不要求 SSH 可用。</p>
   */
  -->
<template>
  <div class="dpf">
    <!-- 单分区的窗口（服务）不需要切换条：主机名已经在窗口标题栏里，再来一条空栏只是浪费高度 -->
    <div v-if="tabbed" class="dpf__bar">
      <button
        v-for="s in sections"
        :key="s.key"
        type="button"
        class="dpf__tab"
        :class="{ 'is-on': s.key === curSection }"
        @click="curSection = s.key"
      >
        {{ s.label }}
      </button>
      <span class="dpf__spacer" />
      <span class="dpf__host">{{ hostName || `主机 #${hostId}` }}</span>
    </div>

    <div class="dpf__body">
      <HostProfileView
        :key="curSection"
        embedded
        :hosts="hostList"
        :groups="[]"
        :host-id="hostId"
        :section="curSection"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { getHost } from "../../../api";
import HostProfileView from "../../HostProfileView.vue";

/** 一个分区：key 对应主机画像的分区名 */
interface ProfileSection {
  key: string;
  label: string;
}

const props = withDefaults(
  defineProps<{
    /** 主机标识 */
    hostId: number;
    /** 主机名，只用于窗口顶栏 */
    hostName?: string;
    /** 分区列表；只有一个分区时不显示切换条 */
    sections?: ProfileSection[];
    /** 窗口是否激活（父级透传，这里只用于样式） */
    active?: boolean;
  }>(),
  { hostName: "", sections: () => [], active: false },
);

/** 当前分区（与 prop active 分开命名：同名会让模板里的 props 作用域被遮蔽） */
const curSection = ref(props.sections[0]?.key ?? "disks");

/**
 * 画像组件要求传主机列表（嵌入模式下它只用来读主机台账字段，不做切换）。
 * 桌面是「一台主机一个窗口」，所以这里永远只有一条。
 */
const hostList = ref<any[]>([]);

/**
 * 拉主机台账。
 *
 * <p>画像组件在嵌入模式下会按这个列表判断 Agent 是否安装、版本是多少，
 * 缺了它分区会显示成「主机不存在」，所以先取到再让它渲染。</p>
 */
async function loadHost(): Promise<void> {
  try {
    const h: any = await getHost(props.hostId);
    hostList.value = h ? [h] : [];
  } catch {
    hostList.value = [];
  }
}

/** 分区列表里找得到就用它，避免分区 key 写错时静默落到磁盘 */
watch(
  () => props.sections,
  (list) => {
    if (list.length && !list.some((s) => s.key === curSection.value)) curSection.value = list[0]!.key;
  },
);

/** 分区数：用于顶栏是否显示切换条 */
const tabbed = computed(() => props.sections.length > 1);

onMounted(() => {
  void loadHost();
});
</script>

<style scoped>
.dpf {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: 12px;
  color: #d8d3e0;
  background: #16141c;
}

.dpf__bar {
  display: flex;
  flex: none;
  gap: 4px;
  align-items: center;
  height: 32px;
  padding: 0 10px;
  background: #1b1922;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dpf__tab {
  height: 22px;
  padding: 0 10px;
  font-size: 11px;
  color: #b9b4c2;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
}

.dpf__tab:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.dpf__tab.is-on {
  color: #fff;
  background: rgba(233, 84, 32, 0.28);
  border-color: rgba(233, 84, 32, 0.5);
}

.dpf__spacer {
  flex: 1;
}

.dpf__host {
  overflow: hidden;
  font-size: 10.5px;
  color: #8f8a9b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/*
 * 内容区是平台自己的页面版式（白卡面 + Element 变量），不是桌面自绘的深色控件，
 * 所以这里整块铺浅色底：深色窗框 + 浅色文档面，跟终端窗口里那块独立画布一个道理。
 * 硬把白卡塞进深色底会变成一块刺眼的亮斑，反过来改它的配色又会和主机资产页
 * 那套版式漂移。
 */
.dpf__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color-page, #f5f6fa);
}

.dpf__body :deep(.profile) {
  height: 100%;
  min-height: 0;
}

.dpf__body :deep(.profile-detail) {
  border-radius: 8px;
}
</style>
