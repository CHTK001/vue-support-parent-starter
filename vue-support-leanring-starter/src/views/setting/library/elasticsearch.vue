<template>
    <el-dialog draggable v-model="dslp.show" title="ElasticSearch-Mapping" @close="dslp.show = false">
        <el-switch inline-prompt v-model="overIndex"  class="mb-2" :active-value="true" :inactive-value="false" active-text="不存在索引先创建"
            inactive-text="不存在索引不创建" />
        <sc-code-editor v-model="dslp.data" mode="json" height="500"></sc-code-editor>
        <template #footer>
            <span class="dialog-footer">
                <el-button :loading="loading" @click="dslp.show = false">关闭</el-button>
                <el-button :loading="loading" type="primary" @click="createMapping">
                    创建
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>
<script>
import { defineAsyncComponent } from 'vue';
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
export default {
    name: 'ElasticSearch',
    components: {
        scCodeEditor
    },
    data() {
        return {
            loading: false,
            dslp: {
                show: false,
                data: "{}"
            },
            indexName: undefined,
            overIndex: false,
        }
    },
    methods: {
        createMapping() {
            this.loading = !0;
            this.$API.learning.doc.createMapping.create({
                'indexName': this.indexName,
                overIndex: this.overIndex,
                mapping: this.dslp.data.replaceAll(/\s+|\r|\n/g, '')
            }).then(res => {
                if (res.code === '00000') {
                    this.$notify.success({
                        title: '提示',
                        message: '创建成功'
                    })
                    return !1;
                }
                this.$notify.error(res.msg);
            }).finally(() => this.loading = !1)
        },
        open(index, row) {
            this.dslp.show = true;
            const tpl = {};
            for (const item of row) {
                tpl[item.name] = {
                    "type": item.type
                };
                if (item.keyword) {
                    const iitem = tpl[item.name]['fields'] = {};
                    iitem["keyword"] = {
                        "type": "keyword",
                        "ignore_above": item.ignoreAbove,
                    }
                } else if (item.type === 'dense_vector') {
                    tpl[item.name]["dims"] = item.dims;
                }
            }
            this.indexName = index;
            this.dslp.data = JSON.stringify({
                "properties": tpl
            }, null, 4)
        }
    }
}
</script>