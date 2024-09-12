import { defineStore } from "pinia";
import { localStorageProxy } from "@/utils/storage";
import { onBeforeUnmount } from "vue";
import { fetchGetWeather } from "@/api/weather";

onBeforeUnmount(() => {
  close();
});
export const useWeatherStore = defineStore({
  id: "weather-setting",
  state: () => ({
    storageKey: "weather-layout-setting",
    weather: {},
    origin: {},
    header: "天气情况",
    weatherArray: [],
    city: null,
    current: null,
    options: {
      type: "24小时天气",
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        }
      },
      xAxis: {
        type: "category",
        axisLabel: {
          textStyle: {
            color: "#fff"
          }
        },
        data: []
      },
      yAxis: {
        nameTextStyle: {
          color: "#fff"
        },
        axisLabel: {
          formatter: "{value}",
          textStyle: {
            color: "#fff"
          }
        },
        type: "value",
        name: "温度（°）",
        max: 40
      },

      series: [
        {
          data: [],
          type: "line",
          itemStyle: {
            normal: {
              label: {
                show: true, // 在折线拐点上显示数据
                formatter: function (v) {
                  return v.data + "°";
                }
              },

              lineStyle: {
                width: 3, // 设置虚线宽度
                type: "dotted" // 虚线'dotted' 实线'solid'
              }
            }
          }
        }
      ]
    }
  }),
  actions: {
    async load() {
      if (Object.keys(this.weather).length == 0) {
        this.afterGetWeather();
      }
      this.doAnalysis();
    },
    async afterGetWeather() {
      const data = localStorageProxy().getItem(this.storageKey);
      if (!data) {
        fetchGetWeather({}).then(res => {
          if (!res?.data) {
            return;
          }
          this.weather = {
            data: res?.data,
            timestamp: new Date().getTime()
          };
          localStorageProxy().setItem(this.storageKey, this.weather);
          this.doAnalysis();
        });
        return;
      }
      this.weather = data;
      this.doAnalysis();
    },

    doAnalysis() {
      const item = this.weather?.data;
      const timestamp = this.weather?.timestamp || 0;
      if (new Date().getTime() - timestamp > 1000 * 60 * 60) {
        localStorageProxy().removeItem(this.storageKey);
      }
      if (Object.keys(this.weather).length == 0) {
        return;
      }
      this.origin = item;
      this.city = item?.city;
      this.header = item?.city + " 未来7天天气情况";
      this.weatherArray = item?.day || [];
      this.current = this.weatherArray.find(item => item.date == this.toDay());
      if (this.current) {
        this.options.series[0].data = (this.current?.hours || []).map(it => it.temperature);
        this.options.xAxis.data = (this.current?.hours || []).map(it => it.name);
      }
    },
    isDay() {
      const currentTime = new Date().getHours();
      return currentTime >= 6 && currentTime < 18;
    },
    toDay() {
      const date = new Date();
      return date.getFullYear() + "-" + (date.getMonth() + 1 > 9 ? date.getMonth() + 1 : "0" + (date.getMonth() + 1)) + "-" + date.getDate();
    }
  }
});
