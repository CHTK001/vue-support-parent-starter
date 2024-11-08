<template>
  <div>
    <ul class="sortable-list connectList agile-list" style="overflow: auto; display: none; height: 100%; position: fixed; right: 0; width: 700px; background: white" />
    <el-card class="fixed z-[100] pt-3 right-4 counter">
      <span v-html="data.title" />
    </el-card>
    <el-row v-for="it in data.data" :key="it">
      <el-col :span="24" class="mt-2 results">
        <el-card>
          <pre>
            <code id="person-code" class="class">
              <span v-html="it.code"/>
            </code>
          </pre>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import axios from "axios";
import $ from "jquery";
import { onBeforeMount, reactive } from "vue";

const data = reactive({
  data: [],
  title: ""
});

onBeforeMount(async () => {
  axios.get("/agent/stream_data").then(res => {
    let json = res.data;
    let xhr1 = json["data"];
    let xhr2 = json["title"];
    let split = xhr1.split("----");
    data.title = split[0] + split[1];
    split = split.slice(2);
    let $stream = $("#result > .v1");
    let arr = [];
    $stream.empty();
    for (let item of split) {
      console.log(item);
      if (!item.trim()) {
        continue;
      }

      let index = item.indexOf("</span>");
      let id = undefined;
      if (index > -1) {
        id = item.substring(0, index).replace("Opend <span style='color:red;'>", "").replaceAll("\\", "_").replaceAll(".", "_").replaceAll(":", "_").replaceAll("\s+", "_").replaceAll("/", "_").trim();
      }
      arr.push({
        id: id,
        code: item
      });
    }

    data.data = arr;
  });
});
</script>
<style lang="scss" scoped>
.counter {
  counter-reset: results;
}
.results::before {
  counter-increment: results;
  content: counter(results);
  color: #eee;
  font-size: 4.5em;
  position: absolute;
  text-align: right;
  left: 2%;
  width: 96%;
  line-height: 1em;
  top: 2%;
}
</style>
