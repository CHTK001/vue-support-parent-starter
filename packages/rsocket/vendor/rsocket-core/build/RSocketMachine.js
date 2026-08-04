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

             
              
                   
                   
        
                
          
            
                   
                 
                  
                
                       
                     
                      
                    
                       
                                                                               
                                                               

import {Flowable, FlowableProcessor, Single} from 'rsocket-flowable';
import {
  createErrorFromFrame,
  getFrameTypeName,
  isComplete,
  isNext,
  isRespond,
  CONNECTION_STREAM_ID,
  ERROR_CODES,
  FLAGS,
  FRAME_TYPES,
  MAX_REQUEST_N,
  MAX_STREAM_ID,
} from './RSocketFrame';
import {IdentitySerializers} from './RSocketSerialization';
import {
  LeaseHandler,
  RequesterLeaseHandler,
  ResponderLeaseHandler,
  Disposable,
} from './RSocketLease';import * as _ns_RSocketError from './RSocketError';
const RSocketError = (_ns_RSocketError && _ns_RSocketError.default !== undefined) ? _ns_RSocketError.default : _ns_RSocketError;
class ResponderWrapper                                  {
  _responder                        ;

  constructor(responder                         ) {
    this._responder = responder || {};
  }

  setResponder(responder                         )       {
    this._responder = responder || {};
  }

  fireAndForget(payload               )       {
    if (this._responder.fireAndForget) {
      try {
        this._responder.fireAndForget(payload);
      } catch (error) {
        console.error('fireAndForget threw an exception', error);
      }
    }
  }

  requestResponse(payload               )                        {
    let error        ;
    if (this._responder.requestResponse) {
      try {
        return this._responder.requestResponse(payload);
      } catch (_error) {
        console.error('requestResponse threw an exception', _error);
        error = _error;
      }
    }
    return Single.error(error || new Error('not implemented'));
  }

  requestStream(payload               )                          {
    let error        ;
    if (this._responder.requestStream) {
      try {
        return this._responder.requestStream(payload);
      } catch (_error) {
        console.error('requestStream threw an exception', _error);
        error = _error;
      }
    }
    return Flowable.error(error || new Error('not implemented'));
  }

  requestChannel(payloads                         )                          {
    let error        ;
    if (this._responder.requestChannel) {
      try {
        return this._responder.requestChannel(payloads);
      } catch (_error) {
        console.error('requestChannel threw an exception', _error);
        error = _error;
      }
    }
    return Flowable.error(error || new Error('not implemented'));
  }

  metadataPush(payload               )               {
    let error        ;
    if (this._responder.metadataPush) {
      try {
        return this._responder.metadataPush(payload);
      } catch (_error) {
        console.error('metadataPush threw an exception', _error);
        error = _error;
      }
    }
    return Single.error(error || new Error('not implemented'));
  }
}

                                                                    
                                                                   
 

export function createServerMachine      (
  connection                  ,
  connectionPublisher                                                        ,
  keepAliveTimeout        ,
  serializers                            ,
  errorHandler                  ,
  requesterLeaseHandler                         ,
  responderLeaseHandler                         ,
)                       {
  return new RSocketMachineImpl(
    'SERVER',
    connection,
    connectionPublisher,
    keepAliveTimeout,
    serializers,
    undefined,
    errorHandler,
    requesterLeaseHandler,
    responderLeaseHandler,
  );
}

export function createClientMachine      (
  connection                  ,
  connectionPublisher                                                        ,
  keepAliveTimeout        ,
  serializers                            ,
  requestHandler                          ,
  errorHandler                  ,
  requesterLeaseHandler                         ,
  responderLeaseHandler                         ,
)                       {
  return new RSocketMachineImpl(
    'CLIENT',
    connection,
    connectionPublisher,
    keepAliveTimeout,
    serializers,
    requestHandler,
    errorHandler,
    requesterLeaseHandler,
    responderLeaseHandler,
  );
}

class RSocketMachineImpl                                       {
  _requestHandler                        ;
  _connection                  ;
  _nextStreamId        ;
  _receivers                                      ;
  _subscriptions                            ;
  _serializers                          ;
  _connectionAvailability         = 1.0;
  _requesterLeaseHandler                        ;
  _responderLeaseHandler                        ;
  _responderLeaseSenderDisposable             ;
  _errorHandler                  ;
  _keepAliveLastReceivedMillis        ;
  _keepAliveTimerHandle            ;

