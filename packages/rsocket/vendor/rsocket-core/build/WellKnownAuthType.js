'use strict';
//      

export default class WellKnownAuthType {
  _identifier        ;
  _string        ;

  constructor(str        , identifier        ) {
    this._string = str;
    this._identifier = identifier;
  }

  /**
   * Find the {@link WellKnownAuthType} for the given identifier (as an {@link number}). Valid
   * identifiers are defined to be integers between 0 and 127, inclusive. Identifiers outside of
   * this range will produce the {@link #UNPARSEABLE_AUTH_TYPE}. Additionally, some identifiers in
   * that range are still only reserved and don't have a type associated yet: this method returns
   * the {@link #UNKNOWN_RESERVED_AUTH_TYPE} when passing such an identifier, which lets call sites
   * potentially detect this and keep the original representation when transmitting the associated
   * metadata buffer.
   *
   * @param id the looked up identifier
   * @return the {@link WellKnownAuthType}, or {@link #UNKNOWN_RESERVED_AUTH_TYPE} if the id is out
   *     of the specification's range, or {@link #UNKNOWN_RESERVED_AUTH_TYPE} if the id is one that
   *     is merely reserved but unknown to this implementation.
   */
  static fromIdentifier(id        )                    {
    if (id < 0x00 || id > 0x7f) {
      return UNPARSEABLE_AUTH_TYPE;
    }
    return TYPES_BY_AUTH_ID[id];
  }

  /**
   * Find the {@link WellKnownAuthType} for the given {@link String} representation. If the
   * representation is {@code null} or doesn't match a {@link WellKnownAuthType}, the {@link
   * #UNPARSEABLE_AUTH_TYPE} is returned.
   *
   * @param authTypeString the looked up mime type
   * @return the matching {@link WellKnownAuthType}, or {@link #UNPARSEABLE_AUTH_TYPE} if none
   *     matches
   */
  static fromString(authTypeString        )                    {
    if (!authTypeString) {
      throw new Error('type must be non-null');
    }

    // force UNPARSEABLE if by chance UNKNOWN_RESERVED_MIME_TYPE's text has been used
    if (authTypeString === UNKNOWN_RESERVED_AUTH_TYPE.string) {
      return UNPARSEABLE_AUTH_TYPE;
    }

    return TYPES_BY_AUTH_STRING.get(authTypeString) || UNPARSEABLE_AUTH_TYPE;
  }

  /** @return the byte identifier of the mime type, guaranteed to be positive or zero. */
  get identifier()         {
    return this._identifier;
  }

  /**
   * @return the mime type represented as a {@link String}, which is made of US_ASCII compatible
   *     characters only
   */
  get string()         {
    return this._string;
  }

  /** @see #string() */
  toString()         {
    return this._string;
  }
}

export const UNPARSEABLE_AUTH_TYPE                    = new WellKnownAuthType(
  'UNPARSEABLE_AUTH_TYPE_DO_NOT_USE',
  -2,
);
export const UNKNOWN_RESERVED_AUTH_TYPE                    = new WellKnownAuthType(
  'UNKNOWN_YET_RESERVED_DO_NOT_USE',
  -1,
);

export const SIMPLE                    = new WellKnownAuthType('simple', 0x00);
export const BEARER                    = new WellKnownAuthType('bearer', 0x01);

export const TYPES_BY_AUTH_ID                      = new Array(128);
export const TYPES_BY_AUTH_STRING                                 = new Map();

const ALL_MIME_TYPES                      = [
  UNPARSEABLE_AUTH_TYPE,
  UNKNOWN_RESERVED_AUTH_TYPE,
  SIMPLE,
  BEARER,
];

TYPES_BY_AUTH_ID.fill(UNKNOWN_RESERVED_AUTH_TYPE);

for (const value of ALL_MIME_TYPES) {
  if (value.identifier >= 0) {
    TYPES_BY_AUTH_ID[value.identifier] = value;
    TYPES_BY_AUTH_STRING.set(value.string, value);
  }
}

if (Object.seal) {
  Object.seal(TYPES_BY_AUTH_ID);
}
