import { describe, expect, it } from "vitest";
import {
  normalizeContainer,
  normalizeImageContainerStartConfig,
} from "../../../apps/vue-support-monitor-starter/src/api/docker/normalizers";

describe("monitor docker api normalization", () => {
  it("normalizes image container start config into backend request fields", () => {
    expect(
      normalizeImageContainerStartConfig({
        containerName: "monitor-ui-test",
        ports: [{ hostPort: "6380", containerPort: "6379" }],
        env: [{ name: "REDIS_ARGS", value: "--appendonly yes" }],
        volumes: [
          {
            hostPath: "/data/redis",
            containerPath: "/data",
            readOnly: false,
          },
        ],
        memoryLimit: "512m",
        cpuLimit: "0.5",
      }),
    ).toEqual({
      containerName: "monitor-ui-test",
      portBindings: ["6380:6379/tcp"],
      environmentVariables: ["REDIS_ARGS=--appendonly yes"],
      volumeBindings: ["/data/redis:/data"],
      memoryLimit: 536870912,
      cpuLimit: 500000000,
    });
  });

  it("normalizes container status and server aliases for monitor pages", () => {
    expect(
      normalizeContainer({
        systemSoftContainerId: 7,
        systemServerId: 3,
        systemSoftContainerStatus: "RUNNING",
        systemSoftContainerDockerId: "1234567890abcdef",
        systemSoftContainerName: "redis-main",
        systemSoftContainerImage: "redis/redis-stack-server",
        systemSoftContainerImageTag: "latest",
        systemServerName: "测试Docker服务器" as any,
      } as any),
    ).toMatchObject({
      id: 7,
      containerId: "7",
      dockerId: "1234567890abcdef",
      status: "running",
      systemSoftContainerStatus: "running",
      serverName: "测试Docker服务器",
      systemSoftContainerServerName: "测试Docker服务器",
    });
  });

  it("supports wizard aliases used by monitor docker dialogs", () => {
    expect(
      normalizeImageContainerStartConfig({
        containerName: "monitor-wizard-test",
        portMappings: [
          { hostPort: "8080", containerPort: "80", protocol: "tcp" },
          { hostPort: "5353", containerPort: "5353", protocol: "udp" },
        ],
        envVars: [
          { name: "TZ", value: "Asia/Shanghai" },
          { name: "APP_MODE", value: "test" },
        ],
        volumeMounts: [
          {
            hostPath: "/opt/data",
            containerPath: "/data",
            readOnly: true,
          },
        ],
        workDir: "/workspace",
        hostname: "monitor-wizard",
        autoStart: false,
      }),
    ).toEqual({
      containerName: "monitor-wizard-test",
      portBindings: ["8080:80/tcp", "5353:5353/udp"],
      environmentVariables: ["TZ=Asia/Shanghai", "APP_MODE=test"],
      volumeBindings: ["/opt/data:/data:ro"],
      workingDirectory: "/workspace",
      hostname: "monitor-wizard",
      autoStart: false,
    });
  });
});
