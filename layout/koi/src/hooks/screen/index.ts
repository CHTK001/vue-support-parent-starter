import { ref, computed, onMounted, onUnmounted } from "vue";

const screenWidth = ref(window.innerWidth);
const screenHeight = ref(window.innerHeight);

function update() {
  screenWidth.value = window.innerWidth;
  screenHeight.value = window.innerHeight;
}

let cleanup: (() => void) | null = null;

export function useScreenStore() {
  if (!cleanup) {
    onMounted(() => window.addEventListener("resize", update));
    onUnmounted(() => window.removeEventListener("resize", update));
    cleanup = () => window.removeEventListener("resize", update);
  }

  const isMobile = computed(() => screenWidth.value < 768);
  const isTablet = computed(() => screenWidth.value >= 768 && screenWidth.value < 1024);
  const isDesktop = computed(() => screenWidth.value >= 1024);

  return { screenWidth, screenHeight, isMobile, isTablet, isDesktop };
}
