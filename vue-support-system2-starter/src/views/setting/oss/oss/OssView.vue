<template>
	<el-skeleton :loading="loading" animated>
		<el-container style="height: 100%">
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
					<scTable ref="table" v-if="mode == 1" :data="{ 'data': data || [], 'total': total }"
						:hidePagination="true" :hideRefresh="true" :hideDo="true" :hideSetting="true" stripe
						highlightCurrentRow @row-contextmenu="rightclickOpenTable" @row-click="tableClick"
						:row-class-name="rowClassName">
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

					<div v-if="mode == 0" class="oss-card">
						<el-empty :description="$t('data.nodata')" v-if="!data || data.length === 0"></el-empty>
						<el-row :gutter="8">
							<el-col :span="12" :body-style="{ padding: '0px !important' }" :xl="2" :lg="2" :md="6" :sm="10"
								:xs="24" v-for="item in data" :key="item.id" class="demo-progress">
								<el-card v-if="item.code === 'plus'"  shadow="always"  class="content-card">
									<sc-upload name="files" :apiObj="apiObj" :data="param"  class="upload"   :compress="1" ></sc-upload>
								</el-card>
								<el-card v-if="item.code !== 'plus'" shadow="always" :title="item.name" class="content-card"
									@click.right.native="rightclickOpenTable(item, null)">
									<div class="content">
										<div v-if="!item.file">
											<el-image @click="intoFolder(images.folder, item)" :src="getImg('folder')"
												fit="none" class="image" />
										</div>
										<div v-else>
											<div v-if="item.type === 'image'">
												<el-image @click="showImagesInViewer(prefix + ossBucket + item.id, item)"
													:src="prefix + ossBucket + item.id" fit="cover" class="image image2" />
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
													:src="getImg(item.subtype, item.name)" class="image" fit="none" />
											</div>
										</div>
										<div class="ext">
											<el-tag class="span">{{ item.name }}</el-tag>
										</div>
									</div>
								</el-card>
							</el-col>
						</el-row>
					</div>
				</el-main>
			</el-container>
		</el-container>
	</el-skeleton>
	<!-- 右键菜单 -->
	<right-menu :class-index="0" :rightclickInfo="rightclickInfoOpenTable" @onCopyBase64="onCopyBase64" @onCopy="onCopy"
		@onDelete="deleleObjects" @onDownload="downloadObjects"></right-menu>
	<div>
		<el-dialog :destroy-on-close="true" draggable title="预览" :align-center="true" :append-to-body="true"
			v-model="isView" width="90%" height="90vh" custom-class="view-iframe-dialog">
			<iframe :src="viewSrc" class="view-iframe"></iframe>
		</el-dialog>
	</div>
</template>
<script>
import config from "@/config"
import { api as viewerApi } from "v-viewer"
import { openView } from '@/views/setting/oss/subview/view'
import RightMenu from "@/components/menu/RightMenu.vue";
import { ElMessageBox, ElNotification } from "element-plus";

