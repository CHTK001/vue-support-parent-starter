<template>
	<el-container style="overflow: hidden;">
		<el-main class="nopadding">
            <div class="code-toolbar">
				<el-button plain text icon="el-icon-refresh" @click="doRefresh">刷新</el-button>
				<el-button plain text icon="sc-icon-indices" @click="doIndices">索引列表</el-button>
				<el-button plain text icon="el-icon-search" @click="doMapping">数据搜索</el-button>
			</div>
			<el-row :gutter="12" style="margin: 4px;">
                <el-col :lg="4" :sm="4" :md="4" :xs="4" >
                    <el-card shadow="hover">
                        <div v-if="loadStatus">
                            <el-skeleton :load="loadStatus"></el-skeleton>
                        </div>
                        <el-statistic v-else title="名称" :value="(info?.cluster_name || '无') + '(ver.' + (stats?.nodes?.versions || '   ')+ ')'" >
                            <template #title>
                                <div style="display: inline-flex; align-items: center; padding-right: 10px">
                                    名称
                                </div>
                                <sc-status-indicator pulse type="success" v-if="info?.status == 'green'"></sc-status-indicator>
                                <sc-status-indicator pulse type="warning" v-else-if="info?.status == 'yellow'"></sc-status-indicator>
                                <sc-status-indicator pulse type="info" v-else></sc-status-indicator>
                            </template>
                        </el-statistic>
                    </el-card>
                </el-col>
              
                <el-col :lg="4" :sm="4" :md="4" :xs="4">
                    <el-card shadow="hover">
                        <el-statistic title="运行时长" :value="$TOOL.date.transferTime((stats?.nodes?.jvm?.max_uptime_in_millis || 0) , 'duration')" >
                        </el-statistic>
                    </el-card>
                </el-col>
               
                <el-col :lg="4" :sm="4" :md="4" :xs="4">
                    <el-card shadow="hover">
                        <el-statistic title="索引数量" :value="(indexResultData || []).length" />
                    </el-card>
                </el-col>

                <el-col :lg="4" :sm="4" :md="4" :xs="4">
                    <el-card shadow="hover">
                        <el-statistic title="文档数量" :value="countInfo?.count || 0" />
                    </el-card>
                </el-col>

                <el-col :lg="4" :sm="4" :md="4" :xs="4">
                    <el-card shadow="hover">
                        <el-statistic title="数据节点数量" :value="info?.number_of_data_nodes || 0" />
                    </el-card>
                </el-col>
                <el-col :lg="4" :sm="4" :md="4" :xs="4">
                    <el-card shadow="hover">
                        <el-statistic title="节点数量" :value="info?.number_of_nodes || 0" />
                    </el-card>
                </el-col>
            </el-row>
			<el-row :gutter="12" style="margin: 4px;">
                <el-col :lg="4" :sm="4" :md="4" :xs="4" >
                    <scEcharts height="200px" :option="{
                        label: {
                            alignTo: 'edge',
                            formatter: p => {
                                return 'Mem\r\n' + change((stats?.nodes?.os?.mem?.free_in_bytes || 0))
                            },
                            minMargin: 5,
                            edgeDistance: 10,
                            lineHeight: 15,
                            rich: {
                            time: {
                                fontSize: 10,
                                color: '#999'
                            }
                            }
                        },
                        series: [
                            {
                            type: 'gauge',
                            type: 'pie',
                            radius: ['80%', '60%'],
                            label: {
                                show: true,
                                position: 'center'
                            },
                            data: [
                                {value: stats?.nodes?.os?.mem?.used_in_bytes || 0, name: '已使用'},
                                {value: (stats?.nodes?.os?.mem?.free_in_bytes || 0), name: ''},
                            ]
                        }
                    ]
                    }"></scEcharts>
                </el-col>
                <el-col :lg="4" :sm="4" :md="4" :xs="4" >
                    <scEcharts height="200px" :option="{
                        label: {
                            alignTo: 'edge',
                            formatter: p => {
                                return 'Jvm\r\n' + change((stats?.nodes?.jvm?.mem?.heap_max_in_bytes || 0)  - (stats?.nodes?.jvm?.mem?.heap_used_in_bytes || 0))
                            },
                            minMargin: 5,
                            edgeDistance: 10,
                            lineHeight: 15,
                            rich: {
                            time: {
                                fontSize: 10,
                                color: '#999'
                            }
                            }
                        },
                        series: [
                            {
                            type: 'gauge',
                            type: 'pie',
                            radius: ['80%', '60%'],
                            label: {
                                show: true,
                                position: 'center'
                            },
                            data: [
                                {value: stats?.nodes?.jvm?.mem?.heap_used_in_bytes || 0, name: '已使用'},
                                {value: (stats?.nodes?.jvm?.mem?.heap_max_in_bytes || 0) - (stats?.nodes?.jvm?.mem?.heap_used_in_bytes || 0), name: ''},
                            ]
                        }
                    ]
                    }"></scEcharts>
                </el-col>
                <el-col :lg="4" :sm="4" :md="4" :xs="4" >
                    <scEcharts height="200px" :option="{
                        label: {
                            alignTo: 'edge',
                            formatter: p => {
                                return 'Fs\r\n' + change((stats?.nodes?.fs?.free_in_bytes || 0))
                            },
                            minMargin: 5,
                            edgeDistance: 10,
                            lineHeight: 15,
                            rich: {
                            time: {
                                fontSize: 10,
                                color: '#999'
                            }
                            }
                        },
                        series: [
                            {
                            type: 'gauge',
                            type: 'pie',
                            radius: ['80%', '60%'],
                            label: {
                                show: true,
                                position: 'center'
                            },
                            data: [
                                {value: stats?.nodes?.jvm?.fs?.free_in_bytes || 0, name: '剩余容量'},
                                {value: (stats?.nodes?.jvm?.fs?.total_in_bytes || 0) - (stats?.nodes?.jvm?.fs?.free_in_bytes || 0), name: '已使用容量'},
                            ]
                        }
                    ]
                    }"></scEcharts>
                </el-col>
                <el-col :lg="4" :sm="4" :md="4" :xs="4" style="position: relative;">
                    <el-progress  :stroke-width="20" :width="160" type="dashboard" :percentage="100 - (stats?.nodes?.process?.cpu?.percent || 0)" style="position: absolute; top: calc(50% - 80px); left: calc(50% - 80px);">
                        <template #default="{ percentage }">
                            <p class="percentage-value">{{ percentage }}%</p>
                            <p class="percentage-label">CPU</p>
                        </template>
                    </el-progress>
                </el-col>
            </el-row>
            <el-divider></el-divider>
            <el-row>
                    <el-row>
                        <el-descriptions title="Cluster Health" direction="vertical" :column="15" :size="size" border >
                            <el-descriptions-item label="es状态">{{info?.status}}</el-descriptions-item>
                            <el-descriptions-item label="集群中的主分片数量">{{info?.active_primary_shards}}</el-descriptions-item>
                            <el-descriptions-item label="集群中所有活跃的分片数">{{info?.active_shards}}</el-descriptions-item>
                            <el-descriptions-item label="集群分片健康度，活跃分片数比例">{{info?.active_shards_percent_as_number}}</el-descriptions-item>
                            <el-descriptions-item label="集群名称">{{info?.cluster_name}}</el-descriptions-item>
                            <el-descriptions-item label="延时待分配到具体节点上的分片数">{{info?.delayed_unassigned_shards}}</el-descriptions-item>
                            <el-descriptions-item label="正在初始化的分片数">{{info?.initializing_shards}}</el-descriptions-item>
                            <el-descriptions-item label="数据节点数">{{info?.number_of_data_nodes}}</el-descriptions-item>
                            <el-descriptions-item label="正在进行的碎片信息请求的数量">{{info?.number_of_in_flight_fetch}}</el-descriptions-item>
                            <el-descriptions-item label="集群节点数">{{info?.number_of_nodes}}</el-descriptions-item>
                            <el-descriptions-item label="待处理的任务数">{{info?.number_of_pending_tasks}}</el-descriptions-item>
                            <el-descriptions-item label="正在迁移的分片数">{{info?.relocating_shards}}</el-descriptions-item>
                            <el-descriptions-item label="任务最大等待数">{{info?.task_max_waiting_in_queue_millis}}</el-descriptions-item>
                            <el-descriptions-item label="是否超时">{{info?.timed_out}}</el-descriptions-item>
                            <el-descriptions-item label="未分配的分片，但在集群中存在">{{info?.unassigned_shards}}</el-descriptions-item>
                        </el-descriptions>
                    </el-row>
                    <el-divider></el-divider>
                    <el-row>
                        <el-descriptions title="ElasticSearch Stats Info" direction="vertical" :column="8" :size="size" border >
                            <el-descriptions-item label="集群名称">{{stats?.cluster_name}}</el-descriptions-item>
                            <el-descriptions-item label="集群uuid">{{stats?.cluster_uuid}}</el-descriptions-item>
                            <el-descriptions-item label="虚拟机版本">{{stats?.nodes?.jvm?.versions[0]['version']}}</el-descriptions-item>
                            <el-descriptions-item label="虚拟机名称">{{stats?.nodes?.jvm?.versions[0]['vm_name']}}</el-descriptions-item>
                            <el-descriptions-item label="操作系统名称">{{stats?.nodes?.os?.names[0]['name']}}</el-descriptions-item>
                            <el-descriptions-item label="虚拟处理器数">{{stats?.nodes?.os?.available_processors}}</el-descriptions-item>
                            <el-descriptions-item label="ES版本">{{stats?.nodes?.versions[0]}}</el-descriptions-item>
                        </el-descriptions>
                    </el-row>
                    <el-divider></el-divider>
                    <el-row>
                        <indices></indices>
                    </el-row>
            </el-row>
		</el-main>

	</el-container>
