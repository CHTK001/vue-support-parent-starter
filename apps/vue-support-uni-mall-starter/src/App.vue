<script setup lang="ts">
import { onHide, onLaunch, onShow } from "@dcloudio/uni-app";
import { IS_MOCK } from "@/api/mock";

onLaunch(() => {
  console.info("[uni-mall] app launch");
  console.info(`[uni-mall] data mode: ${IS_MOCK ? "mock" : "live"}`);
});

onShow(() => {
  console.info("[uni-mall] app show");
});

onHide(() => {
  console.info("[uni-mall] app hide");
});
</script>

<style lang="scss">
@import "./uni.scss";
</style>
