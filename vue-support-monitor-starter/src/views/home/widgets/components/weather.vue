<template>
	<el-card shadow="hover" header="天气情况" class="item-background">
	</el-card>
</template>

<script>
	export default {
		data() {
			return {
				dayWeather:  "",
				dayWindDirection: "",
				dayWindPower: '',
				nightWeather:  "",
				nightWindDirection: "",
				nightWindPower: '',
				aqiName: '',
				pm25: '',
				so2: ''
			}		
		},
		mounted(){
			this.afterGetWeather();
		},
		methods: {
			afterGetWeather(){
				this.$API.part.weather.get({}).then(res=>{
					this.$store.commit("weather",res.data);
					this.dayWeather = this.$store.state.weather.dayWeather;
					this.dayWindDirection = this.$store.state.weather.dayWindDirection;
					this.dayWindPower = this.$store.state.weather.dayWindPower;
					this.nightWeather = this.$store.state.weather.nightWeather;
					this.nightWindDirection = this.$store.state.weather.nightWindDirection;
					this.nightWindPower = this.$store.state.weather.nightWindPower;
				})
		}
	}
}
</script>

<style scoped>
	.item-background p {color: #999;margin-top:10px;line-height: 1.8;}
</style>