</template>

<script>
import Indices from '../indices/index.vue';
import scEcharts from '@/components/scEcharts/index.vue';
import { defineAsyncComponent } from 'vue';
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
export default {
	name: 'ES',
	components: {
		scCodeEditor, scEcharts, Indices
	},
	data() {
		return {
			defaultProps: {
				children: 'children',
				label: 'label',
				isLeaf: (data, node) => {
					if (data.isLeaf == 'leaf') {
						return true
					}
				},
			},
			isOpen: false,
			isSaveBtn: false,
			isLoadDatabase: false,
			isRefresh: false,
            loadStatus: false,
			isSave: false,
			isExplain: false,
			isExecute: false,
			message: '',
			options: {
				hintOptions: { // 自定义提示选项
					completeSingle: false,
					tables: {
						users: ['name', 'score', 'birthDate'],
						countries: ['name', 'population', 'size'],
						score: ['zooao']
					}
				}
			},
			code: '',
            indexResultData: [],
			form: {
				pageSize: 2000
			},
			data: [],
			resultData: {
				data: [{}]
			},
			clickData: null,
			clickDatabase: null,
			clickTtl: -1,
			dataType: 'text',
			returnResult: null,
			openMonitor: false,
			openSave: false,
			opeLog: false,
			query: {},
			formatType: 'text',
            status: {},
            stats: {},
            info: {},
            countInfo: {},
			
		}
	},
	mounted() {
		this.form.genId = this.$route.params.genId;
		if (!this.form.genId || this.form.genId === 'null') {
			delete this.form.genId;
		}
        this.doRefresh();
		// this.initialTables();
	},
	methods: {
        doIndices() {
            this.$router.push({ path: '/ext/es/indices/' + this.form.genId});
        },
        doMapping() {
            this.$router.push({ path: '/ext/es/board/' + this.form.genId});
        },
        doRefresh() {
            this.initialHealth();
            this.initialIndexTables();
        },
        async initialIndexTables() {
            this.$API.gen.session.keyword.get(this.form).then(res => {
                if (res.code === '00000') {
                    if (res.data && res.data.length > 0) {
                        this.indexResultDataLength = res.data[0].children?.length;
                    }
                }
            })
		},
        priSize(attrs, name) {
            if(!attrs) {
                return '';
            }
            for(const item in attrs) {
                if(item?.indexOf(name) > -1) {
                    return attrs[item]
                }

            }
            return '';
        },
        change(limit){
            var size = "";
            if(limit < 0.1 * 1024){                            //小于0.1KB，则转化成B
                size = limit.toFixed(2) + "B"
            }else if(limit < 0.1 * 1024 * 1024){            //小于0.1MB，则转化成KB
                size = (limit/1024).toFixed(2) + "KB"
            }else if(limit < 0.1 * 1024 * 1024 * 1024){        //小于0.1GB，则转化成MB
                size = (limit/(1024 * 1024)).toFixed(2) + "MB"
            }else{                                            //其他转化成GB
                size = (limit/(1024 * 1024 * 1024)).toFixed(2) + "GB"
            }
        
            var sizeStr = size + "";                        //转成字符串
            var index = sizeStr.indexOf(".");                    //获取小数点处的索引
            var dou = sizeStr.substr(index + 1 ,2)            //获取小数点后两位的值
            if(dou == "00"){                                //判断后两位是否为00，如果是则删除00               
                return sizeStr.substring(0, index) + sizeStr.substr(index + 3, 2)
            }
            return size;
        },
        
		doRefreshDatabase(){
			this.isLoadDatabase = true;
			this.initialTables();
			this.isLoadDatabase = false;
		},
		doMonitor() {
			this.openMonitor = true;
			this.$nextTick(() => {
				this.$refs.monitorRef.open(this.form);
			})
		},
		doLog() {
			this.opeLog = true;
			this.$nextTick(() => {
				this.$refs.logRef.open(this.form);
			})
		},
		doSave() {
			this.openSave = true;
			this.$nextTick(() => {
				this.$refs.saveRef.open({data: this.data, genId : this.form.genId});
			})
		},
		doSaveBtn() {
			const query = {};
            query['genId'] = this.form.genId;
            query['name'] = this.clickDatabase;
            query['data'] = {
				key : this.clickData,
				value: this.returnResult,
				ttl : this.clickTtl
			};

			if(!this.clickData) {
				this.$message.error('请选择索引');
				return;
			}
            this.$API.gen.session.update.post(query).then(res => {
                if(res.code == '00000') {
                    this.$message.success('修改成功');
                    this.dialogStatus = false;
                    this.$emit('success', this.form, this.mode)
                    return;
                }
                this.$message.error(res.msg);
            }).finally(() => this.isSave = false);
		},
		changeDataType(val) {
			if(val) {
				this.formatType = val;
			}
			if(!this.resultData.data || this.resultData.data.length == 0 || !this.resultData.data[0]['data']) {
				return;
			}

			if(this.formatType == 'json' ) {
				this.returnResult = JSON.stringify(JSON.parse(this.resultData.data[0]['data']), null, '\t');
				return;
			}
			this.returnResult = this.resultData.data[0]['data'];
		},
		filterNode(value, data) {
			if (!value) return true
			return data.label.includes(value)
		},
		async loadNode(node, resolve) {
			console.log({ node })
			if (node.level !== 0) {
				const _this = this;
				// 子节点，延迟加载
				setTimeout(async () => {
					const tpl = {};
					Object.assign(tpl, this.form);
					tpl.databaseId = node?.data?.name;
					const data = await this.$API.gen.session.children.get(tpl)
					resolve(data?.data)
				}, 100)
			}
		},
		async nodeClick(node) {
			try {
				this.isExecute = true;
				this.clickData = node?.tableName;
				this.clickDatabase = node.database;
				this.query = { sql:  node.database+ ' GET ' + node.tableName, genId: this.form.genId };
				this.doRefresh();
			} catch (e) {
				this.message = e;
				this.isExecute = false;
				return;
			}
			this.isExecute = false;
		},
        initialHealth(){
            const tpl = {};
			Object.assign(tpl, this.form);
			 this.$API.gen.session.info.post(tpl).then(res => {
                if (res.code === '00000') {
                    if (res.data && res.data.data?.length > 0) {
                        const item = res.data.data;
                        for(let i = 0; i < item.length; i++) {
                            if(item[i].name === 'status') {
                                this.status = item[i]['data'] || {};
                                continue
                            }
                            if(item[i].name === 'stats') {
                                this.stats = item[i]['data'] || {};
                                continue
                            }
                            if(item[i].name === 'info') {
                                this.info = item[i]['data'] || {};
                                continue
                            }
                            if(item[i].name === 'count') {
                                this.countInfo = item[i]['data'] || {};
                                continue
                            }
                        }
				    }
                }
            });
			
        },
		async initialTables() {
			const tpl = {};
			Object.assign(tpl, this.form);
			const res = await this.$API.gen.session.keyword.get(tpl);
			if (res.code === '00000') {
				if (res.data && res.data.length > 0) {
					if (res.data[0].table) {
						for (const item of res.data[0].table) {
							const rs = [];
							this.options.hintOptions.tables[item?.tableName] = rs;
							for (const it of item?.column) {
								rs.push(it?.columnName);
							}
						}
					}

					this.data = res.data;
				}

				return res.data;
			}
		},
		//本地更新数据
		handleSaveSuccess(data, mode){
			this.initialTables();
		}
	}
}
</script>

