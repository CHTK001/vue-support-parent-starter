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

                                                                             
                                                                        
                                           

import {Flowable} from 'rsocket-flowable';
import {
  deserializeFrame,
  deserializeFrameWithLength,
  printFrame,
  serializeFrame,
  serializeFrameWithLength,
  toBuffer,
} from 'rsocket-core';
import {CONNECTION_STATUS} from 'rsocket-types';

                              
              
                                         
                  
                                 
   

/**
 * A WebSocket transport client for use in browser environments.
 */
export default class RSocketWebSocketClient                             {
  _encoders              ;
  _options               ;
  _receivers                         ;
  _senders                    ;
  _socket            ;
  _status                  ;
  _statusSubscribers                                 ;

  constructor(options               , encoders              ) {
    this._encoders = encoders;
    this._options = options;
    this._receivers = new Set();
    this._senders = new Set();
    this._socket = null;
    this._status = CONNECTION_STATUS.NOT_CONNECTED;
    this._statusSubscribers = new Set();
  }

  close()       {
    this._close();
  }

  connect()       {
    if (this._status.kind !== 'NOT_CONNECTED') {
      throw new Error(
        'RSocketWebSocketClient: Cannot connect(), a connection is already ' +
          'established.',
      );
    }
    this._setConnectionStatus(CONNECTION_STATUS.CONNECTING);

    const wsCreator = this._options.wsCreator;
    const url = this._options.url;
    this._socket = wsCreator ? wsCreator(url) : new WebSocket(url);

    const socket = this._socket;
    socket.binaryType = 'arraybuffer';

    (socket.addEventListener            )('close', this._handleClosed);
    (socket.addEventListener            )('error', this._handleError);
    (socket.addEventListener            )('open', this._handleOpened);
    (socket.addEventListener            )('message', this._handleMessage);
  }

  connectionStatus()                             {
    return new Flowable(subscriber => {
      subscriber.onSubscribe({
        cancel: () => {
          this._statusSubscribers.delete(subscriber);
        },
        request: () => {
          this._statusSubscribers.add(subscriber);
          subscriber.onNext(this._status);
        },
      });
    });
  }

  receive()                  {
    return new Flowable(subject => {
      subject.onSubscribe({
        cancel: () => {
          this._receivers.delete(subject);
        },
        request: () => {
          this._receivers.add(subject);
        },
      });
    });
  }

  sendOne(frame       )       {
    this._writeFrame(frame);
  }

  send(frames                 )       {
    let subscription;
    frames.subscribe({
      onComplete: () => {
        subscription && this._senders.delete(subscription);
      },
      onError: error => {
        subscription && this._senders.delete(subscription);
        this._close(error);
      },
      onNext: frame => this._writeFrame(frame),
      onSubscribe: _subscription => {
        subscription = _subscription;
        this._senders.add(subscription);
        subscription.request(Number.MAX_SAFE_INTEGER);
      },
    });
  }

  _close(error        ) {
    if (this._status.kind === 'CLOSED' || this._status.kind === 'ERROR') {
      // already closed
      return;
    }
    const status = error ? {error, kind: 'ERROR'} : CONNECTION_STATUS.CLOSED;
    this._setConnectionStatus(status);
    this._receivers.forEach(subscriber => {
      if (error) {
        subscriber.onError(error);
      } else {
        subscriber.onComplete();
      }
    });
    this._receivers.clear();
    this._senders.forEach(subscription => subscription.cancel());
    this._senders.clear();
    const socket = this._socket;
    if (socket) {
      (socket.removeEventListener            )('close', this._handleClosed);
      (socket.removeEventListener            )('error', this._handleError);
      (socket.removeEventListener            )('open', this._handleOpened);
      (socket.removeEventListener            )('message', this._handleMessage);
      socket.close();
      this._socket = null;
    }
  }

  _setConnectionStatus(status                  )       {
    this._status = status;
    this._statusSubscribers.forEach(subscriber => subscriber.onNext(status));
  }

  _handleClosed = (e                   )       => {
    this._close(
      new Error(
        e.reason || 'RSocketWebSocketClient: Socket closed unexpectedly.',
      ),
    );
  };

  _handleError = (e                )       => {
    this._close(e.error);
  };

  _handleOpened = ()       => {
    this._setConnectionStatus(CONNECTION_STATUS.CONNECTED);
  };

  _handleMessage = (message              )       => {
    try {
      const frame = this._readFrame(message);
      this._receivers.forEach(subscriber => subscriber.onNext(frame));
    } catch (error) {
      this._close(error);
    }
  };

  _readFrame(message              )        {
    const buffer = toBuffer(message.data);
    const frame = this._options.lengthPrefixedFrames
      ? deserializeFrameWithLength(buffer, this._encoders)
      : deserializeFrame(buffer, this._encoders);
    if (__DEV__) {
      if (this._options.debug) {
        console.log(printFrame(frame));
      }
    }
    return frame;
  }

  _writeFrame(frame       )       {
    try {
      if (__DEV__) {
        if (this._options.debug) {
          console.log(printFrame(frame));
        }
      }
      const buffer = this._options.lengthPrefixedFrames
        ? serializeFrameWithLength(frame, this._encoders)
        : serializeFrame(frame, this._encoders);
      if (!this._socket) {
        throw new Error(
          'RSocketWebSocketClient: Cannot send frame, not connected.',
        );
      }
      this._socket.send(buffer);
    } catch (error) {
      this._close(error);
    }
  }
}
