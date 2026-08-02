/**
 * LiveKit Official Conference —— LiveKit 官方组件挂载
 *
 * 真实实现需要 @livekit/components-react + react + react-dom，
 * 此处保留接口签名与挂载/卸载逻辑，宿主通过 ConferenceRoom 注入。
 */
export interface LiveKitOfficialConferenceOptions {
  serverUrl: string;
  token: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export interface LiveKitOfficialConferenceHandle {
  unmount: () => void;
}

/** 挂载 LiveKit 官方 VideoConference 到指定 DOM 节点 */
export function mountLiveKitOfficialConference(
  element: HTMLElement,
  _options: LiveKitOfficialConferenceOptions,
): LiveKitOfficialConferenceHandle {
  // 占位：真实实现需引入 @livekit/components-react
  element.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#909399;font-size:13px;">
      <span>LiveKit Official Conference 占位实现</span>
    </div>
  `;
  return {
    unmount() {
      element.innerHTML = "";
    },
  };
}