import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_ROUNDS,
  buildAgentPrompt,
  createAgentLoop,
  looksCompound,
  looksConversational,
  parseAgentReply,
  stripWakeWords,
  summariseResult,
} from './freeAgent.js';

// --- wake words -----------------------------------------------------------

test('conversational runway is stripped from the front', () => {
  assert.equal(stripWakeWords('hey fly to Miami'), 'fly to Miami');
  assert.equal(stripWakeWords('hey can you fly to Miami'), 'fly to Miami');
  assert.equal(stripWakeWords('ok computer, please show the cameras'), 'show the cameras');
  assert.equal(stripWakeWords("I'd like you to zoom out"), 'zoom out');
});

test('stripping only touches the front, never the middle', () => {
  // A place whose name contains an opener must survive intact.
  assert.equal(stripWakeWords('fly to Hey Wisconsin'), 'fly to Hey Wisconsin');
  assert.match(stripWakeWords('hey fly to Ok Oklahoma'), /Ok Oklahoma$/);
});

test('an utterance that is only runway comes back empty', () => {
  assert.equal(stripWakeWords('hey'), '');
  assert.equal(stripWakeWords('ok, can you please'), '');
  assert.equal(stripWakeWords(''), '');
});

// --- routing --------------------------------------------------------------

test('compound requests are recognised so the greedy fast path is skipped', () => {
  // THE TRAP THIS AVOIDS. The local navigation pattern takes everything after
  // the verb as a place name, so this would be geocoded as a place called
  // "miami and check the cameras downtown" — nothing found, cameras never on.
  assert.equal(looksCompound('fly to Miami and check the cameras downtown'), true);
  assert.equal(looksCompound('go to Tokyo and then tell me what you see'), true);
  assert.equal(looksCompound('show the shootings, then what is the worst one'), true);
});

test('a conjunction inside a place name is not a second instruction', () => {
  assert.equal(looksCompound('fly to Trinidad and Tobago'), false);
  assert.equal(looksCompound('go to Bosnia and Herzegovina'), false);
  assert.equal(looksCompound('fly to Turks and Caicos'), false);
});

test('questions route to the agent rather than the command matcher', () => {
  assert.equal(looksConversational('what layers are on'), true);
  assert.equal(looksConversational('how safe is Brazil?'), true);
  assert.equal(looksConversational('tell me what you see'), true);
  assert.equal(looksConversational('fly to Tokyo'), false);
  assert.equal(looksConversational('show shootings'), false);
});

// --- reply parsing --------------------------------------------------------

test('a well-formed reply parses into speech and steps', () => {
  const r = parseAgentReply('{"say":"On it.","steps":[{"action":"zoom_to_globe","args":{}}],"done":true}');
  assert.equal(r.say, 'On it.');
  assert.equal(r.steps.length, 1);
  assert.equal(r.steps[0].action, 'zoom_to_globe');
  assert.equal(r.done, true);
});

test('JSON wrapped in prose or a code fence still parses', () => {
  // Free models do this constantly; refusing to parse would make them unusable.
  const fenced = 'Sure!\n```json\n{"say":"Going.","steps":[],"done":true}\n```\nHope that helps.';
  assert.equal(parseAgentReply(fenced)?.say, 'Going.');
});

test('malformed replies are rejected rather than half-executed', () => {
  assert.equal(parseAgentReply('not json at all'), null);
  assert.equal(parseAgentReply('{"say":"broken",'), null);
  assert.equal(parseAgentReply(''), null);
});

test('steps missing an action name are dropped, not run as undefined', () => {
  const r = parseAgentReply('{"steps":[{"args":{}},{"action":"zoom_to_globe"},{"action":""}],"done":true}');
  assert.equal(r.steps.length, 1);
  assert.equal(r.steps[0].action, 'zoom_to_globe');
  assert.deepEqual(r.steps[0].args, {});
});

