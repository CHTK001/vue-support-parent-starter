<template>
  <div class="home-container">
    <el-card shadow="always" style="margin-bottom: 30px">
      <div class="emq-title">Configuration</div>
      <el-form ref="configForm" hide-required-asterisk size="small" label-position="top" :model="connection">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item prop="host" label="Host">
              <el-row :gutter="10">
                <el-col :span="7">
                  <el-select v-model="connection.protocol" @change="handleProtocolChange">
                    <el-option label="ws://" value="ws" />
                    <el-option label="wss://" value="wss" />
                  </el-select>
                </el-col>
                <el-col :span="17">
                  <el-input v-model="connection.host" />
                </el-col>
              </el-row>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item prop="port" label="Port">
              <el-input v-model.number="connection.port" type="number" placeholder="8083/8084" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item prop="endpoint" label="Mountpoint">
              <el-input v-model="connection.endpoint" placeholder="/mqtt" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item prop="clientId" label="Client ID">
              <el-input v-model="connection.clientId" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item prop="username" label="Username">
              <el-input v-model="connection.username" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item prop="password" label="Password">
              <el-input v-model="connection.password" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-button type="success" size="small" class="conn-btn" style="margin-right: 20px" :disabled="client.connected" :loading="connecting" @click="createConnection">
              {{ client.connected ? "Connected" : "Connect" }}
            </el-button>

            <el-button v-if="client.connected" type="danger" size="small" class="conn-btn" @click="destroyConnection">Disconnect</el-button>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
    <el-card shadow="always" style="margin-bottom: 30px">
      <div class="emq-title">Subscribe</div>
      <el-form ref="subscription" hide-required-asterisk size="small" label-position="top" :model="subscription">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item prop="topic" label="Topic">
              <el-input v-model="subscription.topic" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item prop="qos" label="QoS">
              <el-select v-model="subscription.qos">
                <el-option v-for="qos in qosList" :key="qos" :label="qos" :value="qos" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-button :disabled="!client.connected" type="success" size="small" class="subscribe-btn" @click="doSubscribe">
              {{ subscribeSuccess ? "Subscribed" : "Subscribe" }}
            </el-button>
            <el-button v-if="subscribeSuccess" :disabled="!client.connected" type="success" size="small" class="subscribe-btn" style="margin-left: 20px" @click="doUnSubscribe">Unsubscribe</el-button>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
    <el-card shadow="always" style="margin-bottom: 30px">
      <div class="emq-title">Publish</div>
      <el-form ref="publish" hide-required-asterisk size="small" label-position="top" :model="publish">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item prop="topic" label="Topic">
              <el-input v-model="publish.topic" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item prop="payload" label="Payload">
              <el-input v-model="publish.payload" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item prop="qos" label="QoS">
              <el-select v-model="publish.qos">
                <el-option v-for="qos in qosList" :key="qos" :label="qos" :value="qos" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <el-col :span="24">
        <el-button :disabled="!client.connected" type="success" size="small" class="publish-btn" @click="doPublish">Publish</el-button>
      </el-col>
    </el-card>
    <el-card shadow="always" style="margin-bottom: 30px">
      <div class="emq-title">Receive</div>
      <el-col :span="24">
        <el-input v-model="receiveNews" type="textarea" :rows="3" style="margin-bottom: 15px" readOnly />
      </el-col>
    </el-card>
  </div>
</template>

<script>
import mqtt from "mqtt";