<style scoped lang="less">
:deep(.el-statistic__number) {
    font-size: 18px
}
:deep(.el-progress-circle__path) {
    fill: white
}
:deep(.el-tree-node) {
	border-top: 1px solid #f1eaea;
	;
	border-bottom: 1px solid #f1eaea;
	;
	box-shadow: 0px 2px 3px 0px #f1eaea;
}

:deep(.el-tree) {
	width: 100%;
	overflow: scroll;
}

:deep(.el-tree>.el-tree-node) {
	display: inline-block;
	min-width: 100%;
}

.custom-tree-node {
	font-size: 14px;
	line-height: 38px;
	height: 38px;
}

.custom-icon {
	position: relative;
	top: 3px;
}

.custom-content {
	padding-left: 3px;
}

.code-toolbar {
	height: 38px;
	margin: 5px;
    position: relative;
}
.code-toolbar-right {
    position: absolute;
    top: 0;
    right: 0;
}
.panel-blue .widget-left {
    background: #58b7ff none repeat scroll 0 0;
    color: #fff;
}

.panel-pad {
    padding-right: 40px
}

.widget-left {
    border-bottom-left-radius: 4px;
    border-top-left-radius: 4px;
    height: 80px;
    padding-top: 15px;
    text-align: center
}

.widget-right {
    background: #fff none repeat scroll 0 0;
    border-bottom-right-radius: 4px;
    border-top-right-radius: 4px;
    color: #f8f8f8;
    font-weight: 300;
    height: 80px;
    line-height: 1.6em;
    margin: 0;
    padding: 20px;
    text-align: left
}

