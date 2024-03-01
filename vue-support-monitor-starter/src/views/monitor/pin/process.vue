<template>
    <div v-if="dataList.length > 0" class="overflow-auto  mb-12 grid gap-y-10 gap-x-6 md:grid-cols-3 xl:grid-cols-3" :style="{'height': '100%', backgroundColor: '#eceff180'}">
        <div  v-for="(val, key, i)  in dataList" class="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
            <div class="bg-clip-border rounded-xl overflow-hidden bg-gradient-to-tr from-gray-900 to-gray-800 text-white shadow-gray-900/20 grid absolute place-items-center">
                <el-button circle plain style="background-color: transparent; font-size: 16px; color: skyblue" icon="el-icon-edit"></el-button>
            </div>
            <div class="p-4 text-right">
                <p
                    class="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">
                    <span style="font-size: 14px;"><b>{{ val?.name }}</b></span>
                </p>
                    
                <h4
                    class="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">
                    <span>{{ calculateDuration(val?.upTime) }}</span></h4>

                <h4 
                    class="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">
                    {{ this.$TOOL.sizeFormat(val?.residentSetSize || 0) }}</h4>
                <h4
                    class="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">
                    {{ val?.status  }}</h4>
            </div>
            <div class="border-t border-blue-gray-50 p-4">
                <p class="block antialiased font-sans text-base leading-relaxed font-normal text-blue-gray-600">
                    <!-- <strong class="text-green-500">命令</strong>{{ val?.command }} -->
                </p>
                <p class="block antialiased font-sans text-base leading-relaxed font-normal text-blue-gray-600">
                    <strong class="text-green-500">进程ID: </strong>
                    <span style="color: red"><b>{{ val?.processId }}</b></span>
                </p>
            </div>
        </div>
    </div>

    <el-empty v-else  style="padding: 0;"></el-empty>
</template>
<script>
export default {

    props: {
        data: {
            type: Array,
            default: () => []
        },
        h: {
            type: Number,
            default: 400
        }
    },
    watch: {
        data: {
            handler(val) {
                this.dataList = val;
            },
            deep: true,
            immediate: true
        }
    },
    data(){
        return {
            height: this.h,
            dataList: this.data,
            title: '进程TOP 10'
        }
    },
    methods: {
        calculateDuration(durationInMillis) {
            // 计算相差的天数
            var days = Math.floor(durationInMillis / (1000 * 60 * 60 * 24));
            
            // 计算相差的小时数（不包括天）
            var hours = Math.floor((durationInMillis % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
            // 计算相差的分钟数（不包括小时）
            var minutes = Math.floor((durationInMillis % (1000 * 60 * 60)) / (1000 * 60));
            
            return "持续：" + days + "天 " + hours + "小时 " + minutes + "分钟";
        },
    }


}
</script>
<style lang="scss" scoped>
.text-2xl {
    font-size: 12px !important;
}
</style>