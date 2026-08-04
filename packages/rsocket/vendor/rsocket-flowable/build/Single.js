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

                                                             

                                        
                                              
                                   
                                    
                                                  
 
                                       
                                  
                                   
                                                 
 
                                    
                                  
                                   
                                                   
 

/**
 * Represents a lazy computation that will either produce a value of type T
 * or fail with an error. Calling `subscribe()` starts the
 * computation and returns a subscription object, which has an `unsubscribe()`
 * method that can be called to prevent completion/error callbacks from being
 * invoked and, where supported, to also cancel the computation.
 * Implementations may optionally implement cancellation; if they do not
 * `cancel()` is a no-op.
 *
 * Note: Unlike Promise, callbacks (onComplete/onError) may be invoked
 * synchronously.
 *
 * Example:
 *
 * ```
 * const value = new Single(subscriber => {
 *   const id = setTimeout(
 *     () => subscriber.onComplete('Hello!'),
 *     250
 *   );
 *   // Optional: Call `onSubscribe` with a cancellation callback
 *   subscriber.onSubscribe(() => clearTimeout(id));
 * });
 *
 * // Start the computation. onComplete will be called after the timeout
 * // with 'hello'  unless `cancel()` is called first.
 * value.subscribe({
 *   onComplete: value => console.log(value),
 *   onError: error => console.error(error),
 *   onSubscribe: cancel => ...
 * });
 * ```
 */
export default class Single    {
  _source           ;

  static of   (value   )            {
    return new Single(subscriber => {
      subscriber.onSubscribe();
      subscriber.onComplete(value);
    });
  }

  static error           (error       )            {
    return new Single(subscriber => {
      subscriber.onSubscribe();
      subscriber.onError(error);
    });
  }

  static never           ()            {
    return new Single(subscriber => {
      subscriber.onSubscribe();
    });
  }

  constructor(source           ) {
    this._source = source;
  }

  subscribe(partialSubscriber                               )       {
    const subscriber = new FutureSubscriber(partialSubscriber);
    try {
      this._source(subscriber);
    } catch (error) {
      subscriber.onError(error);
    }
  }

  flatMap   (fn                        )            {
    return new Single(subscriber => {
      let currentCancel;
      const cancel = () => {
        currentCancel && currentCancel();
        currentCancel = null;
      };
      this._source({
        onComplete: value => {
          fn(value).subscribe({
            onComplete: mapValue => {
              subscriber.onComplete(mapValue);
            },
            onError: error => subscriber.onError(error),
            onSubscribe: _cancel => {
              currentCancel = _cancel;
            },
          });
        },
        onError: error => subscriber.onError(error),
        onSubscribe: _cancel => {
          currentCancel = _cancel;
          subscriber.onSubscribe(cancel);
        },
      });
    });
  }

  /**
   * Return a new Single that resolves to the value of this Single applied to
   * the given mapping function.
   */
  map   (fn                )            {
    return new Single(subscriber => {
      return this._source({
        onComplete: value => subscriber.onComplete(fn(value)),
        onError: error => subscriber.onError(error),
        onSubscribe: cancel => subscriber.onSubscribe(cancel),
      });
    });
  }

  then(successFn                    , errorFn                         )       {
    this.subscribe({
      onComplete: successFn || (() => {}),
      onError: errorFn || (() => {}),
    });
  }
}

/**
 * @private
 */
class FutureSubscriber                                    {
  _active         ;
  _started         ;
  _subscriber                             ;

  constructor(subscriber                               ) {
    this._active = false;
    this._started = false;
    this._subscriber = subscriber || {};
  }

  onComplete(value   )       {
    if (!this._active) {
      console.warn(
        'Single: Invalid call to onComplete(): %s.',
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
        this._subscriber.onComplete(value);
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
        'Single: Invalid call to onError(): %s.',
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

  onSubscribe(cancel                  )       {
    if (this._started) {
      console.warn('Single: Invalid call to onSubscribe(): already called.');
      return;
    }
    this._active = true;
    this._started = true;
    try {
      this._subscriber.onSubscribe &&
        this._subscriber.onSubscribe(() => {
          if (!this._active) {
            return;
          }
          this._active = false;
          cancel && cancel();
        });
    } catch (error) {
      this.onError(error);
    }
  }
}
