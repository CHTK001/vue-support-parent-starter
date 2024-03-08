<template>
	<el-card shadow="hover" :header="header" class="item-background">
		<div :class="'sw-ui-main-container sc-fjdhpX fAFgBy' + ' ' + (current?.weatherDayIcon)">
			<div class="sc-htpNat sw-ui-main sc-gzVnrw blUPwB" @click="dialogVisible = true">
				<div class="sw-ui-main-arcContainer sc-dnqmqq cHlxbs">
					<div class="sw-ui-main-arc sc-iwsKbI bRmqwc">
						<el-icon style="font-size: 40px; position: relative; left: 15rem;">
							<component :is="'sc-icon-' + current?.weatherDayIcon"></component>
						</el-icon>	
					</div>
				</div>
				<div class="sw-ui-main-grow sc-htoDjs hzdUrF"></div>
				<p class="sw-typography sw-ui-main-temperature sc-bwzfXH eofBUk" color="inherit">{{current?.temperature}}°</p>
				<div class="sw-ui-main-timeContainer sc-VigVT eMNzRy">
					<span class="sw-typography sw-ui-main-rise sc-bwzfXH bpTFnS" color="textSecondary">{{current?.hours?.length > 0 ? current?.hours[0]?.name: 0}}</span>
					<span class="sw-typography sw-ui-main-temperatureRange sc-jTzLTM bFsUuh sc-bwzfXH dBbtWF" color="inherit">{{ current?.weather }} {{ current?.minTemperature }}°C~{{ current?.maxTemperature }}°C</span>
					<span class="sw-typography sw-ui-main-set sc-bwzfXH fwGqcW"	color="textSecondary">{{current?.hours?.length > 0 ? current?.hours[current?.hours.length - 1]?.name: 23}}</span> </div>
			</div>
		</div>
		<div :class="'three_days'+ ' ' + (item.weatherDayIcon)" v-for="(item, i) in weathArray" :key="i">
			<span>{{ item.date }} {{ item.week }}</span>
			<div>
				<el-icon style="font-size: 40px">
					<component :is="'sc-icon-' + item.weatherDayIcon"></component>
				</el-icon>
			</div>
			<span>{{ item.minTemperature }}-{{ item.maxTemperature }}℃</span>
			<span>{{ item.weather }}</span>
			<span>{{ item.windSpeed }}</span>
		</div>

	</el-card>

	<sc-dialog title="24小时天气情况" draggable v-model="dialogVisible">
		<div class="sw-ui-main-container sc-fjdhpX fAFgBy">
			<div class="sc-htpNat sw-ui-main sc-gzVnrw blUPwB">
				<scEcharts height="200px" width="100%" :option="options"></scEcharts>
			</div>
		</div>

	</sc-dialog>
</template>

<script>
import scEcharts from '@/components/scEcharts/index.vue';
export default {
	components: {scEcharts },
	data() {
		return {
			weathArray: [],
			current: {},
			dialogVisible: false,
			origin: {},
			header: '天气情况',
			options: {
                        type: '24小时天气',
                        tooltip: {
                            trigger: 'axis',
							axisPointer: {
                                type: 'shadow'
                            }
                        },
                        xAxis: {
                            type: 'category',
							axisLabel:{
								textStyle: {
									color: "#fff"
								},
							},
                            data: []
                        },
                        yAxis: {
							nameTextStyle: {
								color: "#fff"
							},
							axisLabel: {
                                formatter: '{value}',
								textStyle: {
									color: "#fff"
								},
                            },
                            type: 'value',
                            name: "温度（°）",
                            max: 40
                        },

                        series: [{
                            data: [],
                            type:'line',
							itemStyle:{
								normal:{
									label : {
										show: true, // 在折线拐点上显示数据
										formatter: function(v) {
											return v.data + "°"
										}
									},
									
									lineStyle:{                 
										width:3,  // 设置虚线宽度
										type:'dotted'  // 虚线'dotted' 实线'solid'
									}
								}
							}
                        }]
            }
		}
	},
	mounted() {
		if (Object.keys(this.$store.state.weather).length == 0) {
			this.afterGetWeather();
		}
		this.doAnalysis();
	},
	methods: {
		isDay() {
			const currentTime = new Date().getHours();
			return currentTime >= 6 && currentTime < 18;
		},
		toDay() {
			const date = new Date();
			return date.getFullYear() + '-' + ((date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : "0" + (date.getMonth() + 1)) + '-' + ((date.getDate()) > 9 ? (date.getDate()) : "0" + (date.getDate()));
		},
		afterGetWeather() {
			this.$API.part.weather.get({}).then(res => {
				if (!res?.data) {
					return;
				}
				this.$store.commit("weather", res.data);
				this.doAnalysis();
			})
		},
		doAnalysis() {
			const item = this.$store.state.weather;
			if (Object.keys(this.$store.state.weather).length == 0) {
				return;
			}
			this.origin = item;
			this.header = item?.city + " 未来7天天气情况"
			this.weathArray = item?.day || [];
			this.current = this.weathArray.find(item => item.date == this.toDay());
			if(this.current) {
				this.options.series[0].data = (this.current?.hours || []).map(it => it.temperature);
				this.options.xAxis.data = (this.current?.hours || []).map(it => it.name);
			}
		}
	}
}
</script>

<style scoped lang="less">
.item-background p {
	margin-top: 10px;
	line-height: 1.8;
}
.qing {
    border-radius: 4px !important;
    background: linear-gradient(rgb(40, 105, 233), rgb(121, 191, 255)) !important;
    box-shadow: rgba(0, 0, 0, 0.15) 0px 2px 20px !important;
    transition: all 0.2s ease 0;
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
	background: linear-gradient(rgb(86, 107, 110), rgb(125, 147, 155));
	box-shadow: rgba(0, 0, 0, 0.15) 0px 2px 20px;
	border-radius: 10px;
	display: inline-flex;
	color: white;
	flex-direction: column;
	justify-content: space-around;
	align-items: center;
	width: 25%;
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
	color: white;
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
	font-size: 2.5rem;
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

