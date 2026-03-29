type RedirectPayloadValue =
  | string
  | number
  | boolean
  | null
  | RedirectPayloadValue[]
  | { [key: string]: RedirectPayloadValue };

type RedirectPayloadParser = {
  input: string;
  index: number;
};

const skipWhitespace = (parser: RedirectPayloadParser) => {
  while (
    parser.index < parser.input.length &&
    /\s/.test(parser.input[parser.index] || "")
  ) {
    parser.index += 1;
  }
};

const parseQuotedString = (parser: RedirectPayloadParser) => {
  const quote = parser.input[parser.index];
  parser.index += 1;
  let result = "";

  while (parser.index < parser.input.length) {
    const current = parser.input[parser.index];

    if (current === "\\") {
      const next = parser.input[parser.index + 1];
      if (next) {
        result += next;
        parser.index += 2;
        continue;
      }
    }

    if (current === quote) {
      parser.index += 1;
      return result;
    }

    result += current;
    parser.index += 1;
  }

  throw new Error("Unterminated quoted string in redirect payload");
};

const normalizePrimitiveToken = (token: string): RedirectPayloadValue => {
  if (!token) {
    return "";
  }

  if (token === "true") {
    return true;
  }

  if (token === "false") {
    return false;
  }

  if (token === "null") {
    return null;
  }

  if (/^-?\d+(?:\.\d+)?$/.test(token)) {
    return Number(token);
  }

  return token;
};

const parseKey = (parser: RedirectPayloadParser) => {
  skipWhitespace(parser);
  const current = parser.input[parser.index];

  if (current === '"' || current === "'") {
    return parseQuotedString(parser);
  }

  const start = parser.index;
  while (
    parser.index < parser.input.length &&
    parser.input[parser.index] !== ":"
  ) {
    parser.index += 1;
  }

  if (parser.input[parser.index] !== ":") {
    throw new Error("Invalid redirect payload object key");
  }

  return parser.input.slice(start, parser.index).trim();
};

const parsePrimitive = (parser: RedirectPayloadParser): RedirectPayloadValue => {
  const current = parser.input[parser.index];

  if (current === '"' || current === "'") {
    return parseQuotedString(parser);
  }

  const start = parser.index;
  while (parser.index < parser.input.length) {
    const next = parser.input[parser.index];
    if (next === "," || next === "}" || next === "]") {
      break;
    }
    parser.index += 1;
  }

  return normalizePrimitiveToken(parser.input.slice(start, parser.index).trim());
};

const parseArray = (parser: RedirectPayloadParser): RedirectPayloadValue[] => {
  parser.index += 1;
  const result: RedirectPayloadValue[] = [];

  while (parser.index < parser.input.length) {
    skipWhitespace(parser);

    if (parser.input[parser.index] === "]") {
      parser.index += 1;
      return result;
    }

    result.push(parseValue(parser));
    skipWhitespace(parser);

    if (parser.input[parser.index] === ",") {
      parser.index += 1;
    }
  }

  throw new Error("Unterminated redirect payload array");
};

const parseObject = (
  parser: RedirectPayloadParser,
): Record<string, RedirectPayloadValue> => {
  parser.index += 1;
  const result: Record<string, RedirectPayloadValue> = {};

  while (parser.index < parser.input.length) {
    skipWhitespace(parser);

    if (parser.input[parser.index] === "}") {
      parser.index += 1;
      return result;
    }

    const key = parseKey(parser);
    parser.index += 1;
    skipWhitespace(parser);
    result[key] = parseValue(parser);
    skipWhitespace(parser);

    if (parser.input[parser.index] === ",") {
      parser.index += 1;
    }
  }

  throw new Error("Unterminated redirect payload object");
};

const parseValue = (parser: RedirectPayloadParser): RedirectPayloadValue => {
  skipWhitespace(parser);
  const current = parser.input[parser.index];

  if (current === "{") {
    return parseObject(parser);
  }

  if (current === "[") {
    return parseArray(parser);
  }

  return parsePrimitive(parser);
};

const parseLooseObjectLiteral = (value: string) => {
  const parser: RedirectPayloadParser = {
    input: value,
    index: 0,
  };
  const parsedValue = parseValue(parser);
  skipWhitespace(parser);

  if (
    parser.index < parser.input.length &&
    parser.input.slice(parser.index).trim().length > 0
  ) {
    throw new Error("Unexpected trailing content in redirect payload");
  }

  return parsedValue;
};

export const parseRedirectParamPayload = (
  value: unknown,
): Record<string, any> | null => {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value as Record<string, any>;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(normalizedValue);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, any>)
      : null;
  } catch {}

  try {
    const parsed = parseLooseObjectLiteral(normalizedValue);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, any>)
      : null;
  } catch {
    return null;
  }
};
