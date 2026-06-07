import "@livekit/components-styles";
import React, { useEffect, useMemo, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  Chevron,
  DisconnectButton,
  LeaveIcon,
  LiveKitRoom,
  MediaDeviceMenu,
  ParticipantTile,
  RoomAudioRenderer,
  TrackToggle,
  useLocalParticipant,
  useParticipants,
  useTracks,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Track } from "livekit-client";

export interface LiveKitFixedHostConferenceOptions {
  serverUrl: string;
  token: string;
  role: "host" | "guest";
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export interface LiveKitFixedHostConferenceHandle {
  unmount: () => void;
}

type ParticipantLike = ReturnType<typeof useParticipants>[number];

function participantName(participant?: ParticipantLike) {
  if (!participant) return "未知用户";
  return participant.name || participant.identity;
}

function isSameParticipant(a?: { identity: string }, b?: { identity: string }) {
  return !!a && !!b && a.identity === b.identity;
}

function isActiveTrackRef(trackRef?: TrackReferenceOrPlaceholder) {
  return !!trackRef?.publication && !trackRef.publication.isMuted;
}

function ConferenceNameEditor() {
  const { localParticipant } = useLocalParticipant();
  const [name, setName] = useState("");

  useEffect(() => {
    setName(localParticipant.name || "");
  }, [localParticipant.name]);

  async function saveName() {
    const nextName = name.trim();
    if (!nextName || nextName === localParticipant.name) return;
    await localParticipant.setName(nextName);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveName();
  }

  return React.createElement(
    "form",
    { className: "conference-name-editor", onSubmit: handleSubmit },
    React.createElement("span", { className: "conference-name-label" }, "我的名称"),
    React.createElement("input", {
      value: name,
      placeholder: participantName(localParticipant),
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value),
      onBlur: () => void saveName(),
      className: "conference-name-input",
      "aria-label": "修改我的名称",
    }),
  );
}

function EmptyPanel({ title }: { title: string }) {
  return React.createElement(
    "div",
    { className: "conference-empty-panel" },
    React.createElement("div", { className: "conference-empty-icon" }),
    React.createElement("div", { className: "conference-empty-title" }, title),
  );
}

function DeviceChevron() {
  return React.createElement(Chevron, { className: "conference-device-chevron" });
}

function ConferenceControls({ onError }: { onError?: (error: Error) => void }) {
  return React.createElement(
    "div",
    { className: "conference-custom-controls", "aria-label": "会议控制栏" },
    React.createElement(
      "div",
      { className: "conference-control-group" },
      React.createElement(TrackToggle, {
        source: Track.Source.Microphone,
        showIcon: true,
        className: "conference-icon-button",
        title: "麦克风",
        "aria-label": "麦克风",
        onDeviceError: onError,
      }),
      React.createElement(
        MediaDeviceMenu,
        {
          kind: "audioinput",
          requestPermissions: false,
          className: "conference-device-button",
          title: "选择麦克风",
          "aria-label": "选择麦克风",
        },
        React.createElement(DeviceChevron),
      ),
    ),
    React.createElement(
      "div",
      { className: "conference-control-group" },
      React.createElement(TrackToggle, {
        source: Track.Source.Camera,
        showIcon: true,
        className: "conference-icon-button",
        title: "摄像头",
        "aria-label": "摄像头",
        onDeviceError: onError,
      }),
      React.createElement(
        MediaDeviceMenu,
        {
          kind: "videoinput",
          requestPermissions: false,
          className: "conference-device-button",
          title: "选择摄像头",
          "aria-label": "选择摄像头",
        },
        React.createElement(DeviceChevron),
      ),
    ),
    React.createElement(TrackToggle, {
      source: Track.Source.ScreenShare,
      showIcon: true,
      className: "conference-icon-button",
      title: "共享屏幕",
      "aria-label": "共享屏幕",
      onDeviceError: onError,
    }),
    React.createElement(
      DisconnectButton,
      {
        className: "conference-icon-button conference-leave-button",
        title: "离开会议",
        "aria-label": "离开会议",
      },
      React.createElement(LeaveIcon, null),
    ),
  );
}

