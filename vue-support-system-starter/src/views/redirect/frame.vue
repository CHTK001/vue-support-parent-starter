<template>
	<div id="iframe-container"  style="height: calc(100vh - 90px)">
		<iframe :src="iframeSrc" class="trend-container2"  scrolling="auto" frameborder="0" style="height: 100%" id="iframe"></iframe>
	</div>
</template>

<script lang="ts" setup>
// 进度条的使用需要安装NProgress,并在main.js注册一哈
import NProgress from 'nprogress'
import {useRoute, useRouter} from "vue-router";
import {onMounted} from 'vue';

NProgress.start()
const route = useRoute();
const router = useRouter();

const iframeSrc = ref('');
//@ts-ignore
onMounted(() => {
	let iframe: any = document.getElementById('iframe')
	//@ts-ignore
	iframeSrc.value = (route.meta || {}).params.src;
	iframe.onload = function () {
		NProgress.done()
	}
	const h = document.getElementsByClassName('app-main')[0].clientHeight;
	//@ts-ignore
	document.getElementById('iframe').style.height = h;
	//@ts-ignore
	document.getElementById('iframe-container').style.height = 	h;
})

</script>

<style scoped>
.trend-container2 {
  position: relative;
  width: 100%;
  min-height: 800px;
  padding-bottom: 16px;
}
</style>

