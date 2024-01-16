<template>
	<el-main style="padding:0 20px;">
		<el-page-header :icon="ArrowLeft" @back="onBack">
			<template #content>
				<span class="mr-3"> {{ path }} </span>
			</template>
		</el-page-header>
		<scTable ref="table" :initiSearch="false" :params="data" :apiObj="apiObj" stripe highlightCurrentRow >
			<el-table-column label="级别" prop="level" width="60">
			<template #default="scope">
				<sc-status-indicator pulse type="warning" v-if="scope.row.logCost > 1000" title="耗时超过1s"></sc-status-indicator>
				<el-icon v-else style="color: #409EFF;"><el-icon-info-filled /></el-icon>
			</template>
		</el-table-column> 
		<el-table-column label="ID" prop="name" width="180" show-overflow-tooltip>
			<template #default="scope">
				<div v-if="scope.row.directory" class="cursor-pointer" @click="rowClick(scope.row)">
					<el-icon style="color: orange; margin-left: 10px; padding-top:4px">
						<component is="el-icon-folder"></component>
					</el-icon>
					{{ scope.row.name }}
				</div>
				<div v-else class="cursor-pointer" @click="onCopy(scope.row.id)">
					<el-icon style=" margin-left: 10px; padding-top:4px" >
						<component is="el-icon-tickets"></component>
					</el-icon>
					{{ scope.row.name }}
				</div>
			</template>
		</el-table-column>
		<el-table-column label="类型" prop="logName">
			<template #default="scope">
					<el-tag v-if="scope.row.directory" type="success">
						文件夹
					</el-tag>
					<el-tag v-else type="danger">文件</el-tag>
			</template>
		</el-table-column>
		<el-table-column label="大小" prop="size">	</el-table-column>
		<el-table-column label="lastModified" prop="lastModified">
			<template #default="scope">
				<el-tag v-time="scope.row.lastModified"></el-tag>
			</template>
		</el-table-column>
	</scTable>
	</el-main>
</template>

<script>
import posix from 'path-browserify'
export default {
	data() {
		return {
			data: {},
			activeNames: ['1', '2'],
			typeMap: {
				'info': "info",
				'warn': "warning",
				'error': "error"
			},
			logWatch: undefined,
			logParam: undefined,
			path: '/',
			apiObj: this.$API.system.oss.list
		}
	},
	methods: {
		onBack() {
			this.path = posix.normalize(this.path + "/..");
			this.$refs.table.reload({fsBucket: this.data.fsBucket, path: this.path});
		},
		setData(data) {
			this.data = data;
			this.logParam = data.logParam;
			this.$refs.table.reload({fsBucket: data.fsBucket});
		},
		rowClick(data) {
			this.path = data.id;
			this.$refs.table.reload({fsBucket: this.data.fsBucket, path: this.path});
		},
		onCopy(text) {
			const _this = this
			this.$copyText( this.data.fsDomain + '/v1/file/' + this.data.fsBucket + '/preview/' + text).then(
                function (e) {
                    _this.$message.success("复制成功!");
                },
                function (e) {
                    console.log("copy arguments e:", e);
                }
            );
		},
	}
}
</script>

<style scoped>
.code {
	background: #848484;
	padding: 15px;
	color: #fff;
	font-size: 12px;
	border-radius: 4px;
}
.comment{
    white-space:pre-wrap;
}
</style>
