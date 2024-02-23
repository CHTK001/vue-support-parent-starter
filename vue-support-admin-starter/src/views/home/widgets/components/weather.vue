<template>
	<el-card shadow="hover" :header="header" class="item-background">
		<div class="three_days" v-for="(item,i) in weathArray" :key="i">
			<span>{{item.date}} {{  item.week }}</span>
			<div><el-icon style="font-size: 40px"><component :is="'sc-icon-' + item.weatherDayIcon"></component></el-icon></div>
			<span>{{item.minTemperature}}-{{item.maxTemperature}}℃</span>
			<span>{{item.weather}}</span>
			<span>{{item.windSpeed}}</span>
		</div>

	</el-card>
</template>

<script>
export default {
	data() {
		return {
			weathArray:[],
			header: '天气情况'
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
		afterGetWeather() {
			this.$API.part.weather.get({}).then(res => {
				if (!res?.data) {
					return;
				}
				this.$store.commit("weather", res.data);
				this.doAnalysis();
			})
		},
		doAnalysis(){
			const item = this.$store.state.weather;
			if (Object.keys(this.$store.state.weather).length == 0) {
				return ;
			}
			this.header = item?.city + " 未来7天天气情况"
			this.weathArray = item?.day || []
		}
	}
}
</script>

<style scoped lang="less">
.item-background p {
	color: #999;
	margin-top: 10px;
	line-height: 1.8;
}

.three_days {
	display: inline-flex;
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
}</style>

