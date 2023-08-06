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
								<el-select v-model="searchType" width="20" @change="imageSearch">
									<el-option :value="0" label="关键词"></el-option>
									<el-option :value="1" label="以图搜图"></el-option>
								</el-select>
								<el-input v-if="searchType == '0'" v-model="keyword" placeholder="关键词" clearable></el-input>
								<el-button type="primary" icon="el-icon-search" @click="upsearch"></el-button>
								<el-button  v-if="searchType == '0'" type="primary" icon="el-icon-plus" @click="addLibrary"></el-button>
							</div>
						</div>
					</el-header>
					<el-main class="nopadding">
						<scTable v-if="searchType == 0" ref="table" :params="param" :apiObj="apiObj" stripe
							highlightCurrentRow @row-click="rowClick">
							<el-table-column label="序号" type="index"></el-table-column>
							<el-table-column label="编码" prop="code" width="150"></el-table-column>
							<el-table-column v-if="base.libType === 'FACE'" label="姓名" prop="name" width="150">
							</el-table-column>
							<el-table-column v-if="base.libType === 'FACE'" label="人脸可信度" prop="score"
								width="150"></el-table-column>
							<el-table-column label="关键词" prop="keyword" width="400" show-overflow-tooltip></el-table-column>
							<el-table-column label="创建时间" prop="createTime" show-overflow-tooltip></el-table-column>
							<el-table-column label="最后一次更新时间" prop="updateTime" show-overflow-tooltip></el-table-column>
							<el-table-column label="操作" fixed="right" align="right" width="100">
								<template #default="scope">
									<el-button-group>
										<el-popconfirm   title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
											<template #reference>
												<el-button  v-auth="'sys:user:del'" text type="primary" size="small">删除</el-button>
											</template>
										</el-popconfirm>
									</el-button-group>
								</template>
							</el-table-column>
						</scTable>
						<div v-if="searchType == 1">
							<el-empty v-if="(!imageData || imageData.length == 0) && !imageDataLoading"
								style="height: 100%;"></el-empty>
							<el-row v-else :gutter="15">
								<el-skeleton :loading="imageDataLoading" animated></el-skeleton>
								<el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24" v-for="item in imageData" :key="item.code"
									class="demo-progress">
									<el-card class="task task-item" shadow="hover">
										<el-row>
											<el-col :span="8">
												<ul>
													<li>
														<h4>图片编号(唯一)</h4>
														<p>{{ item.code }}</p>
													</li>
													<li>
														<h4>创建时间</h4>
														<p>{{ item.createTime }} </p>
													</li>
													<li>
														<h4>相似度</h4>
														<p>
															<el-progress style="width: 60px; height: 60px" :stroke-width="10" :striped="true" :striped-flow="true"
																:indeterminate="true" :color="customColor" type="circle"
																:percentage="Math.min((item.similarities * 100).toFixed(2), 100)">
															</el-progress>
														</p>
													</li>
												</ul>
											</el-col>
											<el-col :span="16" class="progress">
												<div>
													<el-image v-if="item.url" :src="item.url" class="view">
														<div slot="error" class='image-slot'>
															<el-image :lazy="true" fit="cover" src="src/images/404.webp">
															</el-image>
														</div>
														<div slot="placeholder" class='image-slot'>
															<i class="el-icon-picture-outline" ></i>
														</div>
													</el-image>
													<el-image v-else src="src/assets/images/404.webp" class="view">
													</el-image>
												</div>
											</el-col>
										</el-row>
									</el-card>
								</el-col>

							</el-row>
						</div>
					</el-main>
					<el-footer v-if="searchType == 1" style="height: 51px; line-height: 50px; padding:0">
						<scPagintion :pageSize="imageSearchSize" :total="imageDataTotal" @dataChange="doSearch">
						</scPagintion>
					</el-footer>
				</el-container>
			</el-main>
		</el-container>
	</el-container>
	<upload v-if="dialog.save" ref="saveDialog" @success="handlerSuccess" :close-on-click-modal="false"
		@closed="dialog.save = false"></upload>
	<image-search v-if="dialog.imageSearch" ref="saveImageDialog" @closed="closed" @success="handlerImageSuccess"
		:close-on-click-modal="true"></image-search>

		<el-dialog draggable title="预览" v-model="dialog.show"  @closed="dialog.show = false">
			<div style="display: flex;  justify-content: center; align-items: center;">
				<canvas  :width="width" :height="height" class="container"></canvas>

			</div>
		</el-dialog>
</template>
<script>
import CanvasSelect from 'canvas-select'

