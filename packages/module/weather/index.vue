<template>
  <div shadow="hover" :header="header" class="item-background">
    <el-skeleton :loading="loading" animated>
      <template #default>
        <el-empty v-if="!useWeatherStore.weather?.data?.cityName" />
        <div v-else class="sw-ui-main-container sc-fjdhpX fAFgBy">
          <div class="sc-htpNat sw-ui-main sc-gzVnrw blUPwB" @click="dialogVisible = true">
            <div class="sw-ui-main-arcContainer sc-dnqmqq cHlxbs">
              <el-tag type="primary" class="relative top-4 left-4 ml-1">{{ useWeatherStore.weather?.data?.cityName
                }}</el-tag>
              <el-tag type="primary" class="relative top-4 left-4 ml-1">{{ useWeatherStore.weather?.data?.temperature
                }}℃</el-tag>
              <div class="sw-ui-main-arc sc-iwsKbI bRmqwc">
                <el-icon style="font-size: 80px; position: relative; left: 15rem">
                  <component :is="useRenderIcon(icon[useWeatherStore.current?.weatherIcon])" />
                </el-icon>
              </div>
            </div>
            <div class="sw-ui-main-grow sc-htoDjs hzdUrF" />
            <p class="sw-typography sw-ui-main-temperature sc-bwzfXH eofBUk" color="inherit">
              {{ useWeatherStore.current?.weatherDay }}
            </p>
            <div class="sw-ui-main-timeContainer sc-VigVT eMNzRy">
              <span class="sw-typography sw-ui-main-rise sc-bwzfXH bpTFnS" color="textSecondary">
                {{ useWeatherStore.current?.hours?.length > 0 ? useWeatherStore.current?.hours[0]?.name : 0 }}
              </span>
              <span class="sw-typography sw-ui-main-temperatureRange sc-jTzLTM bFsUuh sc-bwzfXH dBbtWF" color="inherit">
                {{ useWeatherStore.current?.minLowTemp }}°C ~ {{ useWeatherStore.current?.maxHighTemp }}°C </span>
              <span class="sw-typography sw-ui-main-set sc-bwzfXH fwGqcW" color="textSecondary">
                {{ useWeatherStore.current?.hours?.length > 0 ?
                  useWeatherStore.current?.hours[useWeatherStore.current?.hours.length - 1]?.name : 23 }}
              </span>
            </div>
          </div>
        </div>
        <div v-for="(item, i) in useWeatherStore.weather?.data?.day || []" :key="i" class="three_days content-box">
          <span>{{ item.date }} {{ item.week }}</span>
          <div>
            <el-icon style="font-size: 40px">
              <component :is="useRenderIcon(icon[item.weatherIcon])" />
            </el-icon>
          </div>
          <span>{{ item.minLowTemp }}-{{ item.maxHighTemp }}℃</span>
          <span>{{ item.weatherDay }}</span>
          <span>{{ item.windDirection }}</span>
        </div>
      </template>
    </el-skeleton>
  </div>

  <sc-dialog v-model="dialogVisible" title="24小时天气情况" draggable>
    <div class="sw-ui-main-container sc-fjdhpX fAFgBy">
      <div class="sc-htpNat sw-ui-main sc-gzVnrw blUPwB">
        <scEcharts height="200px" width="100%" :option="useWeatherStore.options" />
      </div>
    </div>
  </sc-dialog>
</template>

<script>
import scEcharts from "@repo/components/ScEcharts/index.vue";
import { useWeatherStore } from "@repo/core";
import { defineComponent } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
export default defineComponent({
  title: "天气",
  icon: "meteocons:clear-day-fill",
  description: "天气信息",
  components: { scEcharts },
  data() {
    return {
      loading: true,
      dialogVisible: false,
      useWeatherStore: useWeatherStore,
      icon: {
        qing: "meteocons:clear-day-fill",
        yun: "meteocons:partly-cloudy-day-fill",
        yin: "meteocons:overcast-day-fill",
        yu: "meteocons:rain-fill",
      },
    };
  },
  mounted() {
    console.log("loading weather ....");
    useWeatherStore.actions.load().then((res) => (this.loading = false));
    this.$emit("loaded", true);
  },
  methods: {
    useRenderIcon
  }
});
</script>

<style scoped lang="scss">
.item-background p {
  margin-top: 10px;
  line-height: 1.8;
}

:deep(.el-card__body) {
  padding: 0;
}

.bRpexW {
  width: 54px;
  height: 54px;
  display: block;
  position: absolute;
  transform: translate(-50%, -50%);
  left: 67.7796%;
  top: 3.26792%;
}

.three_days {
  height: 200px !important;
  background: linear-gradient(rgb(86, 107, 110), rgb(125, 147, 155));
  box-shadow: rgba(0, 0, 0, 0.15) 0px 2px 20px;
  border-radius: 10px;
  display: inline-flex;
  font-size: 12px;
  color: var(--el-text-color-primary);
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  width: 12.5%;
  padding: 20px;
  border: solid 1px #ddd;
  box-shadow: 4px 3px 6px 0px #ccc;

  .icon_weather {
    width: 50px;
    height: 50px;
    margin: 15px 0;
  }

  span:nth-child(4) {
    margin: 15px 0;
  }

  .current {
    font-weight: 800;
  }
}