test('a reply with no steps is finished even if it claims otherwise', () => {
  // Otherwise a model that answers in prose with done:false spins to the cap.
  const r = parseAgentReply('{"say":"Any time.","steps":[],"done":false}');
  assert.equal(r.done, true);
});

test('a runaway step list is capped', () => {
  const many = Array.from({ length: 20 }, () => ({ action: 'zoom_to_globe', args: {} }));
  const r = parseAgentReply(JSON.stringify({ steps: many, done: false }));
  assert.ok(r.steps.length <= 4, `got ${r.steps.length} steps`);
});

// --- observations ---------------------------------------------------------

test('results are condensed to the fields that carry meaning', () => {
  const line = summariseResult('fly_to_location', { ok: true, label: 'Miami', rangeM: 900 });
  assert.match(line, /fly_to_location/);
  assert.match(line, /ok/);
  assert.match(line, /label=Miami/);
});

test('a failure is reported as a failure, not summarised away', () => {
  const line = summariseResult('fly_to_location', { ok: false, error: 'no such place' });
  assert.match(line, /FAILED/);
  assert.match(line, /no such place/);
});

test('a thrown error becomes an observation instead of ending the turn', () => {
  assert.match(summariseResult('control_radio', new Error('boom')), /failed \(boom\)/);
});

test('enabled layers are listed so "what is on" can be answered', () => {
  const line = summariseResult('get_current_view_state', {
    ok: true,
    layers: [{ id: 'cctv', enabled: true }, { id: 'flights', enabled: false }],
  });
  assert.match(line, /layersOn=\[cctv\]/);
});

test('an enormous result cannot blow the model context', () => {
  const line = summariseResult('analyst_query', { ok: true, summary: 'x'.repeat(5000) });
  assert.ok(line.length < 900, `observation was ${line.length} chars`);
});

// --- the loop -------------------------------------------------------------

/**
 * 依次回复脚本条目的 chat 测试桩。
 * @returns {Function}
 */
function scriptedChat(replies) {
  let i = 0;
  const seen = [];
  const fn = async (messages) => {
    seen.push(messages);
    return replies[i++] ?? '';
  };
  fn.seen = seen;
  return fn;
}

test('a multi-step request runs every step in order', async () => {
  const ran = [];
  const loop = createAgentLoop({
    chat: scriptedChat([
      JSON.stringify({
        say: 'Heading to Miami.',
        steps: [
          { action: 'fly_to_location', args: { query: 'Miami' } },
          { action: 'set_layer_visibility', args: { layerId: 'cctv', enabled: true } },
        ],
        done: false,
      }),
      JSON.stringify({ say: 'Cameras are up in Miami.', steps: [], done: true }),
    ]),
    execute: async (step) => { ran.push(step.action); return { ok: true }; },
    buildPrompt: () => 'SYSTEM',
  });

  const said = [];
  const loop2 = createAgentLoop({
    chat: scriptedChat([
      JSON.stringify({
        say: 'Heading to Miami.',
        steps: [
          { action: 'fly_to_location', args: { query: 'Miami' } },
          { action: 'set_layer_visibility', args: { layerId: 'cctv', enabled: true } },
        ],
        done: false,
      }),
      JSON.stringify({ say: 'Cameras are up in Miami.', steps: [], done: true }),
    ]),
    execute: async (step) => { ran.push(step.action); return { ok: true }; },
    buildPrompt: () => 'SYSTEM',
    onSay: (t) => said.push(t),
  });
  void loop;

  const outcome = await loop2.ask('fly to Miami and check the cameras');
  assert.deepEqual(ran, ['fly_to_location', 'set_layer_visibility']);
  assert.deepEqual(said, ['Heading to Miami.', 'Cameras are up in Miami.']);
  assert.equal(outcome.steps, 2);
});

