<template>
  <el-card shadow="hover" header="时钟" class="item-background">
    <div class="time">
      <h2>{{ time }}</h2>
      <p>{{ day }}</p>
    </div>
  </el-card>
</template>

<script>
import { dateFormat } from "@repo/utils";
export default {
  title: "时钟",
  icon: "ep:clock",
  description: "演示部件效果",
  data() {
    return {
      time: "",
      day: "",
    };
  },
  mounted() {
    this.showTime();
    setInterval(() => {
      this.showTime();
    }, 1000);
  },
  methods: {
    showTime() {
      this.time = dateFormat(new Date(), "hh:mm:ss");
      this.day = dateFormat(new Date(), "yyyy年MM月dd日");
    },
  },
};
</script>

<style scoped>
.item-background {
  background: linear-gradient(to right, #8e54e9, #4776e6);
  color: #fff;
}
.time h2 {
  font-size: 40px;
}
.time p {
  font-size: 14px;
  margin-top: 13px;
  opacity: 0.7;
}
</style>
