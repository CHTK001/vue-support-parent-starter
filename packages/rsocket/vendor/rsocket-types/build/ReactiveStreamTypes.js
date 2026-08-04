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

/**
 * Core types per the [ReactiveStreams specification](http://www.reactive-streams.org/)
 */

/**
 * Represents an asynchronous, pull-based stream of values. Calling
 * `subscribe()` causes the subscriber's `onSubscribe()` method to be be invoked
 * with a Subscription object that has two methods:
 * - `cancel()`: stops the publisher from publishing any more values.
 * - `request(n)`: requests `n` additional values.
 *
 * The subscriber can use `request(n)` to pull additional values from the
 * stream.
 */
                                
                                                              
                                            
 

/**
 * An underlying source of values for a Publisher.
 */
                                
                 
                           
 

/**
 * A handler for values provided by a Publisher.
 */
                                 
                          
                                   
                              
                                                      
 

/**
 * Similar to Subscriber, except that methods are optional. This is a
 * convenience type, allowing subscribers to only specify callbacks for the
 * events they are interested in.
 */
                                        
                           
                                    
                               
                                                       
 

/**
 * Similar to Subscriber, but without onSubscribe.
 */
                              
                          
                                   
                              
 