test('results are fed back so a question about them can be answered', async () => {
  const chat = scriptedChat([
    JSON.stringify({ steps: [{ action: 'get_current_view_state', args: {} }], done: false }),
    JSON.stringify({ say: 'Two layers are on.', steps: [], done: true }),
  ]);
  const loop = createAgentLoop({
    chat,
    execute: async () => ({ ok: true, layers: [{ id: 'cctv', enabled: true }] }),
    buildPrompt: () => 'SYSTEM',
  });
  await loop.ask('what is on screen');
  // The second call must contain the observation from the first round.
  const secondCall = chat.seen[1];
  const observation = secondCall.map((m) => m.content).join('\n');
  assert.match(observation, /RESULTS:/);
  assert.match(observation, /layersOn=\[cctv\]/);
});

test('the loop stops at the round cap instead of running forever', async () => {
  let calls = 0;
  const loop = createAgentLoop({
    chat: async () => {
      calls += 1;
      return JSON.stringify({ steps: [{ action: 'zoom_to_globe', args: {} }], done: false });
    },
    execute: async () => ({ ok: true }),
    buildPrompt: () => 'SYSTEM',
  });
  const outcome = await loop.ask('go forever');
  assert.equal(outcome.failed, 'round-cap');
  assert.equal(calls, MAX_ROUNDS);
});

test('an unparseable reply ends the turn rather than looping', async () => {
  const loop = createAgentLoop({
    chat: async () => 'the model said something useless',
    execute: async () => ({ ok: true }),
    buildPrompt: () => 'SYSTEM',
  });
  const outcome = await loop.ask('hello');
  assert.equal(outcome.failed, 'unparseable');
  assert.equal(outcome.steps, 0);
});

test('a step that throws is observed, not fatal', async () => {
  const chat = scriptedChat([
    JSON.stringify({ steps: [{ action: 'control_radio', args: {} }], done: false }),
    JSON.stringify({ say: 'The radio would not start.', steps: [], done: true }),
  ]);
  const said = [];
  const loop = createAgentLoop({
    chat,
    execute: async () => { throw new Error('no station'); },
    buildPrompt: () => 'SYSTEM',
    onSay: (t) => said.push(t),
  });
  const outcome = await loop.ask('play the radio');
  assert.deepEqual(said, ['The radio would not start.']);
  assert.ok(!outcome.failed);
  assert.match(chat.seen[1].map((m) => m.content).join('\n'), /no station/);
});

test('the conversation is remembered across turns and can be reset', async () => {
  const chat = scriptedChat([
    JSON.stringify({ say: 'Going to Tokyo.', steps: [], done: true }),
    JSON.stringify({ say: 'Now Osaka.', steps: [], done: true }),
  ]);
  const loop = createAgentLoop({
    chat, execute: async () => ({ ok: true }), buildPrompt: () => 'SYSTEM',
  });
  await loop.ask('fly to Tokyo');
  await loop.ask('now the next city over');
  // The second turn must see the first, or follow-ups like "now the next one"
  // are meaningless.
  const followUp = chat.seen[1].map((m) => m.content).join('\n');
  assert.match(followUp, /fly to Tokyo/);
  loop.reset();
  assert.equal(loop.history().length, 0);
});

test('history is trimmed so a long conversation cannot grow without bound', async () => {
  const loop = createAgentLoop({
    chat: async () => JSON.stringify({ say: 'ok', steps: [], done: true }),
    execute: async () => ({ ok: true }),
    buildPrompt: () => 'SYSTEM',
  });
  for (let i = 0; i < 20; i += 1) await loop.ask(`turn ${i}`);
  assert.ok(loop.history().length <= 12, `history grew to ${loop.history().length}`);
});

test('the prompt names the actions and layer ids the model may use', () => {
  const prompt = buildAgentPrompt({
    actions: 'fly_to_location(query) — go somewhere',
    layers: 'cctv = cameras',
    state: 'layers on: none',
  });
  assert.match(prompt, /fly_to_location/);
  assert.match(prompt, /cctv = cameras/);
  assert.match(prompt, /CURRENTLY ON SCREEN/);
  assert.match(prompt, /layers on: none/);
  // It must demand the shape the parser expects.
  assert.match(prompt, /"steps"/);
  assert.match(prompt, /"done"/);
});
