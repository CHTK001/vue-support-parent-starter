/**
 * Conversational, multi-step voice control.
 *
 * WHAT THIS REPLACES. The free voice path parsed one utterance into exactly one
 * action and executed it. That is fine for "fly to Tokyo" and useless for
 * anything a person actually says: "fly to Miami and check the CCTV downtown,
 * then tell me what you see" is three steps and a question, and a single-action
 * parser can only ever do the first third of it and stay silent about the rest.
 *
 * THE LOOP. The model is given the action catalogue and asked for a batch of
 * steps plus something to say. The steps run, their results are fed BACK as an
 * observation, and it is asked again. It keeps going until it says it is done
 * or the round cap is reached. That feedback is what makes "tell me what you
 * see" answerable at all — without it the model is guessing about a map it
 * cannot observe.
 *
 * WHY NOT TOOL-CALLING. The free models this runs on are inconsistent about the
 * OpenAI tool-call protocol, and a malformed tool call is unrecoverable. A JSON
 * object in the text is something we can parse defensively, repair around, and
 * fall back from.
 */

/** Rounds of think-act-observe before giving up. */
export const MAX_ROUNDS = 4;
/** Actions per round. Enough for a compound request, short of a runaway. */
export const MAX_STEPS_PER_ROUND = 4;
/** An observation longer than this is truncated before going back to the model. */
const MAX_OBSERVATION_CHARS = 700;

/**
 * Strip the conversational runway people put in front of a request.
 *
 * "hey can you fly to Miami" and "fly to Miami" are the same instruction, but
 * the local matcher anchors on the verb and the model wastes attention on the
 * politeness. Removed only from the FRONT, so "the town of Hey" survives.
 *
 * @param {string} text
 * @returns {string}
 */
export function stripWakeWords(text) {
  let out = String(text || '').trim();
  const openers = [
    /^(hey|hi|hello|ok|okay|yo)\b[\s,]*/i,
    /^(gev|jarvis|computer|map)\b[\s,]*/i,
    /^(can|could|would|will)\s+you\b[\s,]*/i,
    /^(please|pls)\b[\s,]*/i,
    /^(i\s+want\s+(you\s+)?to|i'd\s+like\s+(you\s+)?to|let's)\b[\s,]*/i,
    /^(go\s+ahead\s+and|just)\b[\s,]*/i,
  ];
  let changed = true;
  while (changed) {
    changed = false;
    for (const opener of openers) {
      const next = out.replace(opener, '');
      if (next !== out) {
        out = next;
        changed = true;
      }
    }
  }
  return out.trim();
}

/**
 * Whether an utterance asks for more than one thing.
 *
 * MATTERS BECAUSE THE FAST PATH IS GREEDY. The local matcher's navigation
 * pattern takes everything after the verb as a place name, so "fly to Miami and
 * check the cameras" would be geocoded as a place called "miami and check the
 * cameras" — it finds nothing, and the cameras never come on. Compound requests
 * have to skip the fast path and go to the model.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function looksCompound(text) {
  const said = String(text || '').toLowerCase();
  if (!said) return false;
  // A following verb is what makes a conjunction a second instruction rather
  // than part of a name ("Trinidad and Tobago" must not count).
  const VERBS = 'show|check|tell|turn|open|close|find|look|give|play|stop|start'
    + '|fly|go|take|zoom|track|follow|enable|disable|switch|make|describe|what';
  if (new RegExp(`\\b(and|then|after that|also|plus)\\s+(${VERBS})\\b`).test(said)) return true;
  if (/\b(and\s+then|after\s+that)\b/.test(said)) return true;
  // A question tacked onto an instruction.
  if (/[,;]\s*(what|how|which|who|where|why|tell)\b/.test(said)) return true;
  return false;
}

/**
 * Whether an utterance is conversation rather than a command.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function looksConversational(text) {
  const said = String(text || '').toLowerCase().trim();
  if (!said) return false;
  if (/^(what|how|why|which|who|when|where|is|are|do|does|can|could|tell me)\b/.test(said)) return true;
  if (/\?\s*$/.test(said)) return true;
  return false;
}

/**
 * The system prompt for one conversation.
 *
 * @param {object} options
 * @param {string} options.actions Formatted action catalogue.
 * @param {string} options.layers Formatted layer id list.
 * @param {string} [options.state] A description of what is on screen now.
 * @returns {string}
 */
