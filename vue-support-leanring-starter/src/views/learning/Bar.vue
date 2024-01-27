<template>
    <div class="left-panel">
    </div>
    
    <div class="right-panel">
        <div class="right-panel-search">
            <el-select v-model="formData.engineValue" clearable placeholder="请选择引擎">
                <el-option :value="item.value" :label="item.value" v-for="item in engine">
                    <span>{{ item.value }}</span>
                    <span class="el-form-item-msg" style="margin-left: 10px;">{{ item.desc }}</span>
                </el-option>
            </el-select>
        </div>

        <div class="right-panel-search">
            <el-select v-if="formData.engineValue" v-model="formData.moduleValue" clearable placeholder="请选择模型类型">
                <!-- <el-option :disabled="item.value !== 'DETECTOR'" :value="item.value" :label="item.label" v-for="item in model">
                    <span>{{ item.value }}</span>
                    <span class="el-form-item-msg" style="margin-left: 10px;">{{ item.desc }}</span>
                </el-option> -->
                <el-option value="DETECTOR" label="DETECTOR" >
                    <span>检测</span>
                    <span class="el-form-item-msg" style="margin-left: 10px;">检测</span>
                </el-option>
                
            </el-select>
        </div>
        <div class="right-panel-search">
            <el-select v-if="formData.moduleValue && formData.engineValue" v-model="formData.implTypeValue" clearable placeholder="请选择实现方式">
                <el-option  :value="item.value" :label="item.value" v-for="item in implType">
                    <span>{{ item.value }}</span>
                    <span class="el-form-item-msg" style="margin-left: 10px;">{{ item.desc }}</span>
                </el-option>
            </el-select>
        </div>
    </div>  
</template>
<script>
export default {
    props: {
        params: { type: Object, default: () => { } },
    },
    data() {
        return {
            engine: [],
            model: [],
            implType: [],
            formData: {
                engineValue: '',
                moduleValue: 'DETECTOR',
                implTypeValue: ''
            }
        }
    },

    watch: {
        'formData.engineValue': async function (val) { 
            this.formData.implTypeValue  = '';
            if(!val) {
                return;
            }
            this.$emit('engineValue', val);
            this.$emit('modelTypeValue', this.formData.moduleValue);
             this.implType = await this.getImplType(this.formData.moduleValue); 
            // 假设有一个getModel方法来获取模型列表，根据引擎值返回相应的模型列表。
            // this.model = await this.getModel(val); 
        },
        'formData.moduleValue': async function (val) { 
            this.formData.implTypeValue  = '';
            if(!val) {
                return;
            }
            this.$emit('modelTypeValue', val);
             this.implType = await this.getImplType(val); 
        },
        'formData.implTypeValue': async function (val) { 
            if(!val) {
                return;
            }
            this.$emit('implTypeValue', val);
        },
    },
    mounted() {
        console.log('Component mounted.')
        this.form = this.params;
        this.initialEngine();
    },

    methods: {
        async getImplType(val) {
            const data = await this.$API.learning.implType.get({engine: this.formData.engineValue, moduleType: val});
            if(data.code === '00000') {
               return data.data;
            }
            return []; 
        },
        async getModel(val) {
            const data = await this.$API.learning.modelType.get({engine: val});
            if(data.code === '00000') {
               return data.data;
            }
            return []; 
        },
        async initialEngine() {
            const data = await this.$API.learning.engine.get();
            if(data.code === '00000') {
                this.engine = data.data;
            }
        }
    }
}

</script>