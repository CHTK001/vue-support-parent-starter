<template>
    <el-container style="overflow: hidden;">
		<el-aside style="width: 25%">
			<el-container>
				<el-main>
					<el-row style="margin-bottom: 12px;">
						<el-col :span="6">
							<el-select v-model="form.data.method" >
								<el-option label="GET" value="GET"></el-option>
								<el-option label="POST" value="POST"></el-option>
								<el-option label="PUT" value="PUT"></el-option>
								<el-option label="DELETE" value="DELETE"></el-option>
								<el-option label="HEAD" value="HEAD"></el-option>
                            </el-select>
						</el-col>
						<el-col :span="18">
							<el-input v-model="form.data.options" placeholder="地址" ></el-input>
						</el-col>

                        <el-col :span="8"  style="margin-top: 12px">
							<el-select v-model="form.dataId" :filterable="true" :allow-create="true" clearable>
								<el-option :key="item.name" :value="item.name" :label="item.name" v-for="item in indexResultData"></el-option>
							</el-select>
                        </el-col>
						<el-col :span="7"  style="margin-top: 12px">
							<el-input v-model="form.type" placeholder="要查询的type" ></el-input>
						</el-col>
						
                        <el-col :span="9" style="margin-top: 12px">
                            <el-button-group>
                                <el-button type="primary" :loading="isRefresh" @click="doSearch">查询</el-button>
                                <el-button type="primary" @click="doValid">检验</el-button>
                            </el-button-group>
                        </el-col>
                        <el-col :span="24" style="margin-top: 12px">
                            <el-input v-model="form.data.body" type="textarea" :rows="30"></el-input>
                        </el-col>
					</el-row>
				</el-main>
			</el-container>
		</el-aside>
		<drag-layout :id="'vertical-drag-bar' + this.form.genId"></drag-layout>
		<el-main class="nopadding">
			<div class="code-toolbar">
				<el-button plain text :loading="isSave" icon="el-icon-plus" @click="doSave">新增</el-button>
				<!-- <el-button plain text :loading="isOpen" icon="el-icon-monitor" @click="doMonitor">服务器信息</el-button>
				<el-button plain text :loading="isOpen" icon="el-icon-refresh" @click="doRefresh">刷新</el-button>
				<el-button plain text :loading="isSaveBtn" icon="sc-icon-save" @click="doSaveBtn">保存</el-button>
				<el-button plain text  icon="el-icon-warning" @click="doLog">日志</el-button> -->
				<el-button plain text icon="sc-icon-time">
					<el-icon class="animation" v-if="isRefresh" title="加载中">
						<component is="sc-icon-loading-v2" circle />
					</el-icon>
					耗时: <el-tag style="margin-top:1px">{{ cost }}ms</el-tag></el-button>
			</div>
			<div>
				<sc-code-editor v-model="resultData" mode="json" height="700"></sc-code-editor>
			</div>
		</el-main>

	</el-container>
</template>
<script>   
import { defineAsyncComponent } from 'vue';

import DragLayout from "@/components/drag/DragLayout.vue";
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));

export default {
    components: {
		scCodeEditor, DragLayout
	},
    data() {
        return {
            form: {
				pageSize: 2000,
                data: {
                    method: 'GET',
                    options: '_search',
                    body: '{"query":{"match_all":{}}}'
                }
			},
            isRefresh: false,
            resultData: '',
			indexResultData: [],
			cost: 0,
            rules: {
                method: [{ required: true, message: '请选择请求方式', trigger: 'change' }],
            }
        }
    },
    mounted(){
        this.form.genId = this.$route.params.genId;
		if (!this.form.genId || this.form.genId === 'null') {
			delete this.form.genId;
		}
		this.initialIndexTables();
    },
    methods: {
		async initialIndexTables() {
            this.$API.gen.session.keyword.get({genId: this.form.genId}).then(res => {
                if (res.code === '00000') {
                    if (res.data && res.data.length > 0) {
                        this.indexResultData = res.data[0].children;
                    }
                }
            })
		},
        doValid(){
            try {
                this.form.data.body = JSON.stringify(JSON.parse(this.form.data.body), null, '\t')
            }catch(e) {
                this.$message.error('请求体数据格式错误');
            }
        },
        doSearch() {
            this.isRefresh = true;
			this.$API.gen.session.execute.post(this.form).then(res => {
				if (res.code === '00000') {
					this.resultData = JSON.stringify(JSON.parse(res.data?.data[0]['data']), null, '\t')
					this.cost = res.data?.cost;
				}

			}).finally(() => this.isRefresh = false);
        }

    }

}
</script>