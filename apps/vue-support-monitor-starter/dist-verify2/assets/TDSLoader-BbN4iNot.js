import { $ as MeshPhongMaterial, Dt as TextureLoader, S as Group, U as Loader, W as LoaderUtils, X as Mesh, Y as Matrix4, b as FileLoader, c as BufferGeometry, d as Color, x as Float32BufferAttribute } from "./file-viewer-3d-ijA7B-Qe.js";
//#region ../../node_modules/.pnpm/three@0.186.1/node_modules/three/examples/jsm/loaders/TDSLoader.js
/**
* A loader for the 3DS format, based on lib3ds.
*
* Loads geometry with uv and materials basic properties with texture support.
*
* ```js
* const loader = new TDSLoader();
* loader.setResourcePath( 'models/3ds/portalgun/textures/' );
* const object = await loader.loadAsync( 'models/3ds/portalgun/portalgun.3ds' );
* scene.add( object );
*
* @augments Loader
* @three_import import { TDSLoader } from 'three/addons/loaders/TDSLoader.js';
*/
var TDSLoader = class extends Loader {
	/**
	* Constructs a new 3DS loader.
	*
	* @param {LoadingManager} [manager] - The loading manager.
	*/
	constructor(manager) {
		super(manager);
		/**
		* Whether debug mode should be enabled or not.
		*
		* @type {boolean}
		* @default false
		*/
		this.debug = false;
		this.group = null;
		this.materials = [];
		this.meshes = [];
	}
	/**
	* Starts loading from the given URL and passes the loaded 3DS asset
	* to the `onLoad()` callback.
	*
	* @param {string} url - The path/URL of the file to be loaded. This can also be a data URI.
	* @param {function(Group)} onLoad - Executed when the loading process has been finished.
	* @param {onProgressCallback} onProgress - Executed while the loading is in progress.
	* @param {onErrorCallback} onError - Executed when errors occur.
	*/
	load(url, onLoad, onProgress, onError) {
		const scope = this;
		const path = this.path === "" ? LoaderUtils.extractUrlBase(url) : this.path;
		const loader = new FileLoader(this.manager);
		loader.setPath(this.path);
		loader.setResponseType("arraybuffer");
		loader.setRequestHeader(this.requestHeader);
		loader.setWithCredentials(this.withCredentials);
		loader.load(url, function(data) {
			try {
				onLoad(scope.parse(data, path));
			} catch (e) {
				if (onError) onError(e);
				else console.error(e);
				scope.manager.itemError(url);
			}
		}, onProgress, onError);
	}
	/**
	* Parses the given 3DS data and returns the resulting data.
	*
	* @param {ArrayBuffer} arraybuffer - The raw 3DS data as an array buffer.
	* @param {string} path - The asset path.
	* @return {Group} The parsed asset represented as a group.
	*/
	parse(arraybuffer, path) {
		this.group = new Group();
		this.materials = [];
		this.meshes = [];
		this.readFile(arraybuffer, path);
		for (let i = 0; i < this.meshes.length; i++) this.group.add(this.meshes[i]);
		return this.group;
	}
	/**
	* Decode file content to read 3ds data.
	*
	* @private
	* @param {ArrayBuffer} arraybuffer - Arraybuffer data to be loaded.
	* @param {string} path - Path for external resources.
	*/
	readFile(arraybuffer, path) {
		const chunk = new Chunk(new DataView(arraybuffer), 0, this.debugMessage);
		if (chunk.id === MLIBMAGIC || chunk.id === CMAGIC || chunk.id === M3DMAGIC) {
			let next = chunk.readChunk();
			while (next) {
				if (next.id === M3D_VERSION) {
					const version = next.readDWord();
					this.debugMessage("3DS file version: " + version);
				} else if (next.id === MDATA) this.readMeshData(next, path);
				else this.debugMessage("Unknown main chunk: " + next.hexId);
				next = chunk.readChunk();
			}
		}
		this.debugMessage("Parsed " + this.meshes.length + " meshes");
	}
	/**
	* Read mesh data chunk.
	*
	* @private
	* @param {Chunk} chunk - to read mesh from
	* @param {string} path - Path for external resources.
	*/
	readMeshData(chunk, path) {
		let next = chunk.readChunk();
		while (next) {
			if (next.id === MESH_VERSION) {
				const version = +next.readDWord();
				this.debugMessage("Mesh Version: " + version);
			} else if (next.id === MASTER_SCALE) {
				const scale = next.readFloat();
				this.debugMessage("Master scale: " + scale);
				this.group.scale.set(scale, scale, scale);
			} else if (next.id === NAMED_OBJECT) {
				this.debugMessage("Named Object");
				this.readNamedObject(next);
			} else if (next.id === MAT_ENTRY) {
				this.debugMessage("Material");
				this.readMaterialEntry(next, path);
			} else this.debugMessage("Unknown MDATA chunk: " + next.hexId);
			next = chunk.readChunk();
		}
	}
	/**
	* Read named object chunk.
	*
	* @private
	* @param {Chunk} chunk - Chunk in use.
	*/
	readNamedObject(chunk) {
		const name = chunk.readString();
		let next = chunk.readChunk();
		while (next) {
			if (next.id === N_TRI_OBJECT) {
				const mesh = this.readMesh(next);
				mesh.name = name;
				this.meshes.push(mesh);
			} else this.debugMessage("Unknown named object chunk: " + next.hexId);
			next = chunk.readChunk();
		}
	}
	/**
	* Read material data chunk and add it to the material list.
	*
	* @private
	* @param {Chunk} chunk - Chunk in use.
	* @param {string} path - Path for external resources.
	*/
	readMaterialEntry(chunk, path) {
		let next = chunk.readChunk();
		const material = new MeshPhongMaterial();
		while (next) {
			if (next.id === MAT_NAME) {
				material.name = next.readString();
				this.debugMessage("   Name: " + material.name);
			} else if (next.id === MAT_WIRE) {
				this.debugMessage("   Wireframe");
				material.wireframe = true;
			} else if (next.id === MAT_WIRE_SIZE) {
				const value = next.readByte();
				material.wireframeLinewidth = value;
				this.debugMessage("   Wireframe Thickness: " + value);
			} else if (next.id === MAT_TWO_SIDE) {
				material.side = 2;
				this.debugMessage("   DoubleSided");
			} else if (next.id === MAT_ADDITIVE) {
				this.debugMessage("   Additive Blending");
				material.blending = 2;
			} else if (next.id === MAT_DIFFUSE) {
				this.debugMessage("   Diffuse Color");
				material.color = this.readColor(next);
			} else if (next.id === MAT_SPECULAR) {
				this.debugMessage("   Specular Color");
				material.specular = this.readColor(next);
			} else if (next.id === MAT_AMBIENT) {
				this.debugMessage("   Ambient color");
				material.color = this.readColor(next);
			} else if (next.id === MAT_SHININESS) {
				const shininess = this.readPercentage(next);
				material.shininess = shininess * 100;
				this.debugMessage("   Shininess : " + shininess);
			} else if (next.id === MAT_TRANSPARENCY) {
				const transparency = this.readPercentage(next);
				material.opacity = 1 - transparency;
				this.debugMessage("  Transparency : " + transparency);
				material.transparent = material.opacity < 1 ? true : false;
			} else if (next.id === MAT_TEXMAP) {
				this.debugMessage("   ColorMap");
				material.map = this.readMap(next, path);
			} else if (next.id === MAT_BUMPMAP) {
				this.debugMessage("   BumpMap");
				material.bumpMap = this.readMap(next, path);
			} else if (next.id === MAT_OPACMAP) {
				this.debugMessage("   OpacityMap");
				material.alphaMap = this.readMap(next, path);
			} else if (next.id === MAT_SPECMAP) {
				this.debugMessage("   SpecularMap");
				material.specularMap = this.readMap(next, path);
			} else this.debugMessage("   Unknown material chunk: " + next.hexId);
			next = chunk.readChunk();
		}
		this.materials[material.name] = material;
	}
	/**
	* Read mesh data chunk.
	*
	* @private
	* @param {Chunk} chunk - Chunk in use.
	* @return {Mesh} - The parsed mesh.
	*/
	readMesh(chunk) {
		let next = chunk.readChunk();
		const geometry = new BufferGeometry();
		const material = new MeshPhongMaterial();
		const mesh = new Mesh(geometry, material);
		mesh.name = "mesh";
		while (next) {
			if (next.id === POINT_ARRAY) {
				const points = next.readWord();
				this.debugMessage("   Vertex: " + points);
				const vertices = [];
				for (let i = 0; i < points; i++) {
					vertices.push(next.readFloat());
					vertices.push(next.readFloat());
					vertices.push(next.readFloat());
				}
				geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
			} else if (next.id === FACE_ARRAY) this.readFaceArray(next, mesh);
			else if (next.id === TEX_VERTS) {
				const texels = next.readWord();
				this.debugMessage("   UV: " + texels);
				const uvs = [];
				for (let i = 0; i < texels; i++) {
					uvs.push(next.readFloat());
					uvs.push(next.readFloat());
				}
				geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
			} else if (next.id === MESH_MATRIX) {
				this.debugMessage("   Transformation Matrix (TODO)");
				const values = [];
				for (let i = 0; i < 12; i++) values[i] = next.readFloat();
				const matrix = new Matrix4();
				matrix.elements[0] = values[0];
				matrix.elements[1] = values[6];
				matrix.elements[2] = values[3];
				matrix.elements[3] = values[9];
				matrix.elements[4] = values[2];
				matrix.elements[5] = values[8];
				matrix.elements[6] = values[5];
				matrix.elements[7] = values[11];
				matrix.elements[8] = values[1];
				matrix.elements[9] = values[7];
				matrix.elements[10] = values[4];
				matrix.elements[11] = values[10];
				matrix.elements[12] = 0;
				matrix.elements[13] = 0;
				matrix.elements[14] = 0;
				matrix.elements[15] = 1;
				matrix.transpose();
				const inverse = new Matrix4();
				inverse.copy(matrix).invert();
				geometry.applyMatrix4(inverse);
				matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
			} else this.debugMessage("   Unknown mesh chunk: " + next.hexId);
			next = chunk.readChunk();
		}
		geometry.computeVertexNormals();
		return mesh;
	}
	/**
	* Read face array data chunk.
	*
	* @private
	* @param {Chunk} chunk - Chunk in use.
	* @param {Mesh} mesh - Mesh to be filled with the data read.
	*/
	readFaceArray(chunk, mesh) {
		const faces = chunk.readWord();
		this.debugMessage("   Faces: " + faces);
		const index = [];
		for (let i = 0; i < faces; ++i) {
			index.push(chunk.readWord(), chunk.readWord(), chunk.readWord());
			chunk.readWord();
		}
		mesh.geometry.setIndex(index);
		let materialIndex = 0;
		let start = 0;
		while (!chunk.endOfChunk) {
			const subchunk = chunk.readChunk();
			if (subchunk.id === MSH_MAT_GROUP) {
				this.debugMessage("      Material Group");
				const group = this.readMaterialGroup(subchunk);
				const count = group.index.length * 3;
				mesh.geometry.addGroup(start, count, materialIndex);
				start += count;
				materialIndex++;
				const material = this.materials[group.name];
				if (Array.isArray(mesh.material) === false) mesh.material = [];
				if (material !== void 0) mesh.material.push(material);
			} else this.debugMessage("      Unknown face array chunk: " + subchunk.hexId);
		}
		if (mesh.material.length === 1) mesh.material = mesh.material[0];
	}
	/**
	* Read texture map data chunk.
	*
	* @private
	* @param {Chunk} chunk - Chunk in use.
	* @param {string} path - Path for external resources.
	* @return {Texture} Texture read from this data chunk.
	*/
	readMap(chunk, path) {
		let next = chunk.readChunk();
		let texture = {};
		const loader = new TextureLoader(this.manager);
		loader.setPath(this.resourcePath || path).setCrossOrigin(this.crossOrigin);
		while (next) {
			if (next.id === MAT_MAPNAME) {
				const name = next.readString();
				texture = loader.load(name);
				this.debugMessage("      File: " + path + name);
			} else if (next.id === MAT_MAP_UOFFSET) {
				texture.offset.x = next.readFloat();
				this.debugMessage("      OffsetX: " + texture.offset.x);
			} else if (next.id === MAT_MAP_VOFFSET) {
				texture.offset.y = next.readFloat();
				this.debugMessage("      OffsetY: " + texture.offset.y);
			} else if (next.id === MAT_MAP_USCALE) {
				texture.repeat.x = next.readFloat();
				this.debugMessage("      RepeatX: " + texture.repeat.x);
			} else if (next.id === MAT_MAP_VSCALE) {
				texture.repeat.y = next.readFloat();
				this.debugMessage("      RepeatY: " + texture.repeat.y);
			} else this.debugMessage("      Unknown map chunk: " + next.hexId);
			next = chunk.readChunk();
		}
		return texture;
	}
	/**
	* Read material group data chunk.
	*
	* @private
	* @param {Chunk} chunk - Chunk in use.
	* @return {Object} Object with name and index of the object.
	*/
	readMaterialGroup(chunk) {
		const name = chunk.readString();
		const numFaces = chunk.readWord();
		this.debugMessage("         Name: " + name);
		this.debugMessage("         Faces: " + numFaces);
		const index = [];
		for (let i = 0; i < numFaces; ++i) index.push(chunk.readWord());
		return {
			name,
			index
		};
	}
	/**
	* Read a color value.
	*
	* @private
	* @param {Chunk} chunk - Chunk.
	* @return {Color} Color value read.
	*/
	readColor(chunk) {
		const subChunk = chunk.readChunk();
		const color = new Color();
		if (subChunk.id === COLOR_24 || subChunk.id === LIN_COLOR_24) {
			const r = subChunk.readByte();
			const g = subChunk.readByte();
			const b = subChunk.readByte();
			color.setRGB(r / 255, g / 255, b / 255);
			this.debugMessage("      Color: " + color.r + ", " + color.g + ", " + color.b);
		} else if (subChunk.id === COLOR_F || subChunk.id === LIN_COLOR_F) {
			const r = subChunk.readFloat();
			const g = subChunk.readFloat();
			const b = subChunk.readFloat();
			color.setRGB(r, g, b);
			this.debugMessage("      Color: " + color.r + ", " + color.g + ", " + color.b);
		} else this.debugMessage("      Unknown color chunk: " + subChunk.hexId);
		return color;
	}
	/**
	* Read percentage value.
	*
	* @private
	* @param {Chunk} chunk - Chunk to read data from.
	* @return {number} Data read from the dataview.
	*/
	readPercentage(chunk) {
		const subChunk = chunk.readChunk();
		switch (subChunk.id) {
			case INT_PERCENTAGE: return subChunk.readShort() / 100;
			case FLOAT_PERCENTAGE: return subChunk.readFloat();
			default:
				this.debugMessage("      Unknown percentage chunk: " + subChunk.hexId);
				return 0;
		}
	}
	/**
	* Print debug message to the console.
	*
	* Is controlled by a flag to show or hide debug messages.
	*
	* @private
	* @param {Object} message - Debug message to print to the console.
	*/
	debugMessage(message) {
		if (this.debug) console.log(message);
	}
};
/**
* Read data/sub-chunks from chunk.
*
* @private
*/
var Chunk = class Chunk {
	/**
	* Create a new chunk
	*
	* @private
	* @param {DataView} data - DataView to read from.
	* @param {number} position - In data.
	* @param {Function} debugMessage - Logging callback.
	*/
	constructor(data, position, debugMessage) {
		this.data = data;
		this.offset = position;
		this.position = position;
		this.debugMessage = debugMessage;
		if (this.debugMessage instanceof Function) this.debugMessage = function() {};
		this.id = this.readWord();
		this.size = this.readDWord();
		this.end = this.offset + this.size;
		if (this.end > data.byteLength) this.debugMessage("Bad chunk size for chunk at " + position);
	}
	/**
	* Reads a sub cchunk.
	*
	* @private
	* @return {Chunk | null} next sub chunk.
	*/
	readChunk() {
		if (this.endOfChunk) return null;
		try {
			const next = new Chunk(this.data, this.position, this.debugMessage);
			this.position += next.size;
			return next;
		} catch (e) {
			this.debugMessage("Unable to read chunk at " + this.position);
			return null;
		}
	}
	/**
	* Returns the ID of this chunk as Hex
	*
	* @private
	* @return {string} hex-string of id
	*/
	get hexId() {
		return this.id.toString(16);
	}
	get endOfChunk() {
		return this.position >= this.end;
	}
	/**
	* Read byte value.
	*
	* @private
	* @return {number} Data read from the dataview.
	*/
	readByte() {
		const v = this.data.getUint8(this.position, true);
		this.position += 1;
		return v;
	}
	/**
	* Read 32 bit float value.
	*
	* @private
	* @return {number} Data read from the dataview.
	*/
	readFloat() {
		try {
			const v = this.data.getFloat32(this.position, true);
			this.position += 4;
			return v;
		} catch (e) {
			this.debugMessage(e + " " + this.position + " " + this.data.byteLength);
			return 0;
		}
	}
	/**
	* Read 32 bit signed integer value.
	*
	* @private
	* @return {number} Data read from the dataview.
	*/
	readInt() {
		const v = this.data.getInt32(this.position, true);
		this.position += 4;
		return v;
	}
	/**
	* Read 16 bit signed integer value.
	*
	* @private
	* @return {number} Data read from the dataview.
	*/
	readShort() {
		const v = this.data.getInt16(this.position, true);
		this.position += 2;
		return v;
	}
	/**
	* Read 64 bit unsigned integer value.
	*
	* @private
	* @return {number} Data read from the dataview.
	*/
	readDWord() {
		const v = this.data.getUint32(this.position, true);
		this.position += 4;
		return v;
	}
	/**
	* Read 32 bit unsigned integer value.
	*
	* @private
	* @return {number} Data read from the dataview.
	*/
	readWord() {
		const v = this.data.getUint16(this.position, true);
		this.position += 2;
		return v;
	}
	/**
	* Read NULL terminated ASCII string value from chunk-pos.
	*
	* @private
	* @return {string} Data read from the dataview.
	*/
	readString() {
		let s = "";
		let c = this.readByte();
		while (c) {
			s += String.fromCharCode(c);
			c = this.readByte();
		}
		return s;
	}
};
var M3DMAGIC = 19789;
var MLIBMAGIC = 15786;
var CMAGIC = 49725;
var M3D_VERSION = 2;
var COLOR_F = 16;
var COLOR_24 = 17;
var LIN_COLOR_24 = 18;
var LIN_COLOR_F = 19;
var INT_PERCENTAGE = 48;
var FLOAT_PERCENTAGE = 49;
var MDATA = 15677;
var MESH_VERSION = 15678;
var MASTER_SCALE = 256;
var MAT_ENTRY = 45055;
var MAT_NAME = 40960;
var MAT_AMBIENT = 40976;
var MAT_DIFFUSE = 40992;
var MAT_SPECULAR = 41008;
var MAT_SHININESS = 41024;
var MAT_TRANSPARENCY = 41040;
var MAT_TWO_SIDE = 41089;
var MAT_ADDITIVE = 41091;
var MAT_WIRE = 41093;
var MAT_WIRE_SIZE = 41095;
var MAT_TEXMAP = 41472;
var MAT_OPACMAP = 41488;
var MAT_BUMPMAP = 41520;
var MAT_SPECMAP = 41476;
var MAT_MAPNAME = 41728;
var MAT_MAP_USCALE = 41812;
var MAT_MAP_VSCALE = 41814;
var MAT_MAP_UOFFSET = 41816;
var MAT_MAP_VOFFSET = 41818;
var NAMED_OBJECT = 16384;
var N_TRI_OBJECT = 16640;
var POINT_ARRAY = 16656;
var FACE_ARRAY = 16672;
var MSH_MAT_GROUP = 16688;
var TEX_VERTS = 16704;
var MESH_MATRIX = 16736;
//#endregion
export { TDSLoader };
