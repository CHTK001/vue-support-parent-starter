<template>
  <div id="callPage" class="call-page h-full w-full">
    <div class="h-full">
      <div :class="['screen', { 'full-screen': fullScreen }]">
        <video ref="localVideoRef" autoplay class="h-full" />
      </div>
      <div :class="['screen', { 'full-screen-owner': fullScreen }]">
        <video ref="remoteVideoRef" autoplay class="h-full" />
      </div>
    </div>
  </div>
</template>
<script>
import { socket, useUserStoreHook } from "@repo/core";
import { message } from "@repo/utils";
import { defineExpose, reactive, ref } from "vue";

const useUserStoreHookObject = useUserStoreHook();
const localVideoRef = ref();
const remoteVideoRef = ref();
const fullScreen = ref(false);
const environment = reactive({
  socket: null,
  yourConn: null,
  yourStream: null,
  connectedUser: null,
  configuration: {
    iceServers: []
  },
  form: {}
});

const goFullScreen = () => {
  fullScreen.value = !fullScreen.value;
};
const handleCall = async form => {
  event.preventDefault();
  environment.form = form;
  initializeHandleSocket();
  initializeHandlePeerConnection();
};
const handleOut = async () => {
  handleSend({
    type: "leave"
  });
  handleLeave();
};

const handleLeave = async () => {
  remoteVideoRef.value.srcObject = null;
  localVideoRef.value.srcObject = null;
  message("已退出", { type: "warning" });
  environment.socket?.close();
  environment.socket = null;
  environment.yourStream?.close();
  environment.yourStream = null;
  environment.yourConn?.close();
  environment.yourConn = null;
};
const handleRegisterEvent = async () => {
  environment.yourConn.onaddstream = function (e) {
    remoteVideoRef.value.srcObject = e.stream;
  };
  environment.yourConn.onicecandidate = function (event) {
    if (event.candidate) {
      handleSend({
        type: "candidate",
        candidate: event.candidate
      });
    }
  };

  environment.yourConn.createOffer(
    function (offer) {
      handleSend({
        type: "offer",
        offer: offer
      });

      environment.yourConn.setLocalDescription(offer);
    },
    function (error) {
      alert("Error when creating an offer");
    }
  );
};
const handleUserMedia = async myStream => {
  environment.yourStream = myStream;
  environment.yourConn = new PeerConnection(environment.configuration);
  environment.yourConn.addStream(myStream);
  handleRegisterEvent();
  localVideoRef.value.srcObject = myStream;
};

const handleSend = async message => {
  if (environment.connectedUser) {
    message.name = environment.connectedUser;
    message.targetForm = environment.form;
  }
  this.socket.emit(JSON.stringify(message));
};
const initializeHandlePeerConnection = async () => {
  var PeerConnection = window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.RTCPeerConnection || undefined;
  var RTCSessionDescription = window.webkitRTCSessionDescription || window.mozRTCSessionDescription || window.RTCSessionDescription || undefined;
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  navigator.getUserMedia({ video: true, audio: true }, handleUserMedia, function (error) {
    console.log(error);
  });
};
const initializeHandleSocket = async () => {
  environment.socket = socket(config.webrtcUrl.split(","), config.webrtcContext || "/socket.io");
  initializeHandleLinstenerSocket();
};

const handleLogin = async () => {
  //TODO:
};

const handleCandidate = async candidate => {
  environment.yourConn.addIceCandidate(new RTCIceCandidate(candidate));
};

const handleAnswer = async answer => {
  environment.yourConn.setRemoteDescription(new RTCSessionDescription(answer));
};
const handleOffer = async (offer, name) => {
  environment.connectedUser = name;
  environment.yourConn.setRemoteDescription(new RTCSessionDescription(offer));

  //create an answer to an offer
  environment.yourConn.createAnswer(
    function (answer) {
      environment.yourConn.setLocalDescription(answer);

      handleSend({
        type: "answer",
        answer: answer
      });
    },
    function (error) {
      alert("Error when creating an answer");
    }
  );
};
const initializeHandleLinstenerSocket = async () => {
  environment.socket.on("message", msg => {
    console.log("Got message", msg.data);
    var data = JSON.parse(msg.data);
    switch (data.type) {
      case "login":
        switch (data.type) {
          case "login":
            handleLogin(data.success);
            break;
          //when somebody wants to call us
          case "offer":
            handleOffer(data.offer, data.name);
            break;
          case "answer":
            handleAnswer(data.answer);
            break;
          //when a remote peer sends an ice candidate to us
          case "candidate":
            handleCandidate(data.candidate);
            break;
          case "leave":
            handleLeave();
            break;
          default:
            break;
        }
        data.success;
        break;
      //when somebody wants to call us
      case "offer":
        this.handleOffer(data.offer, data.name);
        break;
      case "answer":
        this.handleAnswer(data.answer);
        break;
      //when a remote peer sends an ice candidate to us
      case "candidate":
        this.handleCandidate(data.candidate);
        break;
      case "leave":
        this.handleLeave();
        break;
      default:
        break;
    }
  });
};

defineExpose({
  handleCall,
  handleOut,
  goFullScreen
});
</script>
<style scoped lang="scss">
.full-screen {
  width: 100% !important;
}
.full-screen-owner {
  width: 100px;
  height: 100px;
  poistion: relative;

  video {
    poistion: absolute;
    bottom: 0;
    right: 0;
  }
}
.screen {
  width: 50%;
}
</style>
