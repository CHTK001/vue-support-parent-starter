<script>
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import zhCnLocale from "@fullcalendar/core/locales/zh-cn";
import interactionPlugin from "@fullcalendar/interaction";
export default {
  components: {
    FullCalendar, // make the <FullCalendar> tag available
  },
  data: function () {
    return {
      calendarOptions: {
        locale: zhCnLocale,
        plugins: [dayGridPlugin, interactionPlugin],
        initialView: "dayGridMonth",
        weekends: false,
        selectable: true,
        events: [{}],
        select: function (info) {},
      },
    };
  },
};
</script>
<template>
  <div>
    <FullCalendar :options="calendarOptions" />
  </div>
</template>
