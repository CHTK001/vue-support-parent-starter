<template>
    <el-dialog v-model="visible" draggable :title="title" width="60%">
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
                <el-card>
                    <p>{{ item.baseDesc }}</p>
                    <p class="el-statistic__number" v-if="!ifconfigLoading">
                        <b class="el-statistic__number inner" v-if="~~item.baseValue != item.baseValue" :title="item.baseValue">{{ item.baseValue }}</b>
                        <el-statistic :value="transform(~~item.baseValue)" v-else></el-statistic>
                    </p>
                    <el-skeleton :rows="5" animated  v-else />
                </el-card>
            </el-col>
        </el-row>
    </el-dialog>
</template>

<script>
import { useTransition } from '@vueuse/core'

export default {

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