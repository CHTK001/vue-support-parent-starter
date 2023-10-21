<template>
    <div style="height: calc(100% - 150px); position: relative;" id="container">
        <scG6 ref="scG6Ref"></scG6>
        <div class="properties absolute left-0 top-0">
            <el-row class="hover:shadow-xl cursor-default mt-6 h-12 p-4 flex-1 w-64 rounded-lg flex items-center justify-center bg-blue-500 shadow-lg">
                <span class="text-white" style="text-align: 12px; line-height: 12px; font-weight: 800;">节点数量: {{ node?.data }}</span>
            </el-row>

            <el-row class="hover:shadow-xl mt-6 h-12 cursor-default p-4 flex-1 w-64 rounded-lg flex items-center justify-center bg-blue-500 shadow-lg">
                <span class="text-white" style="text-align: 12px; line-height: 12px; font-weight: 800;">关系数量: {{ relation?.data }}</span>
            </el-row>

            <!-- <el-row class="hover:shadow-xl mt-6 h-12 cursor-default p-4 flex-1 w-64 rounded-lg flex items-center justify-center bg-blue-500 shadow-lg">
                <p class="text-white" style="text-align: 12px; line-height: 12px;">properties</p>
            </el-row> -->
        </div>
        <el-row class="absolute top-0 mt-6" style="width: 50vw; left: calc((100% - 50vw) / 2);">
            <el-col :span="18">
                <el-input style="float: left;"  ref="input" v-model="input" placeholder="搜索" size="large" clearable prefix-icon="el-icon-search" @keyup.enter.stop="enterQuery" :trigger-on-focus="false" />
            </el-col>
            <el-col :span="6">
                <el-button :loading="isSearchload" style="float: left; height: 38px; margin-left: 10px" @click="enterQuery" icon="el-icon-search" type="primary" ></el-button>
            </el-col>
        </el-row>
    </div>
</template>
<script>

export default {
    data() {
        return {
            isSearchload: false,
            form: {},
            node: null,
            relation: null,
            properties: null,
            graph: null,
            input: null,
            nodes: [],
            edges: []
        }
    },
    mounted() {
        this.form.genId = this.$route.params.genId;
        if (!this.form.genId || this.form.genId === 'null') {
            delete this.form.genId;
        }
        this.input = "MATCH (n1) -[r]->(n2) RETURN * LIMIT 100";
        this.doRefresh();
    },
    methods: {
       async enterQuery(event){
            if(!this.input) {
                return;
            }

            this.isSearchload = true;
            try {
                const res = await this.$API.gen.session.execute.post({content: this.input, genId: this.form.genId});
                if (res.code === '00000') {
                    this.$refs.scG6Ref.destroy();
                    this.$refs.scG6Ref.refresh(res.data.data[0]);
                    this.cost = res.data?.cost;
                } else {
                    this.message = res.msg;
                    this.resultData = {};
                    this.resultTotal = 0;
                }
            }catch(e) {}
            this.isSearchload = false;
        },
        async doRefresh() {
            this.isLoaded = true;
            this.$API.gen.session.info.post(this.form).then(res => {
                if (res.code == '00000') {
                    this.data = res.data?.data;
                    for (const item of this.data) {
                        if (item.name === 'node') {
                            this.node = item;
                            continue
                        }

                        if (item.name === 'relation') {
                            this.relation = item;
                            continue
                        }

                        if (item.name === 'properties') {
                            this.properties = item;
                            continue
                        }
                    }
                    return;
                }
                this.$message.error(res.msg);
            }).finally(() => this.isLoaded = false);

        },
    }
}
</script>