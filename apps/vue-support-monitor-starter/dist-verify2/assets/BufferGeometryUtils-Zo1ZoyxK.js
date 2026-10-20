import { c as BufferGeometry, s as BufferAttribute } from "./file-viewer-3d-ijA7B-Qe.js";
//#region ../../node_modules/.pnpm/three@0.186.1/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js
/**
* Merges a set of geometries into a single instance. All geometries must have compatible attributes.
*
* @param {Array<BufferGeometry>} geometries - The geometries to merge.
* @param {boolean} [useGroups=false] - Whether to use groups or not.
* @return {?BufferGeometry} The merged geometry. Returns `null` if the merge does not succeed.
*/
function mergeGeometries(geometries, useGroups = false) {
	const isIndexed = geometries[0].index !== null;
	const attributesUsed = new Set(Object.keys(geometries[0].attributes));
	const morphAttributesUsed = new Set(Object.keys(geometries[0].morphAttributes));
	const attributes = {};
	const morphAttributes = {};
	const morphTargetsRelative = geometries[0].morphTargetsRelative;
	const mergedGeometry = new BufferGeometry();
	let offset = 0;
	for (let i = 0; i < geometries.length; ++i) {
		const geometry = geometries[i];
		let attributesCount = 0;
		if (isIndexed !== (geometry.index !== null)) {
			console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + i + ". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.");
			return null;
		}
		for (const name in geometry.attributes) {
			if (!attributesUsed.has(name)) {
				console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + i + ". All geometries must have compatible attributes; make sure \"" + name + "\" attribute exists among all geometries, or in none of them.");
				return null;
			}
			if (attributes[name] === void 0) attributes[name] = [];
			attributes[name].push(geometry.attributes[name]);
			attributesCount++;
		}
		if (attributesCount !== attributesUsed.size) {
			console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + i + ". Make sure all geometries have the same number of attributes.");
			return null;
		}
		if (morphTargetsRelative !== geometry.morphTargetsRelative) {
			console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + i + ". .morphTargetsRelative must be consistent throughout all geometries.");
			return null;
		}
		for (const name in geometry.morphAttributes) {
			if (!morphAttributesUsed.has(name)) {
				console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + i + ".  .morphAttributes must be consistent throughout all geometries.");
				return null;
			}
			if (morphAttributes[name] === void 0) morphAttributes[name] = [];
			morphAttributes[name].push(geometry.morphAttributes[name]);
		}
		if (useGroups) {
			let count;
			if (isIndexed) count = geometry.index.count;
			else if (geometry.attributes.position !== void 0) count = geometry.attributes.position.count;
			else {
				console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index " + i + ". The geometry must have either an index or a position attribute");
				return null;
			}
			mergedGeometry.addGroup(offset, count, i);
			offset += count;
		}
	}
	if (isIndexed) {
		let indexOffset = 0;
		const mergedIndex = [];
		for (let i = 0; i < geometries.length; ++i) {
			const index = geometries[i].index;
			for (let j = 0; j < index.count; ++j) mergedIndex.push(index.getX(j) + indexOffset);
			indexOffset += geometries[i].attributes.position.count;
		}
		mergedGeometry.setIndex(mergedIndex);
	}
	for (const name in attributes) {
		const mergedAttribute = mergeAttributes(attributes[name]);
		if (!mergedAttribute) {
			console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + name + " attribute.");
			return null;
		}
		mergedGeometry.setAttribute(name, mergedAttribute);
	}
	for (const name in morphAttributes) {
		const numMorphTargets = morphAttributes[name][0].length;
		if (numMorphTargets === 0) continue;
		mergedGeometry.morphAttributes = mergedGeometry.morphAttributes || {};
		mergedGeometry.morphAttributes[name] = [];
		for (let i = 0; i < numMorphTargets; ++i) {
			const morphAttributesToMerge = [];
			for (let j = 0; j < morphAttributes[name].length; ++j) morphAttributesToMerge.push(morphAttributes[name][j][i]);
			const mergedMorphAttribute = mergeAttributes(morphAttributesToMerge);
			if (!mergedMorphAttribute) {
				console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the " + name + " morphAttribute.");
				return null;
			}
			mergedGeometry.morphAttributes[name].push(mergedMorphAttribute);
		}
	}
	return mergedGeometry;
}
/**
* Merges a set of attributes into a single instance. All attributes must have compatible properties and types.
* Instances of {@link InterleavedBufferAttribute} are not supported.
*
* @param {Array<BufferAttribute>} attributes - The attributes to merge.
* @return {?BufferAttribute} The merged attribute. Returns `null` if the merge does not succeed.
*/
function mergeAttributes(attributes) {
	let TypedArray;
	let itemSize;
	let normalized;
	let gpuType = -1;
	let arrayLength = 0;
	for (let i = 0; i < attributes.length; ++i) {
		const attribute = attributes[i];
		if (TypedArray === void 0) TypedArray = attribute.array.constructor;
		if (TypedArray !== attribute.array.constructor) {
			console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.");
			return null;
		}
		if (itemSize === void 0) itemSize = attribute.itemSize;
		if (itemSize !== attribute.itemSize) {
			console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.");
			return null;
		}
		if (normalized === void 0) normalized = attribute.normalized;
		if (normalized !== attribute.normalized) {
			console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.");
			return null;
		}
		if (gpuType === -1) gpuType = attribute.gpuType;
		if (gpuType !== attribute.gpuType) {
			console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes.");
			return null;
		}
		arrayLength += attribute.count * itemSize;
	}
	const array = new TypedArray(arrayLength);
	const result = new BufferAttribute(array, itemSize, normalized);
	let offset = 0;
	for (let i = 0; i < attributes.length; ++i) {
		const attribute = attributes[i];
		if (attribute.isInterleavedBufferAttribute) {
			const tupleOffset = offset / itemSize;
			for (let j = 0, l = attribute.count; j < l; j++) for (let c = 0; c < itemSize; c++) {
				const value = attribute.getComponent(j, c);
				result.setComponent(j + tupleOffset, c, value);
			}
		} else array.set(attribute.array, offset);
		offset += attribute.count * itemSize;
	}
	if (gpuType !== void 0) result.gpuType = gpuType;
	return result;
}
/**
* Converts the given geometry to the `TrianglesDrawMode` draw mode, which
* corresponds to the `gl.TRIANGLES` primitive in WebGL. The conversion only
* rewrites the index, so the geometry is modified in place and returned.
*
* @param {BufferGeometry} geometry - The geometry to convert.
* @param {number} drawMode - The current draw mode.
* @return {BufferGeometry} The converted geometry using `TrianglesDrawMode`.
*/
function toTrianglesDrawMode(geometry, drawMode) {
	if (drawMode === 0) {
		console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles.");
		return geometry;
	}
	if (drawMode === 2 || drawMode === 1) {
		let index = geometry.getIndex();
		if (index === null) {
			const indices = [];
			const position = geometry.getAttribute("position");
			if (position !== void 0) {
				for (let i = 0; i < position.count; i++) indices.push(i);
				geometry.setIndex(indices);
				index = geometry.getIndex();
			} else {
				console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible.");
				return geometry;
			}
		}
		const numberOfTriangles = index.count - 2;
		const newIndices = [];
		if (drawMode === 2) for (let i = 1; i <= numberOfTriangles; i++) {
			newIndices.push(index.getX(0));
			newIndices.push(index.getX(i));
			newIndices.push(index.getX(i + 1));
		}
		else for (let i = 0; i < numberOfTriangles; i++) if (i % 2 === 0) {
			newIndices.push(index.getX(i));
			newIndices.push(index.getX(i + 1));
			newIndices.push(index.getX(i + 2));
		} else {
			newIndices.push(index.getX(i + 2));
			newIndices.push(index.getX(i + 1));
			newIndices.push(index.getX(i));
		}
		if (newIndices.length / 3 !== numberOfTriangles) console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");
		geometry.setIndex(newIndices);
		geometry.clearGroups();
		return geometry;
	} else {
		console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:", drawMode);
		return geometry;
	}
}
//#endregion
export { toTrianglesDrawMode as n, mergeGeometries as t };
