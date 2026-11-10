import { C as FileLoader, Et as SRGBColorSpace, J as Loader, l as BufferAttribute, p as Color, u as BufferGeometry, w as Float32BufferAttribute } from "./three.module-0UZ2DIdt.js";
import { n as unzlibSync } from "./fflate.module-mtlOMP1b.js";
//#region ../../node_modules/.pnpm/three@0.186.1/node_modules/three/examples/jsm/loaders/VTKLoader.js
/**
* A loader for the VTK format.
*
* This loader only supports the `POLYDATA` dataset format so far. Other formats
* (structured points, structured grid, rectilinear grid, unstructured grid, appended)
* are not supported.
*
* ```js
* const loader = new VTKLoader();
* const geometry = await loader.loadAsync( 'models/vtk/liver.vtk' );
* geometry.computeVertexNormals();
*
* const mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial() );
* scene.add( mesh );
* ```
*
* @augments Loader
* @three_import import { VTKLoader } from 'three/addons/loaders/VTKLoader.js';
* @deprecated since r184.
*/
var VTKLoader = class extends Loader {
	/**
	* Constructs a new VTK loader.
	*
	* @param {LoadingManager} [manager] - The loading manager.
	* @deprecated since r184.
	*/
	constructor(manager) {
		super(manager);
		console.warn("THREE.VTKLoader: The loader has been deprecated and will be removed with r194. Export your VTK files to glTF before using them on the web.");
	}
	/**
	* Starts loading from the given URL and passes the loaded VTK asset
	* to the `onLoad()` callback.
	*
	* @param {string} url - The path/URL of the file to be loaded. This can also be a data URI.
	* @param {function(BufferGeometry)} onLoad - Executed when the loading process has been finished.
	* @param {onProgressCallback} onProgress - Executed while the loading is in progress.
	* @param {onErrorCallback} onError - Executed when errors occur.
	*/
	load(url, onLoad, onProgress, onError) {
		const scope = this;
		const loader = new FileLoader(scope.manager);
		loader.setPath(scope.path);
		loader.setResponseType("arraybuffer");
		loader.setRequestHeader(scope.requestHeader);
		loader.setWithCredentials(scope.withCredentials);
		loader.load(url, function(text) {
			try {
				onLoad(scope.parse(text));
			} catch (e) {
				if (onError) onError(e);
				else console.error(e);
				scope.manager.itemError(url);
			}
		}, onProgress, onError);
	}
	/**
	* Parses the given VTK data and returns the resulting geometry.
	*
	* @param {ArrayBuffer} data - The raw VTK data as an array buffer
	* @return {BufferGeometry} The parsed geometry.
	*/
	parse(data) {
		function parseASCII(data) {
			const indices = [];
			const positions = [];
			const colors = [];
			const normals = [];
			let result;
			const patWord = /^[^\d.\s-]+/;
			function parseFloats(line) {
				const result = [];
				const parts = line.split(/\s+/);
				for (let i = 0; i < parts.length; i++) if (parts[i] !== "") result.push(parseFloat(parts[i]));
				return result;
			}
			const patConnectivity = /^(\d+)\s+([\s\d]*)/;
			const patPOINTS = /^POINTS /;
			const patPOLYGONS = /^POLYGONS /;
			const patTRIANGLE_STRIPS = /^TRIANGLE_STRIPS /;
			const patPOINT_DATA = /^POINT_DATA[ ]+(\d+)/;
			const patCELL_DATA = /^CELL_DATA[ ]+(\d+)/;
			const patCOLOR_SCALARS = /^COLOR_SCALARS[ ]+(\w+)[ ]+3/;
			const patNORMALS = /^NORMALS[ ]+(\w+)[ ]+(\w+)/;
			let inPointsSection = false;
			let inPolygonsSection = false;
			let inTriangleStripSection = false;
			let inPointDataSection = false;
			let inCellDataSection = false;
			let inColorSection = false;
			let inNormalsSection = false;
			const color = new Color();
			const lines = data.split("\n");
			for (const i in lines) {
				const line = lines[i].trim();
				if (line.indexOf("DATASET") === 0) {
					const dataset = line.split(" ")[1];
					if (dataset !== "POLYDATA") throw new Error("Unsupported DATASET type: " + dataset);
				} else if (inPointsSection) {
					if (patWord.exec(line) === null) {
						const values = parseFloats(line);
						for (let k = 0; k + 2 < values.length; k += 3) positions.push(values[k], values[k + 1], values[k + 2]);
					}
				} else if (inPolygonsSection) {
					if ((result = patConnectivity.exec(line)) !== null) {
						const numVertices = parseInt(result[1]);
						const inds = result[2].split(/\s+/);
						if (numVertices >= 3) {
							const i0 = parseInt(inds[0]);
							let k = 1;
							for (let j = 0; j < numVertices - 2; ++j) {
								const i1 = parseInt(inds[k]);
								const i2 = parseInt(inds[k + 1]);
								indices.push(i0, i1, i2);
								k++;
							}
						}
					}
				} else if (inTriangleStripSection) {
					if ((result = patConnectivity.exec(line)) !== null) {
						const numVertices = parseInt(result[1]);
						const inds = result[2].split(/\s+/);
						if (numVertices >= 3) for (let j = 0; j < numVertices - 2; j++) if (j % 2 === 1) {
							const i0 = parseInt(inds[j]);
							const i1 = parseInt(inds[j + 2]);
							const i2 = parseInt(inds[j + 1]);
							indices.push(i0, i1, i2);
						} else {
							const i0 = parseInt(inds[j]);
							const i1 = parseInt(inds[j + 1]);
							const i2 = parseInt(inds[j + 2]);
							indices.push(i0, i1, i2);
						}
					}
				} else if (inPointDataSection || inCellDataSection) {
					if (inColorSection) {
						if (patWord.exec(line) === null) {
							const values = parseFloats(line);
							for (let k = 0; k + 2 < values.length; k += 3) {
								color.setRGB(values[k], values[k + 1], values[k + 2], SRGBColorSpace);
								colors.push(color.r, color.g, color.b);
							}
						}
					} else if (inNormalsSection) {
						if (patWord.exec(line) === null) {
							const values = parseFloats(line);
							for (let k = 0; k + 2 < values.length; k += 3) normals.push(values[k], values[k + 1], values[k + 2]);
						}
					}
				}
				if (patPOLYGONS.exec(line) !== null) {
					inPolygonsSection = true;
					inPointsSection = false;
					inTriangleStripSection = false;
				} else if (patPOINTS.exec(line) !== null) {
					inPolygonsSection = false;
					inPointsSection = true;
					inTriangleStripSection = false;
				} else if (patTRIANGLE_STRIPS.exec(line) !== null) {
					inPolygonsSection = false;
					inPointsSection = false;
					inTriangleStripSection = true;
				} else if (patPOINT_DATA.exec(line) !== null) {
					inPointDataSection = true;
					inPointsSection = false;
					inPolygonsSection = false;
					inTriangleStripSection = false;
				} else if (patCELL_DATA.exec(line) !== null) {
					inCellDataSection = true;
					inPointsSection = false;
					inPolygonsSection = false;
					inTriangleStripSection = false;
				} else if (patCOLOR_SCALARS.exec(line) !== null) {
					inColorSection = true;
					inNormalsSection = false;
					inPointsSection = false;
					inPolygonsSection = false;
					inTriangleStripSection = false;
				} else if (patNORMALS.exec(line) !== null) {
					inNormalsSection = true;
					inColorSection = false;
					inPointsSection = false;
					inPolygonsSection = false;
					inTriangleStripSection = false;
				}
			}
			let geometry = new BufferGeometry();
			geometry.setIndex(indices);
			geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
			if (normals.length === positions.length) geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
			if (colors.length !== indices.length) {
				if (colors.length === positions.length) geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
			} else {
				geometry = geometry.toNonIndexed();
				const numTriangles = geometry.attributes.position.count / 3;
				if (colors.length === numTriangles * 3) {
					const newColors = [];
					for (let i = 0; i < numTriangles; i++) {
						const r = colors[3 * i + 0];
						const g = colors[3 * i + 1];
						const b = colors[3 * i + 2];
						color.setRGB(r, g, b, SRGBColorSpace);
						newColors.push(color.r, color.g, color.b);
						newColors.push(color.r, color.g, color.b);
						newColors.push(color.r, color.g, color.b);
					}
					geometry.setAttribute("color", new Float32BufferAttribute(newColors, 3));
				}
			}
			return geometry;
		}
		function parseBinary(data) {
			const buffer = new Uint8Array(data);
			const dataView = new DataView(data);
			let points = [];
			let normals = [];
			let indices = [];
			let index = 0;
			function findString(buffer, start) {
				let index = start;
				let c = buffer[index];
				const s = [];
				while (c !== 10 && index < buffer.length) {
					s.push(String.fromCharCode(c));
					index++;
					c = buffer[index];
				}
				return {
					start,
					end: index,
					next: index + 1,
					parsedString: s.join("")
				};
			}
			let state, line;
			while (true) {
				state = findString(buffer, index);
				line = state.parsedString;
				if (line.indexOf("DATASET") === 0) {
					const dataset = line.split(" ")[1];
					if (dataset !== "POLYDATA") throw new Error("Unsupported DATASET type: " + dataset);
				} else if (line.indexOf("POINTS") === 0) {
					const numberOfPoints = parseInt(line.split(" ")[1], 10);
					const count = numberOfPoints * 4 * 3;
					points = new Float32Array(numberOfPoints * 3);
					let pointIndex = state.next;
					for (let i = 0; i < numberOfPoints; i++) {
						points[3 * i] = dataView.getFloat32(pointIndex, false);
						points[3 * i + 1] = dataView.getFloat32(pointIndex + 4, false);
						points[3 * i + 2] = dataView.getFloat32(pointIndex + 8, false);
						pointIndex = pointIndex + 12;
					}
					state.next = state.next + count + 1;
				} else if (line.indexOf("TRIANGLE_STRIPS") === 0) {
					const numberOfStrips = parseInt(line.split(" ")[1], 10);
					const size = parseInt(line.split(" ")[2], 10);
					const count = size * 4;
					indices = new Uint32Array(3 * size - 9 * numberOfStrips);
					let indicesIndex = 0;
					let pointIndex = state.next;
					for (let i = 0; i < numberOfStrips; i++) {
						const indexCount = dataView.getInt32(pointIndex, false);
						const strip = [];
						pointIndex += 4;
						for (let s = 0; s < indexCount; s++) {
							strip.push(dataView.getInt32(pointIndex, false));
							pointIndex += 4;
						}
						for (let j = 0; j < indexCount - 2; j++) if (j % 2) {
							indices[indicesIndex++] = strip[j];
							indices[indicesIndex++] = strip[j + 2];
							indices[indicesIndex++] = strip[j + 1];
						} else {
							indices[indicesIndex++] = strip[j];
							indices[indicesIndex++] = strip[j + 1];
							indices[indicesIndex++] = strip[j + 2];
						}
					}
					state.next = state.next + count + 1;
				} else if (line.indexOf("POLYGONS") === 0) {
					const numberOfStrips = parseInt(line.split(" ")[1], 10);
					const size = parseInt(line.split(" ")[2], 10);
					const count = size * 4;
					indices = new Uint32Array(3 * size - 9 * numberOfStrips);
					let indicesIndex = 0;
					let pointIndex = state.next;
					for (let i = 0; i < numberOfStrips; i++) {
						const indexCount = dataView.getInt32(pointIndex, false);
						const strip = [];
						pointIndex += 4;
						for (let s = 0; s < indexCount; s++) {
							strip.push(dataView.getInt32(pointIndex, false));
							pointIndex += 4;
						}
						for (let j = 1; j < indexCount - 1; j++) {
							indices[indicesIndex++] = strip[0];
							indices[indicesIndex++] = strip[j];
							indices[indicesIndex++] = strip[j + 1];
						}
					}
					state.next = state.next + count + 1;
				} else if (line.indexOf("POINT_DATA") === 0) {
					const numberOfPoints = parseInt(line.split(" ")[1], 10);
					state = findString(buffer, state.next);
					const count = numberOfPoints * 4 * 3;
					normals = new Float32Array(numberOfPoints * 3);
					let pointIndex = state.next;
					for (let i = 0; i < numberOfPoints; i++) {
						normals[3 * i] = dataView.getFloat32(pointIndex, false);
						normals[3 * i + 1] = dataView.getFloat32(pointIndex + 4, false);
						normals[3 * i + 2] = dataView.getFloat32(pointIndex + 8, false);
						pointIndex += 12;
					}
					state.next = state.next + count;
				}
				index = state.next;
				if (index >= buffer.byteLength) break;
			}
			const geometry = new BufferGeometry();
			geometry.setIndex(new BufferAttribute(indices, 1));
			geometry.setAttribute("position", new BufferAttribute(points, 3));
			if (normals.length === points.length) geometry.setAttribute("normal", new BufferAttribute(normals, 3));
			return geometry;
		}
		function Float32Concat(first, second) {
			const firstLength = first.length, result = new Float32Array(firstLength + second.length);
			result.set(first);
			result.set(second, firstLength);
			return result;
		}
		function Int32Concat(first, second) {
			const firstLength = first.length, result = new Int32Array(firstLength + second.length);
			result.set(first);
			result.set(second, firstLength);
			return result;
		}
		function parseXML(stringFile) {
			function xmlToJson(xml) {
				let obj = {};
				if (xml.nodeType === 1) {
					if (xml.attributes) {
						if (xml.attributes.length > 0) {
							obj["attributes"] = {};
							for (let j = 0; j < xml.attributes.length; j++) {
								const attribute = xml.attributes.item(j);
								obj["attributes"][attribute.nodeName] = attribute.nodeValue.trim();
							}
						}
					}
				} else if (xml.nodeType === 3) obj = xml.nodeValue.trim();
				if (xml.hasChildNodes()) for (let i = 0; i < xml.childNodes.length; i++) {
					const item = xml.childNodes.item(i);
					const nodeName = item.nodeName;
					if (typeof obj[nodeName] === "undefined") {
						const tmp = xmlToJson(item);
						if (tmp !== "") {
							if (Array.isArray(tmp["#text"])) tmp["#text"] = tmp["#text"][0];
							obj[nodeName] = tmp;
						}
					} else {
						if (typeof obj[nodeName].push === "undefined") {
							const old = obj[nodeName];
							obj[nodeName] = [old];
						}
						const tmp = xmlToJson(item);
						if (tmp !== "") {
							if (Array.isArray(tmp["#text"])) tmp["#text"] = tmp["#text"][0];
							obj[nodeName].push(tmp);
						}
					}
				}
				return obj;
			}
			function Base64toByteArray(b64) {
				const Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
				const revLookup = [];
				const code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
				for (let i = 0, l = 64; i < l; ++i) revLookup[code.charCodeAt(i)] = i;
				revLookup["-".charCodeAt(0)] = 62;
				revLookup["_".charCodeAt(0)] = 63;
				const len = b64.length;
				if (len % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
				const placeHolders = b64[len - 2] === "=" ? 2 : b64[len - 1] === "=" ? 1 : 0;
				const arr = new Arr(len * 3 / 4 - placeHolders);
				const l = placeHolders > 0 ? len - 4 : len;
				let L = 0;
				let i, j;
				for (i = 0, j = 0; i < l; i += 4, j += 3) {
					const tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
					arr[L++] = (tmp & 16711680) >> 16;
					arr[L++] = (tmp & 65280) >> 8;
					arr[L++] = tmp & 255;
				}
				if (placeHolders === 2) {
					const tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
					arr[L++] = tmp & 255;
				} else if (placeHolders === 1) {
					const tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
					arr[L++] = tmp >> 8 & 255;
					arr[L++] = tmp & 255;
				}
				return arr;
			}
			function parseDataArray(ele, compressed) {
				let numBytes = 0;
				if (json.attributes.header_type === "UInt64") numBytes = 8;
				else if (json.attributes.header_type === "UInt32") numBytes = 4;
				let txt, content;
				if (ele.attributes.format === "binary" && compressed) {
					if (ele.attributes.type === "Float32") txt = /* @__PURE__ */ new Float32Array();
					else if (ele.attributes.type === "Int32" || ele.attributes.type === "Int64") txt = /* @__PURE__ */ new Int32Array();
					const textNode = ele["#text"];
					const byteData = Base64toByteArray(Array.isArray(textNode) ? textNode[0] : textNode);
					const dataPointSize = 8;
					let blocks = byteData[0];
					for (let i = 1; i < numBytes - 1; i++) blocks = blocks | byteData[i] << i * dataPointSize;
					let headerSize = (blocks + 3) * numBytes;
					const padding = headerSize % 3 > 0 ? 3 - headerSize % 3 : 0;
					headerSize = headerSize + padding;
					const dataOffsets = [];
					let currentOffset = headerSize;
					dataOffsets.push(currentOffset);
					const cSizeStart = 3 * numBytes;
					for (let i = 0; i < blocks; i++) {
						let currentBlockSize = byteData[i * numBytes + cSizeStart];
						for (let j = 1; j < numBytes - 1; j++) currentBlockSize = currentBlockSize | byteData[i * numBytes + cSizeStart + j] << j * dataPointSize;
						currentOffset = currentOffset + currentBlockSize;
						dataOffsets.push(currentOffset);
					}
					for (let i = 0; i < dataOffsets.length - 1; i++) {
						content = unzlibSync(byteData.slice(dataOffsets[i], dataOffsets[i + 1])).buffer;
						if (ele.attributes.type === "Float32") {
							content = new Float32Array(content);
							txt = Float32Concat(txt, content);
						} else if (ele.attributes.type === "Int32" || ele.attributes.type === "Int64") {
							content = new Int32Array(content);
							txt = Int32Concat(txt, content);
						}
					}
					delete ele["#text"];
					if (ele.attributes.type === "Int64") {
						if (ele.attributes.format === "binary") txt = txt.filter(function(el, idx) {
							if (idx % 2 !== 1) return true;
						});
					}
				} else {
					if (ele.attributes.format === "binary" && !compressed) {
						content = Base64toByteArray(ele["#text"]);
						content = content.slice(numBytes).buffer;
					} else if (ele["#text"]) content = ele["#text"].split(/\s+/).filter(function(el) {
						if (el !== "") return el;
					});
					else content = (/* @__PURE__ */ new Int32Array(0)).buffer;
					delete ele["#text"];
					if (ele.attributes.type === "Float32") txt = new Float32Array(content);
					else if (ele.attributes.type === "Int32") txt = new Int32Array(content);
					else if (ele.attributes.type === "Int64") {
						txt = new Int32Array(content);
						if (ele.attributes.format === "binary") txt = txt.filter(function(el, idx) {
							if (idx % 2 !== 1) return true;
						});
					}
				}
				return txt;
			}
			const doc = new DOMParser().parseFromString(stringFile, "application/xml").documentElement;
			const json = xmlToJson(doc);
			let points = [];
			let normals = [];
			let indices = [];
			if (json.AppendedData) {
				const appendedData = json.AppendedData["#text"].slice(1);
				const piece = json.PolyData.Piece;
				const sections = [
					"PointData",
					"CellData",
					"Points",
					"Verts",
					"Lines",
					"Strips",
					"Polys"
				];
				let sectionIndex = 0;
				const offsets = sections.map((s) => {
					const sect = piece[s];
					if (sect && sect.DataArray) return (Array.isArray(sect.DataArray) ? sect.DataArray : [sect.DataArray]).map((a) => a.attributes.offset);
					return [];
				}).flat();
				for (const sect of sections) {
					const section = piece[sect];
					if (section && section.DataArray) if (Array.isArray(section.DataArray)) for (const sectionEle of section.DataArray) {
						sectionEle["#text"] = appendedData.slice(offsets[sectionIndex], offsets[sectionIndex + 1]);
						sectionEle.attributes.format = "binary";
						sectionIndex++;
					}
					else {
						section.DataArray["#text"] = appendedData.slice(offsets[sectionIndex], offsets[sectionIndex + 1]);
						section.DataArray.attributes.format = "binary";
						sectionIndex++;
					}
				}
			}
			if (json.PolyData) {
				const piece = json.PolyData.Piece;
				const compressed = json.attributes.hasOwnProperty("compressor");
				const sections = [
					"PointData",
					"Points",
					"Strips",
					"Polys"
				];
				let sectionIndex = 0;
				const numberOfSections = sections.length;
				while (sectionIndex < numberOfSections) {
					const section = piece[sections[sectionIndex]];
					if (section && section.DataArray) {
						let arr;
						if (Array.isArray(section.DataArray)) arr = section.DataArray;
						else arr = [section.DataArray];
						let dataArrayIndex = 0;
						const numberOfDataArrays = arr.length;
						while (dataArrayIndex < numberOfDataArrays) {
							if ("#text" in arr[dataArrayIndex] && arr[dataArrayIndex]["#text"].length > 0) arr[dataArrayIndex].text = parseDataArray(arr[dataArrayIndex], compressed);
							dataArrayIndex++;
						}
						switch (sections[sectionIndex]) {
							case "PointData":
								{
									const numberOfPoints = parseInt(piece.attributes.NumberOfPoints);
									const normalsName = section.attributes.Normals;
									if (numberOfPoints > 0) {
										for (let i = 0, len = arr.length; i < len; i++) if (normalsName === arr[i].attributes.Name) {
											const components = arr[i].attributes.NumberOfComponents;
											normals = new Float32Array(numberOfPoints * components);
											normals.set(arr[i].text, 0);
										}
									}
								}
								break;
							case "Points":
								{
									const numberOfPoints = parseInt(piece.attributes.NumberOfPoints);
									if (numberOfPoints > 0) {
										const components = section.DataArray.attributes.NumberOfComponents;
										points = new Float32Array(numberOfPoints * components);
										points.set(section.DataArray.text, 0);
									}
								}
								break;
							case "Strips":
								{
									const numberOfStrips = parseInt(piece.attributes.NumberOfStrips);
									if (numberOfStrips > 0) {
										const connectivity = new Int32Array(section.DataArray[0].text.length);
										const offset = new Int32Array(section.DataArray[1].text.length);
										connectivity.set(section.DataArray[0].text, 0);
										offset.set(section.DataArray[1].text, 0);
										const size = numberOfStrips + connectivity.length;
										indices = new Uint32Array(3 * size - 9 * numberOfStrips);
										let indicesIndex = 0;
										for (let i = 0, len = numberOfStrips; i < len; i++) {
											const strip = [];
											for (let s = 0, len1 = offset[i], len0 = 0; s < len1 - len0; s++) {
												strip.push(connectivity[s]);
												if (i > 0) len0 = offset[i - 1];
											}
											for (let j = 0, len1 = offset[i], len0 = 0; j < len1 - len0 - 2; j++) {
												if (j % 2) {
													indices[indicesIndex++] = strip[j];
													indices[indicesIndex++] = strip[j + 2];
													indices[indicesIndex++] = strip[j + 1];
												} else {
													indices[indicesIndex++] = strip[j];
													indices[indicesIndex++] = strip[j + 1];
													indices[indicesIndex++] = strip[j + 2];
												}
												if (i > 0) len0 = offset[i - 1];
											}
										}
									}
								}
								break;
							case "Polys": {
								const numberOfPolys = parseInt(piece.attributes.NumberOfPolys);
								if (numberOfPolys > 0) {
									const connectivity = new Int32Array(section.DataArray[0].text.length);
									const offset = new Int32Array(section.DataArray[1].text.length);
									connectivity.set(section.DataArray[0].text, 0);
									offset.set(section.DataArray[1].text, 0);
									const size = numberOfPolys + connectivity.length;
									indices = new Uint32Array(3 * size - 9 * numberOfPolys);
									let indicesIndex = 0, connectivityIndex = 0;
									let i = 0, len0 = 0;
									const len = numberOfPolys;
									while (i < len) {
										const poly = [];
										let s = 0;
										const len1 = offset[i];
										while (s < len1 - len0) {
											poly.push(connectivity[connectivityIndex++]);
											s++;
										}
										let j = 1;
										while (j < len1 - len0 - 1) {
											indices[indicesIndex++] = poly[0];
											indices[indicesIndex++] = poly[j];
											indices[indicesIndex++] = poly[j + 1];
											j++;
										}
										i++;
										len0 = offset[i - 1];
									}
								}
							}
						}
					}
					sectionIndex++;
				}
				const geometry = new BufferGeometry();
				geometry.setIndex(new BufferAttribute(indices, 1));
				geometry.setAttribute("position", new BufferAttribute(points, 3));
				if (normals.length === points.length) geometry.setAttribute("normal", new BufferAttribute(normals, 3));
				return geometry;
			} else throw new Error("Unsupported DATASET type");
		}
		const textDecoder = new TextDecoder();
		const meta = textDecoder.decode(new Uint8Array(data, 0, 250)).split("\n");
		if (meta[0].indexOf("xml") !== -1) return parseXML(textDecoder.decode(data));
		else if (meta[2].includes("ASCII")) return parseASCII(textDecoder.decode(data));
		else return parseBinary(data);
	}
};
//#endregion
export { VTKLoader };
