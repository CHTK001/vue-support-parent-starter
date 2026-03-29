<script setup lang="ts">
import { onHide, onLaunch, onShow } from "@dcloudio/uni-app";

onLaunch(() => {
  console.info("[uni-mall] app launch");
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