function CustomConferenceLayout({ role, onError }: { role: "host" | "guest"; onError?: (error: Error) => void }) {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const screenShareTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });

  useEffect(() => {
    void localParticipant.setAttributes({ role }).catch(() => undefined);
  }, [localParticipant, role]);

  const hostParticipant = useMemo(() => {
    return participants.find((participant) => participant.attributes?.role === "host")
      || participants.find((participant) => participant.isLocal && role === "host")
      || participants.find((participant) => !participant.isLocal)
      || localParticipant;
  }, [localParticipant, participants, role]);

  const hostVisualTrack = useMemo(() => {
    return screenShareTracks.find((trackRef) => isActiveTrackRef(trackRef) && isSameParticipant(trackRef.participant, hostParticipant))
      || cameraTracks.find((trackRef) => isActiveTrackRef(trackRef) && isSameParticipant(trackRef.participant, hostParticipant));
  }, [cameraTracks, hostParticipant, screenShareTracks]);

  const participantVisualTracks = useMemo(() => {
    const visualTracks = new Map<string, TrackReferenceOrPlaceholder>();
    for (const trackRef of screenShareTracks) {
      if (!isActiveTrackRef(trackRef) || isSameParticipant(trackRef.participant, hostParticipant)) continue;
      visualTracks.set(trackRef.participant.identity, trackRef);
    }
    for (const trackRef of cameraTracks) {
      if (!isActiveTrackRef(trackRef) || isSameParticipant(trackRef.participant, hostParticipant)) continue;
      if (!visualTracks.has(trackRef.participant.identity)) {
        visualTracks.set(trackRef.participant.identity, trackRef);
      }
    }
    return Array.from(visualTracks.values());
  }, [cameraTracks, hostParticipant, screenShareTracks]);

  return React.createElement(
    "div",
    { className: `conference-custom-layout${leftCollapsed ? " is-left-collapsed" : ""}` },
    React.createElement(RoomAudioRenderer, null),
    React.createElement(
      "div",
      { className: "conference-custom-main" },
      React.createElement(
        "aside",
        { className: "conference-share-panel" },
        React.createElement(
          "div",
          { className: "conference-panel-header" },
          !leftCollapsed && React.createElement(
            "div",
            { className: "conference-panel-title-block" },
            React.createElement("div", { className: "conference-panel-title" }, "参与人画面"),
            React.createElement("div", { className: "conference-panel-subtitle" }, `${participantVisualTracks.length} 个画面`),
          ),
          React.createElement(
            "button",
            {
              type: "button",
              className: "conference-collapse-button",
              onClick: () => setLeftCollapsed((value) => !value),
              title: leftCollapsed ? "展开左侧画面" : "收起左侧画面",
              "aria-label": leftCollapsed ? "展开左侧画面" : "收起左侧画面",
            },
            React.createElement(Chevron, { className: "conference-collapse-icon" }),
          ),
        ),
        !leftCollapsed && React.createElement(
          "div",
          { className: "conference-share-body" },
          participantVisualTracks.length === 0
            ? React.createElement(EmptyPanel, { title: "暂无画面" })
            : participantVisualTracks.map((trackRef: TrackReferenceOrPlaceholder) => React.createElement(
              ParticipantTile,
              {
                key: `${trackRef.participant.identity}-${trackRef.publication?.trackSid || trackRef.source}`,
                trackRef,
                className: "conference-share-tile",
              },
            )),
        ),
      ),
      React.createElement(
        "section",
        { className: "conference-host-panel" },
        React.createElement(
          "div",
          { className: "conference-host-header" },
          React.createElement("div", null,
            React.createElement("div", { className: "conference-host-kicker" }, "主持人"),
            React.createElement("div", { className: "conference-host-name" }, participantName(hostParticipant)),
          ),
          React.createElement(ConferenceNameEditor, null),
        ),
        React.createElement(
          "div",
          { className: "conference-host-stage" },
          hostVisualTrack
            ? React.createElement(ParticipantTile, { trackRef: hostVisualTrack, className: "conference-host-tile" })
            : React.createElement(EmptyPanel, { title: "主持人暂无画面" }),
        ),
      ),
    ),
    React.createElement(ConferenceControls, { onError }),
  );
}

export function mountLiveKitFixedHostConference(
  element: HTMLElement,
  options: LiveKitFixedHostConferenceOptions,
): LiveKitFixedHostConferenceHandle {
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
        className: "conference-livekit-room",
      },
      React.createElement(CustomConferenceLayout, {
        role: options.role,
        onError: options.onError,
      }),
    ),
  );

  return {
    unmount() {
      root.unmount();
    },
  };
}
