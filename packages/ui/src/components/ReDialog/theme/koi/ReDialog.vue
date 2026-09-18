<script setup lang="ts">
/**
 * ReDialog koi 涓婚 鈥斺€?寮圭獥缁勪欢锛圞oiDialog 绉绘锛?
 *
 * 鎻愪緵绐楀彛澹宠兘鍔涳細鏈€灏忓寲娴爣銆佸叏灞忓垏鎹€佸叧闂簩娆＄‘璁ゃ€?
 * 浣跨敤鏂瑰紡涓?default 涓婚瀵归綈锛坴-model 鎺у埗鏄鹃殣锛夛紝
 * 棰濆鏀寔 koi 涓撳睘鑳藉姏锛歴howWindowShell / fullscreen / footerHidden銆?
 */
import { ref, toRefs, computed, watch, onMounted, onUnmounted, type Component } from "vue";
import { ElDialog, ElButton } from "element-plus";
import { Aim } from "@element-plus/icons-vue";
import { useKoiWindowShell } from "./useKoiWindowShell";
import KoiShellHeaderActions from "./KoiShellHeaderActions.vue";
import KoiShellMinimizedDock from "./KoiShellMinimizedDock.vue";
import ReDialogCloseFab from "../../CloseFab.vue";

defineOptions({ name: "ReDialog", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    title?: string;
    /** 鏍囬鏍忓浘鏍囷紙Element Plus 鍥炬爣缁勪欢锛?*/
    icon?: Component;
    width?: number | string;
    /** 璺濊鍙ｉ《閮ㄧ殑鍋忕Щ锛屽搴?el-dialog 鐨?top锛堝 6vh锛?*/
    top?: string;
    /** 鏍囬涓庨〉鑴氬唴瀹规槸鍚﹀眳涓帓鐗?*/
    center?: boolean;
    /** 寮圭獥鏄惁鍦ㄨ鍙ｄ腑姘村钩銆佸瀭鐩村眳涓?*/
    alignCenter?: boolean;
    height?: number;
    closeOnClickModal?: boolean;
    confirmText?: string;
    cancelText?: string;
    destroyOnClose?: boolean;
    /** 鎵撳紑鏃舵槸鍚﹀叏灞忥紙鍙敤鍙充笂瑙掓寜閽垏鎹級 */
    fullscreen?: boolean;
    loading?: boolean;
    footerHidden?: boolean;
    /** 鏄惁鏄剧ず鍙充笂瑙掔獥鍙ｅ３鎿嶄綔鍖猴紙鏀惰捣 / 鍏ㄥ睆 / 鍏抽棴锛?*/
    showWindowShell?: boolean;
    /** 鏈€灏忓寲鎸夐挳鏄惁鏄剧ず锛堥粯璁や粎鍏抽棴鍙锛?*/
    showMinimize?: boolean;
    /** 鍏ㄥ睆鎸夐挳鏄惁鏄剧ず锛堥粯璁や粎鍏抽棴鍙锛?*/
    showFullscreen?: boolean;
    /** headless锛氶殣钘忔爣棰樻爮锛屽彸涓婅鍦嗗舰鎮诞鍏抽棴鎸夐挳鏇夸唬 */
    headless?: boolean;
    /** 绱у噾妯″紡锛氬噺灏忓脊绐楀唴杈硅窛 */
    compact?: boolean;
  }>(),
  {
    title: "ReDialog",
    icon: Aim,
    height: 300,
    width: 650,
    top: "",
    center: true,
    alignCenter: true,
    closeOnClickModal: false,
    confirmText: "",
    cancelText: "",
    destroyOnClose: false,
    fullscreen: false,
    loading: false,
    footerHidden: false,
    showWindowShell: true,
    showMinimize: false,
    showFullscreen: false,
    headless: false,
    compact: false,
  },
);

/** v-model 鎺у埗鏄鹃殣锛堜笌 default 涓婚 API 瀵归綈锛?*/
const visible = defineModel<boolean>({ default: false });

/**
 * 鏈湴鍙鎬ч暅鍍忥細鍏抽棴鏃舵湰鍦扮珛鍗崇敓鏁堬紝涓嶄緷璧栫埗缁勪欢鏄惁鍝嶅簲 update:modelValue
 * 锛堥槻寰?v-model 缁戝畾鍙 props 绛夐敊璇敤娉曗€斺€旂埗涓嶅搷搴旀椂寮圭獥涔熻兘鍏抽棴锛涚埗閲嶆柊鎵撳紑鏃跺啀鍚屾锛?
 */
