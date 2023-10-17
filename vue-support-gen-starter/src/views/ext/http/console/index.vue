<template>
	<el-container>
		<el-header>
			<el-header>
				<el-input />
			</el-header>
		</el-header>
		<drag-layout id="level-drag-bar" direct="level-drag-bar"></drag-layout>
		<el-main class="nopadding">
			<el-result icon="info" title="Tip" sub-title="可根据 <el-container> <el-header> <el-aside> <el-main> <el-footer> 灵活运用达到各种布局"></el-result>
		</el-main>
		<el-footer>Footer</el-footer>
	</el-container>
</template>
<script>
import DragLayout from "@/components/drag/DragLayout.vue";

export default {
	components: { DragLayout },
	data() {
		return {
			form: {}
		}
	},
	mounted() {
		this.form.genId = this.$route.params.genId;
		if (!this.form.genId || this.form.genId === 'null') {
			delete this.form.genId;
		}
		this.initialBackupConfig();
	},
	methods: {
		initialBackupConfig() {

		}
	}

}
</script>