  constructor(
    role      ,
    connection                  ,
    connectionPublisher                                                        ,
    keepAliveTimeout        ,
    serializers                           ,
    requestHandler                         ,
    errorHandler                  ,
    requesterLeaseHandler                        ,
    responderLeaseHandler                        ,
  ) {
    this._connection = connection;
    this._requesterLeaseHandler = requesterLeaseHandler;
    this._responderLeaseHandler = responderLeaseHandler;
    this._nextStreamId = role === 'CLIENT' ? 1 : 2;
    this._receivers = new Map();
    this._subscriptions = new Map();
    this._serializers = serializers || (IdentitySerializers     );
    this._requestHandler = new ResponderWrapper(requestHandler);
    this._errorHandler = errorHandler;

    // Subscribe to completion/errors before sending anything
    connectionPublisher({
      onComplete: this._handleTransportClose,
      onError: this._handleError,
      onNext: this._handleFrame,
      onSubscribe: subscription =>
        subscription.request(Number.MAX_SAFE_INTEGER),
    });

    const responderHandler = this._responderLeaseHandler;
    if (responderHandler) {
      this._responderLeaseSenderDisposable = responderHandler.send(
        this._leaseFrameSender(),
      );
    }
    // Cleanup when the connection closes
    this._connection.connectionStatus().subscribe({
      onNext: status => {
        if (status.kind === 'CLOSED') {
          this._handleTransportClose();
        } else if (status.kind === 'ERROR') {
          this._handleError(status.error);
        }
      },
      onSubscribe: subscription =>
        subscription.request(Number.MAX_SAFE_INTEGER),
    });

    const MIN_TICK_DURATION = 100;
    this._keepAliveLastReceivedMillis = Date.now();
    const keepAliveHandler = () => {
      const now = Date.now();
      const noKeepAliveDuration = now - this._keepAliveLastReceivedMillis;
      if (noKeepAliveDuration >= keepAliveTimeout) {
        this._handleConnectionError(
          new Error(`No keep-alive acks for ${keepAliveTimeout} millis`),
        );
      } else {
        this._keepAliveTimerHandle = setTimeout(
          keepAliveHandler,
          Math.max(MIN_TICK_DURATION, keepAliveTimeout - noKeepAliveDuration),
        );
      }
    };
    this._keepAliveTimerHandle = setTimeout(keepAliveHandler, keepAliveTimeout);
  }

  setRequestHandler(requestHandler                         )       {
    this._requestHandler.setResponder(requestHandler);
  }

  close()       {
    this._connection.close();
  }

  connectionStatus()                             {
    return this._connection.connectionStatus();
  }

  availability()         {
    const r = this._requesterLeaseHandler;
    const requesterAvailability = r ? r.availability() : 1.0;
    return Math.min(this._connectionAvailability, requesterAvailability);
  }

  fireAndForget(payload               )       {
    if (this._useLeaseOrError(this._requesterLeaseHandler)) {
      return;
    }
    const streamId = this._getNextStreamId(this._receivers);
    const data = this._serializers.data.serialize(payload.data);
    const metadata = this._serializers.metadata.serialize(payload.metadata);
    const frame = {
      data,
      flags: payload.metadata !== undefined ? FLAGS.METADATA : 0,
      metadata,
      streamId,
      type: FRAME_TYPES.REQUEST_FNF,
    };
    this._connection.sendOne(frame);
  }

  requestResponse(payload               )                        {
    const leaseError = this._useLeaseOrError(this._requesterLeaseHandler);
    if (leaseError) {
      return Single.error(new Error(leaseError));
    }

    const streamId = this._getNextStreamId(this._receivers);
    return new Single(subscriber => {
      this._receivers.set(streamId, {
        onComplete: () => {},
        onError: error => subscriber.onError(error),
        onNext: data => subscriber.onComplete(data),
      });
      const data = this._serializers.data.serialize(payload.data);
      const metadata = this._serializers.metadata.serialize(payload.metadata);
      const frame = {
        data,
        flags: payload.metadata !== undefined ? FLAGS.METADATA : 0,
        metadata,
        streamId,
        type: FRAME_TYPES.REQUEST_RESPONSE,
      };
      this._connection.sendOne(frame);

      subscriber.onSubscribe(() => {
        this._receivers.delete(streamId);
        const cancelFrame = {
          flags: 0,
          streamId,
          type: FRAME_TYPES.CANCEL,
        };
        this._connection.sendOne(cancelFrame);
      });
    });
  }

