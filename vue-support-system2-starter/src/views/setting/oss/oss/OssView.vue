<template>
	<el-skeleton :loading="loading" animated>
		<el-container style="height: 100%">
			<el-main class="nopadding">
				<el-container>
					<el-header>
						<div class="right-panel">
							<div class="right-panel-search">
								<el-select v-model="mode" clearable>
									<el-option :value="1" label="列表"></el-option>
									<el-option :value="0" label="卡片"></el-option>
								</el-select>
							</div>
						</div>
					</el-header>
					<el-main class="nopadding">
						<scTable ref="table" v-if="mode == 1" :data="{ 'data': data, 'total': total }"
							:hidePagination="true" :hideRefresh="true" :hideDo="true" :hideSetting="true" stripe
							highlightCurrentRow>
							<el-table-column prop="name" label="名称">
								<template #default="scope">
									<span v-if="scope.row.file === false">
										<img :src="images.folder" width="16" height="16" />
									</span>
									<span v-else>
										<span v-if="scope.row.type === 'image'">
											<img :src="images.image" width="16" height="16" />
										</span>
										<span v-else-if="scope.row.type === 'video'">
											<img :src="images.video" width="16" height="16" />
										</span>
										<span v-else>
											<img :src="getImg(scope.row.subtype, scope.row.name)" width="16" height="16" />
										</span>
									</span>
									{{ scope.row.name }}
								</template>
							</el-table-column>
							<el-table-column prop="file" label="文件类型">
								<template #default="scope">
									<el-tag>{{ !scope.row.file ? "文件夹" : "文件" }}</el-tag>
								</template>
							</el-table-column>
							<el-table-column prop="lastModified" label="最后一次修改时间"></el-table-column>
						</scTable>


						<el-row v-if="mode == 0" :gutter="0">
							<el-col :span="24" :body-style="{ padding: '0px !important' }" :xl="2" :lg="2" :md="6" :sm="10"
								:xs="24" v-for="item in data" :key="item.id" class="demo-progress">
								<el-card shadow="always">
									<div v-if="!item.file">
										<el-image @click="intoFolder(images.folder, item)" :src="getImg('folder')"
											fit="cover" class="image" />
									</div>
									<div v-else>
										<div v-if="item.type === 'image'">
											<el-image @click="showImagesInViewer(prefix + ossBucket + item.id, item)"
												:src="prefix + ossBucket + item.id" fit="cover" class="image" />
										</div>

										<div v-else-if="item.type === 'video'">
											<video class="video-player vjs-custom-skin" ref="videoPlayer"
												:src="prefix + ossBucket + item.id" controls :loop="true" :volume="0.6"
												:playsinline="true">
												<source src="movie.ogg" type="video/ogg">
												<source src="movie.mp4" type="video/mp4">
												您的浏览器不支持此种视频格式。
											</video>
										</div>

										<div v-else>
											<el-image @click="showImagesInViewer(images[item.subtype], item)"
												:src="getImg(item.subtype, item.name)" class="image" />
										</div>
									</div>
								</el-card>
							</el-col>
						</el-row>
					</el-main>
				</el-container>
			</el-main>
		</el-container>

	</el-skeleton>

	<el-dialog :destroy-on-close="true"	draggable title="预览" :align-center="true" :append-to-body="true" v-model="isView" width="90%" height="90vh"
		custom-class="view-iframe-dialog">
		<iframe :src="viewSrc" class="view-iframe"></iframe>
	</el-dialog>
</template>
<script>
import config from "@/config"
import { api as viewerApi } from "v-viewer"
import { openView } from '@/views/setting/oss/subview/view'

import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';
export default {
	name: "OssView",
	props: {
		ossBucket: { type: String, default: '' },
		datas: { type: Object, default: () => { } },
	},
	data() {
		return {
			prefix: this.$API.common.ossPrefix.url,
			mode: 0,
			loading: false,
			total: 0,
			data: [],
			form: {
				size: 20
			},
			images: {
				folder: getAssetsImages('folder.png'),
				video: getAssetsImages('video.png'),
				image: getAssetsImages('image.png')
			},
			isView: false,
		}
	},
	watch: {
		datas: {
			handler(nv, ov) {
				if (nv) {
					this.total = nv.total;
					this.data = nv.data;
				}
			},
			immediate: true,
			deep: true
		}
	},
	mounted() {
	},
	methods: {
		getImg: function (data, name) {
			if (!!name && name.lastIndexOf(".") > -1) {
				const suffix = name.substr(name.lastIndexOf(".") + 1);
				const fileIcon = getAssetsImages(data + "." + suffix);
				if (fileIcon && !fileIcon.endsWith('undefined')) {
					return fileIcon;
				}
			}
			const fileIcon = getAssetsImages(data + ".png");
			return (fileIcon && !fileIcon.endsWith('undefined')) ? fileIcon : getAssetsImages("unknown.png");
		},
		showImagesInViewer: function (url, row) {
			if (row.type === 'image') {
				const imgs = [url];
				for (const item of this.data) {
					if (item.id === row.id) {
						continue;
					}

					if (item.type === 'image') {
						imgs.push(this.prefix + this.ossBucket + item.id)
					}
				}
				viewerApi({ images: imgs })
				return false;
			}
			
			this.viewSrc = openView(row, this)
			if(this.viewSrc) {
				this.isView = !this.isView;
			}

		},
	},

}
</script>

<style scoped lang="less">
.task {
	height: 210px;
}

/deep/ .el-card__body {
	padding: 0 !important;
}

.task-item h2 {
	font-size: 15px;
	color: #3c4a54;
	padding-bottom: 15px;
}

.task-item li {
	list-style-type: none;
	margin-bottom: 10px;
}

.task-item li h4 {
	font-size: 12px;
	font-weight: normal;
	color: #999;
}

.task-item li p {
	margin-top: 5px;
}

.task-item .bottom {
	border-top: 1px solid #EBEEF5;
	text-align: right;
	padding-top: 10px;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.task-add {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	cursor: pointer;
	color: #999;
}

.task-add:hover {
	color: #409EFF;
}

.task-add i {
	font-size: 30px;
}

.task-add p {
	font-size: 12px;
	margin-top: 20px;
}

.dark .task-item .bottom {
	border-color: var(--el-border-color-light);
}

.percentage-value {
	display: block;
	margin-top: 10px;
	font-size: 18px;
}

.percentage-label {
	display: block;
	margin-top: 10px;
	font-size: 12px;
}

.demo-progress .el-progress--line {
	margin-bottom: 15px;
	width: 350px;
}

.demo-progress .el-progress--circle {}

.time {
	font-size: 12px;
	color: #999;
}

.bottom {
	margin-top: 13px;
	line-height: 12px;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.button {
	padding: 0;
	min-height: auto;
}

/deep/ .demo-progress img {
	width: 100%;
	height: 100%;
	position: absolute;
	top: 0;
	left: 0;
	display: block;
}

.image {
	position: relative;
	width: 100%;
	height: 100%;
	min-height: 174px;
	display: block;
}

.image:hover {
	cursor: pointer
}
.view-iframe {
	width: 100%;
	height: 80vh;
}
.view-iframe-dialog {
	width: 90%;
	height: 100vh;
}
.view-iframe-dialog .el-dialog__header{
	padding: 0 !important;
}
.el-dialog__body,
 .view-iframe-dialog .el-dialog__body {
	width: 90%;
	padding: 0 !important;
	height: calc(100vh - 70px);

}
</style>
