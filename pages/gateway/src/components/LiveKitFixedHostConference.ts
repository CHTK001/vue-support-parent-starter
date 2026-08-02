/**
 * LiveKit Fixed Host Conference —— 固定主持人会议室挂载
 *
 * 主持人固定在右侧，参与人画面在左侧网格。
 * 占位实现，接口与官方版一致。
 */
export interface LiveKitFixedHostConferenceOptions {
  serverUrl: string;
  token: string;
  hostIdentity?: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export interface LiveKitFixedHostConferenceHandle {
  unmount: () => void;
}

export function mountLiveKitFixedHostConference(
  element: HTMLElement,
  _options: LiveKitFixedHostConferenceOptions,
): LiveKitFixedHostConferenceHandle {
  element.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#909399;font-size:13px;">
      <span>LiveKit Fixed-Host Conference 占位实现</span>
    </div>
  `;
  return {
    unmount() {
      element.innerHTML = "";
    },
  };
}