import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';
export default {
	name: "OssView",
	components: {
		RightMenu
	},
	props: {
		ossBucket: { type: String, default: '' },
		ossId: { type: String, default: '' },
		datas: { type: Object, default: () => { } },
	},
	data() {
		return {
			dialog: {
				view: false
			},
			prefix: this.$API.common.ossPrefix.url,
			mode: 0,
			loading: false,
			total: 0,
			data: [],
			apiObj: this.$API.system.oss.upload,
			param: {},
			form: {
				size: 20
			},
			rightclickInfoOpenTable: {},
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
		this.param.ossBucket = this.ossBucket;
		this.param.ossId = this.ossId;
	},
	methods: {
		// 行的样式控制方法，通过这个回调方法控制隐藏显示
		rowClassName: function ({ row }) {
			if (row.code === 'plus') {
				return "hidden-row";
			}
			return '';
		},
		tableClick(row, column, event) {
			if (!row.file) {
				this.intoFolder(row, row);
				return false;
			}

			this.showImagesInViewer(this.prefix + this.ossBucket + row.id, row);
			return false;
		},
		downloadObjects: function (row) {
			window.open(this.prefix + this.ossBucket + row.row.id + '?mode=DOWNLOAD', '_blank');
		},
		onCopyBase64(row, col, event) {
			this.$copyText(this.$TOOL.crypto.BASE64.encrypt(window.location.origin + this.prefix + this.ossBucket + row.row.id)).then(
				e => {
					this.$notify.success({
						title: '消息提示',
						message: '复制成功',
						position: 'top-right',
					});
				},
				e => {
					this.$notify.error({
						title: '消息提示',
						message: '复制失败',
						position: 'top-right',
					});
				}
			)
		},
		onCopy(row, col, event) {
			this.$copyText(window.location.origin + this.prefix + this.ossBucket + row.row.id).then(
				e => {
					this.$notify.success({
						title: '消息提示',
						message: '复制成功',
						position: 'top-right',
					});
				},
				e => {
					this.$notify.error({
						title: '消息提示',
						message: '复制失败',
						position: 'top-right',
					});
				}
			)
		},
		deleleObjects: function (row) {
			ElMessageBox.confirm(
				'确定要删除 ' + row.row.name + ' ?',
				'Warning', {
				confirmButtonText: '确认',
				cancelButtonText: '取消',
				type: 'warning',
			}
			).then(() => {
				this.$API.system.oss.deleleObject.get({
					ossId: this.ossId,
					ossBucket: this.ossBucket,
					id: row.row.id,
					name: row.row.name
				}).then((res) => {
					if (res.code === '00000') {
						this.$emit('handleDelete');
						return !1;
					}
					ElNotification({
						title: '消息提示',
						type: res.code === '00000' ? 'success' : 'error',
						message: res.msg,

					});
				});
			}).catch((e) => {
				ElNotification({
					title: '消息提示',
					type: 'error',
					message: "操作失败",

				});
			})
		},
		//右键
		rightclickOpenTable(row, column, event = window.event) {
			this.rightclickInfoOpenTable = {
				position: {
					x: event.clientX,
					y: event.clientY,
				},
				menulists: [
					{
						fnName: "onCopy",
						params: { row, column, event },
						icoName: "menu-icon icon-table-multiple",
						btnName: "复制地址",
					},

					{
						fnName: "onCopyBase64",
						params: { row, column, event },
						icoName: "menu-icon icon-table-multiple",
						btnName: "复制Base64",
					},
					{
						fnName: "onDownload",
						params: { row, column, event },
						icoName: "menu-icon icon-table-multiple",
						btnName: "下載",
					},
					{
						fnName: "onDelete",
						params: { row, column, event },
						icoName: "menu-icon icon-table-multiple",
						btnName: "刪除",
					},
				],
			};
			event.preventDefault(); // 阻止默认的鼠标右击事件
		},
		//进入文件夹
		intoFolder: function (data, row) {
			const param1 = {};
			param1.ossId = this.ossId;
			param1.ossBucket = this.ossBucket;
			param1.fromPath = row.name;
			param1.path = row.path;
			param1.name = row.id;
			this.$emit('infoFolder', param1)
		},
		//获取封面图片
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
			if (this.viewSrc) {
				this.isView = !this.isView;
			}

		},
	},

}
</script>
<style lang="less">
.content-card .el-card__body {
	padding: 0;
}

.view-iframe-dialog {
	.el-dialog__body {
		padding: 0;
	}
}
</style>
<style scoped lang="less">
:deep(.el-table .hidden-row) {
	display: none;
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

:deep(.el-table__row) {
	cursor: pointer;
}

:deep(.oss-card img) {
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
	min-height: 154px;
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
	width: 80%;
	height: 100vh;
}

.view-iframe-dialog .el-dialog__header {
	padding: 0 !important;
}

.el-dialog__body,
.view-iframe-dialog .el-dialog__body {
	width: 90%;
	padding: 0 !important;
	height: calc(100vh - 70px);

}

.content {
	position: relative;
}

.content>.ext {
	width: 80%;
	display: block;
	border-radius: 1px;
	position: absolute;
	top: 0px;
	right: 0px;
}

.content>.ext .span {
	cursor: default;
	position: absolute;
	top: 0px;
	right: 0px;
}
</style>
