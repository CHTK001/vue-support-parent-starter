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

             
                   
        
                
          
                 
                   
                       
             
                
              
                     
                       
                                                               

import {Flowable} from 'rsocket-flowable';import * as _ns_invariant from './Invariant';
const invariant = (_ns_invariant && _ns_invariant.default !== undefined) ? _ns_invariant.default : _ns_invariant;
import {
  getFrameTypeName,
  CONNECTION_STREAM_ID,
  ERROR_CODES,
  FRAME_TYPES,
  FLAGS,
} from './RSocketFrame';
import {IdentitySerializers} from './RSocketSerialization';
import {createServerMachine} from './RSocketMachine';
import {Leases} from './RSocketLease';
import {RequesterLeaseHandler, ResponderLeaseHandler} from './RSocketLease';
import {ReassemblyDuplexConnection} from './ReassemblyDuplexConnection';

                                  
                                      
               
 
                                   
                      
                                 
                           
                              
                                         
                             
                                 
                           
   

/**
 * RSocketServer: A server in an RSocket connection that accepts connections
 * from peers via the given transport server.
 */
export default class RSocketServer       {
  _config                    ;
  _connections                           ;
  _started         ;
  _subscription                ;

  constructor(config                    ) {
    this._config = config;
    this._connections = new Set();
    this._started = false;
    this._subscription = null;
  }

  start()       {
    invariant(
      !this._started,
      'RSocketServer: Unexpected call to start(), already started.',
    );
    this._started = true;
    this._config.transport.start().subscribe({
      onComplete: this._handleTransportComplete,
      onError: this._handleTransportError,
      onNext: this._handleTransportConnection,
      onSubscribe: subscription => {
        this._subscription = subscription;
        subscription.request(Number.MAX_SAFE_INTEGER);
      },
    });
  }

  stop()       {
    if (this._subscription) {
      this._subscription.cancel();
    }
    this._config.transport.stop();
    this._handleTransportError(
      new Error('RSocketServer: Connection terminated via stop().'),
    );
  }

  _handleTransportComplete = ()       => {
    this._handleTransportError(
      new Error('RSocketServer: Connection closed unexpectedly.'),
    );
  };

  _handleTransportError = (error       )       => {
    this._connections.forEach(connection => {
      // TODO: Allow passing in error
      connection.close();
    });
  };

  _handleTransportConnection = (connection                  )       => {
    const swapper                           = new SubscriberSwapper();
    let subscription;
    connection = new ReassemblyDuplexConnection(connection);
    connection.receive().subscribe(
      swapper.swap({
        onError: error => console.error(error),
        onNext: frame => {
          switch (frame.type) {
            case FRAME_TYPES.RESUME:
              connection.sendOne({
                code: ERROR_CODES.REJECTED_RESUME,
                flags: 0,
                message: 'RSocketServer: RESUME not supported.',
                streamId: CONNECTION_STREAM_ID,
                type: FRAME_TYPES.ERROR,
              });
              connection.close();
              break;
            case FRAME_TYPES.SETUP:
              if (this._setupLeaseError(frame)) {
                connection.sendOne({
                  code: ERROR_CODES.INVALID_SETUP,
                  flags: 0,
                  message: 'RSocketServer: LEASE not supported.',
                  streamId: CONNECTION_STREAM_ID,
                  type: FRAME_TYPES.ERROR,
                });
                connection.close();
                break;
              }
              const serializers = this._getSerializers();

              let requesterLeaseHandler                       ;
              let responderLeaseHandler                       ;

              const leasesSupplier = this._config.leases;
              if (leasesSupplier) {
                const lease = leasesSupplier();
                requesterLeaseHandler = new RequesterLeaseHandler(
                  (lease     )._receiver,
                );
                responderLeaseHandler = new ResponderLeaseHandler(
                  (lease     )._sender,
                  (lease     )._stats,
                );
              }
              const serverMachine = createServerMachine(
                connection,
                subscriber => {
                  swapper.swap(subscriber);
                },
                frame.lifetime,
                serializers,
                this._config.errorHandler,
                requesterLeaseHandler,
                responderLeaseHandler,
              );
              try {
                const requestHandler = this._config.getRequestHandler(
                  serverMachine,
                  deserializePayload(serializers, frame),
                );
                serverMachine.setRequestHandler(requestHandler);
                this._connections.add(serverMachine);
                connection.connectionStatus().subscribe({
                  onNext: status => {
                    if (status.kind === 'CLOSED' || status.kind === 'ERROR') {
                      this._connections.delete(serverMachine);
                    }
                  },
                  onSubscribe: subscription =>
                    subscription.request(Number.MAX_SAFE_INTEGER),
                });
              } catch (error) {
                connection.sendOne({
                  code: ERROR_CODES.REJECTED_SETUP,
                  flags: 0,
                  message:
                    'Application rejected setup, reason: ' + error.message,
                  streamId: CONNECTION_STREAM_ID,
                  type: FRAME_TYPES.ERROR,
                });
                connection.close();
              }
              break;
            default:
              invariant(
                false,
                'RSocketServer: Expected first frame to be SETUP or RESUME, ' +
                  'got `%s`.',
                getFrameTypeName(frame.type),
              );
          }
        },
        onSubscribe: _subscription => {
          subscription = _subscription;
          subscription.request(1);
        },
      }),
    );
  };

  _getSerializers()                           {
    return this._config.serializers || (IdentitySerializers     );
  }

  _setupLeaseError(frame       )          {
    const clientLeaseEnabled = (frame.flags & FLAGS.LEASE) === FLAGS.LEASE;
    const serverLeaseEnabled = this._config.leases;
    return clientLeaseEnabled && !serverLeaseEnabled;
  }
}

class SubscriberSwapper                              {
  _target                        ;
  _subscription                ;

  constructor(target                        ) {
    this._target = target;
  }

  swap(next                       )                 {
    this._target = next;
    if (this._subscription) {
      this._target.onSubscribe && this._target.onSubscribe(this._subscription);
    }
    return this;
  }

  onComplete() {
    invariant(this._target, 'must have target');
    this._target.onComplete && this._target.onComplete();
  }
  onError(error) {
    invariant(this._target, 'must have target');
    this._target.onError && this._target.onError(error);
  }
  onNext(value   ) {
    invariant(this._target, 'must have target');
    this._target.onNext && this._target.onNext(value);
  }
  onSubscribe(subscription               ) {
    invariant(this._target, 'must have target');
    this._subscription = subscription;
    this._target.onSubscribe && this._target.onSubscribe(subscription);
  }
}

function deserializePayload      (
  serializers                          ,
  frame               ,
)                {
  return {
    data: serializers.data.deserialize(frame.data),
    metadata: serializers.metadata.deserialize(frame.metadata),
  };
}
