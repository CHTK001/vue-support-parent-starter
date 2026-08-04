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
 * An operator that `request()`s the given number of items immediately upon
 * being subscribed.
 */
export default class FlowableRequestOperator                              {
  _subscriber                ;
  _toRequest        ;

  constructor(subscriber                , toRequest        ) {
    this._subscriber = subscriber;
    this._toRequest = toRequest;
  }

  onComplete()       {
    this._subscriber.onComplete();
  }

  onError(error       )       {
    this._subscriber.onError(error);
  }

  onNext(t   )       {
    this._subscriber.onNext(t);
  }

  onSubscribe(subscription               )       {
    this._subscriber.onSubscribe(subscription);
    subscription.request(this._toRequest);
  }
}