  requestStream(payload               )                          {
    const leaseError = this._useLeaseOrError(this._requesterLeaseHandler);
    if (leaseError) {
      return Flowable.error(new Error(leaseError));
    }

    const streamId = this._getNextStreamId(this._receivers);

    return new Flowable(subscriber => {
      this._receivers.set(streamId, subscriber);
      let initialized = false;

      subscriber.onSubscribe({
        cancel: () => {
          this._receivers.delete(streamId);
          if (!initialized) {
            return;
          }
          const cancelFrame = {
            flags: 0,
            streamId,
            type: FRAME_TYPES.CANCEL,
          };
          this._connection.sendOne(cancelFrame);
        },
        request: n => {
          if (n > MAX_REQUEST_N) {
            n = MAX_REQUEST_N;
          }
          if (initialized) {
            const requestNFrame = {
              flags: 0,
              requestN: n,
              streamId,
              type: FRAME_TYPES.REQUEST_N,
            };
            this._connection.sendOne(requestNFrame);
          } else {
            initialized = true;
            const data = this._serializers.data.serialize(payload.data);
            const metadata = this._serializers.metadata.serialize(
              payload.metadata,
            );
            const requestStreamFrame = {
              data,
              flags: payload.metadata !== undefined ? FLAGS.METADATA : 0,
              metadata,
              requestN: n,
              streamId,
              type: FRAME_TYPES.REQUEST_STREAM,
            };
            this._connection.sendOne(requestStreamFrame);
          }
        },
      });
    }, MAX_REQUEST_N);
  }

  requestChannel(payloads                         )                          {
    const leaseError = this._useLeaseOrError(this._requesterLeaseHandler);
    if (leaseError) {
      return Flowable.error(new Error(leaseError));
    }

    const streamId = this._getNextStreamId(this._receivers);
    let payloadsSubscribed = false;
    return new Flowable(subscriber => {
      try {
        this._receivers.set(streamId, subscriber);

        let initialized = false;

        subscriber.onSubscribe({
          cancel: () => {
            this._receivers.delete(streamId);
            if (!initialized) {
              return;
            }
            const cancelFrame = {
              flags: 0,
              streamId,
              type: FRAME_TYPES.CANCEL,
            };
            this._connection.sendOne(cancelFrame);
          },
          request: n => {
            if (n > MAX_REQUEST_N) {
              n = MAX_REQUEST_N;
            }
            if (initialized) {
              const requestNFrame = {
                flags: 0,
                requestN: n,
                streamId,
                type: FRAME_TYPES.REQUEST_N,
              };
              this._connection.sendOne(requestNFrame);
            } else {
              if (!payloadsSubscribed) {
                payloadsSubscribed = true;
                payloads.subscribe({
                  onComplete: () => {
                    this._sendStreamComplete(streamId);
                  },
                  onError: error => {
                    this._sendStreamError(streamId, error);
                  },
                  //Subscriber methods
                  onNext: payload => {
                    const data = this._serializers.data.serialize(payload.data);
                    const metadata = this._serializers.metadata.serialize(
                      payload.metadata,
                    );
                    if (!initialized) {
                      initialized = true;
                      const requestChannelFrame = {
                        data,
                        flags:
                          payload.metadata !== undefined ? FLAGS.METADATA : 0,
                        metadata,
                        requestN: n,
                        streamId,
                        type: FRAME_TYPES.REQUEST_CHANNEL,
                      };
                      this._connection.sendOne(requestChannelFrame);
                    } else {
                      const payloadFrame = {
                        data,
                        flags:
                          FLAGS.NEXT |
                          (payload.metadata !== undefined ? FLAGS.METADATA : 0),
                        metadata,
                        streamId,
                        type: FRAME_TYPES.PAYLOAD,
                      };
                      this._connection.sendOne(payloadFrame);
                    }
                  },
                  onSubscribe: subscription => {
                    this._subscriptions.set(streamId, subscription);
                    subscription.request(1);
                  },
                });
              } else {
                console.warn(
                  'RSocketClient: re-entrant call to request n before initial' +
                    ' channel established.',
                );
              }
            }
          },
        });
      } catch (err) {
        console.warn('Exception while subscribing to channel flowable:' + err);
      }
    }, MAX_REQUEST_N);
  }

