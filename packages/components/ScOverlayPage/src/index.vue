<template>
  <Teleport v-if="appendToBody" to="body">
    <Transition
      name="sc-overlay-page"
      @after-enter="emit('opened')"
      @after-leave="handleAfterLeave"
    >
      <div
        v-if="rendered"
        v-show="visible"
        class="sc-overlay-page"
        :class="[customClass, `sc-overlay-page--${theme}`]"
        :style="{ zIndex: String(zIndex) }"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="sc-overlay-page__backdrop"
          @click="handleBackdropClick"
        />

        <section class="sc-overlay-page__surface">
          <header v-if="showHeader" class="sc-overlay-page__header">
            <slot name="header">
              <div class="sc-overlay-page__head-main">
                <button
                  v-if="showBack"
                  type="button"
                  class="sc-overlay-page__back"
                  @click="handleBack"
                >
                  <span
                    class="sc-overlay-page__back-icon"
                    aria-hidden="true"
                  />
                  <span>{{ backText }}</span>
                </button>

                <div class="sc-overlay-page__title-group">
                  <p v-if="eyebrow" class="sc-overlay-page__eyebrow">
                    {{ eyebrow }}
                  </p>
                  <h2 class="sc-overlay-page__title">
                    {{ title }}
                  </h2>
                  <p v-if="subtitle" class="sc-overlay-page__subtitle">
                    {{ subtitle }}
                  </p>
                </div>
              </div>

              <div class="sc-overlay-page__actions">
                <slot name="header-actions" />
                <button
                  v-if="showClose"
                  type="button"
                  class="sc-overlay-page__close"
                  @click="close"
                >
                  {{ closeText }}
                </button>
              </div>
            </slot>
          </header>

          <div class="sc-overlay-page__body" :class="bodyClass">
            <slot />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>

  <Transition
    v-else
    name="sc-overlay-page"
    @after-enter="emit('opened')"
    @after-leave="handleAfterLeave"
  >
    <div
      v-if="rendered"
      v-show="visible"
      class="sc-overlay-page"
      :class="[customClass, `sc-overlay-page--${theme}`]"
      :style="{ zIndex: String(zIndex) }"
      role="dialog"
      aria-modal="true"
    >
      <div class="sc-overlay-page__backdrop" @click="handleBackdropClick" />

      <section class="sc-overlay-page__surface">
        <header v-if="showHeader" class="sc-overlay-page__header">
          <slot name="header">
            <div class="sc-overlay-page__head-main">
              <button
                v-if="showBack"
                type="button"
                class="sc-overlay-page__back"
                @click="handleBack"
              >
                <span class="sc-overlay-page__back-icon" aria-hidden="true" />
                <span>{{ backText }}</span>
              </button>

              <div class="sc-overlay-page__title-group">
                <p v-if="eyebrow" class="sc-overlay-page__eyebrow">
                  {{ eyebrow }}
                </p>
                <h2 class="sc-overlay-page__title">
                  {{ title }}
                </h2>
                <p v-if="subtitle" class="sc-overlay-page__subtitle">
                  {{ subtitle }}
                </p>
              </div>
            </div>

            <div class="sc-overlay-page__actions">
              <slot name="header-actions" />
              <button
                v-if="showClose"
                type="button"
                class="sc-overlay-page__close"
                @click="close"
              >
                {{ closeText }}
              </button>
            </div>
          </slot>
        </header>

        <div class="sc-overlay-page__body" :class="bodyClass">
          <slot />
        </div>
      </section>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";

let lockCount = 0;
let previousOverflow = "";

function lockBodyScroll() {
  if (typeof document === "undefined") {
    return;
  }
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

function unlockBodyScroll() {
  if (typeof document === "undefined" || lockCount === 0) {
    return;
  }
  lockCount -= 1;
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow;
  }
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    title?: string;
    subtitle?: string;
    eyebrow?: string;
    backText?: string;
    closeText?: string;
    showHeader?: boolean;
    showBack?: boolean;
    showClose?: boolean;
    closeOnBack?: boolean;
    closeOnBackdrop?: boolean;
    closeOnPressEscape?: boolean;
    appendToBody?: boolean;
    destroyOnClose?: boolean;
    lockScroll?: boolean;
    zIndex?: number;
    theme?: "default" | "music" | "tech";
    customClass?: string;
    bodyClass?: string;
  }>(),
  {
    modelValue: false,
    title: "",
    subtitle: "",
    eyebrow: "",
    backText: "返回",
    closeText: "关闭",
    showHeader: true,
    showBack: true,
    showClose: false,
    closeOnBack: true,
    closeOnBackdrop: false,
    closeOnPressEscape: true,
    appendToBody: true,
    destroyOnClose: true,
    lockScroll: true,
    zIndex: 2600,
    theme: "default",
    customClass: "",
    bodyClass: ""
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  open: [];
  opened: [];
  close: [];
  closed: [];
  back: [];
}>();

const rendered = ref(props.modelValue);
const visible = ref(props.modelValue);
const scrollLocked = ref(false);
const initialized = ref(false);

function setVisible(value: boolean) {
  if (value) {
    rendered.value = true;
    visible.value = true;
    syncScrollLock(true);
  } else {
    visible.value = false;
  }
  emit("update:modelValue", value);
}

function close() {
  setVisible(false);
}

