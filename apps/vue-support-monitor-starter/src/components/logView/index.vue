<template>
  <CustomModal
    v-if="visibleModel"
    v-model:open="visibleModel"
    destroy-on-close
    :width="style.width"
    :body-style="style.bodyStyle"
    :style="style.style"
    :footer="null"
    :mask-closable="false"
    @cancel="close"
  >
    <template #title>
      <a-page-header :title="titleName" :back-icon="false" style="padding: 0">
        <template #subTitle>
          <a-row type="flex" align="middle">
            <a-col>
              <slot name="before"></slot>
            </a-col>

            <a-col v-if="extendBar" style="padding-left: 10px">
              <a-space>
                <a-tooltip :title="$t('i18n_65f66dfe97')">
                  <a-button type="primary" size="small" @click="clearLogCache"
                    ><DeleteOutlined />{{ $t('i18n_288f0c404c') }}</a-button
                  >
                </a-tooltip>
                <!-- <a-tooltip title="内容超过边界自动换行">
                  <a-switch v-model="temp.wordBreak" checked-children="自动换行" un-checked-children="不换行" @change="onChange" />
                </a-tooltip> -->
                <a-tooltip :title="$t('i18n_0693e17fc1')">
                  <a-switch
                    v-model:checked="temp.logScroll"
                    :checked-children="$t('i18n_e0ce74fcac')"
                    :un-checked-children="$t('i18n_18b34cf50d')"
                    @change="onChange"
                  />
                </a-tooltip>
              </a-space>
            </a-col>
          </a-row>
        </template>
      </a-page-header>
    </template>

    <viewPre ref="viewPre" :height="`calc(${style.bodyStyle.height} - 40px)`" :config="temp"></viewPre>
  </CustomModal>
</template>
<script>
import viewPre from './view-pre.vue'
import { mapState } from 'pinia'

export default {
  name: 'LogView',
  components: {
    viewPre
    // VNodes: {
    //   functional: true,
    //   render: (h, ctx) => ctx.props.vnodes,
    // },
  },

  props: {
    titleName: {
      type: String,
      default: ''
    },
    marginTop: {
      type: String,
      default: '0'
    },
    extendBar: {
      type: Boolean,
      default: true
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  data() {
    return {
      temp: {
        logScroll: true,
        // 自动换行
        wordBreak: false
      },
      visibleModel: false
    }
  },
  computed: {
    
    regModifier() {
      return this.regModifiers.join('')
    },
    style() {
      return this.getFullscreenViewLogStyle()
    }
  },
  created() {
    this.visibleModel = this.visible
  },
  mounted() {
    const cacheJson = localStorage.getItem('log-view-cache') || '{}'
    try {
      const cacheData = JSON.parse(cacheJson)
      this.temp = Object.assign({}, this.temp, cacheData)
    } catch (e) {
      console.error(e)
    }
  },
  methods: {
     // 计算弹窗全屏样式
    getFullscreenViewLogStyle ()  {
        // 非全屏
        return {
          // dialogStyle: {
          //   maxWidth: '100vw',
          //   top: false,
          //   paddingBottom: 0
          // },
          bodyStyle: {
            padding: '0 10px',
            paddingTop: '10px',
            marginRight: '10px',
            height: '70vh'
          },
          width: '80vw',
          style: {
            maxWidth: '100vw',
            top: false,
            paddingBottom: 0
          }
        }
    },
    appendLine(data) {
      this.$refs.viewPre?.appendLine(data)
    },
    clearLogCache() {
      this.$refs.viewPre?.clearLogCache()
    },
    onChange() {
      localStorage.setItem('log-view-cache', JSON.stringify(this.temp))
    },
    close() {
      this.visibleModel = false
      this.$emit('close')
    }
  }
}
</script>
<style scoped>
.log-filter {
  padding: 0 10px;
  padding-top: 0;
  padding-bottom: 10px;
  line-height: 0;
}
</style>