  metadataPush(payload               )               {
    return new Single(subscriber => {
      const metadata = this._serializers.metadata.serialize(payload.metadata);
      const frame = {
        flags: 0,
        metadata,
        streamId: 0,
        type: FRAME_TYPES.METADATA_PUSH,
      };
      this._connection.sendOne(frame);

      subscriber.onSubscribe(() => {});
      subscriber.onComplete();
    });
  }

  _getNextStreamId(streamIds                                      )         {
    const streamId = this._nextStreamId;
    do {
      this._nextStreamId = (this._nextStreamId + 2) & MAX_STREAM_ID;
    } while (this._nextStreamId === 0 || streamIds.has(streamId));
    return streamId;
  }

  _useLeaseOrError(leaseHandler               )          {
    if (leaseHandler) {
      if (!leaseHandler.use()) {
        return leaseHandler.errorMessage();
      }
    }
  }

  _leaseFrameSender() {
    return lease =>
      this._connection.sendOne({
        flags: 0,
        metadata: lease.metadata,
        requestCount: lease.allowedRequests,
        streamId: CONNECTION_STREAM_ID,
        ttl: lease.timeToLiveMillis,
        type: FRAME_TYPES.LEASE,
      });
  }

  _dispose(...disposables                    ) {
    disposables.forEach(d => {
      if (d) {
        d.dispose();
      }
    });
  }

  _isRequest(frameType        ) {
    switch (frameType) {
      case FRAME_TYPES.REQUEST_FNF:
      case FRAME_TYPES.REQUEST_RESPONSE:
      case FRAME_TYPES.REQUEST_STREAM:
      case FRAME_TYPES.REQUEST_CHANNEL:
        return true;
      default:
        return false;
    }
  }

  /**
   * Handle the connection closing normally: this is an error for any open streams.
   */
  _handleTransportClose = ()       => {
    this._handleError(new Error('RSocket: The connection was closed.'));
  };

  /**
   * Handle the transport connection closing abnormally or a connection-level protocol error.
   */
  _handleError = (error       ) => {
    // Error any open request streams
    this._receivers.forEach(receiver => {
      receiver.onError(error);
    });
    this._receivers.clear();
    // Cancel any active subscriptions
    this._subscriptions.forEach(subscription => {
      subscription.cancel();
    });
    this._subscriptions.clear();
    this._connectionAvailability = 0.0;
    this._dispose(
      this._requesterLeaseHandler,
      this._responderLeaseSenderDisposable,
    );
    const handle = this._keepAliveTimerHandle;
    if (handle) {
      clearTimeout(handle);
      this._keepAliveTimerHandle = null;
    }
  };

  _handleConnectionError(error       )       {
    this._handleError(error);
    this._connection.close();
    const errorHandler = this._errorHandler;
    if (errorHandler) {
      errorHandler(error);
    }
  }

  /**
   * Handle a frame received from the transport client.
   */
  _handleFrame = (frame       ) => {
    const {streamId} = frame;
    if (streamId === CONNECTION_STREAM_ID) {
      this._handleConnectionFrame(frame);
    } else {
      this._handleStreamFrame(streamId, frame);
    }
  };

  /**
   * Handle connection frames (stream id === 0).
   */
  _handleConnectionFrame(frame       )       {
    switch (frame.type) {
      case FRAME_TYPES.ERROR:
        const error = createErrorFromFrame(frame);
        this._handleConnectionError(error);
        break;
      case FRAME_TYPES.EXT:
        // Extensions are not supported
        break;
      case FRAME_TYPES.KEEPALIVE:
        this._keepAliveLastReceivedMillis = Date.now();
        if (isRespond(frame.flags)) {
          this._connection.sendOne({
            ...frame,
            flags: frame.flags ^ FLAGS.RESPOND, // eslint-disable-line no-bitwise
            lastReceivedPosition: 0,
          });
        }
        break;
      case FRAME_TYPES.LEASE:
        const r = this._requesterLeaseHandler;
        if (r) {
          r.receive(frame);
        }
        break;
      case FRAME_TYPES.METADATA_PUSH:
        this._handleMetadataPush(frame);
        break;
      case FRAME_TYPES.REQUEST_CHANNEL:
      case FRAME_TYPES.REQUEST_FNF:
      case FRAME_TYPES.REQUEST_RESPONSE:
      case FRAME_TYPES.REQUEST_STREAM:
        // TODO #18064706: handle requests from server
        break;
      case FRAME_TYPES.RESERVED:
        // No-op
        break;
      case FRAME_TYPES.RESUME:
      case FRAME_TYPES.RESUME_OK:
        // TODO #18065016: support resumption
        break;
      default:
        if (__DEV__) {
          console.log(
            'RSocketClient: Unsupported frame type `%s` on stream `%s`.',
            getFrameTypeName(frame.type),
            CONNECTION_STREAM_ID,
          );
        }
        break;
    }
  }

