<template>
	<el-container>
		<el-container>
			<el-main class="nopadding">
				<el-container>
					<el-header>
						<div class="left-panel">
							<el-date-picker v-model="date" type="datetimerange" range-separator="至" start-placeholder="开始日期"
								end-placeholder="结束日期"></el-date-picker>
						</div>
						<div class="right-panel">
							<div class="right-panel-search">
								<el-input v-model="keyword" placeholder="关键词" clearable></el-input>
								<el-button type="primary" icon="el-icon-search" @click="upsearch"></el-button>
								<el-button type="primary" icon="el-icon-plus" @click="addLibrary"></el-button>
							</div>
						</div>
					</el-header>
					<el-main class="nopadding">
						<scTable ref="table" :params="param" :apiObj="apiObj" stripe highlightCurrentRow>
							<el-table-column label="序号" type="index" ></el-table-column>
							<el-table-column label="编码" prop="code" width="150"></el-table-column>
							<el-table-column v-if="base.libType === 'FACE'" label="姓名" prop="name" width="150"> </el-table-column>
							<el-table-column v-if="base.libType === 'FACE'" label="人脸可信度" prop="score" width="150"></el-table-column>
							<el-table-column label="关键词" prop="keyword" width="400" show-overflow-tooltip></el-table-column>
							<el-table-column label="创建时间" prop="createTime" show-overflow-tooltip></el-table-column>
							<el-table-column label="最后一次更新时间" prop="updateTime" show-overflow-tooltip></el-table-column>
						</scTable>
					</el-main>
				</el-container>
			</el-main>
		</el-container>
	</el-container>
	<upload v-if="dialog.save" ref="saveDialog" @success="handlerSuccess" :close-on-click-modal="false" @closed="dialog.save = false"></upload>
</template>
<script>
import upload from './upload.vue'
export default {
	name: 'FaceReLibrary',
	components: {
		upload
	},
	data() {
		return {
			param: {
				indexName: undefined,
			},
			keyword: undefined,
			date: undefined,
			base: {
				indexName: undefined,
				libType: undefined,
			},
			apiObj: undefined,
			search: {},
			dialog: {
				save: false
			}
		}
	},
	watch:{
		'base.indexName': {
			handler(ov, nv) {
				this.param.indexName = nv || ov;
			},
			immediate: !0,
			deep: !0,
		}
	},
	mounted() {
		this.base.indexName = this.$route.params.indexName;
		this.base.libType = this.$route.params.libType;
		this.apiObj = this.$API.learning.reg[this.base.libType]?.page
	},
	methods: {
		handlerSuccess() {
			this.$refs.table.refresh();
		},
		/**查询人脸库信息 */
		upsearch() {
			const param = {
				indexName: this.base.indexName
			};
			if(this.keyword) {
				param.keyword = "keyword:*"+ this.keyword +"*"
			}

			if(this.date) {
				if(this.param.keyword) {
					param.keyword = "OR createTime: ["+ this.$TOOL.dateFormat(this.date[0]) +" TO "+ this.$TOOL.dateFormat(this.date[1]) +" ]"
				} else {
					param.keyword = "createTime: ["+ this.$TOOL.dateFormat(this.date[0]) +" TO "+ this.$TOOL.dateFormat(this.date[1]) +" ]"
				}
			}

			this.$refs.table.reload(param);
		},
		/**添加库数据 */
		addLibrary() {
			this.dialog.save = true;
			this.$nextTick(() => {
				this.$refs.saveDialog.open('add', this.base)
			})
		}
	}
}
</script>

<style scoped lang="less"></style>