.widget-right .text-muted {
    color: #9fadbb
}

.widget-right .large {
    color: #5f6468;
    font-size: 2em
}

.panel-pink .widget-left {
    background: #875ea2 none repeat scroll 0 0;
    color: #fff
}

.panel-yellow .widget-left {
    background: #dc69aa none repeat scroll 0 0;
    color: #fff
}

.panel-blue .widget-left {
    background: #58b7ff none repeat scroll 0 0;
    color: #fff
}

.panel-teal .widget-left {
    background: #1ebfae none repeat scroll 0 0;
    color: #fff
}

.panel-orange .widget-left {
    background: #f7ba2a none repeat scroll 0 0;
    color: #fff
}

.panel-red .widget-left {
    background: #475669 none repeat scroll 0 0;
    color: #fff
}

.panel-widget {
    background: #fff none repeat scroll 0 0
}

.overview-panel-widget {
    background: #f7f7ff none repeat scroll 0 0
}

.panel .tabs {
    margin: 0;
    padding: 0
}

.demo-table-expand {
    font-size: 0
}

.demo-table-expand label {
    width: 90px;
    color: #99a9bf
}

.demo-table-expand .el-form-item {
    margin-right: 0;
    margin-bottom: 0;
    width: 50%
}

.overview-p {
    word-wrap: normal;
    text-overflow: ellipsis;
    line-height: 39px;
    width: 100%;
    box-sizing: border-box;
    background-color: #eef1f6;
    border: 1px solid #dfe6ec;
    margin-right: 20px;
    padding: 0 20px
}

