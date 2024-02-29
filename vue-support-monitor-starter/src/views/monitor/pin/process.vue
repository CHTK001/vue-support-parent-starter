<template>
    <p style="position: relative; top:0">{{ title }}</p>

    <div v-if="dataList.length > 0" class="overflow-auto  mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-2" style="max-height: 260px;">
        <div v-for="(val, key, i)  in dataList" class="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
            <div v-if="key != 'timestamp' && val" 
                class="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-gray-900 to-gray-800 text-white shadow-gray-900/20 absolute grid h-12 w-12 place-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                    aria-hidden="true" class="w-6 h-6 text-white">
                    <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"></path>
                    <path fill-rule="evenodd"
                        d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z"
                        clip-rule="evenodd"></path>
                    <path
                        d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z">
                    </path>
                </svg>
            </div>
            <div class="p-4 text-right">
                <p
                    class="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">
                    <span v-if="key == 'total'">
                        总量
                    </span>
                    <span v-if="key == 'max'">
                        物理总量
                    </span>
                    <span v-else-if="key == 'free'">
                        剩余
                    </span>
                    <span v-else-if="key == 'used'">
                        已使用
                    </span>
                    <span v-else-if="key == 'timestamp'">
                        上报时间
                    </span>
                    <span v-else-if="key == 'version'">
                        版本
                    </span>
                    <span v-else-if="key == 'home'">
                        路径
                    </span>
                    <span v-else>{{ key }}</span>
                </p>
                    
                <h4 v-if="key == 'timestamp'"
                    class="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">
                    <span v-time.tip="val" /></h4>

                <h4 v-else-if="typeof val === 'number'"
                    class="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">
                    {{ this.$TOOL.sizeFormat(val || 0) }}</h4>
                <h4 v-else
                    class="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">
                    {{ val  }}</h4>
            </div>
        </div>
        <div  class="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
            <div
                class="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-gray-900 to-gray-800 text-white shadow-gray-900/20 absolute grid h-12 w-12 place-items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                    aria-hidden="true" class="w-6 h-6 text-white">
                    <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"></path>
                    <path fill-rule="evenodd"
                        d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z"
                        clip-rule="evenodd"></path>
                    <path
                        d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z">
                    </path>
                </svg>
            </div>
            <div class="p-4 text-right">
                <p
                    class="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600">
                    <span><b>{{ val?.name }}</b></span>
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
        }
    },
    data(){
        return {
            dataList: this.data,
            title: '进程TOP 10'
        }
    }


}
</script>