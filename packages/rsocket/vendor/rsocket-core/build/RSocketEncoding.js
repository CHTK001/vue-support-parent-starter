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

                                             

import {byteLength} from './RSocketBufferUtils';import * as _ns_invariant from './Invariant';
const invariant = (_ns_invariant && _ns_invariant.default !== undefined) ? _ns_invariant.default : _ns_invariant;
/**
 * Commonly used subset of the allowed Node Buffer Encoder types.
 */
                                      
                                           
           
                     
                   
                  
                
              
                                                            
   

/**
 * The Encoders object specifies how values should be serialized/deserialized
 * to/from binary.
 */
                                       
                   
                                
                           
                       
                                    
                          
   

export const UTF8Encoder                  = {
  byteLength: (value           ) => byteLength(value, 'utf8'),
  decode: (buffer        , start        , end        )         => {
    return buffer.toString('utf8', start, end);
  },
  encode: (
    value           ,
    buffer        ,
    start        ,
    end        ,
  )         => {
    invariant(
      typeof value === 'string',
      'RSocketEncoding: Expected value to be a string, got `%s`.',
      value,
    );
    buffer.write(value, start, end - start, 'utf8');
    return end;
  },
};

export const BufferEncoder                  = {
  byteLength: (value           ) => {
    invariant(
      Buffer.isBuffer(value),
      'RSocketEncoding: Expected value to be a buffer, got `%s`.',
      value,
    );
    return (value     ).length;
  },
  decode: (buffer        , start        , end        )         => {
    return buffer.slice(start, end);
  },
  encode: (
    value           ,
    buffer        ,
    start        ,
    end        ,
  )         => {
    invariant(
      Buffer.isBuffer(value),
      'RSocketEncoding: Expected value to be a buffer, got `%s`.',
      value,
    );
    (value     ).copy(buffer, start, 0, value.length);
    return end;
  },
};

/**
 * Encode all values as UTF8 strings.
 */
export const Utf8Encoders                   = {
  data: UTF8Encoder,
  dataMimeType: UTF8Encoder,
  message: UTF8Encoder,
  metadata: UTF8Encoder,
  metadataMimeType: UTF8Encoder,
  resumeToken: UTF8Encoder,
};

/**
 * Encode all values as buffers.
 */
export const BufferEncoders                   = {
  data: BufferEncoder,
  dataMimeType: UTF8Encoder,
  message: UTF8Encoder,
  metadata: BufferEncoder,
  metadataMimeType: UTF8Encoder,
  resumeToken: BufferEncoder,
};