.fAFgBy {
  width: 100%;
  color: var(--el-text-color-primary);
  font-weight: 800;
  background: linear-gradient(rgb(86, 107, 110), rgb(125, 147, 155));
  box-shadow: rgba(0, 0, 0, 0.15) 0px 2px 20px;
  border-radius: 10px;
}

.blUPwB {
  flex: 1 0 99.999%;
  max-width: 100%;
  padding: 8px 10px 0px;
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  position: relative;
  margin-bottom: 16px;
  height: 196px;
}

.cHlxbs {
  width: 100%;
  height: 180px;
  margin: 0px -6px;
  left: 6px;
  position: absolute;
  bottom: 20px;
  overflow: hidden;
}

.hzdUrF {
  height: 92px;
}

.bRmqwc {
  width: 265.44px;
  height: 265.44px;
  position: absolute;
  border-radius: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  left: 50%;
  bottom: 0px;
  transform: translate(-50%, 50%);
}

.bRpexW {
  width: 54px;
  height: 54px;
  display: block;
  position: absolute;
  transform: translate(-50%, -50%);
  left: 67.7796%;
  top: 3.26792%;
}

.hlBhLX {
  width: 1em;
  height: 1em;
  margin: 0px;
  vertical-align: -0.15em;
  fill: currentcolor;
  overflow: hidden;
  flex: 0 0 auto;
}

.iWEWlT {
  z-index: 1;
  display: inline-flex;
  flex-direction: row;
  -webkit-box-align: center;
  align-items: center;
}

.jQHZYL {
  font-family: "Avenir Next", PingFangSC-Light, PingFangSC, "Helvetica Neue", Helvetica, Arial, "Hiragino Sans GB", "Heiti SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
  font-size: 1.875rem;
  line-height: 1.71429;
  font-weight: 400;
  margin: 0px;
  text-align: inherit;
  white-space: pre;
  flex: 0 0 auto;
  color: inherit;
}

.eccBLL {
  font-family: "Avenir Next", PingFangSC-Light, PingFangSC, "Helvetica Neue", Helvetica, Arial, "Hiragino Sans GB", "Heiti SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
  font-size: 1.75rem;
  line-height: 1.33333;
  font-weight: 400;
  margin: 0px;
  text-align: inherit;
  white-space: pre;
  flex: 0 0 auto;
  color: rgba(255, 255, 255, 0.54);
}

.ggJaPA {
  color: rgb(255, 255, 255);
}

.jQHZYL {
  font-family: "Avenir Next", PingFangSC-Light, PingFangSC, "Helvetica Neue", Helvetica, Arial, "Hiragino Sans GB", "Heiti SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
  font-size: 0.875rem;
  line-height: 1.71429;
  font-weight: 400;
  margin: 0px;
  text-align: inherit;
  white-space: pre;
  flex: 0 0 auto;
  color: inherit;
}

.eofBUk {
  font-family: "Avenir Next", PingFangSC-Light, PingFangSC, "Helvetica Neue", Helvetica, Arial, "Hiragino Sans GB", "Heiti SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
  font-size: 25px;
  line-height: 1.4;
  font-weight: 500;
  margin: 0px;
  text-align: center;
  white-space: pre;
  flex: 0 0 auto;
  color: inherit;
}

.eMNzRy {
  display: flex;
  -webkit-box-pack: justify;
  justify-content: space-between;
}

.bpTFnS {
  font-family: "Avenir Next", PingFangSC-Light, PingFangSC, "Helvetica Neue", Helvetica, Arial, "Hiragino Sans GB", "Heiti SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
  font-size: 1.25rem;
  line-height: 1.33333;
  font-weight: 400;
  margin: 0px;
  text-align: left;
  white-space: pre;
  flex: 0 0 auto;
  color: rgba(255, 255, 255, 0.54);
}

.bFsUuh {
  display: inline-flex;
  flex-direction: row;
  align-items: flex-start;
}

.fwGqcW {
  font-family: "Avenir Next", PingFangSC-Light, PingFangSC, "Helvetica Neue", Helvetica, Arial, "Hiragino Sans GB", "Heiti SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
  font-size: 1.25rem;
  line-height: 1.33333;
  font-weight: 400;
  margin: 0px;
  text-align: right;
  white-space: pre;
  flex: 0 0 auto;
  color: rgba(255, 255, 255, 0.54);
}

.dBbtWF {
  font-family: "Avenir Next", PingFangSC-Light, PingFangSC, "Helvetica Neue", Helvetica, Arial, "Hiragino Sans GB", "Heiti SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
  font-size: 1.25rem;
  line-height: 1.33333;
  font-weight: 400;
  margin: 0px;
  text-align: center;
  white-space: pre;
  flex: 0 0 auto;
  color: inherit;
}
</style>
