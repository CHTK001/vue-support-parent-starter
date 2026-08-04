/** Copyright 2015-2019 the original author or authors.
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
'use strict';import * as _ns_invariant from './Invariant';
const invariant = (_ns_invariant && _ns_invariant.default !== undefined) ? _ns_invariant.default : _ns_invariant;
import {Flowable} from 'rsocket-flowable';
                                                                          
import {MAX_REQUEST_N} from './RSocketFrame';

                                                          

                             
                                  
 

                             
                  

                        
 

export class Lease {
  allowedRequests        ;
  startingAllowedRequests        ;
  timeToLiveMillis        ;
  expiry        ;
  metadata            ;

  constructor(
    timeToLiveMillis        ,
    allowedRequests        ,
    metadata            ,
  ) {
    invariant(timeToLiveMillis > 0, 'Lease time-to-live must be positive');
    invariant(allowedRequests > 0, 'Lease allowed requests must be positive');
    this.timeToLiveMillis = timeToLiveMillis;
    this.allowedRequests = allowedRequests;
    this.startingAllowedRequests = allowedRequests;
    this.expiry = Date.now() + timeToLiveMillis;
    this.metadata = metadata;
  }

  expired()          {
    return Date.now() > this.expiry;
  }

  valid()          {
    return this.allowedRequests > 0 && !this.expired();
  }

  // todo hide
  _use()          {
    if (this.expired()) {
      return false;
    }
    const allowed         = this.allowedRequests;
    const success = allowed > 0;
    if (success) {
      this.allowedRequests = allowed - 1;
    }
    return success;
  }
}

export class Leases                {
  _sender                          = () => Flowable.never();
  _receiver                            = leases => {};
  _stats    ;

  sender(sender                         )            {
    this._sender = sender;
    return this;
  }

  receiver(receiver                           )            {
    this._receiver = receiver;
    return this;
  }

  stats(stats   )            {
    this._stats = stats;
    return this;
  }
}

                               
                 

                         
 

export class RequesterLeaseHandler                                     {
  _isDisposed         ;
  _subscriber                     ;
  /*negative value means received lease was not signalled due to missing requestN*/
  _requestN         = -1;
  _lease        ;

  constructor(leaseReceiver                           ) {
    leaseReceiver(
      new Flowable(subscriber => {
        if (this._subscriber) {
          subscriber.onError(new Error('only 1 subscriber is allowed'));
          return;
        }
        if (this.isDisposed()) {
          subscriber.onComplete();
          return;
        }
        this._subscriber = subscriber;
        subscriber.onSubscribe({
          cancel: () => {
            this.dispose();
          },
          request: n => {
            if (n <= 0) {
              subscriber.onError(
                new Error(`request demand must be positive: ${n}`),
              );
            }
            if (!this.isDisposed()) {
              const curReqN = this._requestN;
              this._onRequestN(curReqN);
              this._requestN = Math.min(
                Number.MAX_SAFE_INTEGER,
                Math.max(0, curReqN) + n,
              );
            }
          },
        });
      }),
    );
  }

  use()          {
    const l = this._lease;
    return l ? l._use() : false;
  }

  errorMessage()         {
    return _errorMessage(this._lease);
  }

  receive(frame            )       {
    if (!this.isDisposed()) {
      const timeToLiveMillis = frame.ttl;
      const requestCount = frame.requestCount;
      const metadata = frame.metadata;
      this._onLease(new Lease(timeToLiveMillis, requestCount, metadata));
    }
  }

  availability()         {
    const l = this._lease;
    if (l && l.valid()) {
      return l.allowedRequests / l.startingAllowedRequests;
    }
    return 0.0;
  }

  dispose()       {
    if (!this._isDisposed) {
      this._isDisposed = true;
      const s = this._subscriber;
      if (s) {
        s.onComplete();
      }
    }
  }

  isDisposed()          {
    return this._isDisposed;
  }

  _onRequestN(requestN        ) {
    const l = this._lease;
    const s = this._subscriber;
    if (requestN < 0 && l && s) {
      s.onNext(l);
    }
  }

  _onLease(lease       ) {
    const s = this._subscriber;
    const newReqN = this._requestN - 1;
    if (newReqN >= 0 && s) {
      s.onNext(lease);
    }
    this._requestN = Math.max(-1, newReqN);
    this._lease = lease;
  }
}

export class ResponderLeaseHandler                         {
  _lease        ;
  _leaseSender                                  ;
  _stats             ;
  _errorConsumer                  ;

  constructor(
    leaseSender                                  ,
    stats             ,
    errorConsumer                  ,
  ) {
    this._leaseSender = leaseSender;
    this._stats = stats;
    this._errorConsumer = errorConsumer;
  }

  use()          {
    const l = this._lease;
    const success = l ? l._use() : false;
    this._onStatsEvent(success);
    return success;
  }

  errorMessage()         {
    return _errorMessage(this._lease);
  }

  send(send                 )             {
    let subscription                ;
    let isDisposed         ;

    this._leaseSender(this._stats).subscribe({
      onComplete: () => this._onStatsEvent(),
      onError: error => {
        this._onStatsEvent();
        const errConsumer = this._errorConsumer;
        if (errConsumer) {
          errConsumer(error);
        }
      },
      onNext: lease => {
        this._lease = lease;
        send(lease);
      },
      onSubscribe: s => {
        if (isDisposed) {
          s.cancel();
          return;
        }
        s.request(MAX_REQUEST_N);
        subscription = s;
      },
    });

    return {
      dispose()       {
        if (!isDisposed) {
          isDisposed = true;
          this._onStatsEvent();
          if (subscription) {
            subscription.cancel();
          }
        }
      },

      isDisposed()          {
        return isDisposed;
      },
    };
  }

  _onStatsEvent(success          ) {
    const s = this._stats;
    if (s) {
      const event =
        success === undefined ? 'Terminate' : success ? 'Accept' : 'Reject';
      s.onEvent(event);
    }
  }
}

function _errorMessage(lease        )         {
  if (!lease) {
    return 'Lease was not received yet';
  }
  if (lease.valid()) {
    return 'Missing leases';
  } else {
    const isExpired = lease.expired();
    const requests = lease.allowedRequests;
    return `Missing leases. Expired: ${isExpired.toString()}, allowedRequests: ${requests}`;
  }
}