export function buildAgentPrompt({ actions, layers, state = '' }) {
  return [
    "You are the voice of a 3D world map called God's Eye View. You talk to the",
    'user like a person and you operate the map by calling actions.',
    '',
    'Reply with STRICT JSON only. No markdown, no code fence, no commentary.',
    '',
    'Shape:',
    '{"say":"<what to say aloud, one or two short sentences>",',
    ' "steps":[{"action":"<name>","args":{...}}],',
    ' "done":<true|false>}',
    '',
    'RULES',
    '- Put EVERY action needed for the request in "steps", in order. A request',
    '  like "fly to Miami and turn on the cameras" is two steps, not one.',
    '- Set "done": false when you need to see the results before answering.',
    '  You will be shown what happened and asked again.',
    '- Set "done": true when the task is finished and "say" is your final answer.',
    '- To answer a question about what is on screen, first call',
    '  get_current_view_state or get_entity_context with "done": false, then',
    '  answer from what comes back. Never invent what the map shows.',
    '- "steps" may be empty when you are only talking.',
    '- Keep "say" conversational and brief. It is spoken aloud, not read.',
    '- Never mention JSON, actions, steps or tools to the user.',
    '',
    'ACTIONS:',
    actions,
    '',
    'LAYER IDS (use the id, never the spoken words):',
    layers,
    ...(state ? ['', 'CURRENTLY ON SCREEN:', state] : []),
    '',
    'EXAMPLES',
    '"fly to Miami and check the cameras downtown, then tell me what you see"',
    ' -> {"say":"Heading to Miami and bringing the cameras up.",'
      + '"steps":[{"action":"fly_to_location","args":{"query":"downtown Miami"}},'
      + '{"action":"set_layer_visibility","args":{"layerId":"cctv","enabled":true}},'
      + '{"action":"get_current_view_state","args":{}}],"done":false}',
    '"what layers are on right now"',
    ' -> {"say":"Let me look.","steps":[{"action":"get_current_view_state","args":{}}],"done":false}',
    '"turn on the shootings"',
    ' -> {"say":"Mass killings layer on.",'
      + '"steps":[{"action":"set_layer_visibility","args":{"layerId":"shootings","enabled":true}}],"done":true}',
    '"what was the worst shooting in florida"',
    ' -> {"say":"Finding it.",'
      + '"steps":[{"action":"find_incident","args":{"query":"worst shooting in Florida"}}],"done":true}',
    '"thanks, that is all"',
    ' -> {"say":"Any time.","steps":[],"done":true}',
  ].join('\n');
}

/**
 * Parse one model reply.
 *
 * Defensive by necessity: free models wrap JSON in prose, in code fences, and
 * occasionally emit two objects. Taking the outermost braces and validating
 * every field is cheaper than trusting any of it.
 *
 * @param {string} text
 * @returns {{say: string, steps: Array<{action: string, args: object}>, done: boolean}|null}
 */
export function parseAgentReply(text) {
  const raw = String(text || '');
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const steps = [];
  const list = Array.isArray(parsed.steps) ? parsed.steps : [];
  for (const step of list.slice(0, MAX_STEPS_PER_ROUND)) {
    if (!step || typeof step.action !== 'string' || !step.action) continue;
    steps.push({
      action: step.action,
      args: step.args && typeof step.args === 'object' && !Array.isArray(step.args)
        ? step.args
        : {},
    });
  }
  return {
    say: typeof parsed.say === 'string' ? parsed.say : '',
    steps,
    // A reply carrying no steps is finished whatever it claims, otherwise a
    // model that answers with prose and done:false spins the loop to its cap.
    done: steps.length ? parsed.done === true : true,
  };
}

/**
 * Condense an action result into something worth sending back to the model.
 *
 * Raw results are far too big — get_current_view_state alone returns nested
 * camera, style, layer and annotation state — and a free model's context is
 * both small and slow. This keeps what answers a question and drops the rest.
 *
 * @param {string} action
 * @param {any} result
 * @returns {string}
 */
