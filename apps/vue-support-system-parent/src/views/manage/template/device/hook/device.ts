import { fetchCheckProjectForDevice, fetchDeleteProjectForDevice, fetchSyncProjectForDevice, fetchSyncProjectForDeviceOrg, fetchUpdateProjectForDevice } from "@/api/manage/project-device";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { nextTick, reactive } from "vue";
import { useI18n } from "vue-i18n";
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
    return useRenderIcon("mingcute:computer-camera-fill");
  }

  return useRenderIcon("ri:device-line");
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
  async handlePreviewUrl(cameraPreviewDialogRef, row) {
    cameraPreviewDialogRef.handleOpen(row);
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
