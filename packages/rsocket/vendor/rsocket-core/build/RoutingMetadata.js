// $FlowFixMe
//      

import {LiteBuffer as Buffer} from './LiteBuffer';
import {createBuffer, toBuffer} from './RSocketBufferUtils';

// $FlowFixMe
export class RoutingMetadata                             {
  _buffer        ;

  constructor(buffer        ) {
    this._buffer = buffer;
  }

  iterator()                   {
    return decodeRoutes(this._buffer);
  }

  // $FlowFixMe
  [Symbol.iterator]()                   {
    return decodeRoutes(this._buffer);
  }
}

/**
 * Encode given set of routes into {@link Buffer} following the <a href="https://github.com/rsocket/rsocket/blob/master/Extensions/Routing.md">Routing Metadata Layout</a>
 *
 * @param routes non-empty set of routes
 * @returns {Buffer} with encoded content
 */
export function encodeRoutes(...routes          )         {
  if (routes.length < 1) {
    throw new Error('routes should be non empty array');
  }

  return Buffer.concat(routes.map(route => encodeRoute(route)));
}

export function encodeRoute(route        )         {
  const encodedRoute = toBuffer(route, 'utf8');

  if (encodedRoute.length > 255) {
    throw new Error(
      `route length should fit into unsigned byte length but the given one is ${encodedRoute.length}`,
    );
  }

  const encodedLength = createBuffer(1);

  encodedLength.writeUInt8(encodedRoute.length);

  return Buffer.concat([encodedLength, encodedRoute]);
}

export function* decodeRoutes(
  routeMetadataBuffer        ,
)                               {
  const length = routeMetadataBuffer.byteLength;
  let offset = 0;

  while (offset < length) {
    const routeLength = routeMetadataBuffer.readUInt8(offset++);

    if (offset + routeLength > length) {
      throw new Error(
        `Malformed RouteMetadata. Offset(${offset}) + RouteLength(${routeLength}) is greater than TotalLength`,
      );
    }

    const route = routeMetadataBuffer.toString(
      'utf8',
      offset,
      offset + routeLength,
    );
    offset += routeLength;
    yield route;
  }
}