import upload from './upload.vue'
import imageSearch from './imageSearch.vue'
export default {
	name: 'FaceReLibrary',
	components: {
		upload, imageSearch, CanvasSelect
	},
	data() {
		return {
			width:  300,
			dwidth:  300,
            height:  300,
			canvasSelect: null,
			customColor: [
				{ color: '#f56c6c', percentage: 20 },
				{ color: '#e6a23c', percentage: 40 },
				{ color: '#5cb87a', percentage: 60 },
				{ color: '#1989fa', percentage: 80 },
				{ color: '#6f7ad3', percentage: 100 },
			],
			imageDataLoading: false,
			param: {
				indexName: undefined,
			},
			searchType: 0,
			keyword: undefined,
			date: undefined,
			imageData: [],
			imageSearchParams: {},
			base: {
				indexName: undefined,
				libType: undefined,
			},
			imageSearchSize: 10,
			apiObj: undefined,
			search: {},
			dialog: {
				show: false,
				save: false,
				imageSearch: false,
			}
		}
	},
	watch: {
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
		rowClick(row) {
			if(!row.url) {
				return !1;
			}
			const _this = this;
			this.dialog.show = true;
			var img = new Image();
            img.onload = function(){    
                _this.width = img.naturalWidth;
                _this.dwidth = img.naturalWidth + 40;
                _this.height = img.naturalHeight;
				_this.$nextTick(() => {
					 _this.load(row.url, row.box)
				})
            }   
            img.src= row.url;    
		},
		load: function (url, box) {
            this.canvasSelect = new CanvasSelect('.container');
            this.canvasSelect.setImage(url);
            this.canvasSelect.labelMaxLen = 255;
            this.container = 'container-shadow container-animation'
			 this.marker(box)
        },
		marker: function (box) {
            const option = [];
            const width = this.width;
            const height = this.height;
			box = JSON.parse(box);

			const coor1 = [];
			const color = this.getRandomColor();
			const it = box.corners[0];
			if(it.x * width > this.width || it.y * height > this.height) {
				for(const it of box.corners) {
					coor1.push([it.x, it.y]);
				}
				option.push({
					strokeStyle: color,
					activeFillStyle: color,
					activeStrokeStyle: color,
					labelFillStyle: color,
					textFillStyle: "#fff",
					label: '特征值',
					coor: coor1, // required
					type: 2 // required
				})
			} else {
				coor1.push([it.x * width + box.width * width, it.y * height + box.height * height]);
				coor1.push([it.x * width, it.y * height]);
				option.push({
					strokeStyle: color,
					activeFillStyle: color,
					activeStrokeStyle: color,
					labelFillStyle: color,
					textFillStyle: "#fff",
					label: '特征值',
					coor: coor1, // required
					type: 1 // required
				})
			}
				
            this.canvasSelect.setData(option);
        },
		getRandomColor() {
            const rgb = []
            for (let i = 0 ; i < 3; ++i){
                let color = Math.floor(Math.random() * 256).toString(16)
                color = color.length == 1 ? '0' + color : color
                rgb.push(color)
            }
            return '#' + rgb.join('')
        },
		closed() {
			this.dialog.imageSearch = false
		},
		/**以图搜图 */
		imageSearch() {
			if (this.searchType != 1) {
				return !1;
			}
			this.dialog.imageSearch = true;
			this.$nextTick(() => {
				this.$refs.saveImageDialog.open('add', this.base)
			})
		},
		handlerImageSuccess(param) {
			this.apiObj = this.$API.learning.reg[this.base.libType]?.image
			param.set("pageSize", this.imageSearchSize);
			this.imageSearchParams = param;
			this.doSearch();
		},
		table_del(row) {
			const apiObj = this.$API.learning.reg[this.base.libType]?.delete;
			apiObj?.get({
				indexName: this.base.indexName,
				code: row.code
			}).then(res => {
				if(res.code === '00000') {
					this.$notify.success({
						title: '提示',
						message: '删除成功'
					})
					this.doSearch();
					return !1;
				}
				this.$notify.error({
					title: '提示',
					message: res.msg
				})
			})
		},
		doSearch() {
			if (!this.imageSearchParams.get('files')) {
				this.$message.error("请上传图片!")
				return !1;
			}
			this.imageDataLoading = true;
			this.imageData.length = 0;
			this.apiObj.get(this.imageSearchParams).then(res => {
				if (res.code === '00000') {
					this.imageData = res.data.data;
					this.imageDataTotal = res.data.total;
					return !1;
				}
			}).finally(() => this.imageDataLoading = false)
		},
		handlerSuccess() {
			this.searchType = 0;
		},
		/**查询人脸库信息 */
		upsearch() {
			if (this.searchType == 1) {
				this.imageSearch();
				return !1;
			}

			const param = {
				indexName: this.base.indexName
			};
			if (this.keyword) {
				param.keyword = "keyword:*" + this.keyword + "*"
			}

			if (this.date) {
				if (this.param.keyword) {
					param.keyword = "OR createTime: [" + this.$TOOL.dateFormat(this.date[0]) + " TO " + this.$TOOL.dateFormat(this.date[1]) + " ]"
				} else {
					param.keyword = "createTime: [" + this.$TOOL.dateFormat(this.date[0]) + " TO " + this.$TOOL.dateFormat(this.date[1]) + " ]"
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

<style scoped lang="less">
:deep(.el-progress-circle) {
	height: 100% !important;
	width: 100% !important;
}
.nopadding {
	overflow-x: hidden;
}

.task {
	height: 210px;
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

.demo-progress .el-progress--circle {
	margin-right: 15px;
}
.view {
	height: 206px !important;
	width: 100%;
}
.progress {
	margin-top: -20px;
}
</style>