function handleBack() {
  emit("back");
  if (props.closeOnBack) {
    close();
  }
}

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    close();
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === "Escape" && props.closeOnPressEscape && visible.value) {
    close();
  }
}

function syncScrollLock(value: boolean) {
  if (!props.lockScroll) {
    return;
  }
  if (value && !scrollLocked.value) {
    lockBodyScroll();
    scrollLocked.value = true;
    return;
  }
  if (!value && scrollLocked.value) {
    unlockBodyScroll();
    scrollLocked.value = false;
  }
}

function handleAfterLeave() {
  syncScrollLock(false);
  if (props.destroyOnClose) {
    rendered.value = false;
  }
  emit("closed");
}

watch(
  () => props.modelValue,
  async value => {
    if (!initialized.value) {
      initialized.value = true;
      rendered.value = value;
      visible.value = value;
      syncScrollLock(value);
      return;
    }
    if (value) {
      rendered.value = true;
      await nextTick();
      visible.value = true;
      syncScrollLock(true);
      emit("open");
      return;
    }
    visible.value = false;
    emit("close");
  },
  { immediate: true }
);

watch(
  () => visible.value,
  value => {
    if (!value && !props.modelValue) {
      syncScrollLock(false);
    }
  }
);

watch(
  () => props.closeOnPressEscape,
  value => {
    if (typeof window === "undefined") {
      return;
    }
    if (value) {
      window.addEventListener("keydown", handleEscape);
      return;
    }
    window.removeEventListener("keydown", handleEscape);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleEscape);
  }
  syncScrollLock(false);
});

defineExpose({
  open: () => setVisible(true),
  close,
  isVisible: () => visible.value
});
</script>

<style scoped lang="scss">
.sc-overlay-page {
  position: fixed;
  inset: 0;
  overflow: hidden;
}

.sc-overlay-page__backdrop {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(16, 11, 10, 0.48), rgba(16, 11, 10, 0.68));
  backdrop-filter: blur(8px);
}

.sc-overlay-page__surface {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgba(255, 205, 116, 0.16), transparent 28%),
    radial-gradient(circle at left 20%, rgba(255, 124, 76, 0.18), transparent 24%),
    linear-gradient(180deg, rgba(42, 19, 18, 0.98), rgba(24, 12, 12, 0.99));
}

.sc-overlay-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding:
    calc(18px + env(safe-area-inset-top, 0px))
    28px
    18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(22, 11, 11, 0.62);
  backdrop-filter: blur(18px);
}

.sc-overlay-page__head-main {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
}

.sc-overlay-page__back,
.sc-overlay-page__close {
  appearance: none;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.sc-overlay-page__back {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 18px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff4e7;
  font-size: 14px;
  font-weight: 600;
}

.sc-overlay-page__back:hover,
.sc-overlay-page__close:hover {
  transform: translateY(-1px);
}

.sc-overlay-page__back-icon {
  width: 10px;
  height: 10px;
  border-left: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
  margin-left: 4px;
}

.sc-overlay-page__title-group {
  min-width: 0;
}

.sc-overlay-page__eyebrow {
  margin: 0 0 6px;
  color: rgba(255, 208, 157, 0.7);
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.sc-overlay-page__title {
  margin: 0;
  color: #fff8ef;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}

.sc-overlay-page__subtitle {
  margin: 6px 0 0;
  color: rgba(255, 234, 214, 0.72);
  font-size: 13px;
  line-height: 1.5;
}

.sc-overlay-page__actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.sc-overlay-page__close {
  min-height: 42px;
  padding: 0 18px;
  background: rgba(255, 221, 190, 0.14);
  color: #fff1df;
  font-size: 13px;
  font-weight: 600;
}

.sc-overlay-page__body {
  min-height: 0;
  overflow: auto;
  padding: 24px 28px calc(28px + env(safe-area-inset-bottom, 0px));
}

.sc-overlay-page--tech .sc-overlay-page__surface {
  background:
    radial-gradient(circle at top right, rgba(96, 163, 255, 0.16), transparent 24%),
    linear-gradient(180deg, rgba(7, 18, 40, 0.98), rgba(4, 10, 23, 0.99));
}

.sc-overlay-page--music .sc-overlay-page__surface {
  background:
    radial-gradient(circle at top right, rgba(255, 205, 116, 0.18), transparent 28%),
    radial-gradient(circle at left 24%, rgba(255, 110, 70, 0.16), transparent 24%),
    linear-gradient(180deg, rgba(50, 21, 20, 0.985), rgba(20, 10, 10, 0.995));
}

.sc-overlay-page-enter-active,
.sc-overlay-page-leave-active {
  transition:
    opacity 0.28s ease,
    transform 0.28s ease;
}

.sc-overlay-page-enter-from,
.sc-overlay-page-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.sc-overlay-page-enter-to,
.sc-overlay-page-leave-from {
  opacity: 1;
  transform: translateX(0);
}

@media (max-width: 768px) {
  .sc-overlay-page__header {
    padding:
      calc(14px + env(safe-area-inset-top, 0px))
      16px
      14px;
    gap: 14px;
  }

  .sc-overlay-page__head-main {
    align-items: flex-start;
    gap: 12px;
  }

  .sc-overlay-page__title {
    font-size: 20px;
  }

  .sc-overlay-page__body {
    padding: 18px 16px calc(22px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
