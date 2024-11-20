import { fetchGetWeather } from "../../api/common/weather";
import { localStorageProxy } from "@repo/utils";
import { onBeforeUnmount } from "vue";

onBeforeUnmount(() => {
  close();
});
export const useWeatherStore = {
  id: "weather-setting",
  storageKey: "weather-layout-setting",
  weather: {
    data: null,
    timestamp: null,
  },
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
        type: "shadow",
      },
    },
    xAxis: {
      type: "category",
      axisLabel: {
        textStyle: {
          color: "#fff",
        },
      },
      data: [],
    },
    yAxis: {
      nameTextStyle: {
        color: "#fff",
      },
      axisLabel: {
        formatter: "{value}",
        textStyle: {
          color: "#fff",
        },
      },
      type: "value",
    },

    series: [
      {
        name: "温度",
        data: [],
        type: "line",
        itemStyle: {
          normal: {
            label: {
              show: true, // 在折线拐点上显示数据
              formatter: function (v) {
                return v.data + "°";
              },
            },

            lineStyle: {
              width: 3, // 设置虚线宽度
              type: "dotted", // 虚线'dotted' 实线'solid'
            },
          },
        },
      },
      {
        name: "湿度",
        data: [],
        type: "line",
        itemStyle: {
          normal: {
            label: {
              show: true, // 在折线拐点上显示数据
            },
          },
        },
      },
      {
        name: "风力",
        data: [],
        type: "line",
        itemStyle: {
          normal: {
            label: {
              show: true, // 在折线拐点上显示数据
            },
          },
        },
      },
    ],
  },
  actions: {
    async load() {
      if (!useWeatherStore.weather.data) {
        return new Promise((resolve) => {
          this.afterGetWeather();
          resolve(null);
        });
      }
      return new Promise((resolve) => {
        this.doAnalysis();
        resolve(null);
      });
    },
    async afterGetWeather() {
      const data: any = localStorageProxy().getItem(useWeatherStore.storageKey);
      if (!data?.data) {
        fetchGetWeather({}).then(async (res: any) => {
          useWeatherStore.weather = {
            data: res.data,
            timestamp: new Date().getTime(),
          };
          localStorageProxy().setItem(
            useWeatherStore.storageKey,
            useWeatherStore.weather,
          );
          this.doAnalysis();
        });
        return;
      }
      useWeatherStore.weather.data = data?.data;
      useWeatherStore.weather.timestamp = data?.timestamp;
      this.doAnalysis();
    },

    doAnalysis() {
      const item = useWeatherStore.weather?.data;
      const timestamp = useWeatherStore.weather?.timestamp || 0;
      if (new Date().getTime() - timestamp > 1000 * 60 * 60) {
        localStorageProxy().removeItem(useWeatherStore.storageKey);
      }
      if (Object.keys(useWeatherStore.weather).length == 0) {
        return;
      }
      useWeatherStore.origin = item;
      useWeatherStore.city = item?.city;
      useWeatherStore.header = item?.city + " 未来7天天气情况";
      useWeatherStore.weatherArray = item?.day || [];
      useWeatherStore.current = useWeatherStore.weatherArray.find(
        (item) => item.date == this.toDay(),
      );
      if (useWeatherStore.current) {
        useWeatherStore.options.series[0].data = (item?.hours || []).map(
          (it) => it.temperature,
        );
        useWeatherStore.options.series[1].data = (item?.hours || []).map(
          (it) => it.humidity,
        );
        useWeatherStore.options.series[2].data = (item?.hours || []).map(
          (it) => it.windSpeed,
        );
        useWeatherStore.options.xAxis.data = (item?.hours || []).map(
          (it) => it.time,
        );
      }
    },
    isDay() {
      const currentTime = new Date().getHours();
      return currentTime >= 6 && currentTime < 18;
    },
    toDay() {
      const date = new Date();
      return (
        date.getFullYear() +
        "-" +
        (date.getMonth() + 1 > 9
          ? date.getMonth() + 1
          : "0" + (date.getMonth() + 1)) +
        "-" +
        date.getDate()
      );
    },
  },
};
