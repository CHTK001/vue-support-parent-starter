import { fetchCheckProjectForDevice, fetchDeleteProjectForDevice, fetchSyncProjectForDevice, fetchSyncProjectForDeviceOrg, fetchUpdateProjectForDevice } from "@/api/manage/project-device";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { nextTick, reactive } from "vue";
import { useI18n } from "vue-i18n";
import { fetchSyncMessageForDevice } from "@/api/manage/device-message";
import { router } from "@repo/core";
import { Base64 } from "js-base64";
/**
 * 创建一个新的 Device 实例。
 *
 * @param options 一个可选的配置对象
 * @return 一个新的 LLMDialog 实例。
 */
export function createDevice(options?: { [key: string]: any }) {
  return reactive(new Device(options));
}

/**
 * 获取资源图标
 *
 * @param row
 * @return
 */
export function getResourceIcon(row) {
  if (row == "CAMERA") {
    return "mingcute:computer-camera-fill";
  }

  if (row == "MEN_JIN") {
    return "ri:id-card-line";
  }
  return "ri:device-line";
}

export class Device {
  private _t: any;
  constructor(options?: { [key: string]: any }) {
    const { t } = useI18n();
    this._t = t;
  }
  async onDelete(tableRef, row, form) {
    await fetchDeleteProjectForDevice(row.sysTemplateId).then((res) => {
      if (res.code == "00000") {
        tableRef.value.reload(form);
        message(this._t("message.deleteSuccess"), { type: "success" });
        return;
      }
    });
  }

  async handleUpdateData(item) {
    fetchUpdateProjectForDevice(item).then((res) => {
      if (res.code == "00000") {
        message(this._t("message.updateSuccess"), { type: "success" });
        return;
      }
    });
  }
  async dialogOpen(saveDialog, item, mode) {
    nextTick(() => {
      saveDialog.setData(item).open(mode);
    });
  }

  async handlePreviewCardHistory(cardHistoryRef, row, mode) {
    cardHistoryRef.handleOpen(row, mode);
  }
  async handleChannel(channelDialogRef, row, mode) {
    channelDialogRef.handleOpen(row, mode);
  }
  async syncMessageEvent(row, mode) {
    message("同步时间较长请耐心等待, 请勿重复/点击其它设备", { type: "success" });
    fetchSyncMessageForDevice(row).then((res) => {
      if (res.code == "00000") {
        message(this._t("message.syncSuccess"), { type: "success" });
        return;
      }
    });
  }
  async handlePreviewUrl(cameraPreviewDialogRef, row, mode) {
    router.push({
      name: "CameraPreview",
      query: {
        data: Base64.encode(JSON.stringify(row)),
      },
    });
  }
  async handleTimeline(timelineDialogRef, item) {
    timelineDialogRef.handleOpen(item);
  }
  async handleOnline(item: any) {
    fetchCheckProjectForDevice({
      sysDeviceCameraIds: [item.sysDeviceId],
    }).then(async (res) => {
      if (res.code == "00000") {
        message(this._t("message.checkSuccess"), { type: "success" });
        return;
      }
    });
  }
  async handleSync(env) {
    fetchSyncProjectForDevice(env).then((res) => {
      if (res.code == "00000") {
        message(this._t("message.syncSuccess"), { type: "success" });
        return;
      }
    });
  }
  async handleSyncOrg(env) {
    fetchSyncProjectForDeviceOrg(env).then((res) => {
      if (res.code == "00000") {
        message(this._t("message.syncSuccess"), { type: "success" });
        return;
      }
    });
  }
}