export default {
  name: "Home",

  data() {
    return {
      connection: {
        protocol: "wss",
        host: "你的mqtt服务器地址",
        // server less服务器只有两种协议：mqtts: 8883; wss: 8084
        port: 8084,
        endpoint: "/mqtt",
        clean: true,
        connectTimeout: 30 * 1000, // ms
        reconnectPeriod: 4000, // ms
        clientId: "emqx_vue_" + Math.random().toString(16).substring(2, 8),
        // auth
        username: "void",
        password: "123"
      },
      subscription: {
        topic: "topic/mqttx",
        qos: 0
      },
      publish: {
        topic: "topic/browser",
        qos: 0,
        payload: '{ "msg": "Hello, I am browser." }'
      },
      receiveNews: "",
      qosList: [0, 1, 2],
      client: {
        connected: false
      },
      subscribeSuccess: false,
      connecting: false,
      retryTimes: 0
    };
  },
  methods: {
    initData() {
      this.client = {
        connected: false
      };
      this.retryTimes = 0;
      this.connecting = false;
      this.subscribeSuccess = false;
    },
    handleOnReConnect() {
      this.retryTimes += 1;
      if (this.retryTimes > 5) {
        try {
          this.client.end();
          this.initData();
          this.$message.error("Connection maxReconnectTimes limit, stop retry");
        } catch (error) {
          this.$message.error(error.toString());
        }
      }
    },
    createConnection() {
      try {
        this.connecting = true;
        const { protocol, host, port, endpoint, ...options } = this.connection;
        const connectUrl = `${protocol}://${host}:${port}${endpoint}`;
        this.client = mqtt.connect(connectUrl, options);
        if (this.client.on) {
          this.client.on("connect", () => {
            this.connecting = false;
            console.log("Connection succeeded!");
          });
          this.client.on("reconnect", this.handleOnReConnect);
          this.client.on("error", error => {
            console.log("Connection failed", error);
          });
          this.client.on("message", (topic, message) => {
            this.receiveNews = this.receiveNews.concat(message);
            console.log(`Received message ${message} from topic ${topic}`);
          });
        }
      } catch (error) {
        this.connecting = false;
        console.log("mqtt.connect error", error);
      }
    },
    // subscribe topic
    doSubscribe() {
      const { topic, qos } = this.subscription;
      this.client.subscribe(topic, { qos }, (error, res) => {
        if (error) {
          console.log("Subscribe to topics error", error);
          return;
        }
        this.subscribeSuccess = true;
        console.log("Subscribe to topics res", res);
      });
    },
    // unsubscribe topic
    doUnSubscribe() {
      const { topic } = this.subscription;
      this.client.unsubscribe(topic, error => {
        if (error) {
          console.log("Unsubscribe error", error);
        }
      });
    },
    // publish message
    doPublish() {
      const { topic, qos, payload } = this.publish;
      this.client.publish(topic, payload, { qos }, error => {
        if (error) {
          console.log("Publish error", error);
        }
      });
    },
    // disconnect
    destroyConnection() {
      if (this.client.connected) {
        try {
          this.client.end(false, () => {
            this.initData();
            console.log("Successfully disconnected!");
          });
        } catch (error) {
          console.log("Disconnect failed", error.toString());
        }
      }
    },
    handleProtocolChange(value) {
      this.connection.port = value === "wss" ? "8084" : "8083";
    }
  }
};
</script>

<style lang="scss">
.emq-title {
  font-size: 16px;
  color: #333333;
  font-weight: bolder;
  margin-bottom: 15px;

  &.h3 {
    font-size: 14px;
  }

  &[size="small"] {
    font-size: 14px;
  }

  .sub-title {
    font-weight: normal;
    display: block;
    font-size: 12px;
    color: #8f9297;
    margin-top: 12px;
  }

  &.required-title {
    &:before {
      content: "*";
      color: #f5222d;
      margin-right: 4px;
    }
  }
}

.home-container {
  max-width: 1100px;
  margin: 0 auto;

  .conn-btn {
    color: #fff;
    background-color: #00b173;
    font-size: 14px;
  }

  .publish-btn {
    margin-bottom: 20px;
    float: right;
  }

  .el-button--success {
    background-color: #34c388 !important;
    border-color: #34c388 !important;
    font-size: 14px !important;
  }

  .el-button--danger {
    background-color: #f5222d !important;
    border-color: #f5222d !important;
  }

  .el-form-item {
    &.is-error {
      .el-input__inner,
      .el-textarea__inner {
        box-shadow: 0 0 0 2px rgba(245, 34, 45, 0.2);
      }
    }
    &.is-success {
      .el-input__inner,
      .el-textarea__inner {
        border-color: #34c388 !important;
      }
    }
  }
}
</style>
