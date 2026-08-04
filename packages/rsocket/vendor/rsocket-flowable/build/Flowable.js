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

'use strict';import * as _ns_FlowableMapOperator from './FlowableMapOperator';
const FlowableMapOperator = (_ns_FlowableMapOperator && _ns_FlowableMapOperator.default !== undefined) ? _ns_FlowableMapOperator.default : _ns_FlowableMapOperator;import * as _ns_FlowableTakeOperator from './FlowableTakeOperator';
const FlowableTakeOperator = (_ns_FlowableTakeOperator && _ns_FlowableTakeOperator.default !== undefined) ? _ns_FlowableTakeOperator.default : _ns_FlowableTakeOperator;import * as _ns_invariant from './Invariant';
const invariant = (_ns_invariant && _ns_invariant.default !== undefined) ? _ns_invariant.default : _ns_invariant;
/**
 * Implements the ReactiveStream `Publisher` interface with Rx-style operators.
 */
export default class Flowable                             {
  _max        ;
  _source           ;

  static just   (...values          )              {
    return new Flowable(subscriber => {
      let cancelled = false;
      let i = 0;
      subscriber.onSubscribe({
        cancel: () => {
          cancelled = true;
        },
        request: n => {
          while (!cancelled && n > 0 && i < values.length) {
            subscriber.onNext(values[i++]);
            n--;
          }
          if (!cancelled && i == values.length) {
            subscriber.onComplete();
          }
        },
      });
    });
  }

  static error           (error       )              {
    return new Flowable(subscriber => {
      subscriber.onSubscribe({
        cancel: () => {},
        request: () => {
          subscriber.onError(error);
        },
      });
    });
  }

  static never           ()              {
    return new Flowable(subscriber => {
      subscriber.onSubscribe({
        cancel: () => {},
        request: () => {},
      });
    });
  }

  constructor(source           , max          = Number.MAX_SAFE_INTEGER) {
    this._max = max;
    this._source = source;
  }

  subscribe(
    subscriberOrCallback                                           ,
  )       {
    let partialSubscriber                        ;
    if (typeof subscriberOrCallback === 'function') {
      partialSubscriber = this._wrapCallback(subscriberOrCallback);
    } else {
      partialSubscriber = subscriberOrCallback;
    }
    const subscriber = new FlowableSubscriber(partialSubscriber, this._max);
    this._source(subscriber);
  }

  lift   (
    onSubscribeLift                                                ,
  )              {
    return new Flowable(subscriber =>
      this._source(onSubscribeLift(subscriber)),
    );
  }

  map   (fn                )              {
    return this.lift(subscriber => new FlowableMapOperator(subscriber, fn));
  }

  take(toTake        )              {
    return this.lift(
      subscriber => new FlowableTakeOperator(subscriber, toTake),
    );
  }

  _wrapCallback(callback             )                        {
    const max = this._max;
    return {
      onNext: callback,
      onSubscribe(subscription) {
        subscription.request(max);
      },
    };
  }
}

/**
 * @private
 */
class FlowableSubscriber                              {
  _active         ;
  _emitting         ;
  _max        ;
  _pending        ;
  _started         ;
  _subscriber                       ;
  _subscription                ;

  constructor(subscriber                         , max        ) {
    this._active = false;
    this._max = max;
    this._pending = 0;
    this._started = false;
    this._subscriber = subscriber || {};
    this._subscription = null;
  }

  onComplete()       {
    if (!this._active) {
      console.warn(
        'Flowable: Invalid call to onComplete(): %s.',
        this._started
          ? 'onComplete/onError was already called'
          : 'onSubscribe has not been called',
      );
      return;
    }
    this._active = false;
    this._started = true;
    try {
      if (this._subscriber.onComplete) {
        this._subscriber.onComplete();
      }
    } catch (error) {
      if (this._subscriber.onError) {
        this._subscriber.onError(error);
      }
    }
  }

  onError(error       )       {
    if (this._started && !this._active) {
      console.warn(
        'Flowable: Invalid call to onError(): %s.',
        this._active
          ? 'onComplete/onError was already called'
          : 'onSubscribe has not been called',
      );
      return;
    }
    this._active = false;
    this._started = true;
    this._subscriber.onError && this._subscriber.onError(error);
  }

  onNext(data   )       {
    if (!this._active) {
      console.warn(
        'Flowable: Invalid call to onNext(): %s.',
        this._active
          ? 'onComplete/onError was already called'
          : 'onSubscribe has not been called',
      );
      return;
    }
    if (this._pending === 0) {
      console.warn(
        'Flowable: Invalid call to onNext(), all request()ed values have been ' +
          'published.',
      );
      return;
    }
    if (this._pending !== this._max) {
      this._pending--;
    }
    try {
      this._subscriber.onNext && this._subscriber.onNext(data);
    } catch (error) {
      if (this._subscription) {
        this._subscription.cancel();
      }
      this.onError(error);
    }
  }

  onSubscribe(subscription                 )       {
    if (this._started) {
      console.warn('Flowable: Invalid call to onSubscribe(): already called.');
      return;
    }
    this._active = true;
    this._started = true;
    this._subscription = subscription;
    try {
      this._subscriber.onSubscribe &&
        this._subscriber.onSubscribe({
          cancel: this._cancel,
          request: this._request,
        });
    } catch (error) {
      this.onError(error);
    }
  }

  _cancel = () => {
    if (!this._active) {
      return;
    }
    this._active = false;
    if (this._subscription) {
      this._subscription.cancel();
    }
  };

  _request = (n        ) => {
    invariant(
      Number.isInteger(n) && n >= 1 && n <= this._max,
      'Flowable: Expected request value to be an integer with a ' +
        'value greater than 0 and less than or equal to %s, got ' +
        '`%s`.',
      this._max,
      n,
    );
    if (!this._active) {
      return;
    }
    if (n === this._max) {
      this._pending = this._max;
    } else {
      this._pending += n;
      if (this._pending >= this._max) {
        this._pending = this._max;
      }
    }
    if (this._subscription) {
      this._subscription.request(n);
    }
  };
}