const localOpen = ref(false);
watch(visible, (v) => { localOpen.value = v; }, { immediate: true });

const { loading, width } = toRefs(props);
const confirmLoading = ref(loading);

const {
  minimized,
  fullscreen: windowFullscreen,
  minimize,
  restoreFromDock,
  toggleFullscreen,
  clearMinimized,
  dockStackIndex,
} = useKoiWindowShell(visible, () => props.fullscreen);

const dialogFullscreen = computed(() => windowFullscreen.value);

const windowWidth = ref(window.innerWidth);

const dialogWidth = computed(() => {
  if (dialogFullscreen.value) return "100%";
  if (windowWidth.value < 600) return "90%";
  const numericWidth = typeof width.value === "number" ? width.value : Number.parseFloat(String(width.value)) || windowWidth.value;
  if (numericWidth > windowWidth.value) return "90%";
  if (numericWidth > windowWidth.value * 0.95) return "95%";
  return width.value;
});

function handleResize() {
  windowWidth.value = window.innerWidth;
}

onMounted(() => window.addEventListener("resize", handleResize));
onUnmounted(() => window.removeEventListener("resize", handleResize));

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

function koiClose() {
  localOpen.value = false;
  visible.value = false;
  clearMinimized();
}

function koiConfirm() {
  emit("confirm");
}

function koiCancel() {
  emit("cancel");
  localOpen.value = false;
  visible.value = false;
  clearMinimized();
}

/** 缂栫▼寮忔墦寮€ */
function koiOpen() {
  visible.value = true;
}

/** 缂栫▼寮忓揩閫熷叧闂紙璺宠繃浜屾纭锛?*/
function koiQuickClose() {
  clearMinimized();
  localOpen.value = false;
  visible.value = false;
}

defineExpose({ koiOpen, koiClose, koiQuickClose });
</script>

<template>
  <ElDialog
    class="koi-dialog-shell"
    :class="{ 'is-headless': headless, 'koi-dialog-compact': compact }"
    :model-value="localOpen"
    :title="title"
    :width="dialogWidth"
    :top="top"
    :center="center"
    :align-center="alignCenter"
    :close-on-click-modal="closeOnClickModal"
    append-to-body
    modal-class="koi-dialog-modal"
    draggable
    :destroy-on-close="destroyOnClose"
    :before-close="koiClose"
    :fullscreen="dialogFullscreen"
    :loading="loading"
    :show-close="!showWindowShell"
  >
    <template v-if="showWindowShell" #header>
      <div class="koi-dialog-custom-header" :class="{ 'is-empty': headless }">
        <template v-if="!headless">
          <span class="koi-dialog-header-left">
            <span v-if="icon" class="koi-dialog-header-icon-wrap">
              <el-icon class="koi-dialog-header-icon"><component :is="icon" /></el-icon>
            </span>
            <span class="el-dialog__title">{{ title }}</span>
          </span>
          <KoiShellHeaderActions
            :is-fullscreen="dialogFullscreen"
            :enabled="visible"
            :show-minimize="showMinimize"
            :show-fullscreen="showFullscreen"
            @minimize="minimize"
            @toggle-fullscreen="toggleFullscreen"
            @close="koiClose"
          />
        </template>
        <!-- headless锛氶殣钘忔爣棰樻爮鍐呭锛屼粎淇濈暀涓€鏉℃瀬绐勬嫋鎷芥潯 + 鍙充笂瑙掑叧闂寜閽?-->
        <template v-else>
          <span class="koi-dialog-header-drag" />
        </template>
      </div>
    </template>
    <slot v-if="!headless" name="header"></slot>
    <ReDialogCloseFab
      v-if="headless"
      :size="28"
      @click="koiClose"
    />
    <div
      class="dialog-content-wrapper"
      :style="dialogFullscreen ? { height: 'auto' } : { height: height + 'px' }"
    >
      <slot name="content">
        <slot></slot>
      </slot>
    </div>
     <template v-if="!footerHidden" #footer>
      <slot name="footer" v-bind="{ confirm: koiConfirm, cancel: koiCancel, loading: confirmLoading }">
        <span class="dialog-footer">
          <el-button size="small" class="koi-btn-borderless" type="primary" :loading="confirmLoading" @click="koiConfirm">
            {{ confirmText || "确定" }}
          </el-button>
          <el-button size="small" class="koi-btn-borderless" type="danger" @click="koiCancel">
            {{ cancelText || "取消" }}
          </el-button>
        </span>
      </slot>
    </template>
  </ElDialog>
  <KoiShellMinimizedDock
    :visible="minimized"
    :title="title"
    tooltip="恢复窗口"
    :stack-index="dockStackIndex"
    @restore="restoreFromDock"
  />