  /**
   * Handle stream-specific frames (stream id !== 0).
   */
  _handleStreamFrame(streamId        , frame       )       {
    if (this._isRequest(frame.type)) {
      const leaseError = this._useLeaseOrError(this._responderLeaseHandler);
      if (leaseError) {
        this._sendStreamError(streamId, new Error(leaseError));
        return;
      }
    }
    switch (frame.type) {
      case FRAME_TYPES.CANCEL:
        this._handleCancel(streamId, frame);
        break;
      case FRAME_TYPES.REQUEST_N:
        this._handleRequestN(streamId, frame);
        break;
      case FRAME_TYPES.REQUEST_FNF:
        this._handleFireAndForget(streamId, frame);
        break;
      case FRAME_TYPES.REQUEST_RESPONSE:
        this._handleRequestResponse(streamId, frame);
        break;
      case FRAME_TYPES.REQUEST_STREAM:
        this._handleRequestStream(streamId, frame);
        break;
      case FRAME_TYPES.REQUEST_CHANNEL:
        this._handleRequestChannel(streamId, frame);
        break;
      case FRAME_TYPES.ERROR:
        const error = createErrorFromFrame(frame);
        this._handleStreamError(streamId, error);
        break;
      case FRAME_TYPES.PAYLOAD:
        const receiver = this._receivers.get(streamId);
        if (receiver != null) {
          if (isNext(frame.flags)) {
            const payload = {
              data: this._serializers.data.deserialize(frame.data),
              metadata: this._serializers.metadata.deserialize(frame.metadata),
            };
            receiver.onNext(payload);
          }
          if (isComplete(frame.flags)) {
            this._receivers.delete(streamId);
            receiver.onComplete();
          }
        }
        break;
      default:
        if (__DEV__) {
          console.log(
            'RSocketClient: Unsupported frame type `%s` on stream `%s`.',
            getFrameTypeName(frame.type),
            streamId,
          );
        }
        break;
    }
  }

  _handleCancel(streamId        , frame             )       {
    const subscription = this._subscriptions.get(streamId);
    if (subscription) {
      subscription.cancel();
      this._subscriptions.delete(streamId);
    }
  }

  _handleRequestN(streamId        , frame               )       {
    const subscription = this._subscriptions.get(streamId);
    if (subscription) {
      subscription.request(frame.requestN);
    }
  }

  _handleFireAndForget(streamId        , frame                 )       {
    const payload = this._deserializePayload(frame);
    this._requestHandler.fireAndForget(payload);
  }

  _handleRequestResponse(streamId        , frame                      )       {
    const payload = this._deserializePayload(frame);
    this._requestHandler.requestResponse(payload).subscribe({
      onComplete: payload => {
        this._sendStreamPayload(streamId, payload, true);
      },
      onError: error => this._sendStreamError(streamId, error),
      onSubscribe: cancel => {
        const subscription = {
          cancel,
          request: () => {},
        };
        this._subscriptions.set(streamId, subscription);
      },
    });
  }

  _handleRequestStream(streamId        , frame                    )       {
    const payload = this._deserializePayload(frame);
    this._requestHandler.requestStream(payload).subscribe({
      onComplete: () => this._sendStreamComplete(streamId),
      onError: error => this._sendStreamError(streamId, error),
      onNext: payload => this._sendStreamPayload(streamId, payload),
      onSubscribe: subscription => {
        this._subscriptions.set(streamId, subscription);
        subscription.request(frame.requestN);
      },
    });
  }