export function summariseResult(action, result) {
  if (result === null || result === undefined) return `${action}: no result`;
  if (result instanceof Error) return `${action}: failed (${result.message})`;
  if (typeof result !== 'object') return `${action}: ${String(result)}`;

  const parts = [];
  if (result.ok === false) {
    parts.push(`FAILED${result.error ? `: ${result.error}` : ''}`);
  } else {
    parts.push('ok');
  }
  // Pull out the handful of fields that actually carry meaning across the
  // whole catalogue, rather than serialising everything.
  for (const key of [
    'label', 'layerId', 'enabled', 'count', 'style', 'mode', 'stack',
    'title', 'name', 'callsign', 'station', 'answer', 'summary', 'text',
  ]) {
    const value = result[key];
    if (value === undefined || value === null || value === '') continue;
    if (typeof value === 'object') continue;
    parts.push(`${key}=${value}`);
  }
  if (Array.isArray(result.layers)) {
    const on = result.layers.filter((l) => l && l.enabled).map((l) => l.id || l.name);
    parts.push(`layersOn=[${on.join(', ')}]`);
  }
  if (result.camera && typeof result.camera === 'object') {
    const { latitude, longitude, heightM } = result.camera;
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      parts.push(`camera=${latitude.toFixed(2)},${longitude.toFixed(2)}`
        + `${Number.isFinite(heightM) ? ` @${Math.round(heightM)}m` : ''}`);
    }
  }
  if (Array.isArray(result.entities)) parts.push(`entities=${result.entities.length}`);
  if (Array.isArray(result.places)) {
    parts.push(`places=[${result.places.slice(0, 6).map((p) => p?.name || p).join(', ')}]`);
  }
  const line = `${action}: ${parts.join(' ')}`;
  return line.length > MAX_OBSERVATION_CHARS
    ? `${line.slice(0, MAX_OBSERVATION_CHARS)}…`
    : line;
}

/**
 * Build the think-act-observe loop.
 *
 * @param {object} options
 * @param {Function} options.chat Takes messages, resolves to the model's text.
 * @param {Function} options.execute Runs one step, resolves to its result.
 * @param {Function} options.buildPrompt Returns the system prompt for this turn.
 * @param {Function} [options.onSay] Called with each thing to speak.
 * @param {Function} [options.onStep] Called with each step before it runs.
 * @param {number} [options.maxRounds]
 * @returns {{ask: Function, reset: Function, history: Function}}
 */
export function createAgentLoop({
  chat, execute, buildPrompt, onSay = () => {}, onStep = () => {}, maxRounds = MAX_ROUNDS,
}) {
  /** @type {Array<{role: string, content: string}>} */
  let history = [];

  /** Keep the last few exchanges; a free model's context is small. */
  function trimHistory() {
    const MAX_MESSAGES = 12;
    if (history.length > MAX_MESSAGES) history = history.slice(-MAX_MESSAGES);
  }

  return {
    /**
     * Handle one utterance end to end.
     *
     * @param {string} transcript
     * @returns {Promise<{spoke: boolean, rounds: number, steps: number, failed?: string}>}
     */
    async ask(transcript) {
      history.push({ role: 'user', content: transcript });
      trimHistory();

      let rounds = 0;
      let stepCount = 0;
      let spoke = false;

      while (rounds < maxRounds) {
        rounds += 1;
        const text = await chat([
          { role: 'system', content: buildPrompt() },
          ...history,
        ]);
        const reply = parseAgentReply(text);
        if (!reply) {
          return { spoke, rounds, steps: stepCount, failed: 'unparseable' };
        }

        if (reply.say) { onSay(reply.say); spoke = true; }
        history.push({ role: 'assistant', content: JSON.stringify(reply) });

        if (!reply.steps.length || reply.done) {
          // Run any final steps, then stop without another model round.
          for (const step of reply.steps) {
            onStep(step);
            stepCount += 1;
            try { await execute(step); } catch { /* reported by the runner */ }
          }
          trimHistory();
          return { spoke, rounds, steps: stepCount };
        }

        const observations = [];
        for (const step of reply.steps) {
          onStep(step);
          stepCount += 1;
          let result;
          try {
            result = await execute(step);
          } catch (error) {
            result = error instanceof Error ? error : new Error(String(error));
          }
          observations.push(summariseResult(step.action, result));
        }
        history.push({
          role: 'user',
          content: `RESULTS:\n${observations.join('\n')}\n\nAnswer the user now, `
            + 'or take the next step.',
        });
        trimHistory();
      }
      return { spoke, rounds, steps: stepCount, failed: 'round-cap' };
    },

    /**
     * 清除对话历史。
     */
    reset() {
      history = [];
    },

    /**
     * 返回对话历史的副本，用于测试与诊断。
     * @returns {Array<object>}
     */
    history() {
      return history.map((m) => ({ ...m }));
    },
  };
}
