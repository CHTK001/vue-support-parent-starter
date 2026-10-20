import { ho as createFileViewerTranslator, ud as __vitePreload, wc as DEFAULT_RENDERER_DEFINITIONS } from "./file-viewer-3d-ijA7B-Qe.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-media@3.1.2/node_modules/@file-viewer/renderer-media/dist/optionalCapabilities.js
var hlsLoader = null;
var midiLoader = null;
var registerFileViewerHlsLoader = (loader) => {
	hlsLoader = loader;
};
var registerFileViewerMidiLoader = (loader) => {
	midiLoader = loader;
};
var getFileViewerHlsLoader = () => hlsLoader;
var getFileViewerMidiLoader = () => midiLoader;
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-media@3.1.2/node_modules/@file-viewer/renderer-media/dist/audio.js
var AUDIO_MIME_MAP = {
	aac: "audio/aac",
	flac: "audio/flac",
	m4a: "audio/mp4",
	mp3: "audio/mpeg",
	mpeg: "audio/mpeg",
	oga: "audio/ogg",
	ogg: "audio/ogg",
	opus: "audio/ogg; codecs=opus",
	wav: "audio/wav",
	weba: "audio/webm"
};
var audioStyle = `
.fv-audio-viewer{width:100%;min-height:100%;display:flex;align-items:center;justify-content:center;padding:28px;background:linear-gradient(135deg,rgba(14,116,144,.1),transparent 34%),linear-gradient(180deg,#f5f8fb 0%,#edf2f7 100%);box-sizing:border-box}
.fv-audio-card{width:min(100%,640px);display:grid;grid-template-columns:86px minmax(0,1fr);gap:18px;align-items:center;padding:24px;border-radius:8px;border:1px solid rgba(15,23,42,.08);background:rgba(255,255,255,.92);box-shadow:0 20px 52px rgba(15,23,42,.13);box-sizing:border-box}
.fv-audio-art{position:relative;width:86px;height:86px;border-radius:8px;background:linear-gradient(135deg,#0f766e,#2dd4bf);box-shadow:inset 0 0 0 1px rgba(255,255,255,.24)}
.fv-audio-art span{position:absolute;inset:18px;border-radius:999px;border:8px solid rgba(255,255,255,.88)}
.fv-audio-art i{position:absolute;right:18px;bottom:20px;width:18px;height:36px;border-radius:10px 10px 4px 4px;background:rgba(255,255,255,.9)}
.fv-audio-copy{min-width:0}
.fv-audio-kicker{color:#0f766e;font-size:12px;font-weight:800;letter-spacing:0}
.fv-audio-copy strong{display:block;margin-top:5px;color:#132235;font-size:23px;line-height:1.15}
.fv-audio-copy p{margin:8px 0 0;color:#64748b;font-size:13px;line-height:1.7}
.fv-audio-meter{grid-column:1/-1;display:grid;grid-template-columns:48px minmax(0,1fr) 48px;align-items:center;gap:10px;color:#64748b;font-size:12px;font-variant-numeric:tabular-nums}
.fv-audio-progress{height:6px;overflow:hidden;border-radius:999px;background:rgba(15,118,110,.12)}
.fv-audio-progress i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#0f766e,#2dd4bf);transition:width .18s ease}
.fv-audio-control{grid-column:1/-1;width:100%;height:42px}
.fv-midi-viewer{min-height:100%;padding:28px;background:#eef1f4;box-sizing:border-box}
.fv-midi-card{max-width:960px;margin:0 auto;border-radius:8px;border:1px solid rgba(15,23,42,.08);background:#fff;box-shadow:0 18px 48px rgba(15,23,42,.12);overflow:hidden}
.fv-midi-card header{padding:18px 22px;border-bottom:1px solid rgba(15,23,42,.08)}
.fv-midi-card header span{display:block;color:#0f766e;font-size:12px;font-weight:800}
.fv-midi-card header strong{display:block;margin-top:6px;color:#132235;font-size:22px}
.fv-midi-state{padding:28px 22px;color:#64748b}
.fv-midi-error{color:#b42318}
.fv-midi-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:rgba(15,23,42,.08)}
.fv-midi-stats div{padding:16px;background:#f8fafc}
.fv-midi-stats span{display:block;color:#64748b;font-size:12px}
.fv-midi-stats strong{display:block;margin-top:4px;color:#132235;font-size:20px}
.fv-midi-table-wrap{overflow:auto}
.fv-midi-table{width:100%;border-collapse:collapse;color:#132235;font-size:14px}
.fv-midi-table th,.fv-midi-table td{padding:12px 16px;border-top:1px solid rgba(15,23,42,.08);text-align:left}
.fv-midi-table th{color:#64748b;background:#f8fafc;font-weight:700}
[data-viewer-theme='dark'] .fv-audio-viewer{background:linear-gradient(135deg,rgba(45,212,191,.12),transparent 34%),linear-gradient(180deg,#111827 0%,#101820 100%);color:#e5eef8}
[data-viewer-theme='dark'] .fv-audio-card,[data-viewer-theme='dark'] .fv-midi-card{border-color:rgba(148,163,184,.18);background:#111827;color:#e5eef8;box-shadow:0 22px 56px rgba(0,0,0,.32)}
[data-viewer-theme='dark'] .fv-audio-copy strong,[data-viewer-theme='dark'] .fv-midi-card header strong,[data-viewer-theme='dark'] .fv-midi-stats strong,[data-viewer-theme='dark'] .fv-midi-table{color:#f8fafc}
[data-viewer-theme='dark'] .fv-audio-copy p,[data-viewer-theme='dark'] .fv-audio-meter,[data-viewer-theme='dark'] .fv-midi-state,[data-viewer-theme='dark'] .fv-midi-stats span,[data-viewer-theme='dark'] .fv-midi-table th{color:#94a3b8}
[data-viewer-theme='dark'] .fv-midi-viewer{background:#101820}
[data-viewer-theme='dark'] .fv-midi-card header,[data-viewer-theme='dark'] .fv-midi-table th,[data-viewer-theme='dark'] .fv-midi-stats div{border-color:rgba(148,163,184,.18);background:#151f2b}
[data-viewer-theme='dark'] .fv-midi-stats,[data-viewer-theme='dark'] .fv-midi-table th,[data-viewer-theme='dark'] .fv-midi-table td{border-color:rgba(148,163,184,.18)}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .fv-audio-viewer{background:linear-gradient(135deg,rgba(45,212,191,.12),transparent 34%),linear-gradient(180deg,#111827 0%,#101820 100%);color:#e5eef8}[data-viewer-theme='system'] .fv-audio-card,[data-viewer-theme='system'] .fv-midi-card{border-color:rgba(148,163,184,.18);background:#111827;color:#e5eef8;box-shadow:0 22px 56px rgba(0,0,0,.32)}[data-viewer-theme='system'] .fv-audio-copy strong,[data-viewer-theme='system'] .fv-midi-card header strong,[data-viewer-theme='system'] .fv-midi-stats strong,[data-viewer-theme='system'] .fv-midi-table{color:#f8fafc}[data-viewer-theme='system'] .fv-audio-copy p,[data-viewer-theme='system'] .fv-audio-meter,[data-viewer-theme='system'] .fv-midi-state,[data-viewer-theme='system'] .fv-midi-stats span,[data-viewer-theme='system'] .fv-midi-table th{color:#94a3b8}[data-viewer-theme='system'] .fv-midi-viewer{background:#101820}[data-viewer-theme='system'] .fv-midi-card header,[data-viewer-theme='system'] .fv-midi-table th,[data-viewer-theme='system'] .fv-midi-stats div{border-color:rgba(148,163,184,.18);background:#151f2b}[data-viewer-theme='system'] .fv-midi-stats,[data-viewer-theme='system'] .fv-midi-table th,[data-viewer-theme='system'] .fv-midi-table td{border-color:rgba(148,163,184,.18)}}
@media (max-width:700px){.fv-midi-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
var createElement$2 = (tagName, className, text) => {
	const element = document.createElement(tagName);
	if (className) element.className = className;
	if (typeof text === "string") element.textContent = text;
	return element;
};
var formatDuration = (seconds) => {
	if (!Number.isFinite(seconds) || seconds <= 0) return "00:00";
	const minutes = Math.floor(seconds / 60);
	const rest = Math.round(seconds % 60);
	return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};
var createStyle$1 = () => {
	const style = document.createElement("style");
	style.textContent = audioStyle;
	return style;
};
var clearTarget = (target) => {
	target.replaceChildren();
};
var createRenderedInstance$1 = (target, cleanup) => ({
	$el: target,
	unmount() {
		cleanup();
		clearTarget(target);
	}
});
var renderAudioElement = (buffer, target, type, context) => {
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const normalizedType = type.trim().toLowerCase() || "mp3";
	const mimeType = AUDIO_MIME_MAP[normalizedType] || "audio/*";
	const sourceUrl = URL.createObjectURL(new Blob([buffer], { type: mimeType }));
	const root = createElement$2("div", "fv-audio-viewer");
	const card = createElement$2("section", "fv-audio-card");
	const art = createElement$2("div", "fv-audio-art");
	art.append(createElement$2("span"), createElement$2("i"));
	const copy = createElement$2("div", "fv-audio-copy");
	copy.append(createElement$2("span", "fv-audio-kicker", normalizedType.toUpperCase() || "AUDIO"), createElement$2("strong", "", t("media.audio.title")), createElement$2("p", "", t("media.audio.description")));
	const currentTimeText = createElement$2("span", "", "00:00");
	const durationText = createElement$2("span", "", "--:--");
	const progressFill = createElement$2("i");
	const progress = createElement$2("div", "fv-audio-progress");
	progress.setAttribute("aria-hidden", "true");
	progress.append(progressFill);
	const meter = createElement$2("div", "fv-audio-meter");
	meter.append(currentTimeText, progress, durationText);
	const audio = createElement$2("audio", "fv-audio-control");
	audio.src = sourceUrl;
	audio.controls = true;
	audio.preload = "metadata";
	audio.textContent = t("media.audio.unsupported");
	const handleLoadedMetadata = () => {
		durationText.textContent = Number.isFinite(audio.duration) && audio.duration > 0 ? formatDuration(audio.duration) : "--:--";
	};
	const handleTimeUpdate = () => {
		currentTimeText.textContent = formatDuration(audio.currentTime);
		const percent = Number.isFinite(audio.duration) && audio.duration > 0 ? Math.min(100, Math.max(0, audio.currentTime / audio.duration * 100)) : 0;
		progressFill.style.width = `${percent}%`;
	};
	audio.addEventListener("loadedmetadata", handleLoadedMetadata);
	audio.addEventListener("timeupdate", handleTimeUpdate);
	card.append(art, copy, meter, audio);
	root.append(card);
	target.replaceChildren(createStyle$1(), root);
	return createRenderedInstance$1(target, () => {
		audio.pause();
		audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
		audio.removeEventListener("timeupdate", handleTimeUpdate);
		URL.revokeObjectURL(sourceUrl);
	});
};
var renderMidiElement = (buffer, target, context) => {
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	let disposed = false;
	const root = createElement$2("div", "fv-midi-viewer");
	const card = createElement$2("section", "fv-midi-card");
	const header = document.createElement("header");
	const title = createElement$2("strong", "", t("media.midi.title"));
	header.append(createElement$2("span", "", "MIDI"), title);
	const body = createElement$2("div", "fv-midi-state", t("media.midi.loading"));
	card.append(header, body);
	root.append(card);
	target.replaceChildren(createStyle$1(), root);
	const renderError = (message) => {
		body.className = "fv-midi-state fv-midi-error";
		body.textContent = message;
	};
	const renderTrackTable = (tracks) => {
		const wrap = createElement$2("div", "fv-midi-table-wrap");
		const table = createElement$2("table", "fv-midi-table");
		const thead = document.createElement("thead");
		const headerRow = document.createElement("tr");
		for (const label of [
			t("media.midi.trackHeader"),
			t("media.midi.instrumentHeader"),
			t("media.midi.channelHeader"),
			t("media.midi.noteCountHeader"),
			t("media.midi.durationHeader")
		]) headerRow.append(createElement$2("th", "", label));
		thead.append(headerRow);
		const tbody = document.createElement("tbody");
		for (const track of tracks) {
			const row = document.createElement("tr");
			row.append(createElement$2("td", "", track.name), createElement$2("td", "", track.instrument), createElement$2("td", "", String(track.channel + 1)), createElement$2("td", "", String(track.notes)), createElement$2("td", "", formatDuration(track.duration)));
			tbody.append(row);
		}
		table.append(thead, tbody);
		wrap.append(table);
		return wrap;
	};
	const renderSummary = (input) => {
		title.textContent = input.name;
		const totalNotes = input.tracks.reduce((sum, track) => sum + track.notes, 0);
		const stats = createElement$2("div", "fv-midi-stats");
		for (const [label, value] of [
			[t("media.midi.durationStat"), formatDuration(input.duration)],
			["PPQ", String(input.ppq)],
			[t("media.midi.trackStat"), String(input.tracks.length)],
			[t("media.midi.noteStat"), String(totalNotes)]
		]) {
			const stat = document.createElement("div");
			stat.append(createElement$2("span", "", label), createElement$2("strong", "", value));
			stats.append(stat);
		}
		body.replaceWith(stats, renderTrackTable(input.tracks));
	};
	(async () => {
		try {
			const loadMidi = getFileViewerMidiLoader();
			if (!loadMidi) throw new Error("MIDI support is opt-in. Run `npx file-viewer-cli add midi --write`, then `npx file-viewer-cli install --yes`.");
			const { Midi } = await loadMidi();
			const midi = new Midi(buffer);
			if (disposed) return;
			renderSummary({
				name: midi.name || t("media.midi.title"),
				duration: midi.duration,
				ppq: midi.header.ppq,
				tracks: midi.tracks.map((track, index) => {
					var _a, _b;
					return {
						name: track.name || `Track ${index + 1}`,
						instrument: ((_a = track.instrument) === null || _a === void 0 ? void 0 : _a.name) || ((_b = track.instrument) === null || _b === void 0 ? void 0 : _b.family) || "Unknown",
						channel: track.channel,
						notes: track.notes.length,
						duration: track.duration
					};
				})
			});
		} catch (error) {
			if (!disposed) renderError(error instanceof Error ? error.message : t("media.midi.parseFailed"));
		}
	})();
	return createRenderedInstance$1(target, () => {
		disposed = true;
	});
};
/**
* Pure TypeScript audio renderer.
*
* Regular audio files use the browser's native `<audio>` element. MIDI stays in
* the same async chunk and lazily imports `@tonejs/midi` only for `.mid/.midi`.
*/
async function renderAudio(buffer, target, type, context) {
	const normalizedType = (type || "mp3").toLowerCase();
	if (normalizedType === "midi" || normalizedType === "mid") return renderMidiElement(buffer, target, context);
	return renderAudioElement(buffer, target, normalizedType, context);
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-media@3.1.2/node_modules/@file-viewer/renderer-media/dist/index.js
var mediaRendererIds = ["audio", "video"];
var mediaDefinitions = DEFAULT_RENDERER_DEFINITIONS.filter((definition) => mediaRendererIds.includes(definition.id));
if (mediaDefinitions.length !== mediaRendererIds.length) throw new Error("@file-viewer/renderer-media could not locate the shared audio/video format definitions.");
var mediaRendererDefinitions = mediaDefinitions;
var renderFileViewerAudio = (buffer, target, type, context) => __vitePreload(async () => {
	const { default: renderAudio } = await import("./audio-CkdXujzy.js");
	return { default: renderAudio };
}, []).then(({ default: renderAudio }) => renderAudio(buffer, target, type, context));
var renderFileViewerVideo = (buffer, target, type, context) => __vitePreload(async () => {
	const { default: renderVideo } = await import("./video-D0nrDchR.js");
	return { default: renderVideo };
}, []).then(({ default: renderVideo }) => renderVideo(buffer, target, type, context));
var mediaRenderer = {
	id: "file-viewer-renderer-media",
	label: "Flyfish File Viewer media renderer",
	definitions: mediaRendererDefinitions,
	handlers: [{
		rendererId: "audio",
		handler: renderFileViewerAudio
	}, {
		rendererId: "video",
		handler: renderFileViewerVideo
	}]
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-media@3.1.2/node_modules/@file-viewer/renderer-media/dist/mp4.js
var MAX_MP4_VIDEO_SAMPLES = 1e6;
var MAX_MP4V_DIMENSION = 8192;
var MAX_MP4V_PIXELS = 35e6;
var MAX_MP4V_DECODER_CONFIG_BYTES = 65536;
var MAX_MP4V_SAMPLE_BYTES = 67108864;
var VIDEO_CODEC_LABELS = {
	av01: "AV1 (av01)",
	avc1: "H.264/AVC (avc1)",
	avc3: "H.264/AVC (avc3)",
	hev1: "HEVC (hev1)",
	hvc1: "HEVC (hvc1)",
	mp4v: "MPEG-4 Part 2 (mp4v)",
	vp09: "VP9 (vp09)"
};
var readFourCc = (view, offset) => {
	if (offset < 0 || offset + 4 > view.byteLength) return "";
	return String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
};
var readBox = (view, offset, limit) => {
	if (offset < 0 || offset + 8 > limit || limit > view.byteLength) return void 0;
	const size32 = view.getUint32(offset);
	const type = readFourCc(view, offset + 4);
	let headerSize = 8;
	let size = size32;
	if (size32 === 1) {
		if (offset + 16 > limit) return void 0;
		const high = view.getUint32(offset + 8);
		const low = view.getUint32(offset + 12);
		size = high * 4294967296 + low;
		headerSize = 16;
	} else if (size32 === 0) size = limit - offset;
	if (!type || !Number.isSafeInteger(size) || size < headerSize || offset + size > limit) return;
	return {
		type,
		start: offset,
		payloadStart: offset + headerSize,
		end: offset + size
	};
};
var readChildren = (view, start, end) => {
	const boxes = [];
	let offset = start;
	while (offset + 8 <= end) {
		const box = readBox(view, offset, end);
		if (!box) break;
		boxes.push(box);
		if (box.end <= offset) break;
		offset = box.end;
	}
	return boxes;
};
var findChild = (view, parent, type) => readChildren(view, parent.payloadStart, parent.end).find((box) => box.type === type);
var readUint64 = (view, offset) => {
	const high = view.getUint32(offset);
	const low = view.getUint32(offset + 4);
	const value = high * 4294967296 + low;
	return Number.isSafeInteger(value) ? value : 0;
};
var getHandlerType = (view, mediaBox) => {
	const handlerBox = findChild(view, mediaBox, "hdlr");
	if (!handlerBox || handlerBox.payloadStart + 12 > handlerBox.end) return "";
	return readFourCc(view, handlerBox.payloadStart + 8);
};
var getVideoSampleEntry = (view, mediaBox) => {
	const mediaInformationBox = findChild(view, mediaBox, "minf");
	const sampleTableBox = mediaInformationBox ? findChild(view, mediaInformationBox, "stbl") : void 0;
	const sampleDescriptionBox = sampleTableBox ? findChild(view, sampleTableBox, "stsd") : void 0;
	if (!sampleDescriptionBox || sampleDescriptionBox.payloadStart + 8 > sampleDescriptionBox.end) return;
	const entryCount = view.getUint32(sampleDescriptionBox.payloadStart + 4);
	const offset = sampleDescriptionBox.payloadStart + 8;
	for (let index = 0; index < entryCount && offset + 8 <= sampleDescriptionBox.end; index += 1) {
		const entry = readBox(view, offset, sampleDescriptionBox.end);
		if (!entry) break;
		return entry.type;
	}
};
var getSampleDescription = (view, mediaBox) => {
	const mediaInformationBox = findChild(view, mediaBox, "minf");
	const sampleTableBox = mediaInformationBox ? findChild(view, mediaInformationBox, "stbl") : void 0;
	const sampleDescriptionBox = sampleTableBox ? findChild(view, sampleTableBox, "stsd") : void 0;
	if (!sampleDescriptionBox || sampleDescriptionBox.payloadStart + 16 > sampleDescriptionBox.end) return;
	return readBox(view, sampleDescriptionBox.payloadStart + 8, sampleDescriptionBox.end);
};
var readMpeg4Descriptor = (view, offset, limit) => {
	if (offset + 2 > limit) return void 0;
	const tag = view.getUint8(offset);
	let cursor = offset + 1;
	let length = 0;
	for (let index = 0; index < 4 && cursor < limit; index += 1) {
		const value = view.getUint8(cursor);
		cursor += 1;
		length = length << 7 | value & 127;
		if ((value & 128) === 0) {
			const end = cursor + length;
			if (end > limit) return void 0;
			return {
				tag,
				payloadStart: cursor,
				end
			};
		}
	}
};
var readDecoderSpecificInfo = (view, sampleEntry) => {
	const visualSampleEntryHeaderSize = 78;
	if (sampleEntry.payloadStart + visualSampleEntryHeaderSize > sampleEntry.end) return;
	const esdsBox = readChildren(view, sampleEntry.payloadStart + visualSampleEntryHeaderSize, sampleEntry.end).find((box) => box.type === "esds");
	if (!esdsBox || esdsBox.payloadStart + 4 >= esdsBox.end) return void 0;
	const esDescriptor = readMpeg4Descriptor(view, esdsBox.payloadStart + 4, esdsBox.end);
	if (!esDescriptor || esDescriptor.tag !== 3 || esDescriptor.payloadStart + 3 > esDescriptor.end) return;
	const flags = view.getUint8(esDescriptor.payloadStart + 2);
	let cursor = esDescriptor.payloadStart + 3;
	if (flags & 128) cursor += 2;
	if (flags & 64) {
		if (cursor >= esDescriptor.end) return void 0;
		cursor += 1 + view.getUint8(cursor);
	}
	if (flags & 32) cursor += 2;
	const decoderConfig = readMpeg4Descriptor(view, cursor, esDescriptor.end);
	if (!decoderConfig || decoderConfig.tag !== 4) return void 0;
	cursor = decoderConfig.payloadStart + 13;
	while (cursor < decoderConfig.end) {
		const descriptor = readMpeg4Descriptor(view, cursor, decoderConfig.end);
		if (!descriptor) return void 0;
		if (descriptor.tag === 5) {
			const configSize = descriptor.end - descriptor.payloadStart;
			if (configSize <= 0 || configSize > MAX_MP4V_DECODER_CONFIG_BYTES) return;
			return new Uint8Array(view.buffer.slice(descriptor.payloadStart, descriptor.end));
		}
		cursor = descriptor.end;
	}
};
var getMediaTimescaleAndDuration = (view, mediaBox) => {
	const mediaHeader = findChild(view, mediaBox, "mdhd");
	if (!mediaHeader || mediaHeader.payloadStart + 20 > mediaHeader.end) return void 0;
	if (view.getUint8(mediaHeader.payloadStart) === 1) {
		if (mediaHeader.payloadStart + 32 > mediaHeader.end) return void 0;
		return {
			timescale: view.getUint32(mediaHeader.payloadStart + 20),
			duration: readUint64(view, mediaHeader.payloadStart + 24)
		};
	}
	return {
		timescale: view.getUint32(mediaHeader.payloadStart + 12),
		duration: view.getUint32(mediaHeader.payloadStart + 16)
	};
};
var getSampleTable = (view, mediaBox) => {
	const mediaInformationBox = findChild(view, mediaBox, "minf");
	return mediaInformationBox ? findChild(view, mediaInformationBox, "stbl") : void 0;
};
var readTimeToSample = (view, box, expectedSamples) => {
	if (box.payloadStart + 8 > box.end) return [];
	const count = view.getUint32(box.payloadStart + 4);
	const durations = [];
	let cursor = box.payloadStart + 8;
	for (let index = 0; index < count && cursor + 8 <= box.end; index += 1) {
		const sampleCount = view.getUint32(cursor);
		const sampleDelta = view.getUint32(cursor + 4);
		if (sampleCount === 0 || sampleDelta === 0 || durations.length + sampleCount > expectedSamples) return [];
		for (let sample = 0; sample < sampleCount; sample += 1) durations.push(sampleDelta);
		cursor += 8;
	}
	return durations.length === expectedSamples ? durations : [];
};
var readCompositionOffsets = (view, box, expectedSamples) => {
	if (!box || box.payloadStart + 8 > box.end) return [];
	const version = view.getUint8(box.payloadStart);
	const count = view.getUint32(box.payloadStart + 4);
	const offsets = [];
	let cursor = box.payloadStart + 8;
	for (let index = 0; index < count && cursor + 8 <= box.end; index += 1) {
		const sampleCount = view.getUint32(cursor);
		const sampleOffset = version === 1 ? view.getInt32(cursor + 4) : view.getUint32(cursor + 4);
		if (sampleCount === 0 || offsets.length + sampleCount > expectedSamples) return [];
		for (let sample = 0; sample < sampleCount; sample += 1) offsets.push(sampleOffset);
		cursor += 8;
	}
	return offsets.length === expectedSamples ? offsets : [];
};
var readSampleSizes = (view, box) => {
	if (box.payloadStart + 12 > box.end) return [];
	const fixedSize = view.getUint32(box.payloadStart + 4);
	const count = view.getUint32(box.payloadStart + 8);
	if (count === 0 || count > MAX_MP4_VIDEO_SAMPLES) return [];
	if (fixedSize) {
		if (fixedSize > MAX_MP4V_SAMPLE_BYTES) return [];
		return Array.from({ length: count }, () => fixedSize);
	}
	const sizes = [];
	let cursor = box.payloadStart + 12;
	for (let index = 0; index < count && cursor + 4 <= box.end; index += 1) {
		const size = view.getUint32(cursor);
		if (size === 0 || size > MAX_MP4V_SAMPLE_BYTES) return [];
		sizes.push(size);
		cursor += 4;
	}
	return sizes.length === count ? sizes : [];
};
var readChunkOffsets = (view, box) => {
	if (box.payloadStart + 8 > box.end) return [];
	const count = view.getUint32(box.payloadStart + 4);
	const entrySize = box.type === "co64" ? 8 : 4;
	const offsets = [];
	let cursor = box.payloadStart + 8;
	for (let index = 0; index < count && cursor + entrySize <= box.end; index += 1) {
		offsets.push(entrySize === 8 ? readUint64(view, cursor) : view.getUint32(cursor));
		cursor += entrySize;
	}
	return offsets;
};
var readSampleToChunk = (view, box) => {
	if (box.payloadStart + 8 > box.end) return [];
	const count = view.getUint32(box.payloadStart + 4);
	const entries = [];
	let cursor = box.payloadStart + 8;
	for (let index = 0; index < count && cursor + 12 <= box.end; index += 1) {
		const firstChunk = view.getUint32(cursor);
		const samplesPerChunk = view.getUint32(cursor + 4);
		if (firstChunk === 0 || samplesPerChunk === 0 || entries.length === 0 && firstChunk !== 1 || entries.length > 0 && firstChunk <= entries[entries.length - 1].firstChunk) return [];
		entries.push({
			firstChunk,
			samplesPerChunk
		});
		cursor += 12;
	}
	return entries;
};
var readSyncSamples = (view, box, sampleCount) => {
	if (!box) return void 0;
	if (box.payloadStart + 8 > box.end) return null;
	const count = view.getUint32(box.payloadStart + 4);
	if (count > sampleCount) return null;
	const samples = /* @__PURE__ */ new Set();
	let cursor = box.payloadStart + 8;
	for (let index = 0; index < count && cursor + 4 <= box.end; index += 1) {
		const sample = view.getUint32(cursor);
		if (sample === 0 || sample > sampleCount) return null;
		samples.add(sample - 1);
		cursor += 4;
	}
	return samples;
};
var buildSamples = (view, sampleTable) => {
	const timeToSampleBox = findChild(view, sampleTable, "stts");
	const sampleSizeBox = findChild(view, sampleTable, "stsz");
	const sampleToChunkBox = findChild(view, sampleTable, "stsc");
	const chunkOffsetBox = findChild(view, sampleTable, "stco") || findChild(view, sampleTable, "co64");
	if (!timeToSampleBox || !sampleSizeBox || !sampleToChunkBox || !chunkOffsetBox) return [];
	const sizes = readSampleSizes(view, sampleSizeBox);
	if (!sizes.length) return [];
	const durations = readTimeToSample(view, timeToSampleBox, sizes.length);
	if (!durations.length) return [];
	const compositionOffsets = readCompositionOffsets(view, findChild(view, sampleTable, "ctts"), sizes.length);
	const sampleToChunk = readSampleToChunk(view, sampleToChunkBox);
	const chunkOffsets = readChunkOffsets(view, chunkOffsetBox);
	const syncSamples = readSyncSamples(view, findChild(view, sampleTable, "stss"), sizes.length);
	if (syncSamples === null) return [];
	if (!sampleToChunk.length || !chunkOffsets.length) return [];
	const offsets = [];
	let sampleIndex = 0;
	let tableIndex = 0;
	for (let chunkIndex = 1; chunkIndex <= chunkOffsets.length && sampleIndex < sizes.length; chunkIndex += 1) {
		while (tableIndex + 1 < sampleToChunk.length && sampleToChunk[tableIndex + 1].firstChunk <= chunkIndex) tableIndex += 1;
		let offset = chunkOffsets[chunkIndex - 1];
		for (let sampleInChunk = 0; sampleInChunk < sampleToChunk[tableIndex].samplesPerChunk && sampleIndex < sizes.length; sampleInChunk += 1) {
			offsets.push(offset);
			offset += sizes[sampleIndex];
			sampleIndex += 1;
		}
	}
	if (offsets.length !== sizes.length) return [];
	let dts = 0;
	return sizes.map((size, index) => {
		const duration = durations[index] || durations[durations.length - 1] || 0;
		const sample = {
			offset: offsets[index],
			size,
			dts,
			cts: dts + (compositionOffsets[index] || 0),
			duration,
			isSync: syncSamples ? syncSamples.has(index) : true
		};
		dts += duration;
		return sample;
	});
};
var getCodecContentType = (codec) => {
	return `video/mp4; codecs="${codec === "mp4v" ? "mp4v.20" : codec}"`;
};
/**
* Reads the declared video sample entry from an ISO BMFF/MP4 file.
*
* Browsers can accept the generic `video/mp4` container while silently
* ignoring an unsupported video track. Inspecting `stsd` lets the renderer
* distinguish that audio-only success from a genuinely decodable video.
*/
var inspectMp4VideoTrack = (buffer) => {
	const view = new DataView(buffer);
	const movieBox = readChildren(view, 0, view.byteLength).find((box) => box.type === "moov");
	if (!movieBox) return void 0;
	for (const trackBox of readChildren(view, movieBox.payloadStart, movieBox.end)) {
		if (trackBox.type !== "trak") continue;
		const mediaBox = findChild(view, trackBox, "mdia");
		if (!mediaBox || getHandlerType(view, mediaBox) !== "vide") continue;
		const codec = getVideoSampleEntry(view, mediaBox);
		if (!codec) return void 0;
		return {
			codec,
			label: VIDEO_CODEC_LABELS[codec] || codec,
			contentType: getCodecContentType(codec)
		};
	}
};
/**
* Extracts the minimal MP4V decode timeline needed by the Apache-2.0
* PacketVideo software decoder. This intentionally avoids a general-purpose
* media framework so the fallback stays small and offline-friendly.
*/
var extractMp4vSoftwareTrack = (buffer) => {
	const view = new DataView(buffer);
	const movieBox = readChildren(view, 0, view.byteLength).find((box) => box.type === "moov");
	if (!movieBox) return void 0;
	for (const trackBox of readChildren(view, movieBox.payloadStart, movieBox.end)) {
		if (trackBox.type !== "trak") continue;
		const mediaBox = findChild(view, trackBox, "mdia");
		if (!mediaBox || getHandlerType(view, mediaBox) !== "vide") continue;
		const sampleEntry = getSampleDescription(view, mediaBox);
		if (!sampleEntry || sampleEntry.type !== "mp4v") return void 0;
		const dimensionsOffset = sampleEntry.payloadStart + 24;
		if (dimensionsOffset + 4 > sampleEntry.end) return void 0;
		const decoderConfig = readDecoderSpecificInfo(view, sampleEntry);
		const timing = getMediaTimescaleAndDuration(view, mediaBox);
		const sampleTable = getSampleTable(view, mediaBox);
		const width = view.getUint16(dimensionsOffset);
		const height = view.getUint16(dimensionsOffset + 2);
		if (!width || !height || width > MAX_MP4V_DIMENSION || height > MAX_MP4V_DIMENSION || width * height > MAX_MP4V_PIXELS || !(decoderConfig === null || decoderConfig === void 0 ? void 0 : decoderConfig.length) || decoderConfig.length > MAX_MP4V_DECODER_CONFIG_BYTES || !(timing === null || timing === void 0 ? void 0 : timing.timescale) || !timing.duration || !sampleTable) return void 0;
		const samples = buildSamples(view, sampleTable);
		if (!samples.length || samples.some((sample) => sample.offset < 0 || sample.size <= 0 || !Number.isSafeInteger(sample.offset + sample.size) || sample.offset + sample.size > buffer.byteLength)) return void 0;
		return {
			codec: "mp4v",
			label: VIDEO_CODEC_LABELS.mp4v,
			contentType: getCodecContentType("mp4v"),
			width,
			height,
			timescale: timing.timescale,
			duration: timing.duration,
			decoderConfig,
			samples
		};
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-media@3.1.2/node_modules/@file-viewer/renderer-media/dist/mp4vPlayer.js
var createElement$1 = (tagName, className, text) => {
	const element = document.createElement(tagName);
	if (className) element.className = className;
	if (typeof text === "string") element.textContent = text;
	return element;
};
var formatTime = (seconds) => {
	if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
	const wholeSeconds = Math.floor(seconds);
	const hours = Math.floor(wholeSeconds / 3600);
	const minutes = Math.floor(wholeSeconds % 3600 / 60);
	const rest = wholeSeconds % 60;
	return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}` : `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};
var mountMp4vSoftwarePlayer = async (buffer, video, track, context) => {
	var _a;
	if (typeof Worker === "undefined") throw new Error("Web Worker is unavailable.");
	if (typeof HTMLCanvasElement.prototype.transferControlToOffscreen !== "function") throw new Error("OffscreenCanvas is unavailable.");
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const player = createElement$1("div", "fv-video-software-player");
	player.tabIndex = 0;
	player.dataset.state = "loading";
	player.style.aspectRatio = `${track.width} / ${track.height}`;
	const canvas = createElement$1("canvas", "fv-video-software-canvas");
	canvas.width = track.width;
	canvas.height = track.height;
	const loading = createElement$1("div", "fv-video-software-loading", t("media.video.softwareLoading"));
	loading.setAttribute("role", "status");
	const badge = createElement$1("span", "fv-video-software-badge", t("media.video.softwareBadge"));
	const controls = createElement$1("div", "fv-video-software-controls");
	const playButton = createElement$1("button", "fv-video-software-button", "▶");
	playButton.type = "button";
	playButton.setAttribute("aria-label", t("media.video.play"));
	const currentTime = createElement$1("span", "fv-video-software-time", "00:00");
	const seek = createElement$1("input", "fv-video-software-seek");
	seek.type = "range";
	seek.min = "0";
	seek.max = String(track.duration / track.timescale);
	seek.step = "0.01";
	seek.value = "0";
	seek.setAttribute("aria-label", t("media.video.seek"));
	const duration = createElement$1("span", "fv-video-software-time", formatTime(track.duration / track.timescale));
	const volumeButton = createElement$1("button", "fv-video-software-button", "🔊");
	volumeButton.type = "button";
	volumeButton.setAttribute("aria-label", t("media.video.mute"));
	const fullscreenButton = createElement$1("button", "fv-video-software-button", "⛶");
	fullscreenButton.type = "button";
	fullscreenButton.setAttribute("aria-label", t("media.video.fullscreen"));
	controls.append(playButton, currentTime, seek, duration, volumeButton, fullscreenButton);
	video.controls = false;
	video.className = "fv-video-audio-clock";
	video.replaceWith(player);
	player.append(canvas, loading, badge, controls, video);
	const worker = new Worker(new URL(
		/* @vite-ignore */
		"/assets/mp4v.worker-BA592xuL.js",
		"" + import.meta.url
	), {
		type: "module",
		name: "file-viewer-mp4v-decoder"
	});
	let disposed = false;
	let ready = false;
	let rejectReady;
	let resolveReady;
	const readyPromise = new Promise((resolve, reject) => {
		resolveReady = resolve;
		rejectReady = reject;
	});
	const sendClock = (type) => {
		if (disposed || !ready) return;
		worker.postMessage({
			type,
			time: video.currentTime || 0
		});
	};
	const syncControls = () => {
		const value = Number.isFinite(video.currentTime) ? video.currentTime : 0;
		currentTime.textContent = formatTime(value);
		seek.value = String(value);
		playButton.textContent = video.paused ? "▶" : "❚❚";
		playButton.setAttribute("aria-label", t(video.paused ? "media.video.play" : "media.video.pause"));
		volumeButton.textContent = video.muted || video.volume === 0 ? "🔇" : "🔊";
		volumeButton.setAttribute("aria-label", t(video.muted || video.volume === 0 ? "media.video.unmute" : "media.video.mute"));
	};
	const onPlay = () => {
		syncControls();
		sendClock("play");
	};
	const onPause = () => {
		syncControls();
		sendClock("pause");
	};
	const onSeeking = () => {
		syncControls();
		sendClock("seek");
	};
	const onTimeUpdate = () => {
		syncControls();
		sendClock("sync");
	};
	const onVolumeChange = () => syncControls();
	const onAbort = () => cleanup();
	const togglePlayback = () => {
		if (video.paused) video.play().catch((error) => {
			player.dataset.state = "error";
			loading.textContent = error instanceof Error ? error.message : String(error);
		});
		else video.pause();
	};
	const onSeekInput = () => {
		video.currentTime = Number(seek.value);
		onSeeking();
	};
	const onVolumeClick = () => {
		video.muted = !video.muted;
	};
	const onFullscreenClick = () => {
		if (document.fullscreenElement === player) document.exitFullscreen();
		else player.requestFullscreen();
	};
	const onPlayerKeydown = (event) => {
		if (event.target === seek) return;
		if (event.key === " " || event.key === "k") {
			event.preventDefault();
			togglePlayback();
		} else if (event.key === "ArrowLeft") video.currentTime = Math.max(0, video.currentTime - 5);
		else if (event.key === "ArrowRight") video.currentTime = Math.min(Number(seek.max), video.currentTime + 5);
	};
	const cleanup = () => {
		var _a;
		if (disposed) return;
		disposed = true;
		video.pause();
		worker.postMessage({ type: "dispose" });
		worker.terminate();
		video.removeEventListener("play", onPlay);
		video.removeEventListener("pause", onPause);
		video.removeEventListener("ended", onPause);
		video.removeEventListener("seeking", onSeeking);
		video.removeEventListener("timeupdate", onTimeUpdate);
		video.removeEventListener("volumechange", onVolumeChange);
		playButton.removeEventListener("click", togglePlayback);
		canvas.removeEventListener("click", togglePlayback);
		seek.removeEventListener("input", onSeekInput);
		volumeButton.removeEventListener("click", onVolumeClick);
		fullscreenButton.removeEventListener("click", onFullscreenClick);
		player.removeEventListener("keydown", onPlayerKeydown);
		(_a = context === null || context === void 0 ? void 0 : context.signal) === null || _a === void 0 || _a.removeEventListener("abort", onAbort);
	};
	worker.onmessage = (event) => {
		const message = event.data;
		if (message.type === "ready") {
			ready = true;
			player.dataset.state = "ready";
			loading.hidden = true;
			seek.max = String(Math.max(message.duration, video.duration || 0));
			duration.textContent = formatTime(Number(seek.max));
			syncControls();
			resolveReady === null || resolveReady === void 0 || resolveReady();
			return;
		}
		if (message.type === "frame") {
			player.dataset.frame = String(message.index);
			player.dataset.frameTime = String(message.time);
			player.dataset.decodeMs = String(message.decodeMs);
			return;
		}
		const error = new Error(message.message);
		player.dataset.state = "error";
		loading.hidden = false;
		loading.textContent = message.message;
		if (!ready) rejectReady === null || rejectReady === void 0 || rejectReady(error);
	};
	worker.onerror = (event) => {
		const error = new Error(event.message || "The MP4V decoder Worker failed.");
		player.dataset.state = "error";
		loading.hidden = false;
		loading.textContent = error.message;
		if (!ready) rejectReady === null || rejectReady === void 0 || rejectReady(error);
	};
	video.addEventListener("play", onPlay);
	video.addEventListener("pause", onPause);
	video.addEventListener("ended", onPause);
	video.addEventListener("seeking", onSeeking);
	video.addEventListener("timeupdate", onTimeUpdate);
	video.addEventListener("volumechange", onVolumeChange);
	playButton.addEventListener("click", togglePlayback);
	canvas.addEventListener("click", togglePlayback);
	seek.addEventListener("input", onSeekInput);
	volumeButton.addEventListener("click", onVolumeClick);
	fullscreenButton.addEventListener("click", onFullscreenClick);
	player.addEventListener("keydown", onPlayerKeydown);
	(_a = context === null || context === void 0 ? void 0 : context.signal) === null || _a === void 0 || _a.addEventListener("abort", onAbort, { once: true });
	syncControls();
	const offscreen = canvas.transferControlToOffscreen();
	worker.postMessage({
		type: "init",
		buffer,
		canvas: offscreen
	}, [buffer, offscreen]);
	try {
		await readyPromise;
	} catch (error) {
		cleanup();
		throw error;
	}
	return { cleanup };
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-media@3.1.2/node_modules/@file-viewer/renderer-media/dist/video.js
var videoStyle = `
.fv-video-viewer{width:100%;min-height:100%;display:flex;align-items:center;justify-content:center;padding:28px;background:#eef1f4;box-sizing:border-box}
.fv-video-shell{width:min(100%,960px);border-radius:8px;border:1px solid rgba(15,23,42,.1);background:#fff;box-shadow:0 18px 48px rgba(15,23,42,.14);overflow:hidden}
.fv-video-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 18px;border-bottom:1px solid rgba(15,23,42,.08)}
.fv-video-heading span{color:#0f766e;font-size:12px;font-weight:800}
.fv-video-heading strong{color:#132235;font-size:16px}
.fv-video-player{display:block;width:100%;aspect-ratio:16/9;background:#05070a}
.fv-video-hint{margin:0;padding:12px 18px 16px;color:#64748b;font-size:13px;line-height:1.7}
.fv-video-software-player{position:relative;width:100%;max-height:min(72vh,720px);overflow:hidden;background:#05070a;color:#fff;outline:none}
.fv-video-software-canvas{display:block;width:100%;height:100%;object-fit:contain;background:#05070a;cursor:pointer}
.fv-video-audio-clock{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.fv-video-software-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(2,6,12,.74);color:#f8fafc;font-size:14px;text-align:center;box-sizing:border-box;z-index:2}
.fv-video-software-loading[hidden]{display:none}
.fv-video-software-badge{position:absolute;top:12px;right:12px;padding:4px 8px;border:1px solid rgba(255,255,255,.24);border-radius:999px;background:rgba(2,6,12,.68);color:#e2e8f0;font-size:11px;font-weight:700;z-index:1}
.fv-video-software-controls{position:absolute;left:0;right:0;bottom:0;display:grid;grid-template-columns:40px auto minmax(80px,1fr) auto 40px 40px;gap:8px;align-items:center;padding:28px 12px 10px;background:linear-gradient(transparent,rgba(2,6,12,.9));box-sizing:border-box;z-index:1}
.fv-video-software-button{width:36px;height:32px;padding:0;border:0;border-radius:6px;background:rgba(255,255,255,.08);color:#fff;font:700 15px/1 system-ui;cursor:pointer}
.fv-video-software-button:hover,.fv-video-software-button:focus-visible{background:rgba(255,255,255,.2);outline:2px solid rgba(45,212,191,.8);outline-offset:1px}
.fv-video-software-time{min-width:42px;color:#f8fafc;font-size:12px;font-variant-numeric:tabular-nums;text-align:center}
.fv-video-software-seek{width:100%;accent-color:#14b8a6;cursor:pointer}
.fv-video-compatibility{min-height:320px;display:flex;align-items:center;justify-content:center;padding:32px;background:linear-gradient(135deg,rgba(245,158,11,.12),transparent 46%),#f8fafc;box-sizing:border-box}
.fv-video-compatibility-card{width:min(100%,620px);padding:24px;border:1px solid rgba(217,119,6,.24);border-radius:8px;background:#fff7ed;color:#7c2d12;box-sizing:border-box}
.fv-video-compatibility-card span{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;background:#ffedd5;color:#9a3412;font-size:12px;font-weight:800}
.fv-video-compatibility-card strong{display:block;margin-top:12px;color:#7c2d12;font-size:20px;line-height:1.3}
.fv-video-compatibility-card p{margin:9px 0 0;color:#9a3412;font-size:14px;line-height:1.7}
.fv-video-compatibility-card code{display:inline-block;margin-top:14px;padding:5px 8px;border-radius:6px;background:rgba(124,45,18,.08);color:#7c2d12;font:600 12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace}
[data-viewer-theme='dark'] .fv-video-viewer{background:#101820;color:#e5eef8}
[data-viewer-theme='dark'] .fv-video-shell{border-color:rgba(148,163,184,.18);background:#111827;box-shadow:0 22px 56px rgba(0,0,0,.32)}
[data-viewer-theme='dark'] .fv-video-heading{border-color:rgba(148,163,184,.18)}
[data-viewer-theme='dark'] .fv-video-heading strong{color:#f8fafc}
[data-viewer-theme='dark'] .fv-video-hint{color:#94a3b8}
[data-viewer-theme='dark'] .fv-video-compatibility{background:linear-gradient(135deg,rgba(251,146,60,.13),transparent 46%),#0f172a}
[data-viewer-theme='dark'] .fv-video-compatibility-card{border-color:rgba(251,146,60,.3);background:#28170f;color:#fed7aa}
[data-viewer-theme='dark'] .fv-video-compatibility-card span{background:#431d0b;color:#fdba74}
[data-viewer-theme='dark'] .fv-video-compatibility-card strong,[data-viewer-theme='dark'] .fv-video-compatibility-card p,[data-viewer-theme='dark'] .fv-video-compatibility-card code{color:#fed7aa}
[data-viewer-theme='dark'] .fv-video-compatibility-card code{background:rgba(251,146,60,.12)}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .fv-video-viewer{background:#101820;color:#e5eef8}[data-viewer-theme='system'] .fv-video-shell{border-color:rgba(148,163,184,.18);background:#111827;box-shadow:0 22px 56px rgba(0,0,0,.32)}[data-viewer-theme='system'] .fv-video-heading{border-color:rgba(148,163,184,.18)}[data-viewer-theme='system'] .fv-video-heading strong{color:#f8fafc}[data-viewer-theme='system'] .fv-video-hint{color:#94a3b8}[data-viewer-theme='system'] .fv-video-compatibility{background:linear-gradient(135deg,rgba(251,146,60,.13),transparent 46%),#0f172a}[data-viewer-theme='system'] .fv-video-compatibility-card{border-color:rgba(251,146,60,.3);background:#28170f;color:#fed7aa}[data-viewer-theme='system'] .fv-video-compatibility-card span{background:#431d0b;color:#fdba74}[data-viewer-theme='system'] .fv-video-compatibility-card strong,[data-viewer-theme='system'] .fv-video-compatibility-card p,[data-viewer-theme='system'] .fv-video-compatibility-card code{color:#fed7aa}[data-viewer-theme='system'] .fv-video-compatibility-card code{background:rgba(251,146,60,.12)}}
@media (max-width:640px){.fv-video-viewer{padding:10px}.fv-video-software-controls{grid-template-columns:36px minmax(72px,1fr) 36px 36px}.fv-video-software-time{display:none}.fv-video-software-badge{top:8px;right:8px}}
`;
var VIDEO_MIME_MAP = {
	m3u8: "application/vnd.apple.mpegurl",
	mp4: "video/mp4",
	webm: "video/webm"
};
var createElement = (tagName, className, text) => {
	const element = document.createElement(tagName);
	if (className) element.className = className;
	if (typeof text === "string") element.textContent = text;
	return element;
};
var createStyle = () => {
	const style = document.createElement("style");
	style.textContent = videoStyle;
	return style;
};
var createRenderedInstance = (target, cleanup) => ({
	$el: target,
	unmount() {
		cleanup();
		target.replaceChildren();
	}
});
var getMimeType = (type) => {
	return VIDEO_MIME_MAP[type] || "video/*";
};
var createLocalUrl = (buffer, type) => {
	return URL.createObjectURL(new Blob([buffer], { type: getMimeType(type) }));
};
var UnsupportedVideoCodecError = class extends Error {
	constructor(track) {
		super(`The browser could not decode the ${track.label} video track.`);
		this.name = "UnsupportedVideoCodecError";
		this.track = track;
	}
};
var createCompatibilityNotice = (track, t) => {
	const notice = createElement("div", "fv-video-compatibility");
	notice.setAttribute("role", "alert");
	notice.dataset.codec = track.codec;
	const card = createElement("div", "fv-video-compatibility-card");
	card.append(createElement("span", "", t("media.video.codecUnsupportedBadge")), createElement("strong", "", t("media.video.codecUnsupportedTitle")), createElement("p", "", t("media.video.codecUnsupportedDescription", { codec: track.label })), createElement("code", "", track.contentType), createElement("p", "", t("media.video.codecUnsupportedAction")));
	notice.append(card);
	return notice;
};
/**
* Pure TypeScript video renderer.
*
* MP4/WebM use the native `<video>` element. HLS uses native browser support
* first and imports `hls.js` only when the current browser needs it.
*/
async function renderVideo(buffer, target, type, context) {
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const normalizedType = (type || "mp4").toLowerCase();
	const mp4VideoTrack = normalizedType === "mp4" ? inspectMp4VideoTrack(buffer) : void 0;
	const mp4vSoftwareTrack = (mp4VideoTrack === null || mp4VideoTrack === void 0 ? void 0 : mp4VideoTrack.codec) === "mp4v" ? extractMp4vSoftwareTrack(buffer) : void 0;
	let disposed = false;
	let objectUrl = "";
	let hls = null;
	let softwarePlayer = null;
	const root = createElement("div", "fv-video-viewer");
	const shell = createElement("section", "fv-video-shell");
	const heading = createElement("div", "fv-video-heading");
	heading.append(createElement("span", "", normalizedType.toUpperCase() || "VIDEO"), createElement("strong", "", t("media.video.title")));
	const video = createElement("video", "fv-video-player");
	video.controls = true;
	video.preload = "metadata";
	video.textContent = t("media.video.unsupported");
	shell.append(heading, video);
	if (normalizedType === "m3u8") shell.append(createElement("p", "fv-video-hint", t("media.video.hlsHint")));
	root.append(shell);
	target.replaceChildren(createStyle(), root);
	const resolveSource = () => {
		if (normalizedType === "m3u8" && (context === null || context === void 0 ? void 0 : context.url)) return context.url;
		objectUrl = createLocalUrl(buffer, normalizedType);
		return objectUrl;
	};
	const mountVideo = async () => {
		var _a;
		const source = resolveSource();
		if (normalizedType === "m3u8") {
			if (video.canPlayType("application/vnd.apple.mpegurl")) {
				video.src = source;
				video.load();
				await waitForVideoMetadata(video, context === null || context === void 0 ? void 0 : context.signal);
				return;
			}
			const loadHls = getFileViewerHlsLoader();
			if (!loadHls) throw new Error("HLS fallback support is opt-in. Run `npx file-viewer-cli add streaming-media --write`, then `npx file-viewer-cli install --yes`.");
			const { default: HlsConstructor } = await loadHls();
			if (disposed) return;
			if (HlsConstructor.isSupported()) {
				hls = new HlsConstructor({
					enableWorker: true,
					lowLatencyMode: false
				});
				if ((_a = context === null || context === void 0 ? void 0 : context.signal) === null || _a === void 0 ? void 0 : _a.aborted) throw new DOMException("The video request was aborted.", "AbortError");
				await new Promise((resolve, reject) => {
					var _a;
					const events = HlsConstructor.Events;
					const timeoutId = window.setTimeout(() => {
						cleanupListeners();
						reject(/* @__PURE__ */ new Error("Timed out while loading the HLS manifest."));
					}, 3e4);
					const onManifest = () => {
						cleanupListeners();
						resolve();
					};
					const onError = (_event, data) => {
						if (!(data === null || data === void 0 ? void 0 : data.fatal)) return;
						cleanupListeners();
						reject(new Error(data.details || "Unable to load the HLS video stream."));
					};
					const onAbort = () => {
						cleanupListeners();
						reject(new DOMException("The video request was aborted.", "AbortError"));
					};
					const cleanupListeners = () => {
						var _a;
						window.clearTimeout(timeoutId);
						hls === null || hls === void 0 || hls.off(events.MANIFEST_PARSED, onManifest);
						hls === null || hls === void 0 || hls.off(events.ERROR, onError);
						(_a = context === null || context === void 0 ? void 0 : context.signal) === null || _a === void 0 || _a.removeEventListener("abort", onAbort);
					};
					hls === null || hls === void 0 || hls.on(events.MANIFEST_PARSED, onManifest);
					hls === null || hls === void 0 || hls.on(events.ERROR, onError);
					(_a = context === null || context === void 0 ? void 0 : context.signal) === null || _a === void 0 || _a.addEventListener("abort", onAbort, { once: true });
					hls === null || hls === void 0 || hls.attachMedia(video);
					hls === null || hls === void 0 || hls.loadSource(source);
				});
				await waitForVideoMetadata(video, context === null || context === void 0 ? void 0 : context.signal);
				return;
			}
			throw new Error("This browser cannot play HLS video.");
		}
		video.src = source;
		video.load();
		await waitForVideoMetadata(video, context === null || context === void 0 ? void 0 : context.signal);
		if (mp4VideoTrack) await ensureVideoTrackDecoded(video, mp4VideoTrack, context === null || context === void 0 ? void 0 : context.signal);
	};
	const releasePlaybackResources = () => {
		hls === null || hls === void 0 || hls.destroy();
		hls = null;
		video.pause();
		video.removeAttribute("src");
		video.load();
		if (objectUrl) {
			URL.revokeObjectURL(objectUrl);
			objectUrl = "";
		}
	};
	const cleanup = () => {
		disposed = true;
		softwarePlayer === null || softwarePlayer === void 0 || softwarePlayer.cleanup();
		softwarePlayer = null;
		releasePlaybackResources();
	};
	try {
		await mountVideo();
		root.dataset.videoState = "ready";
	} catch (error) {
		if (error instanceof UnsupportedVideoCodecError) if (error.track.codec === "mp4v" && mp4vSoftwareTrack) try {
			softwarePlayer = await mountMp4vSoftwarePlayer(buffer, video, mp4vSoftwareTrack, context);
			root.dataset.videoState = "software-decoder";
		} catch (softwareError) {
			releasePlaybackResources();
			root.dataset.videoState = "unsupported-codec";
			root.dataset.videoError = softwareError instanceof Error ? softwareError.message : String(softwareError);
			(shell.querySelector(".fv-video-software-player") || video).replaceWith(createCompatibilityNotice(error.track, t));
		}
		else {
			releasePlaybackResources();
			root.dataset.videoState = "unsupported-codec";
			video.replaceWith(createCompatibilityNotice(error.track, t));
		}
		else {
			cleanup();
			target.replaceChildren();
			throw error;
		}
	}
	return createRenderedInstance(target, () => {
		cleanup();
	});
}
var ensureVideoTrackDecoded = async (video, track, signal) => {
	if (video.videoWidth > 0 && video.videoHeight > 0) return;
	if (!video.canPlayType(track.contentType)) throw new UnsupportedVideoCodecError(track);
	if (signal === null || signal === void 0 ? void 0 : signal.aborted) throw new DOMException("The video request was aborted.", "AbortError");
	await new Promise((resolve, reject) => {
		const timeoutId = window.setTimeout(() => {
			cleanup();
			reject(new UnsupportedVideoCodecError(track));
		}, 1500);
		const cleanup = () => {
			window.clearTimeout(timeoutId);
			video.removeEventListener("resize", onReady);
			video.removeEventListener("loadeddata", onReady);
			video.removeEventListener("error", onError);
			signal === null || signal === void 0 || signal.removeEventListener("abort", onAbort);
		};
		const onReady = () => {
			if (video.videoWidth <= 0 || video.videoHeight <= 0) return;
			cleanup();
			resolve();
		};
		const onError = () => {
			cleanup();
			reject(video.error || new UnsupportedVideoCodecError(track));
		};
		const onAbort = () => {
			cleanup();
			reject(new DOMException("The video request was aborted.", "AbortError"));
		};
		video.addEventListener("resize", onReady);
		video.addEventListener("loadeddata", onReady);
		video.addEventListener("error", onError, { once: true });
		signal === null || signal === void 0 || signal.addEventListener("abort", onAbort, { once: true });
	});
};
var waitForVideoMetadata = async (video, signal) => {
	if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return;
	if (signal === null || signal === void 0 ? void 0 : signal.aborted) throw new DOMException("The video request was aborted.", "AbortError");
	await new Promise((resolve, reject) => {
		const timeoutId = window.setTimeout(() => {
			cleanup();
			reject(/* @__PURE__ */ new Error("Timed out while loading video metadata."));
		}, 3e4);
		const cleanup = () => {
			window.clearTimeout(timeoutId);
			video.removeEventListener("loadedmetadata", onReady);
			video.removeEventListener("canplay", onReady);
			video.removeEventListener("error", onError);
			signal === null || signal === void 0 || signal.removeEventListener("abort", onAbort);
		};
		const onReady = () => {
			cleanup();
			resolve();
		};
		const onError = () => {
			var _a;
			cleanup();
			reject(new Error(((_a = video.error) === null || _a === void 0 ? void 0 : _a.message) || "The browser could not decode this video."));
		};
		const onAbort = () => {
			cleanup();
			reject(new DOMException("The video request was aborted.", "AbortError"));
		};
		video.addEventListener("loadedmetadata", onReady, { once: true });
		video.addEventListener("canplay", onReady, { once: true });
		video.addEventListener("error", onError, { once: true });
		signal === null || signal === void 0 || signal.addEventListener("abort", onAbort, { once: true });
	});
};
//#endregion
export { renderFileViewerVideo as a, getFileViewerMidiLoader as c, renderFileViewerAudio as i, registerFileViewerHlsLoader as l, mediaRenderer as n, renderAudio as o, mediaRendererDefinitions as r, getFileViewerHlsLoader as s, renderVideo as t, registerFileViewerMidiLoader as u };