</template>

<style lang="scss" scoped>
.koi-dialog-custom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  padding-right: 0;
  padding-bottom: 4px;

  .koi-dialog-header-left {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .koi-dialog-header-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-radius-md, 8px);
    background: var(--el-bg-color);
  }

  .koi-dialog-header-icon {
    font-size: 14px;
    color: var(--el-color-primary);
    flex-shrink: 0;
  }

  .el-dialog__title {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.dialog-content-wrapper {
  box-sizing: border-box;
  padding-right: 4px;
  overflow: hidden auto;

  & > * {
    padding-right: 4px;
  }

  &--headless {
    padding-top: 16px;
  }
}

.koi-btn-borderless {
  border: none;
  box-shadow: none;
}

/* compact 妯″紡锛堜娇鐢ㄥ叡浜护鐗岋級 */
.koi-dialog-compact .koi-dialog-custom-header {
  padding-bottom: var(--rm-compact-koi-header-padding-bottom);
}
.koi-dialog-compact .koi-dialog-header-icon-wrap {
  width: var(--rm-compact-koi-icon-size);
  height: var(--rm-compact-koi-icon-size);
}
.koi-dialog-compact .koi-dialog-header-icon {
  font-size: var(--rm-compact-koi-icon-font-size);
}
.koi-dialog-compact .el-dialog__title {
  font-size: var(--rm-compact-title-font-size);
}
.koi-dialog-compact .dialog-footer .koi-btn-borderless {
  height: var(--rm-compact-btn-height);
  padding: var(--rm-compact-btn-padding);
  font-size: var(--rm-compact-btn-font-size);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

<style lang="scss">
.koi-dialog-shell .el-dialog__header {
  margin-right: 0;
}

/* 绱у噾 body 鍐呰竟璺?*/
.koi-dialog-shell .el-dialog__body {
  padding: 16px 20px;
}

/* compact 妯″紡锛氳繘涓€姝ョ缉灏?body 鍐呰竟璺?*/
.koi-dialog-shell.koi-dialog-compact .el-dialog__body {
  padding: var(--rm-compact-body-padding);
}

.koi-dialog-shell--headless .el-dialog__header {
  display: none;
}

/* 寮圭獥閬僵锛氱函鑹叉墎骞抽伄缃?*/
.koi-dialog-modal {
  background-color: rgba(0, 0, 0, 0.45);
}

/* headless锛氶殣钘忔爣棰樺唴瀹癸紝浠呬繚鐣欎竴鏉℃偓娴簬椤堕儴鐨勬嫋鎷界儹鍖烘潯锛堜笉鍗犲唴瀹归珮搴︼紝鍙嫋鍔級锛孋loseFab 娴簬鍙充笂瑙?*/
.koi-dialog-shell.is-headless {
  position: relative;
}

/* 鎷栨嫿鐑尯锛?4px 閫忔槑鏉¤鐩栧湪 body 椤堕儴锛屾墿澶у彲鎷栨嫿鑼冨洿 */
.koi-dialog-shell.is-headless .el-dialog__header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  margin: 0;
  padding: 0;
  height: 44px;
  overflow: hidden;
  z-index: 6;
}

.koi-dialog-shell.is-headless .koi-dialog-custom-header.is-empty {
  height: 44px;
  padding: 0;
}

.koi-dialog-shell.is-headless .koi-dialog-header-drag {
  display: block;
  width: 100%;
  height: 44px;
}

.koi-dialog-shell.is-headless .el-dialog__body {
  padding-top: 0;
}

/* 寮圭獥鏈綋锛氬姞澶у渾瑙掞紙淇濇寔涓嶉€忔槑鐧借壊鑳屾櫙锛?*/
.koi-dialog-shell {
  --el-dialog-border-radius: var(--el-radius-xl);
  border-radius: var(--el-radius-xl);
  overflow: hidden;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.04);
}
</style>
