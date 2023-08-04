<template>
    <el-dialog draggable :title="title" v-model="visible" width="80%" destroy-on-close @closed="$emit('closed')">

        <el-card shadow="never">
            <el-form ref="ruleForm" :model="form"  label-width="100px">
                <el-form-item label="库" prop="title">
                    <el-input readonly disabled v-model="base.libName"></el-input>
                </el-form-item>
                <el-form-item label="Mapping" prop="list">
                    <sc-form-table ref="table" v-model="form.list" :addTemplate="addTemplate" drag-sort placeholder="暂无数据">
                        <el-table-column prop="time" label="名称" width="180">
                            <template #default="scope">
                                <el-input v-model="scope.row.name"></el-input>
                            </template>
                        </el-table-column>
                        <el-table-column prop="type" label="类型" width="180">
                            <template #default="scope">
                                <el-select v-model="scope.row.type" placeholder="请选择">
                                    <el-option value="text" label="文本"></el-option>
                                    <el-option value="dense_vector" label="向量"></el-option>
                                    <el-option value="float" label="浮点"></el-option>
                                    <el-option value="date" label="日期"></el-option>
                                    <el-option value="long" label="长整型"></el-option>
                                    <el-option value="ip" label="地址"></el-option>
                                    <el-option value="boolean" label="bool"></el-option>
                                    <el-option value="double" label="double"></el-option>
                                </el-select>
                            </template>
                        </el-table-column>
                        <el-table-column prop="keyword" label="关键词" min-width="180">
                            <template #default="scope">
                                <el-switch v-model="scope.row.keyword"></el-switch>
                            </template>
                        </el-table-column>
                        <el-table-column prop="dims" label="向量长度" min-width="180">
                            <template #default="scope">
                                <el-input v-if="scope.row.type === 'dense_vector'" v-model="scope.row.dims"></el-input>
                            </template>
                        </el-table-column>
                        <el-table-column prop="marker" label="描述" min-width="180">
                            <template #default="scope">
                                <el-input v-model="scope.row.marker"></el-input>
                            </template>
                        </el-table-column>
                    </sc-form-table>
                </el-form-item>
                <el-form-item>
                    <el-button :loading="loading" type="primary" @click="submitForm">保存</el-button>
                    <el-button :loading="loading" @click="visible = false">取 消</el-button>
                    <el-button :loading="loading" @click="dsl">ElasticMapping</el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </el-dialog>

    <el-dialog draggable v-model="dslp.show" title="ElasticSearch-Mapping">
        <sc-code-editor v-model="dslp.data" mode="json" height="500"></sc-code-editor>
    </el-dialog>
</template>

<script>
import { defineAsyncComponent } from 'vue';
	const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
export default {
    name: "Mappings",
    components: {
			scCodeEditor
		},
    data() {
        return {
            dslp: {
                show: false,
                data: "{}"
            },
            form: {
                list: [],
            },
            loading: false,
            visible: false,
            addTemplate: {
                name: '',
                value: '',
                type: 'text',
                marker: '',
                keyword: true,
                dims: 512,
                ignore_above: 256
            },
            base: {},
            mode: undefined,
        }
    },
    methods: {
        open(mode = 'add') {
            this.mode = mode;
            this.visible = true;
            return this;
        },
        dsl() {
            this.dslp.show = true;
            const tpl = {};
            for(const item of this.form.list) {
                tpl[item.name] = {
                    "type": item.type
                };
                if(item.keyword) {
                    tpl[item.name]["keyword"] = {
                        "type": "keyword",
                        "ignore_above": item.ignoreAbove,
                    }
                } else if(item.type === 'dense_vector'){
                    tpl[item.name]["dim"]  = item.dims;
                }
            }
            this.dslp.data = JSON.stringify({
                "mappings": tpl
            }, null, 4)
        },
        async setData(data) {
            this.title = data.libName + "的Mapping"
            this.base = data;
            await this.getMapping();
        },
        async getMapping() {
            var res = await this.$API.system.library.getMapping.get({libId: this.base.libId});
            if(res.code !== '00000') {
                this.$message.error(res?.msg);
                return !1;
            }
            this.form.list = res.data;
        },
        submitForm() {
            for (const item of this.form.list) {
                item['libId'] = this.base.libId;
            }
            this.loading = true;
            this.$API.system.library.updateMapping.put(this.form.list).then(res => {
                if (res.code === '00000') {
                    this.$notify.success({
                        title: '提示',
                        message: '更新成功'
                    })
                    this.visible = false;
                    return !1;
                }
            }).finally(() => this.loading = false)
        }
    }
}
</script>