<template>
    <el-container>
        <el-header>
            <div class="left-panel">
                <el-select v-model="form.appValue" clearable placeholder="请选择应用">
                    <el-option v-for="item in apps" :key="item.monitorAppname" :value="item.monitorAppname"
                        :label="item.monitorAppname">
                        <span>{{ item.monitorAppname }}</span>
                        <span class="el-form-item-msg" style="margin-left: 10px;">{{ item.monitorName }}</span>
                    </el-option>
                </el-select>
                <el-button type="primary pl-1" style="margin-left: 10px" icon="el-icon-search" @click="query"></el-button>
            </div>
        </el-header>
        <el-main>
            <div class="w-full max-w-full px-3 mb-6 sm:w-1/2 sm:flex-none xl:mb-0 xl:w-1/4" v-if="data.length > 0">
                <div v-for="item in data"
                    class="relative flex flex-col min-w-0 break-words bg-white shadow-xl dark:bg-slate-850 dark:shadow-dark-xl rounded-2xl bg-clip-border">
                    <div class="flex-auto p-4">
                        <div class="flex flex-row -mx-3">
                            <div class="flex-none w-2/3 max-w-full px-3">
                                <div>
                                    <p
                                        class="mb-0 font-sans text-sm font-semibold leading-normal uppercase dark:text-white dark:opacity-60">
                                        {{ item?.name }}</p>
                                    <h5 class="mb-2 font-bold dark:text-white"></h5>
                                    <h5 class="mb-2 font-bold dark:text-white"></h5>
                                    <p class="mb-0 dark:text-white dark:opacity-60">
                                        <span class="text-sm font-bold leading-normal text-emerald-500">地址</span>
                                       {{ item?.host }}:{{ item?.port }}
                                    </p>
                                    <p class="mb-0 dark:text-white dark:opacity-60">
                                        <span class="text-sm font-bold leading-normal text-emerald-500">环境</span>
                                       {{ item?.profile }}
                                    </p>
                                </div>
                            </div>
                            <div class="px-3 text-right basis-1/3">
                                <el-icon type="arrow-up" style="font-size: 40px; color: vlue">
                                    <component is="sc-icon-app" />
                                </el-icon>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <el-empty v-else ></el-empty>
        </el-main>
    </el-container>
</template>
<script>
export default {
    data() {
        return {
            form: {

            },
            apps: [],
            data: []
        }
    },
    watch:{
      "form.appValue": {
        handler: function (val) {
           this.form.appModelValue = '';
        },
        deep: true,
        immediate: true
      }
    },
    mounted() {
        this.afterPrepertiesSet();
    },
    methods: {
        query() {
            this.$API.monitor.register.get({ appName: this.form.appValue }).then(res => {
                if (res.code === '00000') {
                    this.data = res.data;
                }
            });
        },
        async afterPrepertiesSet() {
            this.$API.monitor.app.list.get().then(res => {
                if (res.code === '00000') {
                    this.apps = res.data;
                }
            });
        },
    }
}
</script>