.el-card__header {
    padding: 10px 20px!important;
    border-bottom: 1px solid #ccc!important;
    background-color: #f1f4f7
}

#spinner {
    text-align: center;
    margin: 0 auto;
    color: #ccc
}

.el-upload__input {
    display: none!important
}

.image-rocket {
    height: 300px;
    background-color: #fff
}

.image,.image-rocket {
    width: 100%;
    display: block
}

.text-content {
    color: #000;
    margin: 20px 0;
    font-size: 12px;
    text-align: justify
}

.mapping-p {
    word-wrap: normal;
    text-overflow: ellipsis;
    line-height: 39px;
    width: 100%;
    box-sizing: border-box;
    background-color: #eef1f6;
    border: 1px solid #dfe6ec;
    margin-right: 20px;
    padding: 0 20px
}

.mapping-hr {
    margin-top: 0;
    margin-bottom: 0;
    background-color: #99a9bf
}

.el-table .cell {
    overflow: hidden!important;
    white-space: nowrap!important;
    text-overflow: ellipsis!important
}

.bar-chart {
    font-size: 12px;
    margin-left: 2px
}

.bullet-point {
    position: relative;
    top: -2px;
    display: inline-block;
    width: 8px;
    height: 8px;
    background-color: #42a9f4;
    border-radius: 100%;
    margin-right: 5px;
    vertical-align: middle
}

