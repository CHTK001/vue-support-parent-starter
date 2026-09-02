import { createContextApp } from "@repo/app";
import { install as ReButtonInstall } from "@repo/ui/re-button";
import { install as ReInputInstall } from "@repo/ui/re-input";
import { install as ReInputNumberInstall } from "@repo/ui/re-input-number";
import { install as ReSelectInstall } from "@repo/ui/re-select";
import { install as ReDatePickerInstall } from "@repo/ui/re-date-picker";
import { install as ReSwitchInstall } from "@repo/ui/re-switch";
import { install as ReDialogInstall } from "@repo/ui/re-dialog";
import { install as ReTagInstall } from "@repo/ui/re-tag";
import { install as ReBadgeInstall } from "@repo/ui/re-badge";
import { install as RePaginationInstall } from "@repo/ui/re-pagination";
import { install as ReFormInstall } from "@repo/ui/re-form";
import { install as ReEmptyInstall } from "@repo/ui/re-empty";
import { install as ReSkeletonInstall } from "@repo/ui/re-skeleton";
import { install as ReTableInstall } from "@repo/ui/re-table";
import { install as ReSearchInstall } from "@repo/ui/re-search";
import { install as ReCardInstall } from "@repo/ui/re-card";
import { install as ReEchartsInstall } from "@repo/ui/re-echarts";
import { install as ReGraphRelationInstall } from "@repo/ui/re-graph-relation";
import { monitorRoutes } from "@pages/monitor";
import { serverRoutes } from "@pages/server";

createContextApp()
  .use([
    ReButtonInstall,
    ReInputInstall,
    ReInputNumberInstall,
    ReSelectInstall,
    ReDatePickerInstall,
    ReSwitchInstall,
    ReDialogInstall,
    ReTagInstall,
    ReBadgeInstall,
    RePaginationInstall,
    ReFormInstall,
    ReEmptyInstall,
    ReSkeletonInstall,
    ReTableInstall,
    ReSearchInstall,
    ReCardInstall,
    ReEchartsInstall,
    ReGraphRelationInstall,
  ])
  .routes([...monitorRoutes, ...serverRoutes] as never)
  .mount("#app");
