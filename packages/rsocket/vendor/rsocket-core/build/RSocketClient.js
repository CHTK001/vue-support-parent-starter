/** Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *      
 */

'use strict';

             
                   
                   
          
                 
             
            
                       
                                                               

import {Flowable, Single, every} from 'rsocket-flowable';import * as _ns_invariant from './Invariant';
const invariant = (_ns_invariant && _ns_invariant.default !== undefined) ? _ns_invariant.default : _ns_invariant;
import {CONNECTION_STREAM_ID, FLAGS, FRAME_TYPES} from './RSocketFrame';
import {MAJOR_VERSION, MINOR_VERSION} from './RSocketVersion';
import {createClientMachine} from './RSocketMachine';
import {Lease, Leases} from './RSocketLease';
import {RequesterLeaseHandler, ResponderLeaseHandler} from './RSocketLease';
import {IdentitySerializers} from './RSocketSerialization';
import {ReassemblyDuplexConnection} from './ReassemblyDuplexConnection';

                                   
                                         
           
                            
                         
                      
                     
                             
     
                              
                              
                                 
                           
   

/**
 * RSocketClient: A client in an RSocket connection that will communicates with
 * the peer via the given transport client. Provides methods for establishing a
 * connection and initiating the RSocket interactions:
 * - fireAndForget()
 * - requestResponse()
 * - requestStream()
 * - requestChannel()
 * - metadataPush()
 */
export default class RSocketClient       {
  _cancel             ;
  _config                    ;
  _connection                               ;
  _socket                            ;

  constructor(config                    ) {
    this._checkConfig(config);
    this._cancel = null;
    this._config = config;
    this._connection = null;
    this._socket = null;
  }

  close()       {
    this._config.transport.close();
  }

  connect()                               {
    invariant(
      !this._connection,
      'RSocketClient: Unexpected call to connect(), already connected.',
    );
    this._connection = new Single(subscriber => {
      const transport = this._config.transport;
      let subscription;
      transport.connectionStatus().subscribe({
        onNext: status => {
          if (status.kind === 'CONNECTED') {
            subscription && subscription.cancel();
            subscriber.onComplete(
              new RSocketClientSocket(
                this._config,
                new ReassemblyDuplexConnection(transport),
              ),
            );
          } else if (status.kind === 'ERROR') {
            subscription && subscription.cancel();
            subscriber.onError(status.error);
          } else if (status.kind === 'CLOSED') {
            subscription && subscription.cancel();
            subscriber.onError(new Error('RSocketClient: Connection closed.'));
          }
        },
        onSubscribe: _subscription => {
          subscription = _subscription;
          subscriber.onSubscribe(() => {
            _subscription.cancel();
            transport.close();
          });
          subscription.request(Number.MAX_SAFE_INTEGER);
        },
      });
      transport.connect();
    });
    return this._connection;
  }

  _checkConfig(config                    ) {
    const setup = config.setup;
    const keepAlive = setup && setup.keepAlive;
    // wrap in try catch since in 'strict' mode the access to an unexciting window will throw
    // the ReferenceError: window is not defined exception
    try {
      // eslint-disable-next-line no-undef
      const navigator = window && window.navigator;
      if (
        keepAlive > 30000 &&
        navigator &&
        navigator.userAgent &&
        (navigator.userAgent.includes('Trident') ||
          navigator.userAgent.includes('Edg'))
      ) {
        console.warn(
          'rsocket-js: Due to a browser bug, Internet Explorer and Edge users may experience WebSocket instability with keepAlive values longer than 30 seconds.',
        );
      }
    } catch (e) {
      // ignore the error since it means that the code is running in non browser environment
    }
  }
}

/**
 * @private
 */
class RSocketClientSocket                                       {
  _machine                      ;

  constructor(config                    , connection                  ) {
    let requesterLeaseHandler                        ;
    let responderLeaseHandler                        ;

    const leasesSupplier = config.leases;
    if (leasesSupplier) {
      const lease = leasesSupplier();
      requesterLeaseHandler = new RequesterLeaseHandler((lease     )._receiver);
      responderLeaseHandler = new ResponderLeaseHandler(
        (lease     )._sender,
        (lease     )._stats,
      );
    }
    const {keepAlive, lifetime} = config.setup;

    this._machine = createClientMachine(
      connection,
      subscriber => connection.receive().subscribe(subscriber),
      lifetime,
      config.serializers,
      config.responder,
      config.errorHandler,
      requesterLeaseHandler,
      responderLeaseHandler,
    );

    // Send SETUP
    connection.sendOne(this._buildSetupFrame(config));

    // Send KEEPALIVE frames
    const keepAliveFrames = every(keepAlive).map(() => ({
      data: null,
      flags: FLAGS.RESPOND,
      lastReceivedPosition: 0,
      streamId: CONNECTION_STREAM_ID,
      type: FRAME_TYPES.KEEPALIVE,
    }));
    connection.send(keepAliveFrames);
  }

  fireAndForget(payload               )       {
    this._machine.fireAndForget(payload);
  }

  requestResponse(payload               )                        {
    return this._machine.requestResponse(payload);
  }

  requestStream(payload               )                          {
    return this._machine.requestStream(payload);
  }

  requestChannel(payloads                         )                          {
    return this._machine.requestChannel(payloads);
  }

  metadataPush(payload               )               {
    return this._machine.metadataPush(payload);
  }

  close()       {
    this._machine.close();
  }

  connectionStatus()                             {
    return this._machine.connectionStatus();
  }

  availability()         {
    return this._machine.availability();
  }

  _buildSetupFrame(config                    )             {
    const {
      dataMimeType,
      keepAlive,
      lifetime,
      metadataMimeType,
      payload,
    } = config.setup;

    const serializers = config.serializers || (IdentitySerializers     );
    const data = payload ? serializers.data.serialize(payload.data) : undefined;
    const metadata = payload
      ? serializers.metadata.serialize(payload.metadata)
      : undefined;
    let flags = 0;
    if (metadata !== undefined) {
      flags |= FLAGS.METADATA;
    }
    return {
      data,
      dataMimeType,
      flags: flags | (config.leases ? FLAGS.LEASE : 0),
      keepAlive,
      lifetime,
      majorVersion: MAJOR_VERSION,
      metadata,
      metadataMimeType,
      minorVersion: MINOR_VERSION,
      resumeToken: null,
      streamId: CONNECTION_STREAM_ID,
      type: FRAME_TYPES.SETUP,
    };
  }
}