  _handleRequestChannel(streamId        , frame                     )       {
    const existingSubscription = this._subscriptions.get(streamId);
    if (existingSubscription) {
      //Likely a duplicate REQUEST_CHANNEL frame, ignore per spec
      return;
    }

    const payloads = new Flowable(subscriber => {
      let firstRequest = true;

      subscriber.onSubscribe({
        cancel: () => {
          this._receivers.delete(streamId);
          const cancelFrame = {
            flags: 0,
            streamId,
            type: FRAME_TYPES.CANCEL,
          };
          this._connection.sendOne(cancelFrame);
        },
        request: n => {
          if (n > MAX_REQUEST_N) {
            n = MAX_REQUEST_N;
          }
          if (firstRequest) {
            n--;
          }

          if (n > 0) {
            const requestNFrame = {
              flags: 0,
              requestN: n,
              streamId,
              type: FRAME_TYPES.REQUEST_N,
            };
            this._connection.sendOne(requestNFrame);
          }
          //critically, if n is 0 now, that's okay because we eagerly decremented it
          if (firstRequest && n >= 0) {
            firstRequest = false;
            //release the initial frame we received in frame form due to map operator
            subscriber.onNext(frame);
          }
        },
      });
    }, MAX_REQUEST_N);
    const framesToPayloads = new FlowableProcessor(payloads, frame =>
      this._deserializePayload(frame),
    );
    this._receivers.set(streamId, framesToPayloads);

    this._requestHandler.requestChannel(framesToPayloads).subscribe({
      onComplete: () => this._sendStreamComplete(streamId),
      onError: error => this._sendStreamError(streamId, error),
      onNext: payload => this._sendStreamPayload(streamId, payload),
      onSubscribe: subscription => {
        this._subscriptions.set(streamId, subscription);
        subscription.request(frame.requestN);
      },
    });
  }

  _handleMetadataPush(frame                   )       {
    const payload = this._deserializeMetadataPushPayload(frame);
    this._requestHandler.metadataPush(payload).subscribe({
      onComplete: () => {},
      onError: error => {},
      onSubscribe: cancel => {},
    });
  }

  _sendStreamComplete(streamId        )       {
    this._subscriptions.delete(streamId);
    this._connection.sendOne({
      data: null,
      flags: FLAGS.COMPLETE,
      metadata: null,
      streamId,
      type: FRAME_TYPES.PAYLOAD,
    });
  }

  _sendStreamError(streamId        , err       )       {
    this._subscriptions.delete(streamId);
    this._connection.sendOne({
      code:
        err instanceof RSocketError
          ? err.errorCode
          : ERROR_CODES.APPLICATION_ERROR,
      flags: 0,
      message: err.message,
      streamId,
      type: FRAME_TYPES.ERROR,
    });
    const error = new Error(`terminated from the requester: ${err.message}`);
    this._handleStreamError(streamId, error);
  }

  _sendStreamPayload(
    streamId        ,
    payload               ,
    complete           = false,
  )       {
    let flags = FLAGS.NEXT;
    if (complete) {
      // eslint-disable-next-line no-bitwise
      flags |= FLAGS.COMPLETE;
      this._subscriptions.delete(streamId);
    }
    if (payload.metadata !== undefined &&
        payload.metadata !== null) {
      // eslint-disable-next-line no-bitwise
      flags |= FLAGS.METADATA;
    }
    const data = this._serializers.data.serialize(payload.data);
    const metadata = this._serializers.metadata.serialize(payload.metadata);
    this._connection.sendOne({
      data,
      flags,
      metadata,
      streamId,
      type: FRAME_TYPES.PAYLOAD,
    });
  }

  _deserializePayload(frame               )                {
    return deserializePayload(this._serializers, frame);
  }

  _deserializeMetadataPushPayload(frame                   )                {
    return deserializeMetadataPushPayload(this._serializers, frame);
  }

  /**
   * Handle an error specific to a stream.
   */
  _handleStreamError(streamId        , error       )       {
    const receiver = this._receivers.get(streamId);
    if (receiver != null) {
      this._receivers.delete(streamId);
      receiver.onError(error);
    }
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

function deserializeMetadataPushPayload      (
  serializers                          ,
  frame                   ,
)                {
  return {
    data: null,
    metadata: serializers.metadata.deserialize(frame.metadata),
  };
}
