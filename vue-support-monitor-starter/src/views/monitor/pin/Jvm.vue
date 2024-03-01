<template>
        <div class="text-white">虚拟机</div>
        <dv-active-ring-chart :config="config" style="width:300px;height:300px" :isDigitalFlop="false"/>
</template>
<script>
export default {
    props: {
        data: {
            type: Array,
            default: () => {
                return []
            }
        }
    },
    watch: {
        data(){
            this.config.data = [
                {
                        name: "最大内存",
                        value: this.data.total
                },
                {
                        name: "版本",
                        value: this.data.version
                }
            ]
        }
    },
    data(){
        return {
            config: {
              data: this.data,
            },
        }
    },
}
</script>