.search-wrapper {
    height: 35px;
    line-height: 35px;
    padding: 0 5px;
    margin: 5px 0;
    background-image: linear-gradient(#dfe7ec,#f1f1f1);
    vertical-align: middle;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex
}

.filter-wrapper,.search-wrapper {
    border: 1px solid #ddd;
    border-radius: 2px
}

.filter-wrapper {
    float: left;
    width: 100%;
    height: 100%;
    font-size: 12px;
    overflow-y: auto;
    position: relative;
    background: #fff
}

.filter-wrapper h2 {
    color: #333;
    font-size: 14px;
    font-weight: 700;
    margin: 0;
    padding: 0 1em;
    line-height: 39px;
    height: 40px;
    border-bottom: 1px solid #ddd;
    background-image: linear-gradient(#dfe7ec,#f1f1f1)
}

h2 {
    display: block;
    font-size: 1.5em;
    -webkit-margin-before: .83em;
    -webkit-margin-after: .83em;
    -webkit-margin-start: 0;
    -webkit-margin-end: 0;
    font-weight: 700
}

.filter-wrapper .field-set-wrapper h3 {
    font-size: 12px;
    margin: .5em;
    position: relative
}

.search-body .thead {
    display: table-header-group;
    vertical-align: middle;
    border-color: inherit
}

.filter-wrapper ul {
    box-sizing: border-box;
    padding: .5em;
    margin: 0
}

thead {
    display: table-header-group;
    vertical-align: middle;
    border-color: inherit
}
:global(h2#card-usage ~ .example .example-showcase) {
  background-color: var(--el-fill-color) !important;
}

.el-statistic {
  --el-statistic-content-font-size: 28px;
}

.statistic-card {
  height: 100%;
  padding: 20px;
  border-radius: 4px;
  background-color: var(--el-bg-color-overlay);
}

.statistic-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 16px;
}

.statistic-footer .footer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.statistic-footer .footer-item span:last-child {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
}

.green {
  color: var(--el-color-success);
}
.red {
  color: var(--el-color-error);
}
.message {
	white-space: pre;
}</style>
