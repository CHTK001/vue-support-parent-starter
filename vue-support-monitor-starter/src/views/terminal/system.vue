<template>
    <el-dialog v-model="visible" draggable :title="title" width="60%" :close-on-click-modal="false" :destroy-on-close="true">
        <template #header="{ close, titleId, titleClass }">
        <div class="my-header">
            <h4 :id="titleId" :class="titleClass">{{ title }}
                <span>
                    <el-icon @click="doRefresh">
                        <component is="el-icon-refresh" />
                    </el-icon>
                </span>
            </h4>
        </div>
        </template>
        <el-row>
            <el-col :span="6" v-for="item in baseData" style="width: 300px">
                <el-card style="height: 100px; position: relative;">
                    <p>{{ item.baseDesc }}</p>
                    <el-icon style="position: absolute; top:0; right:0" @click="doDeleteBase(item)"><component is="el-icon-close"/></el-icon>
                    <p class="el-statistic__number" v-if="!ifconfigLoading">
                        <b class="el-statistic__number inner2" v-if="~~item.baseValue != item.baseValue" >
                            <el-tooltip raw-content>
                                <template #content>
                                    <sc-code-editor v-if="item.baseValue.length > 300" v-model="item.baseValue" mode="shell"></sc-code-editor> 
                                    <span v-else>{{ item.baseValue }}</span>
                                </template>
                                {{ item.baseValue }}
                            </el-tooltip>
                        </b>
                        <el-statistic :value="transform(~~item.baseValue)" v-else></el-statistic>
                    </p>
                    <el-skeleton :rows="5" animated  v-else />
                </el-card>
            </el-col>
        </el-row>
    </el-dialog>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { useTransition } from '@vueuse/core'
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));

export default {
    components: {
			scCodeEditor
		},
    data() {
        return {
            visible: false,
            title: '',
            ifconfigLoading: false,
            ifconfig: '0.0.0.0',
            form: {},
            baseData: []
        }
    },
    unmounted() {
        this.visible = false;
    },
    methods: {
        open() {
            this.visible = true;
            return this;
        },
        transform(v) {
            return useTransition(v, {
                duration: 1500,
            })
        },
        doDeleteBase(item) {
            this.$API.project.baseDelete.delete({id: item.baseId}).then(res => {
                if(res.code != '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                this.afterProperties();
            })
        },
        setData(item) {
            this.title = item.terminalHost + ' - ' + item.terminalName;
            Object.assign(this.form, item);
            this.afterProperties();
        },
        doRefresh(){
            this.ifconfigLoading = true;
            this.$API.terminal.upgrade.put({id: this.form.terminalId}).then(res => {
                if(res.code == '00000') {
                    this.baseData = res.data;
                }
            }).finally(() => {
                this.ifconfigLoading = false;
            })
        },
        afterProperties() {
            this.ifconfigLoading = true;
            this.$API.terminal.base.get({id: this.form.terminalId}).then(res => {
                if(res.code == '00000') {
                    this.baseData = res.data;
                }
            }).finally(() => {
                this.ifconfigLoading = false;
            })
        }
    }
}

</script>

<style scoped>
:global(h2#card-usage ~ .example .example-showcase) {
  background-color: var(--el-fill-color) !important;
}
.inner {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.inner2 {
    word-break: break-all;
    word-wrap: break-word;
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
</style>