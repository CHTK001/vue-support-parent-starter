<template>
    <el-container>
        <el-header style="height: auto;">
            <sc-select-filter :data="filterData" :label-width="80" @on-change="filterChange"></sc-select-filter>
        </el-header>
        <el-header>
            <div class="left-panel">
            </div>
            <div class="right-panel">
                <div class="right-panel-search">
                    <el-button type="primary" icon="el-icon-search" @click="marker"></el-button>
                </div>
            </div>
        </el-header>
        <el-main class="nopadding" style="display: flex; justify-content: center; align-items: center;">
            <el-skeleton :loading="loading" :rows="12"></el-skeleton>
            <el-image v-if="!loading" :src="url"></el-image>
        </el-main>
    </el-container>
</template>

<script>
import scSelectFilter from '@/components/scSelectFilter/index.vue'

export default {
    name: "Gan",
    components: {
        scSelectFilter
    },
    data() {
        return {
            size: 128,
            keyword: 1,
            loading: false,
            url: '',
            filterData: [
                {
                    title: "尺寸",
                    key: "size",
                    multiple: !1,
                    options: [
                        {
                            label: "128",
                            value: 128
                        },
                        {
                            label: "256",
                            value: 256
                        },
                        {
                            label: "512",
                            value: 512
                        },
                    ]
                },
                {
                    title: "类型",
                    key: "keyword",
                    options: [
                        {
                            label: "金鱼",
                            value: "1"
                        },
                        {
                            label: "鲨鱼",
                            value: "2"
                        },
                        {
                            label: "鱼类",
                            value: "3"
                        },
                        {
                            label: "公鸡",
                            value: "7"
                        },
                        {
                            label: "母鸡",
                            value: "8"
                        },
                        {
                            label: "鸵鸟",
                            value: "9"
                        },
                        {
                            label: "10",
                            value: "10"
                        },
                        {
                            label: "鸟类",
                            value: "11"
                        },
                        {
                            label: "犬",
                            value: "156"
                        },
                        {
                            label: "桥",
                            value: "821"
                        },
                    ]
                }
            ],
        }
    },
    mounted(){
        const item = this.filterData[1];
        for(var i = 1; i < 1000; i ++ ) {
            var bool = false;
            lo:for(const it of item.options) {
                if(it.value == i) {
                    bool = !0;
                    break lo;
                }
            }

            if(bool) {
                continue;
            }

            item.options.push(
                {
                    label: this.getValue(i),
                    value: i
                },
            )
        }
    },
    methods: {
        getValue(i){
            switch(i) {
                case  100: return '黑天鹅';
                case  101: return '象';
                case  102: return '刺猬';
            }

            return i;
        },
        filterChange(data) {
            this.size = data.size;
            this.keyword = data.keyword;
        },
        marker() {
            this.loading = !0;
            this.$API.learning.gan.get({
                keyword: this.keyword,
                size: this.size
            }).then(res => {
                this.url = 'data:image/png;base64,' + btoa(
                    new Uint8Array(res).reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
            }).finally(() => this.loading = !1)
        }
    }
}
</script>
<style scoped lang="less">
:deep(.sc-select-filter__item-options > ul) {
    max-height: 200px;
    overflow-y: auto;
}
</style>