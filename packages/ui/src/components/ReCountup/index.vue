<template>
  <span ref="elRef" class="re-countup"></span>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";

interface Props {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

const props = withDefaults(defineProps<Props>(), {
  decimals: 0,
  duration: 1500,
  prefix: "",
  suffix: "",
});

const elRef = ref<HTMLElement>();

function animate() {
  const el = elRef.value;
  if (!el) return;
  const start = performance.now();
  const from = 0;
  const to = props.value;

  function tick(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / props.duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = from + (to - from) * eased;
    el.textContent = props.prefix + current.toFixed(props.decimals) + props.suffix;
    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

onMounted(animate);
watch(() => props.value, animate);
</script>
