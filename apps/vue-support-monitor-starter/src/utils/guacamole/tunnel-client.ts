/**
 * Guacamole 隧道客户端
 * 基于 simple-client 的封装，提供兼容的接口
 */

import SimpleGuacamoleClient, { type SimpleGuacamoleConfig, type SimpleGuacamoleEvents } from './simple-client';

export type TunnelClientConfig = SimpleGuacamoleConfig;

export class GuacamoleTunnelClient extends SimpleGuacamoleClient {
  constructor(config: TunnelClientConfig, events: SimpleGuacamoleEvents = {}) {
    super(config, events);
  }
}

export default GuacamoleTunnelClient;


