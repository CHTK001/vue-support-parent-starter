import "@livekit/components-styles";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";

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

export function mountLiveKitOfficialConference(
  element: HTMLElement,
  options: LiveKitOfficialConferenceOptions,
): LiveKitOfficialConferenceHandle {
  const root: Root = createRoot(element);

  root.render(
    React.createElement(
      LiveKitRoom,
      {
        serverUrl: options.serverUrl,
        token: options.token,
        connect: true,
        audio: false,
        video: false,
        options: {
          adaptiveStream: true,
          dynacast: true,
        },
        onConnected: options.onConnected,
        onDisconnected: options.onDisconnected,
        onError: options.onError,
        className: "conference-livekit-room conference-livekit-official-room",
      },
      React.createElement(VideoConference, {
        className: "lk-video-conference conference-livekit-video-conference",
      }),
    ),
  );

  return {
    unmount() {
      root.unmount();
    },
  };
}
