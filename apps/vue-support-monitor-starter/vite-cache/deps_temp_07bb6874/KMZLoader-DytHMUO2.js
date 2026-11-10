import { C as FileLoader, E as Group, J as Loader, X as LoadingManager } from "./three.module-0UZ2DIdt.js";
import { t as unzipSync } from "./fflate.module-mtlOMP1b.js";
import { t as ColladaLoader } from "./ColladaLoader-BWRYHkfM.js";
//#region ../../node_modules/.pnpm/three@0.186.1/node_modules/three/examples/jsm/loaders/KMZLoader.js
/**
* A loader for the KMZ format.
*
* ```js
* const loader = new KMZLoader();
* const kmz = await loader.loadAsync( './models/kmz/Box.kmz' );
*
* scene.add( kmz.scene );
* ```
*
* @augments Loader
* @three_import import { KMZLoader } from 'three/addons/loaders/KMZLoader.js';
*/
var KMZLoader = class extends Loader {
	/**
	* Constructs a new KMZ loader.
	*
	* @param {LoadingManager} [manager] - The loading manager.
	*/
	constructor(manager) {
		super(manager);
	}
	/**
	* Starts loading from the given URL and passes the loaded KMZ asset
	* to the `onLoad()` callback.
	*
	* @param {string} url - The path/URL of the file to be loaded. This can also be a data URI.
	* @param {function({scene:Group})} onLoad - Executed when the loading process has been finished.
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
	* Parses the given KMZ data and returns an object holding the scene.
	*
	* @param {ArrayBuffer} data - The raw KMZ data as an array buffer.
	* @return {{scene:Group}} The parsed KMZ asset.
	*/
	parse(data) {
		function findFile(url) {
			for (const path in zip) if (path.slice(-url.length) === url) return zip[path];
		}
		const manager = new LoadingManager();
		manager.setURLModifier(function(url) {
			const image = findFile(url);
			if (image) {
				console.log("Loading", url);
				const blob = new Blob([image.buffer], { type: "application/octet-stream" });
				return URL.createObjectURL(blob);
			}
			return url;
		});
		const zip = unzipSync(new Uint8Array(data));
		if (zip["doc.kml"]) {
			const model = new DOMParser().parseFromString(new TextDecoder().decode(zip["doc.kml"]), "application/xml").querySelector("Placemark Model Link href");
			if (model) return new ColladaLoader(manager).parse(new TextDecoder().decode(zip[model.textContent]));
		} else {
			console.warn("KMZLoader: Missing doc.kml file.");
			for (const path in zip) if (path.split(".").pop().toLowerCase() === "dae") return new ColladaLoader(manager).parse(new TextDecoder().decode(zip[path]));
		}
		console.error("KMZLoader: Couldn't find .dae file.");
		return { scene: new Group() };
	}
};
//#endregion
export { KMZLoader };
