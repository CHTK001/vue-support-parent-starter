import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { $ as createFileViewerViewStateChangeEmitter, Q as createFileViewerViewStateChange, a as resolveFileViewerColorScheme, dn as resolveFileViewerRuntimeAssetBaseUrl, on as resolveFileViewerModelAssetUrls } from "./dist-B6GcL3C6.js";
import { _ as unregisterFileViewerZoomProvider, g as unregisterFileViewerViewStateProvider, m as registerFileViewerZoomProvider, o as createFileViewerZoomChangeEmitter, p as registerFileViewerViewStateProvider } from "./fit-BmeG0j2O.js";
import { n as resolveFileViewerLocale, t as createFileViewerTranslator } from "./messages-C9eWaSMj.js";
import { $ as MathUtils, Ct as Ray, D as HemisphereLight, Dt as Scene, E as Group, Et as SRGBColorSpace, Gt as Vector3, It as TOUCH, Lt as Texture, Mt as Sphere, Ot as ShaderMaterial, Pt as Spherical, T as GridHelper, Wt as Vector2, Z as MOUSE, a as AxesHelper, g as Controls, gt as Plane, ht as PerspectiveCamera, i as AnimationMixer, l as BufferAttribute, nt as Mesh, p as Color, s as Box3, st as MeshStandardMaterial, t as WebGLRenderer, u as BufferGeometry, vt as Points, w as Float32BufferAttribute, x as DirectionalLight, xt as Quaternion, yt as PointsMaterial, zt as Timer } from "./three.module-0UZ2DIdt.js";
//#region ../../node_modules/.pnpm/three@0.186.1/node_modules/three/examples/jsm/controls/OrbitControls.js
/**
* Fires when the camera has been transformed by the controls.
*
* @event OrbitControls#change
* @type {Object}
*/
var _changeEvent = { type: "change" };
/**
* Fires when an interaction was initiated.
*
* @event OrbitControls#start
* @type {Object}
*/
var _startEvent = { type: "start" };
/**
* Fires when an interaction has finished.
*
* @event OrbitControls#end
* @type {Object}
*/
var _endEvent = { type: "end" };
var _ray = new Ray();
var _plane = new Plane();
var _TILT_LIMIT = Math.cos(70 * MathUtils.DEG2RAD);
var _v = new Vector3();
var _twoPI = 2 * Math.PI;
var _STATE = {
	NONE: -1,
	ROTATE: 0,
	DOLLY: 1,
	PAN: 2,
	TOUCH_ROTATE: 3,
	TOUCH_PAN: 4,
	TOUCH_DOLLY_PAN: 5,
	TOUCH_DOLLY_ROTATE: 6
};
var _EPS = 1e-6;
/**
* Orbit controls allow the camera to orbit around a target.
*
* OrbitControls performs orbiting, dollying (zooming), and panning. Unlike {@link TrackballControls},
* it maintains the "up" direction `object.up` (+Y by default).
*
* - Orbit: Left mouse / touch: one-finger move.
* - Zoom: Middle mouse, or mousewheel / touch: two-finger spread or squish.
* - Pan: Right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move.
*
* ```js
* const controls = new OrbitControls( camera, renderer.domElement );
*
* // controls.update() must be called after any manual changes to the camera's transform
* camera.position.set( 0, 20, 100 );
* controls.update();
*
* function animate() {
*
* 	// required if controls.enableDamping or controls.autoRotate are set to true
* 	controls.update();
*
* 	renderer.render( scene, camera );
*
* }
* ```
*
* @augments Controls
* @three_import import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
*/
var OrbitControls = class extends Controls {
	/**
	* Constructs a new controls instance.
	*
	* @param {Object3D} object - The object that is managed by the controls.
	* @param {?HTMLElement} domElement - The HTML element used for event listeners.
	*/
	constructor(object, domElement = null) {
		super(object, domElement);
		this.state = _STATE.NONE;
		/**
		* The focus point of the controls, the `object` orbits around this.
		* It can be updated manually at any point to change the focus of the controls.
		*
		* @type {Vector3}
		*/
		this.target = new Vector3();
		/**
		* The focus point of the `minTargetRadius` and `maxTargetRadius` limits.
		* It can be updated manually at any point to change the center of interest
		* for the `target`.
		*
		* @type {Vector3}
		*/
		this.cursor = new Vector3();
		/**
		* How far you can dolly in (perspective camera only).
		*
		* @type {number}
		* @default 0
		*/
		this.minDistance = 0;
		/**
		* How far you can dolly out (perspective camera only).
		*
		* @type {number}
		* @default Infinity
		*/
		this.maxDistance = Infinity;
		/**
		* How far you can zoom in (orthographic camera only).
		*
		* @type {number}
		* @default 0
		*/
		this.minZoom = 0;
		/**
		* How far you can zoom out (orthographic camera only).
		*
		* @type {number}
		* @default Infinity
		*/
		this.maxZoom = Infinity;
		/**
		* How close you can get the target to the 3D `cursor`.
		*
		* @type {number}
		* @default 0
		*/
		this.minTargetRadius = 0;
		/**
		* How far you can move the target from the 3D `cursor`.
		*
		* @type {number}
		* @default Infinity
		*/
		this.maxTargetRadius = Infinity;
		/**
		* How far you can orbit vertically, lower limit. Range is `[0, Math.PI]` radians.
		*
		* @type {number}
		* @default 0
		*/
		this.minPolarAngle = 0;
		/**
		* How far you can orbit vertically, upper limit. Range is `[0, Math.PI]` radians.
		*
		* @type {number}
		* @default Math.PI
		*/
		this.maxPolarAngle = Math.PI;
		/**
		* How far you can orbit horizontally, lower limit. If set, the interval `[ min, max ]`
		* must be a sub-interval of `[ - 2 PI, 2 PI ]`, with `( max - min < 2 PI )`.
		*
		* @type {number}
		* @default -Infinity
		*/
		this.minAzimuthAngle = -Infinity;
		/**
		* How far you can orbit horizontally, upper limit. If set, the interval `[ min, max ]`
		* must be a sub-interval of `[ - 2 PI, 2 PI ]`, with `( max - min < 2 PI )`.
		*
		* @type {number}
		* @default -Infinity
		*/
		this.maxAzimuthAngle = Infinity;
		/**
		* Set to `true` to enable damping (inertia), which can be used to give a sense of weight
		* to the controls. Note that if this is enabled, you must call `update()` in your animation
		* loop.
		*
		* @type {boolean}
		* @default false
		*/
		this.enableDamping = false;
		/**
		* The damping inertia used if `enableDamping` is set to `true`.
		*
		* Note that for this to work, you must call `update()` in your animation loop.
		*
		* @type {number}
		* @default 0.05
		*/
		this.dampingFactor = .05;
		/**
		* Enable or disable zooming (dollying) of the camera.
		*
		* @type {boolean}
		* @default true
		*/
		this.enableZoom = true;
		/**
		* Speed of zooming / dollying.
		*
		* @type {number}
		* @default 1
		*/
		this.zoomSpeed = 1;
		/**
		* Enable or disable horizontal and vertical rotation of the camera.
		*
		* Note that it is possible to disable a single axis by setting the min and max of the
		* `minPolarAngle` or `minAzimuthAngle` to the same value, which will cause the vertical
		* or horizontal rotation to be fixed at that value.
		*
		* @type {boolean}
		* @default true
		*/
		this.enableRotate = true;
		/**
		* Speed of rotation.
		*
		* @type {number}
		* @default 1
		*/
		this.rotateSpeed = 1;
		/**
		* How fast to rotate the camera when the keyboard is used.
		*
		* @type {number}
		* @default 1
		*/
		this.keyRotateSpeed = 1;
		/**
		* Enable or disable camera panning.
		*
		* @type {boolean}
		* @default true
		*/
		this.enablePan = true;
		/**
		* Speed of panning.
		*
		* @type {number}
		* @default 1
		*/
		this.panSpeed = 1;
		/**
		* Defines how the camera's position is translated when panning. If `true`, the camera pans
		* in screen space. Otherwise, the camera pans in the plane orthogonal to the camera's up
		* direction.
		*
		* @type {boolean}
		* @default true
		*/
		this.screenSpacePanning = true;
		/**
		* How fast to pan the camera when the keyboard is used in
		* pixels per keypress.
		*
		* @type {number}
		* @default 7
		*/
		this.keyPanSpeed = 7;
		/**
		* Setting this property to `true` allows to zoom to the cursor's position.
		*
		* @type {boolean}
		* @default false
		*/
		this.zoomToCursor = false;
		/**
		* Set to true to automatically rotate around the target
		*
		* Note that if this is enabled, you must call `update()` in your animation loop.
		* If you want the auto-rotate speed to be independent of the frame rate (the refresh
		* rate of the display), you must pass the time `deltaTime`, in seconds, to `update()`.
		*
		* @type {boolean}
		* @default false
		*/
		this.autoRotate = false;
		/**
		* How fast to rotate around the target if `autoRotate` is `true`. The default  equates to 30 seconds
		* per orbit at 60fps.
		*
		* Note that if `autoRotate` is enabled, you must call `update()` in your animation loop.
		*
		* @type {number}
		* @default 2
		*/
		this.autoRotateSpeed = 2;
		/**
		* This object contains references to the keycodes for controlling camera panning.
		*
		* ```js
		* controls.keys = {
		* 	LEFT: 'ArrowLeft', //left arrow
		* 	UP: 'ArrowUp', // up arrow
		* 	RIGHT: 'ArrowRight', // right arrow
		* 	BOTTOM: 'ArrowDown' // down arrow
		* }
		* ```
		* @type {Object}
		*/
		this.keys = {
			LEFT: "ArrowLeft",
			UP: "ArrowUp",
			RIGHT: "ArrowRight",
			BOTTOM: "ArrowDown"
		};
		/**
		* This object contains references to the mouse actions used by the controls.
		*
		* ```js
		* controls.mouseButtons = {
		* 	LEFT: THREE.MOUSE.ROTATE,
		* 	MIDDLE: THREE.MOUSE.DOLLY,
		* 	RIGHT: THREE.MOUSE.PAN
		* }
		* ```
		* @type {Object}
		*/
		this.mouseButtons = {
			LEFT: MOUSE.ROTATE,
			MIDDLE: MOUSE.DOLLY,
			RIGHT: MOUSE.PAN
		};
		/**
		* This object contains references to the touch actions used by the controls.
		*
		* ```js
		* controls.mouseButtons = {
		* 	ONE: THREE.TOUCH.ROTATE,
		* 	TWO: THREE.TOUCH.DOLLY_PAN
		* }
		* ```
		* @type {Object}
		*/
		this.touches = {
			ONE: TOUCH.ROTATE,
			TWO: TOUCH.DOLLY_PAN
		};
		/**
		* Used internally by `saveState()` and `reset()`.
		*
		* @type {Vector3}
		*/
		this.target0 = this.target.clone();
		/**
		* Used internally by `saveState()` and `reset()`.
		*
		* @type {Vector3}
		*/
		this.position0 = this.object.position.clone();
		/**
		* Used internally by `saveState()` and `reset()`.
		*
		* @type {number}
		*/
		this.zoom0 = this.object.zoom;
		this._cursorStyle = "auto";
		this._domElementKeyEvents = null;
		this._lastPosition = new Vector3();
		this._lastQuaternion = new Quaternion();
		this._lastTargetPosition = new Vector3();
		this._quat = new Quaternion().setFromUnitVectors(object.up, new Vector3(0, 1, 0));
		this._quatInverse = this._quat.clone().invert();
		this._spherical = new Spherical();
		this._sphericalDelta = new Spherical();
		this._scale = 1;
		this._panOffset = new Vector3();
		this._rotateStart = new Vector2();
		this._rotateEnd = new Vector2();
		this._rotateDelta = new Vector2();
		this._panStart = new Vector2();
		this._panEnd = new Vector2();
		this._panDelta = new Vector2();
		this._dollyStart = new Vector2();
		this._dollyEnd = new Vector2();
		this._dollyDelta = new Vector2();
		this._dollyDirection = new Vector3();
		this._mouse = new Vector2();
		this._performCursorZoom = false;
		this._pointers = [];
		this._pointerPositions = {};
		this._controlActive = false;
		this._onPointerMove = onPointerMove.bind(this);
		this._onPointerDown = onPointerDown.bind(this);
		this._onPointerUp = onPointerUp.bind(this);
		this._onContextMenu = onContextMenu.bind(this);
		this._onMouseWheel = onMouseWheel.bind(this);
		this._onKeyDown = onKeyDown.bind(this);
		this._onTouchStart = onTouchStart.bind(this);
		this._onTouchMove = onTouchMove.bind(this);
		this._onMouseDown = onMouseDown.bind(this);
		this._onMouseMove = onMouseMove.bind(this);
		this._interceptControlDown = interceptControlDown.bind(this);
		this._interceptControlUp = interceptControlUp.bind(this);
		if (this.domElement !== null) this.connect(this.domElement);
		this.update();
	}
	/**
	* Defines the visual representation of the cursor.
	*
	* @type {('auto'|'grab')}
	* @default 'auto'
	*/
	set cursorStyle(type) {
		this._cursorStyle = type;
		if (type === "grab") this.domElement.style.cursor = "grab";
		else this.domElement.style.cursor = "auto";
	}
	get cursorStyle() {
		return this._cursorStyle;
	}
	connect(element) {
		super.connect(element);
		this.domElement.addEventListener("pointerdown", this._onPointerDown);
		this.domElement.addEventListener("pointercancel", this._onPointerUp);
		this.domElement.addEventListener("contextmenu", this._onContextMenu);
		this.domElement.addEventListener("wheel", this._onMouseWheel, { passive: false });
		this.domElement.getRootNode().addEventListener("keydown", this._interceptControlDown, {
			passive: true,
			capture: true
		});
		this.domElement.style.touchAction = "none";
	}
	disconnect() {
		this.state = _STATE.NONE;
		this.domElement.removeEventListener("pointerdown", this._onPointerDown);
		this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove);
		this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp);
		this.domElement.removeEventListener("pointercancel", this._onPointerUp);
		this.domElement.removeEventListener("wheel", this._onMouseWheel);
		this.domElement.removeEventListener("contextmenu", this._onContextMenu);
		this.stopListenToKeyEvents();
		const document = this.domElement.getRootNode();
		document.removeEventListener("keydown", this._interceptControlDown, { capture: true });
		document.removeEventListener("keyup", this._interceptControlUp, { capture: true });
		this._controlActive = false;
		this._pointers.length = 0;
		this._pointerPositions = {};
		this.domElement.style.touchAction = "";
		this.domElement.style.cursor = "auto";
	}
	dispose() {
		this.disconnect();
	}
	/**
	* Get the current vertical rotation, in radians.
	*
	* @return {number} The current vertical rotation, in radians.
	*/
	getPolarAngle() {
		return this._spherical.phi;
	}
	/**
	* Get the current horizontal rotation, in radians.
	*
	* @return {number} The current horizontal rotation, in radians.
	*/
	getAzimuthalAngle() {
		return this._spherical.theta;
	}
	/**
	* Returns the distance from the camera to the target.
	*
	* @return {number} The distance from the camera to the target.
	*/
	getDistance() {
		return this.object.position.distanceTo(this.target);
	}
	/**
	* Adds key event listeners to the given DOM element.
	* `window` is a recommended argument for using this method.
	*
	* @param {HTMLElement} domElement - The DOM element
	*/
	listenToKeyEvents(domElement) {
		domElement.addEventListener("keydown", this._onKeyDown);
		this._domElementKeyEvents = domElement;
	}
	/**
	* Removes the key event listener previously defined with `listenToKeyEvents()`.
	*/
	stopListenToKeyEvents() {
		if (this._domElementKeyEvents !== null) {
			this._domElementKeyEvents.removeEventListener("keydown", this._onKeyDown);
			this._domElementKeyEvents = null;
		}
	}
	/**
	* Save the current state of the controls. This can later be recovered with `reset()`.
	*/
	saveState() {
		this.target0.copy(this.target);
		this.position0.copy(this.object.position);
		this.zoom0 = this.object.zoom;
	}
	/**
	* Reset the controls to their state from either the last time the `saveState()`
	* was called, or the initial state.
	*/
	reset() {
		this.target.copy(this.target0);
		this.object.position.copy(this.position0);
		this.object.zoom = this.zoom0;
		this.object.updateProjectionMatrix();
		this.dispatchEvent(_changeEvent);
		this.update();
		this.state = _STATE.NONE;
	}
	/**
	* Programmatically pan the camera.
	*
	* @param {number} deltaX - The horizontal pan amount in pixels.
	* @param {number} deltaY - The vertical pan amount in pixels.
	*/
	pan(deltaX, deltaY) {
		this._pan(deltaX, deltaY);
		this.update();
	}
	/**
	* Programmatically dolly in (zoom in for perspective camera).
	*
	* @param {number} dollyScale - The dolly scale factor.
	*/
	dollyIn(dollyScale) {
		this._dollyIn(dollyScale);
		this.update();
	}
	/**
	* Programmatically dolly out (zoom out for perspective camera).
	*
	* @param {number} dollyScale - The dolly scale factor.
	*/
	dollyOut(dollyScale) {
		this._dollyOut(dollyScale);
		this.update();
	}
	/**
	* Programmatically rotate the camera left (around the vertical axis).
	*
	* @param {number} angle - The rotation angle in radians.
	*/
	rotateLeft(angle) {
		this._rotateLeft(angle);
		this.update();
	}
	/**
	* Programmatically rotate the camera up (around the horizontal axis).
	*
	* @param {number} angle - The rotation angle in radians.
	*/
	rotateUp(angle) {
		this._rotateUp(angle);
		this.update();
	}
	update(deltaTime = null) {
		const position = this.object.position;
		_v.copy(position).sub(this.target);
		_v.applyQuaternion(this._quat);
		this._spherical.setFromVector3(_v);
		if (this.autoRotate && this.state === _STATE.NONE) this._rotateLeft(this._getAutoRotationAngle(deltaTime));
		if (this.enableDamping) {
			this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor;
			this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor;
		} else {
			this._spherical.theta += this._sphericalDelta.theta;
			this._spherical.phi += this._sphericalDelta.phi;
		}
		let min = this.minAzimuthAngle;
		let max = this.maxAzimuthAngle;
		if (isFinite(min) && isFinite(max)) {
			if (min < -Math.PI) min += _twoPI;
			else if (min > Math.PI) min -= _twoPI;
			if (max < -Math.PI) max += _twoPI;
			else if (max > Math.PI) max -= _twoPI;
			if (min <= max) this._spherical.theta = Math.max(min, Math.min(max, this._spherical.theta));
			else this._spherical.theta = this._spherical.theta > (min + max) / 2 ? Math.max(min, this._spherical.theta) : Math.min(max, this._spherical.theta);
		}
		this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi));
		this._spherical.makeSafe();
		if (this.enableDamping === true) this.target.addScaledVector(this._panOffset, this.dampingFactor);
		else this.target.add(this._panOffset);
		this.target.sub(this.cursor);
		this.target.clampLength(this.minTargetRadius, this.maxTargetRadius);
		this.target.add(this.cursor);
		let zoomChanged = false;
		if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera) this._spherical.radius = this._clampDistance(this._spherical.radius);
		else {
			const prevRadius = this._spherical.radius;
			this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale);
			zoomChanged = prevRadius != this._spherical.radius;
		}
		_v.setFromSpherical(this._spherical);
		_v.applyQuaternion(this._quatInverse);
		position.copy(this.target).add(_v);
		this.object.lookAt(this.target);
		if (this.enableDamping === true) {
			this._sphericalDelta.theta *= 1 - this.dampingFactor;
			this._sphericalDelta.phi *= 1 - this.dampingFactor;
			this._panOffset.multiplyScalar(1 - this.dampingFactor);
		} else {
			this._sphericalDelta.set(0, 0, 0);
			this._panOffset.set(0, 0, 0);
		}
		if (this.zoomToCursor && this._performCursorZoom) {
			let newRadius = null;
			if (this.object.isPerspectiveCamera) {
				const prevRadius = _v.length();
				newRadius = this._clampDistance(prevRadius * this._scale);
				const radiusDelta = prevRadius - newRadius;
				this.object.position.addScaledVector(this._dollyDirection, radiusDelta);
				this.object.updateMatrixWorld();
				zoomChanged = !!radiusDelta;
			} else if (this.object.isOrthographicCamera) {
				const mouseBefore = new Vector3(this._mouse.x, this._mouse.y, 0);
				mouseBefore.unproject(this.object);
				const prevZoom = this.object.zoom;
				this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale));
				this.object.updateProjectionMatrix();
				zoomChanged = prevZoom !== this.object.zoom;
				const mouseAfter = new Vector3(this._mouse.x, this._mouse.y, 0);
				mouseAfter.unproject(this.object);
				this.object.position.sub(mouseAfter).add(mouseBefore);
				this.object.updateMatrixWorld();
				newRadius = _v.length();
			} else {
				console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.");
				this.zoomToCursor = false;
			}
			if (newRadius !== null) if (this.screenSpacePanning) this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(newRadius).add(this.object.position);
			else {
				_ray.origin.copy(this.object.position);
				_ray.direction.set(0, 0, -1).transformDirection(this.object.matrix);
				if (Math.abs(this.object.up.dot(_ray.direction)) < _TILT_LIMIT) this.object.lookAt(this.target);
				else {
					_plane.setFromNormalAndCoplanarPoint(this.object.up, this.target);
					_ray.intersectPlane(_plane, this.target);
				}
			}
		} else if (this.object.isOrthographicCamera) {
			const prevZoom = this.object.zoom;
			this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale));
			if (prevZoom !== this.object.zoom) {
				this.object.updateProjectionMatrix();
				zoomChanged = true;
			}
		}
		this._scale = 1;
		this._performCursorZoom = false;
		if (zoomChanged || this._lastPosition.distanceToSquared(this.object.position) > _EPS || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > _EPS || this._lastTargetPosition.distanceToSquared(this.target) > _EPS) {
			this.dispatchEvent(_changeEvent);
			this._lastPosition.copy(this.object.position);
			this._lastQuaternion.copy(this.object.quaternion);
			this._lastTargetPosition.copy(this.target);
			return true;
		}
		return false;
	}
	_getAutoRotationAngle(deltaTime) {
		if (deltaTime !== null) return _twoPI / 60 * this.autoRotateSpeed * deltaTime;
		else return _twoPI / 60 / 60 * this.autoRotateSpeed;
	}
	_getZoomScale(delta) {
		const normalizedDelta = Math.abs(delta * .01);
		return Math.pow(.95, this.zoomSpeed * normalizedDelta);
	}
	_rotateLeft(angle) {
		this._sphericalDelta.theta -= angle;
	}
	_rotateUp(angle) {
		this._sphericalDelta.phi -= angle;
	}
	_panLeft(distance, objectMatrix) {
		_v.setFromMatrixColumn(objectMatrix, 0);
		_v.multiplyScalar(-distance);
		this._panOffset.add(_v);
	}
	_panUp(distance, objectMatrix) {
		if (this.screenSpacePanning === true) _v.setFromMatrixColumn(objectMatrix, 1);
		else {
			_v.setFromMatrixColumn(objectMatrix, 0);
			_v.crossVectors(this.object.up, _v);
		}
		_v.multiplyScalar(distance);
		this._panOffset.add(_v);
	}
	_pan(deltaX, deltaY) {
		const element = this.domElement;
		if (this.object.isPerspectiveCamera) {
			const position = this.object.position;
			_v.copy(position).sub(this.target);
			let targetDistance = _v.length();
			targetDistance *= Math.tan(this.object.fov / 2 * Math.PI / 180);
			this._panLeft(2 * deltaX * targetDistance / element.clientHeight, this.object.matrix);
			this._panUp(2 * deltaY * targetDistance / element.clientHeight, this.object.matrix);
		} else if (this.object.isOrthographicCamera) {
			this._panLeft(deltaX * (this.object.right - this.object.left) / this.object.zoom / element.clientWidth, this.object.matrix);
			this._panUp(deltaY * (this.object.top - this.object.bottom) / this.object.zoom / element.clientHeight, this.object.matrix);
		} else {
			console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.");
			this.enablePan = false;
		}
	}
	_dollyOut(dollyScale) {
		if (this.object.isPerspectiveCamera || this.object.isOrthographicCamera) this._scale /= dollyScale;
		else {
			console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");
			this.enableZoom = false;
		}
	}
	_dollyIn(dollyScale) {
		if (this.object.isPerspectiveCamera || this.object.isOrthographicCamera) this._scale *= dollyScale;
		else {
			console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.");
			this.enableZoom = false;
		}
	}
	_updateZoomParameters(x, y) {
		if (!this.zoomToCursor) return;
		this._performCursorZoom = true;
		const rect = this.domElement.getBoundingClientRect();
		const dx = x - rect.left;
		const dy = y - rect.top;
		const w = rect.width;
		const h = rect.height;
		this._mouse.x = dx / w * 2 - 1;
		this._mouse.y = -(dy / h) * 2 + 1;
		this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
	}
	_clampDistance(dist) {
		return Math.max(this.minDistance, Math.min(this.maxDistance, dist));
	}
	_handleMouseDownRotate(event) {
		this._rotateStart.set(event.clientX, event.clientY);
	}
	_handleMouseDownDolly(event) {
		this._updateZoomParameters(event.clientX, event.clientX);
		this._dollyStart.set(event.clientX, event.clientY);
	}
	_handleMouseDownPan(event) {
		this._panStart.set(event.clientX, event.clientY);
	}
	_handleMouseMoveRotate(event) {
		this._rotateEnd.set(event.clientX, event.clientY);
		this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
		const element = this.domElement;
		this._rotateLeft(_twoPI * this._rotateDelta.x / element.clientHeight);
		this._rotateUp(_twoPI * this._rotateDelta.y / element.clientHeight);
		this._rotateStart.copy(this._rotateEnd);
		this.update();
	}
	_handleMouseMoveDolly(event) {
		this._dollyEnd.set(event.clientX, event.clientY);
		this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart);
		if (this._dollyDelta.y > 0) this._dollyOut(this._getZoomScale(this._dollyDelta.y));
		else if (this._dollyDelta.y < 0) this._dollyIn(this._getZoomScale(this._dollyDelta.y));
		this._dollyStart.copy(this._dollyEnd);
		this.update();
	}
	_handleMouseMovePan(event) {
		this._panEnd.set(event.clientX, event.clientY);
		this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed);
		this._pan(this._panDelta.x, this._panDelta.y);
		this._panStart.copy(this._panEnd);
		this.update();
	}
	_handleMouseWheel(event) {
		this._updateZoomParameters(event.clientX, event.clientY);
		if (event.deltaY < 0) this._dollyIn(this._getZoomScale(event.deltaY));
		else if (event.deltaY > 0) this._dollyOut(this._getZoomScale(event.deltaY));
		this.update();
	}
	_handleKeyDown(event) {
		let needsUpdate = false;
		switch (event.code) {
			case this.keys.UP:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate) this._rotateUp(_twoPI * this.keyRotateSpeed / this.domElement.clientHeight);
				} else if (this.enablePan) this._pan(0, this.keyPanSpeed);
				needsUpdate = true;
				break;
			case this.keys.BOTTOM:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate) this._rotateUp(-_twoPI * this.keyRotateSpeed / this.domElement.clientHeight);
				} else if (this.enablePan) this._pan(0, -this.keyPanSpeed);
				needsUpdate = true;
				break;
			case this.keys.LEFT:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate) this._rotateLeft(_twoPI * this.keyRotateSpeed / this.domElement.clientHeight);
				} else if (this.enablePan) this._pan(this.keyPanSpeed, 0);
				needsUpdate = true;
				break;
			case this.keys.RIGHT:
				if (event.ctrlKey || event.metaKey || event.shiftKey) {
					if (this.enableRotate) this._rotateLeft(-_twoPI * this.keyRotateSpeed / this.domElement.clientHeight);
				} else if (this.enablePan) this._pan(-this.keyPanSpeed, 0);
				needsUpdate = true;
		}
		if (needsUpdate) {
			event.preventDefault();
			this.update();
		}
	}
	_handleTouchStartRotate(event) {
		if (this._pointers.length === 1) this._rotateStart.set(event.pageX, event.pageY);
		else {
			const position = this._getSecondPointerPosition(event);
			const x = .5 * (event.pageX + position.x);
			const y = .5 * (event.pageY + position.y);
			this._rotateStart.set(x, y);
		}
	}
	_handleTouchStartPan(event) {
		if (this._pointers.length === 1) this._panStart.set(event.pageX, event.pageY);
		else {
			const position = this._getSecondPointerPosition(event);
			const x = .5 * (event.pageX + position.x);
			const y = .5 * (event.pageY + position.y);
			this._panStart.set(x, y);
		}
	}
	_handleTouchStartDolly(event) {
		const position = this._getSecondPointerPosition(event);
		const dx = event.pageX - position.x;
		const dy = event.pageY - position.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		this._dollyStart.set(0, distance);
	}
	_handleTouchStartDollyPan(event) {
		if (this.enableZoom) this._handleTouchStartDolly(event);
		if (this.enablePan) this._handleTouchStartPan(event);
	}
	_handleTouchStartDollyRotate(event) {
		if (this.enableZoom) this._handleTouchStartDolly(event);
		if (this.enableRotate) this._handleTouchStartRotate(event);
	}
	_handleTouchMoveRotate(event) {
		if (this._pointers.length == 1) this._rotateEnd.set(event.pageX, event.pageY);
		else {
			const position = this._getSecondPointerPosition(event);
			const x = .5 * (event.pageX + position.x);
			const y = .5 * (event.pageY + position.y);
			this._rotateEnd.set(x, y);
		}
		this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
		const element = this.domElement;
		this._rotateLeft(_twoPI * this._rotateDelta.x / element.clientHeight);
		this._rotateUp(_twoPI * this._rotateDelta.y / element.clientHeight);
		this._rotateStart.copy(this._rotateEnd);
	}
	_handleTouchMovePan(event) {
		if (this._pointers.length === 1) this._panEnd.set(event.pageX, event.pageY);
		else {
			const position = this._getSecondPointerPosition(event);
			const x = .5 * (event.pageX + position.x);
			const y = .5 * (event.pageY + position.y);
			this._panEnd.set(x, y);
		}
		this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed);
		this._pan(this._panDelta.x, this._panDelta.y);
		this._panStart.copy(this._panEnd);
	}
	_handleTouchMoveDolly(event) {
		const position = this._getSecondPointerPosition(event);
		const dx = event.pageX - position.x;
		const dy = event.pageY - position.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		this._dollyEnd.set(0, distance);
		this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed));
		this._dollyOut(this._dollyDelta.y);
		this._dollyStart.copy(this._dollyEnd);
		const centerX = (event.pageX + position.x) * .5;
		const centerY = (event.pageY + position.y) * .5;
		this._updateZoomParameters(centerX, centerY);
	}
	_handleTouchMoveDollyPan(event) {
		if (this.enableZoom) this._handleTouchMoveDolly(event);
		if (this.enablePan) this._handleTouchMovePan(event);
	}
	_handleTouchMoveDollyRotate(event) {
		if (this.enableZoom) this._handleTouchMoveDolly(event);
		if (this.enableRotate) this._handleTouchMoveRotate(event);
	}
	_addPointer(event) {
		this._pointers.push(event.pointerId);
	}
	_removePointer(event) {
		delete this._pointerPositions[event.pointerId];
		for (let i = 0; i < this._pointers.length; i++) if (this._pointers[i] == event.pointerId) {
			this._pointers.splice(i, 1);
			return;
		}
	}
	_isTrackingPointer(event) {
		for (let i = 0; i < this._pointers.length; i++) if (this._pointers[i] == event.pointerId) return true;
		return false;
	}
	_trackPointer(event) {
		let position = this._pointerPositions[event.pointerId];
		if (position === void 0) {
			position = new Vector2();
			this._pointerPositions[event.pointerId] = position;
		}
		position.set(event.pageX, event.pageY);
	}
	_getSecondPointerPosition(event) {
		const pointerId = event.pointerId === this._pointers[0] ? this._pointers[1] : this._pointers[0];
		return this._pointerPositions[pointerId];
	}
	_customWheelEvent(event) {
		const mode = event.deltaMode;
		const newEvent = {
			clientX: event.clientX,
			clientY: event.clientY,
			deltaY: event.deltaY
		};
		switch (mode) {
			case 1:
				newEvent.deltaY *= 16;
				break;
			case 2: newEvent.deltaY *= 100;
		}
		if (event.ctrlKey && !this._controlActive) newEvent.deltaY *= 10;
		return newEvent;
	}
};
function onPointerDown(event) {
	if (this.enabled === false) return;
	if (this._pointers.length === 0) {
		this.domElement.setPointerCapture(event.pointerId);
		this.domElement.ownerDocument.addEventListener("pointermove", this._onPointerMove);
		this.domElement.ownerDocument.addEventListener("pointerup", this._onPointerUp);
	}
	if (this._isTrackingPointer(event)) return;
	this._addPointer(event);
	if (event.pointerType === "touch") this._onTouchStart(event);
	else this._onMouseDown(event);
	if (this._cursorStyle === "grab") this.domElement.style.cursor = "grabbing";
}
function onPointerMove(event) {
	if (this.enabled === false) return;
	if (event.pointerType === "touch") this._onTouchMove(event);
	else this._onMouseMove(event);
}
function onPointerUp(event) {
	this._removePointer(event);
	switch (this._pointers.length) {
		case 0:
			this.domElement.releasePointerCapture(event.pointerId);
			this.domElement.ownerDocument.removeEventListener("pointermove", this._onPointerMove);
			this.domElement.ownerDocument.removeEventListener("pointerup", this._onPointerUp);
			this.dispatchEvent(_endEvent);
			this.state = _STATE.NONE;
			if (this._cursorStyle === "grab") this.domElement.style.cursor = "grab";
			break;
		case 1:
			const pointerId = this._pointers[0];
			const position = this._pointerPositions[pointerId];
			this._onTouchStart({
				pointerId,
				pageX: position.x,
				pageY: position.y
			});
	}
}
function onMouseDown(event) {
	let mouseAction;
	switch (event.button) {
		case 0:
			mouseAction = this.mouseButtons.LEFT;
			break;
		case 1:
			mouseAction = this.mouseButtons.MIDDLE;
			break;
		case 2:
			mouseAction = this.mouseButtons.RIGHT;
			break;
		default: mouseAction = -1;
	}
	switch (mouseAction) {
		case MOUSE.DOLLY:
			if (this.enableZoom === false) return;
			this._handleMouseDownDolly(event);
			this.state = _STATE.DOLLY;
			break;
		case MOUSE.ROTATE:
			if (event.ctrlKey || event.metaKey || event.shiftKey) {
				if (this.enablePan === false) return;
				this._handleMouseDownPan(event);
				this.state = _STATE.PAN;
			} else {
				if (this.enableRotate === false) return;
				this._handleMouseDownRotate(event);
				this.state = _STATE.ROTATE;
			}
			break;
		case MOUSE.PAN:
			if (event.ctrlKey || event.metaKey || event.shiftKey) {
				if (this.enableRotate === false) return;
				this._handleMouseDownRotate(event);
				this.state = _STATE.ROTATE;
			} else {
				if (this.enablePan === false) return;
				this._handleMouseDownPan(event);
				this.state = _STATE.PAN;
			}
			break;
		default: this.state = _STATE.NONE;
	}
	if (this.state !== _STATE.NONE) this.dispatchEvent(_startEvent);
}
function onMouseMove(event) {
	switch (this.state) {
		case _STATE.ROTATE:
			if (this.enableRotate === false) return;
			this._handleMouseMoveRotate(event);
			break;
		case _STATE.DOLLY:
			if (this.enableZoom === false) return;
			this._handleMouseMoveDolly(event);
			break;
		case _STATE.PAN:
			if (this.enablePan === false) return;
			this._handleMouseMovePan(event);
	}
}
function onMouseWheel(event) {
	if (this.enabled === false || this.enableZoom === false || this.state !== _STATE.NONE) return;
	event.preventDefault();
	this.dispatchEvent(_startEvent);
	this._handleMouseWheel(this._customWheelEvent(event));
	this.dispatchEvent(_endEvent);
}
function onKeyDown(event) {
	if (this.enabled === false) return;
	this._handleKeyDown(event);
}
function onTouchStart(event) {
	this._trackPointer(event);
	switch (this._pointers.length) {
		case 1:
			switch (this.touches.ONE) {
				case TOUCH.ROTATE:
					if (this.enableRotate === false) return;
					this._handleTouchStartRotate(event);
					this.state = _STATE.TOUCH_ROTATE;
					break;
				case TOUCH.PAN:
					if (this.enablePan === false) return;
					this._handleTouchStartPan(event);
					this.state = _STATE.TOUCH_PAN;
					break;
				default: this.state = _STATE.NONE;
			}
			break;
		case 2:
			switch (this.touches.TWO) {
				case TOUCH.DOLLY_PAN:
					if (this.enableZoom === false && this.enablePan === false) return;
					this._handleTouchStartDollyPan(event);
					this.state = _STATE.TOUCH_DOLLY_PAN;
					break;
				case TOUCH.DOLLY_ROTATE:
					if (this.enableZoom === false && this.enableRotate === false) return;
					this._handleTouchStartDollyRotate(event);
					this.state = _STATE.TOUCH_DOLLY_ROTATE;
					break;
				default: this.state = _STATE.NONE;
			}
			break;
		default: this.state = _STATE.NONE;
	}
	if (this.state !== _STATE.NONE) this.dispatchEvent(_startEvent);
}
function onTouchMove(event) {
	this._trackPointer(event);
	switch (this.state) {
		case _STATE.TOUCH_ROTATE:
			if (this.enableRotate === false) return;
			this._handleTouchMoveRotate(event);
			this.update();
			break;
		case _STATE.TOUCH_PAN:
			if (this.enablePan === false) return;
			this._handleTouchMovePan(event);
			this.update();
			break;
		case _STATE.TOUCH_DOLLY_PAN:
			if (this.enableZoom === false && this.enablePan === false) return;
			this._handleTouchMoveDollyPan(event);
			this.update();
			break;
		case _STATE.TOUCH_DOLLY_ROTATE:
			if (this.enableZoom === false && this.enableRotate === false) return;
			this._handleTouchMoveDollyRotate(event);
			this.update();
			break;
		default: this.state = _STATE.NONE;
	}
}
function onContextMenu(event) {
	if (this.enabled === false) return;
	event.preventDefault();
}
function interceptControlDown(event) {
	if (event.key === "Control") {
		this._controlActive = true;
		this.domElement.getRootNode().addEventListener("keyup", this._interceptControlUp, {
			passive: true,
			capture: true
		});
	}
}
function interceptControlUp(event) {
	if (event.key === "Control") {
		this._controlActive = false;
		this.domElement.getRootNode().removeEventListener("keyup", this._interceptControlUp, {
			passive: true,
			capture: true
		});
	}
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+geometry-engine@3.1.2/node_modules/@file-viewer/geometry-engine/dist/index.js
var DEFAULT_OCCT_IMPORT_TIMEOUT_MS = 12e4;
var occtRuntimePromises = /* @__PURE__ */ new Map();
var geometryWorkerRequestId = 0;
var createGeometryAbortError = (signal) => {
	if ((signal === null || signal === void 0 ? void 0 : signal.reason) instanceof Error) return signal.reason;
	return new DOMException("Geometry import was aborted.", "AbortError");
};
var toOwnedBytes = (input) => {
	return input instanceof Uint8Array ? input.slice() : new Uint8Array(input.slice(0));
};
var normalizeOcctFormat = (type) => {
	const format = normalizeGeometryKernelFormat(type);
	if (format === "step" || format === "iges" || format === "brep") return format;
	throw new Error(`No OpenCascade import route is available for ${String(type || "unknown").toUpperCase()}.`);
};
var validateOcctResult = (value, format) => {
	const result = value;
	if (!(result === null || result === void 0 ? void 0 : result.success)) throw new Error(`${format.toUpperCase()} geometry parsing failed. The file may be empty, damaged, or unsupported by this OpenCascade build.`);
	if (!Array.isArray(result.meshes) || result.meshes.length === 0) throw new Error(`${format.toUpperCase()} geometry parsing completed without any renderable meshes.`);
	return {
		success: true,
		root: result.root,
		meshes: result.meshes
	};
};
var getOcctRuntime = (wasmUrl) => {
	let promise = occtRuntimePromises.get(wasmUrl);
	if (!promise) {
		promise = import("./occt-CUOzRCIR.js").then((m) => /* @__PURE__ */ __toESM(m.default)).then((module) => module.default({ locateFile(path) {
			return path.endsWith(".wasm") ? wasmUrl : path;
		} }));
		occtRuntimePromises.set(wasmUrl, promise);
		promise.catch(() => occtRuntimePromises.delete(wasmUrl));
	}
	return promise;
};
var readOcctGeometry = (occt, format, bytes, params) => {
	switch (format) {
		case "step": return occt.ReadStepFile(bytes, params || null);
		case "iges": return occt.ReadIgesFile(bytes, params || null);
		case "brep": return occt.ReadBrepFile(bytes, params || null);
	}
};
var importOcctGeometryOnMainThread = async (bytes, format, options) => {
	var _a, _b, _c;
	if ((_a = options.signal) === null || _a === void 0 ? void 0 : _a.aborted) throw createGeometryAbortError(options.signal);
	const runtime = await getOcctRuntime(options.wasmUrl);
	if ((_b = options.signal) === null || _b === void 0 ? void 0 : _b.aborted) throw createGeometryAbortError(options.signal);
	const result = readOcctGeometry(runtime, format, bytes, options.params);
	if ((_c = options.signal) === null || _c === void 0 ? void 0 : _c.aborted) throw createGeometryAbortError(options.signal);
	return validateOcctResult(result, format);
};
var importOcctGeometryInWorker = (bytes, format, options) => new Promise((resolve, reject) => {
	var _a, _b;
	if (!options.workerUrl || !options.runtimeUrl) {
		reject(/* @__PURE__ */ new Error("The OCCT worker and runtime URLs are required for worker-based geometry import."));
		return;
	}
	if ((_a = options.signal) === null || _a === void 0 ? void 0 : _a.aborted) {
		reject(createGeometryAbortError(options.signal));
		return;
	}
	const worker = new Worker(options.workerUrl);
	const requestId = `geometry-${Date.now()}-${++geometryWorkerRequestId}`;
	const timeoutMs = Math.max(1e3, options.timeoutMs || DEFAULT_OCCT_IMPORT_TIMEOUT_MS);
	let settled = false;
	const cleanup = () => {
		var _a;
		clearTimeout(timeout);
		(_a = options.signal) === null || _a === void 0 || _a.removeEventListener("abort", onAbort);
		worker.removeEventListener("message", onMessage);
		worker.removeEventListener("error", onError);
		worker.terminate();
	};
	const complete = (action) => {
		if (settled) return;
		settled = true;
		cleanup();
		action();
	};
	const onAbort = () => complete(() => reject(createGeometryAbortError(options.signal)));
	const onError = (event) => complete(() => reject(new Error(event.message || "The OCCT geometry worker failed to load.")));
	const onMessage = (event) => {
		const message = event.data || {};
		if (message.id !== requestId) return;
		if (!message.ok) {
			complete(() => reject(new Error(message.error || `${format.toUpperCase()} geometry parsing failed.`)));
			return;
		}
		complete(() => {
			try {
				resolve(validateOcctResult(message.result, format));
			} catch (error) {
				reject(error);
			}
		});
	};
	const timeout = setTimeout(() => complete(() => reject(/* @__PURE__ */ new Error(`${format.toUpperCase()} geometry parsing timed out after ${Math.round(timeoutMs / 1e3)} seconds.`))), timeoutMs);
	(_b = options.signal) === null || _b === void 0 || _b.addEventListener("abort", onAbort, { once: true });
	worker.addEventListener("message", onMessage);
	worker.addEventListener("error", onError);
	const transferableBuffer = bytes.buffer;
	worker.postMessage({
		id: requestId,
		format,
		buffer: transferableBuffer,
		params: options.params || null,
		runtimeUrl: options.runtimeUrl,
		wasmUrl: options.wasmUrl
	}, [transferableBuffer]);
});
var importOcctGeometryFile = async (input, type, options) => {
	const format = normalizeOcctFormat(type);
	const bytes = toOwnedBytes(input);
	return options.useWorker !== false && typeof Worker === "function" && Boolean(options.workerUrl && options.runtimeUrl) ? importOcctGeometryInWorker(bytes, format, options) : importOcctGeometryOnMainThread(bytes, format, options);
};
var textDecoder = typeof TextDecoder === "function" ? new TextDecoder("utf-8", { fatal: false }) : void 0;
var normalizeToken = (value) => {
	return String(value || "").trim().toLowerCase().replace(/^\./, "").replace(/^model\//, "").replace(/^application\//, "").replace(/^x-/, "");
};
var geometryKernelRoutes = [
	{
		format: "step",
		aliases: [
			"step",
			"stp",
			"p21",
			"iso-10303-21"
		],
		label: "STEP / ISO 10303",
		family: "cad-brep",
		recommended: [{
			renderer: "OpenCascade / OCCT import",
			packageName: "occt-import-js",
			wasm: true,
			output: ["three-object", "mesh"],
			note: "Imports STEP into mesh/JSON data in the browser; suitable as the first full preview path.",
			url: "https://github.com/kovacsv/occt-import-js"
		}, {
			renderer: "OpenCascade.js",
			packageName: "opencascade.js",
			wasm: true,
			output: ["three-object", "mesh"],
			note: "Full OpenCascade geometry kernel port for richer CAD workflows.",
			url: "https://ocjs.org/"
		}],
		serverConversionTargets: [
			"glb",
			"gltf",
			"stl",
			"obj"
		],
		licenseNotes: ["Ship the OCCT and occt-import-js license files beside the self-hosted runtime and WASM assets."]
	},
	{
		format: "iges",
		aliases: ["iges", "igs"],
		label: "IGES",
		family: "cad-brep",
		recommended: [{
			renderer: "OpenCascade / OCCT import",
			packageName: "occt-import-js",
			wasm: true,
			output: ["three-object", "mesh"],
			note: "Uses OCCT importers for IGES/BREP geometry and keeps the heavy runtime behind a dedicated package.",
			url: "https://github.com/kovacsv/occt-import-js"
		}],
		serverConversionTargets: [
			"glb",
			"gltf",
			"stl",
			"obj"
		],
		licenseNotes: ["Treat CAD kernel licensing separately from the lightweight viewer core."]
	},
	{
		format: "brep",
		aliases: ["brep"],
		label: "BREP",
		family: "cad-brep",
		recommended: [{
			renderer: "OpenCascade / OCCT import",
			packageName: "occt-import-js",
			wasm: true,
			output: ["three-object", "mesh"],
			note: "BREP is closest to the native OCCT topology model and should share the STEP/IGES engine.",
			url: "https://github.com/kovacsv/occt-import-js"
		}],
		serverConversionTargets: [
			"glb",
			"gltf",
			"stl",
			"obj"
		],
		licenseNotes: ["Keep OCCT WASM as an explicit renderer dependency."]
	},
	{
		format: "ifc",
		aliases: [
			"ifc",
			"ifczip",
			"ifcxml"
		],
		label: "IFC / BuildingSMART",
		family: "bim-ifc",
		recommended: [{
			renderer: "That Open web-ifc",
			packageName: "web-ifc",
			wasm: true,
			output: ["fragments", "mesh"],
			note: "Reads IFC at native speed in the browser and can be paired with Fragments for large BIM models.",
			url: "https://github.com/thatopen/engine_web-ifc"
		}],
		serverConversionTargets: [
			"glb",
			"gltf",
			"fragments"
		],
		licenseNotes: ["Large IFC models often need preprocessing, fragments, worker isolation, and property paging."]
	},
	{
		format: "3dm",
		aliases: ["3dm", "rhino"],
		label: "Rhino 3DM / OpenNURBS",
		family: "rhino-3dm",
		recommended: [{
			renderer: "McNeel rhino3dm.js",
			packageName: "rhino3dm",
			wasm: true,
			output: ["three-object", "mesh"],
			note: "Official OpenNURBS WASM binding; Three.js provides Rhino3dmLoader on top of it.",
			url: "https://github.com/mcneel/rhino3dm"
		}],
		serverConversionTargets: [
			"glb",
			"gltf",
			"obj"
		],
		licenseNotes: ["Ship rhino3dm.wasm only in the dedicated 3DM renderer path."]
	}
];
var routeByAlias = /* @__PURE__ */ new Map();
geometryKernelRoutes.forEach((route) => {
	route.aliases.forEach((alias) => routeByAlias.set(alias, route));
});
var normalizeGeometryKernelFormat = (type) => {
	var _a;
	return (_a = routeByAlias.get(normalizeToken(type))) === null || _a === void 0 ? void 0 : _a.format;
};
var getGeometryKernelRoute = (type) => {
	return routeByAlias.get(normalizeToken(type));
};
var isGeometryKernelFormat = (type) => {
	return Boolean(getGeometryKernelRoute(type));
};
var toBytes = (input) => {
	return input instanceof Uint8Array ? input : new Uint8Array(input);
};
var decodePrefix = (bytes, maxLength = 8192) => {
	const slice = bytes.slice(0, Math.min(bytes.byteLength, maxLength));
	if (textDecoder) return textDecoder.decode(slice);
	let text = "";
	for (let index = 0; index < slice.length; index += 1) text += String.fromCharCode(slice[index]);
	return text;
};
var createInspection = (bytes, format, confidence, signature, warnings = []) => {
	return {
		format,
		route: format ? getGeometryKernelRoute(format) : void 0,
		confidence,
		byteLength: bytes.byteLength,
		signature,
		warnings
	};
};
var inspectGeometryKernelFile = (input, type) => {
	const bytes = toBytes(input);
	const explicitFormat = normalizeGeometryKernelFormat(type);
	const prefix = decodePrefix(bytes);
	const normalizedPrefix = prefix.toUpperCase();
	const warnings = [];
	if (bytes.byteLength === 0) return createInspection(bytes, explicitFormat, explicitFormat ? "low" : "none", void 0, ["Empty file."]);
	if (/FILE_SCHEMA\s*\(\s*\(\s*'IFC/i.test(prefix) || normalizedPrefix.includes("IFC") && normalizedPrefix.includes("FILE_SCHEMA")) return createInspection(bytes, "ifc", "high", "IFC-SPF", warnings);
	if (/ISO-10303-21|HEADER;\s*FILE_DESCRIPTION|DATA;\s*#\d+=/i.test(prefix)) return createInspection(bytes, "step", "high", "ISO-10303-21", warnings);
	if (/3D GEOMETRY FILE FORMAT|OPENNURBS/i.test(prefix)) return createInspection(bytes, "3dm", "high", "OpenNURBS 3DM", warnings);
	if (/DBRep_DrawableShape|CASCADE Topology V|BREP/i.test(prefix)) return createInspection(bytes, "brep", "medium", "OpenCascade BREP", warnings);
	const hasIgesStartSection = /^.{0,72}S\s*\d+/m.test(prefix);
	const hasIgesGlobalSection = /^.{0,72}G\s*\d+/m.test(prefix);
	if (hasIgesStartSection || hasIgesGlobalSection || /S\s+1\s*\n.{0,72}G\s+1/i.test(prefix)) return createInspection(bytes, "iges", hasIgesStartSection && hasIgesGlobalSection ? "high" : "medium", "IGES section marker", warnings);
	if (explicitFormat) {
		warnings.push("File signature was not fully recognized; using the provided extension or MIME hint.");
		return createInspection(bytes, explicitFormat, "low", void 0, warnings);
	}
	return createInspection(bytes, void 0, "none", void 0, ["No supported geometry kernel signature was detected."]);
};
var formatGeometryKernelNotice = (type, locale = "zh-CN") => {
	const route = getGeometryKernelRoute(type);
	const formatLabel = (route === null || route === void 0 ? void 0 : route.label) || String(type || "Engineering model").toUpperCase();
	const engines = (route === null || route === void 0 ? void 0 : route.recommended.map((item) => item.packageName).join(" / ")) || "OpenCascade / web-ifc / rhino3dm";
	const targets = (route === null || route === void 0 ? void 0 : route.serverConversionTargets.join(" / ")) || "GLB / GLTF";
	if ((route === null || route === void 0 ? void 0 : route.format) === "step" || (route === null || route === void 0 ? void 0 : route.format) === "iges" || (route === null || route === void 0 ? void 0 : route.format) === "brep") {
		if (locale === "en-US") return `${formatLabel} is previewed locally with the dedicated OCCT Worker/WASM path. The file stays in the browser; configure options.model only when the self-hosted assets use a custom deployment path.`;
		if (locale === "ja-JP") return `${formatLabel} は専用の OCCT Worker/WASM によりブラウザー内でローカルプレビューされます。ファイルはブラウザー外へ送信されません。自己ホストしたアセットを独自のパスへ配置する場合だけ options.model を設定してください。`;
		if (locale === "de-DE") return `${formatLabel} wird lokal über den eigenen OCCT-Worker/WASM-Pfad angezeigt. Die Datei bleibt im Browser; konfigurieren Sie options.model nur für selbst gehostete Assets unter einem abweichenden Pfad.`;
		return `${formatLabel} 已通过独立 OCCT Worker/WASM 在浏览器本地完成预览，文件无需上传；仅当离线资源部署在自定义目录时，才需要覆盖 options.model 路径。`;
	}
	if (locale === "en-US") return `${formatLabel} requires a dedicated WebAssembly geometry kernel (${engines}) for full browser preview. Flyfish Viewer keeps these heavy runtimes outside core and the default 3D renderer install path; use the dedicated geometry engine route or convert the model to ${targets} in a private pipeline.`;
	if (locale === "ja-JP") return `${formatLabel} をブラウザーで完全にプレビューするには、専用の WebAssembly 幾何カーネル（${engines}）が必要です。Flyfish Viewer は重量級ランタイムを core と既定の 3D renderer から分離しています。専用の geometry engine 経路を使うか、非公開の変換パイプラインで ${targets} へ変換してください。`;
	if (locale === "de-DE") return `${formatLabel} benötigt für eine vollständige Browservorschau einen eigenen WebAssembly-Geometriekern (${engines}). Flyfish Viewer hält diese großen Laufzeiten aus core und dem standardmäßigen 3D-Renderer heraus; verwenden Sie den Geometrie-Engine-Pfad oder konvertieren Sie das Modell intern nach ${targets}.`;
	return `${formatLabel} 需要独立 WebAssembly 几何内核（${engines}）才能完整浏览器预览。Flyfish Viewer 不会把这类重型运行时塞进 core 或默认 3D renderer 安装路径；请通过独立几何内核路线接入，或在私有转换链路输出 ${targets} 后预览。`;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-3d@3.1.2_esbuild@0.28.1_web-ifc@0.0.78/node_modules/@file-viewer/renderer-3d/dist/occtModel.js
var DEFAULT_SURFACE_COLOR = new Color(5214138);
var readColor = (value) => {
	if (!value || value.length < 3) return DEFAULT_SURFACE_COLOR.clone();
	const components = value.slice(0, 3).map(Number);
	if (components.some((component) => !Number.isFinite(component))) return DEFAULT_SURFACE_COLOR.clone();
	const [red, green, blue] = components.map((component) => MathUtils.clamp(component, 0, 1));
	return new Color(red, green, blue);
};
var createMaterial = (color, wireframe) => new MeshStandardMaterial({
	color,
	metalness: .06,
	roughness: .72,
	side: 2,
	wireframe
});
var hasOnlyFiniteNumbers = (values) => {
	for (let index = 0; index < values.length; index += 1) if (!Number.isFinite(Number(values[index]))) return false;
	return true;
};
var normalizeFaces = (faces, triangleCount) => {
	return (faces || []).map((face) => ({
		...face,
		first: Math.max(0, Math.floor(Number(face.first))),
		last: Math.min(triangleCount - 1, Math.floor(Number(face.last)))
	})).filter((face) => face.first <= face.last && face.first < triangleCount).sort((left, right) => left.first - right.first);
};
var buildGeometry = (source) => {
	const sourcePositions = source.attributes?.position?.array || [];
	const sourceIndices = source.index?.array || [];
	if (sourcePositions.length < 9 || sourcePositions.length % 3 !== 0) throw new Error(`OCCT mesh ${source.name || "(unnamed)"} has invalid vertex data.`);
	if (!hasOnlyFiniteNumbers(sourcePositions)) throw new Error(`OCCT mesh ${source.name || "(unnamed)"} has invalid vertex data.`);
	if (sourceIndices.length < 3 || sourceIndices.length % 3 !== 0) throw new Error(`OCCT mesh ${source.name || "(unnamed)"} has invalid triangle data.`);
	const vertexCount = sourcePositions.length / 3;
	for (let index = 0; index < sourceIndices.length; index += 1) {
		const vertexIndex = Number(sourceIndices[index]);
		if (!Number.isInteger(vertexIndex) || vertexIndex < 0 || vertexIndex >= vertexCount) throw new Error(`OCCT mesh ${source.name || "(unnamed)"} has an invalid triangle index.`);
	}
	const positions = Float32Array.from(sourcePositions);
	const indices = Uint32Array.from(sourceIndices);
	const geometry = new BufferGeometry();
	geometry.name = source.name || "";
	geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geometry.setIndex(new BufferAttribute(indices, 1));
	const normals = source.attributes?.normal?.array;
	if (normals && normals.length === positions.length && hasOnlyFiniteNumbers(normals)) geometry.setAttribute("normal", new Float32BufferAttribute(Float32Array.from(normals), 3));
	else geometry.computeVertexNormals();
	geometry.computeBoundingBox();
	geometry.computeBoundingSphere();
	return geometry;
};
var buildMaterials = (geometry, source, wireframe) => {
	const baseColor = readColor(source.color);
	const materials = [createMaterial(baseColor, wireframe)];
	const materialByColor = /* @__PURE__ */ new Map();
	const triangleCount = (geometry.index?.count || 0) / 3;
	const faces = normalizeFaces(source.brep_faces, triangleCount);
	if (!faces.length) return materials;
	let cursor = 0;
	for (const face of faces) {
		if (face.first > cursor) geometry.addGroup(cursor * 3, (face.first - cursor) * 3, 0);
		const faceColor = face.color ? readColor(face.color) : baseColor;
		const colorKey = face.color ? faceColor.getHexString() : "base";
		let materialIndex = colorKey === "base" ? 0 : materialByColor.get(colorKey);
		if (materialIndex === void 0) {
			materialIndex = materials.length;
			materialByColor.set(colorKey, materialIndex);
			materials.push(createMaterial(faceColor, wireframe));
		}
		const start = Math.max(cursor, face.first);
		if (face.last >= start) {
			geometry.addGroup(start * 3, (face.last - start + 1) * 3, materialIndex);
			cursor = face.last + 1;
		}
	}
	if (cursor < triangleCount) geometry.addGroup(cursor * 3, (triangleCount - cursor) * 3, 0);
	return materials;
};
var createMeshFactory = (source, wireframe) => {
	const geometry = buildGeometry(source);
	const materials = buildMaterials(geometry, source, wireframe);
	return () => {
		const mesh = new Mesh(geometry, materials.length === 1 ? materials[0] : materials);
		mesh.name = source.name || "";
		mesh.castShadow = false;
		mesh.receiveShadow = false;
		return mesh;
	};
};
var buildOcctThreeObject = (result, wireframe = false) => {
	if (!result.success || !result.meshes.length) throw new Error("The OpenCascade result does not contain renderable geometry.");
	const meshFactories = result.meshes.map((mesh) => createMeshFactory(mesh, wireframe));
	const referencedMeshes = /* @__PURE__ */ new Set();
	let nodeCount = 0;
	const buildNode = (node) => {
		const group = new Group();
		group.name = node.name || "";
		nodeCount += 1;
		for (const meshIndex of node.meshes || []) {
			const factory = meshFactories[meshIndex];
			if (!factory) continue;
			referencedMeshes.add(meshIndex);
			group.add(factory());
		}
		for (const child of node.children || []) group.add(buildNode(child));
		return group;
	};
	const object = result.root ? buildNode(result.root) : new Group();
	object.name ||= "OCCT model";
	const unassigned = new Group();
	unassigned.name = "Unassigned geometry";
	meshFactories.forEach((factory, index) => {
		if (!referencedMeshes.has(index)) unassigned.add(factory());
	});
	if (unassigned.children.length) {
		nodeCount += 1;
		object.add(unassigned);
	}
	object.rotation.x = -Math.PI / 2;
	object.updateMatrixWorld(true);
	const stats = {
		meshCount: 0,
		nodeCount,
		triangleCount: 0,
		vertexCount: 0
	};
	object.traverse((child) => {
		const mesh = child;
		if (!mesh.isMesh || !mesh.geometry.getAttribute("position")) return;
		stats.meshCount += 1;
		stats.vertexCount += mesh.geometry.getAttribute("position").count;
		stats.triangleCount += (mesh.geometry.index?.count || 0) / 3;
	});
	if (!stats.meshCount) throw new Error("The OpenCascade hierarchy does not reference any renderable meshes.");
	object.userData.fileViewerGeometryStats = stats;
	return {
		object,
		stats
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-3d@3.1.2_esbuild@0.28.1_web-ifc@0.0.78/node_modules/@file-viewer/renderer-3d/dist/modelViewport.js
var resolveCssSize = (stage, canvas) => {
	return {
		width: Math.max(1, Math.floor(stage.clientWidth || canvas.clientWidth || stage.getBoundingClientRect().width || canvas.getBoundingClientRect().width)),
		height: Math.max(1, Math.floor(stage.clientHeight || canvas.clientHeight || stage.getBoundingClientRect().height || canvas.getBoundingClientRect().height))
	};
};
var syncModelViewport = ({ renderer, camera, stage, canvas, devicePixelRatio = 1 }) => {
	const { width, height } = resolveCssSize(stage, canvas);
	const pixelRatio = Math.min(2, Math.max(1, Number.isFinite(devicePixelRatio) ? devicePixelRatio : 1));
	const pixelRatioChanged = Math.abs(renderer.getPixelRatio() - pixelRatio) > .001;
	if (pixelRatioChanged) renderer.setPixelRatio(pixelRatio);
	const expectedWidth = Math.max(1, Math.floor(width * pixelRatio));
	const expectedHeight = Math.max(1, Math.floor(height * pixelRatio));
	const resized = pixelRatioChanged || canvas.width !== expectedWidth || canvas.height !== expectedHeight;
	if (resized) renderer.setSize(width, height, false);
	const aspect = width / height;
	if (Math.abs(camera.aspect - aspect) > 1e-4) {
		camera.aspect = aspect;
		camera.updateProjectionMatrix();
	}
	return {
		width,
		height,
		pixelRatio,
		resized
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-3d@3.1.2_esbuild@0.28.1_web-ifc@0.0.78/node_modules/@file-viewer/renderer-3d/dist/model.js
var modelStyle = `
.model-viewer{display:flex;height:100%;min-height:100%;flex-direction:column;background:#f8fafc;color:#162333}
.model-viewer *{box-sizing:border-box}
.model-toolbar{display:flex;min-height:48px;align-items:center;justify-content:space-between;gap:16px;padding:0 12px;border-bottom:1px solid rgba(15,23,42,.08);background:#fff}
.model-actions{display:flex;min-width:0;flex-wrap:wrap;gap:6px}
.model-actions button{min-height:30px;border:0;border-radius:8px;padding:0 10px;background:rgba(15,23,42,.06);color:#475569;cursor:pointer;font-size:12px;font-weight:700;letter-spacing:0;transition:background-color .18s ease,color .18s ease}
.model-actions button.active,.model-actions button:hover{background:rgba(33,163,102,.14);color:#16804f}
.model-meta{min-width:0;display:flex;align-items:center;justify-content:flex-end;gap:8px;color:#64748b;font-size:12px}
.model-meta strong{color:#0f766e;font-weight:800}
.model-meta span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.model-stage{position:relative;flex:1;min-height:0;overflow:hidden}
.model-stage canvas{display:block;width:100%;height:100%;outline:none}
.model-state{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;background:rgba(248,250,252,.88);color:#64748b;text-align:center;line-height:1.7}
.model-state[hidden]{display:none!important}
.model-state.error{color:#b42318}
.model-state strong{color:#b42318;font-size:18px}
[data-viewer-theme='dark'] .model-viewer{background:#101820;color:#e5eef8}
[data-viewer-theme='dark'] .model-toolbar{border-color:rgba(148,163,184,.18);background:#111827}
[data-viewer-theme='dark'] .model-actions button{background:#1f2937;color:#cbd5e1}
[data-viewer-theme='dark'] .model-actions button.active,[data-viewer-theme='dark'] .model-actions button:hover{background:rgba(45,212,191,.14);color:#5eead4}
[data-viewer-theme='dark'] .model-meta{color:#94a3b8}
[data-viewer-theme='dark'] .model-meta strong{color:#5eead4}
[data-viewer-theme='dark'] .model-state{background:rgba(15,23,42,.88);color:#cbd5e1}
.model-viewer[data-model-theme='dark']{background:#101820;color:#e5eef8}
.model-viewer[data-model-theme='dark'] .model-toolbar{border-color:rgba(148,163,184,.18);background:#111827}
.model-viewer[data-model-theme='dark'] .model-actions button{background:#1f2937;color:#cbd5e1}
.model-viewer[data-model-theme='dark'] .model-actions button.active,.model-viewer[data-model-theme='dark'] .model-actions button:hover{background:rgba(45,212,191,.14);color:#5eead4}
.model-viewer[data-model-theme='dark'] .model-meta{color:#94a3b8}
.model-viewer[data-model-theme='dark'] .model-meta strong{color:#5eead4}
.model-viewer[data-model-theme='dark'] .model-state{background:rgba(15,23,42,.88);color:#cbd5e1}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .model-viewer{background:#101820;color:#e5eef8}[data-viewer-theme='system'] .model-toolbar{border-color:rgba(148,163,184,.18);background:#111827}[data-viewer-theme='system'] .model-actions button{background:#1f2937;color:#cbd5e1}[data-viewer-theme='system'] .model-actions button.active,[data-viewer-theme='system'] .model-actions button:hover{background:rgba(45,212,191,.14);color:#5eead4}[data-viewer-theme='system'] .model-meta{color:#94a3b8}[data-viewer-theme='system'] .model-meta strong{color:#5eead4}[data-viewer-theme='system'] .model-state{background:rgba(15,23,42,.88);color:#cbd5e1}}
@media (max-width:720px){.model-toolbar{min-height:64px;align-items:flex-start;flex-direction:column;gap:8px;padding:8px 10px}.model-meta{width:100%;justify-content:flex-start}}
`;
var ModelPreviewNotice = class extends Error {};
var MODEL_MIN_ZOOM = .1;
var MODEL_MAX_ZOOM = 20;
var MODEL_ZOOM_STEP = 1.2;
var MODEL_THEME_PALETTES = {
	light: {
		background: 16317180,
		gridCenter: 12175060,
		gridLine: 14542317,
		hemisphereSky: 16777215,
		hemisphereGround: 14147304
	},
	dark: {
		background: 857116,
		gridCenter: 5399929,
		gridLine: 2504004,
		hemisphereSky: 14412542,
		hemisphereGround: 1516081
	}
};
var createStyle = () => {
	const style = document.createElement("style");
	style.textContent = modelStyle;
	return style;
};
var createElement = (tagName, className, text) => {
	const element = document.createElement(tagName);
	if (className) element.className = className;
	if (text !== void 0) element.textContent = text;
	return element;
};
var normalizeError = (reason) => {
	if (reason instanceof Error) return reason.message;
	if (typeof reason === "string") return reason;
	try {
		return JSON.stringify(reason);
	} catch {
		return String(reason);
	}
};
var isWorkerBootstrapFailure = (reason) => {
	const errorName = reason && typeof reason === "object" && "name" in reason ? String(reason.name || "") : "";
	if (errorName === "SecurityError" || errorName === "NetworkError") return true;
	return /worker failed to load|worker-src|content security policy|importscripts|script error|loading (?:the )?wasm|fetching of the wasm failed/i.test(normalizeError(reason));
};
var canUseWorkerUrlFromDocument = (workerUrl, documentRef) => {
	const location = documentRef.defaultView?.location;
	if (!location) return true;
	try {
		const resolved = new URL(workerUrl, documentRef.baseURI);
		return resolved.protocol === "blob:" || resolved.origin === location.origin;
	} catch {
		return true;
	}
};
var getResourcePath = (sourceUrl) => {
	if (!sourceUrl) return "";
	try {
		return new URL(".", sourceUrl).href;
	} catch {
		const clean = sourceUrl.split(/[?#]/)[0] || sourceUrl;
		const slashIndex = clean.lastIndexOf("/");
		return slashIndex >= 0 ? clean.slice(0, slashIndex + 1) : "";
	}
};
var disposeObject = (object) => {
	const disposedGeometries = /* @__PURE__ */ new Set();
	const disposedMaterials = /* @__PURE__ */ new Set();
	const disposedTextures = /* @__PURE__ */ new Set();
	const disposedSkeletons = /* @__PURE__ */ new Set();
	const disposeTexture = (value) => {
		if (value instanceof Texture && !disposedTextures.has(value)) {
			disposedTextures.add(value);
			value.dispose();
		}
	};
	const disposeMaterial = (material) => {
		if (disposedMaterials.has(material)) return;
		disposedMaterials.add(material);
		Object.values(material).forEach((value) => {
			disposeTexture(value);
			if (Array.isArray(value)) value.forEach(disposeTexture);
		});
		if (material instanceof ShaderMaterial) Object.values(material.uniforms).forEach((uniform) => {
			disposeTexture(uniform?.value);
			if (Array.isArray(uniform?.value)) uniform.value.forEach(disposeTexture);
		});
		material.dispose();
	};
	object.traverse((child) => {
		const mesh = child;
		const points = child;
		if (mesh.geometry && !disposedGeometries.has(mesh.geometry)) {
			disposedGeometries.add(mesh.geometry);
			mesh.geometry.dispose();
		}
		if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(disposeMaterial);
		if (points.material) (Array.isArray(points.material) ? points.material : [points.material]).forEach(disposeMaterial);
		const skinnedMesh = child;
		if (skinnedMesh.isSkinnedMesh && !disposedSkeletons.has(skinnedMesh.skeleton)) {
			disposedSkeletons.add(skinnedMesh.skeleton);
			skinnedMesh.skeleton.dispose();
		}
	});
};
async function renderModel(buffer, target, type = "glb", context) {
	const normalizedType = type.toLowerCase();
	const sourceUrl = context?.url;
	const t = createFileViewerTranslator(context?.options);
	let status = "loading";
	let errorMessage = "";
	let objectSummary = t("model.state.loadingSummary");
	let autoRotate = false;
	let wireframe = false;
	let showGrid = true;
	let showAxes = true;
	let renderer = null;
	let scene = null;
	let camera = null;
	let controls = null;
	let modelRoot = null;
	let gridHelper = null;
	let axesHelper = null;
	let hemisphereLight = null;
	let themeObserver = null;
	let stopSystemThemeListener = null;
	let activeDarkMode = null;
	let resizeObserver = null;
	let controlsWithEvents = null;
	let disposed = false;
	let animationFrame = 0;
	let activeVersion = 0;
	let modelMeshCount = 0;
	let zoomBaselineDistance = 0;
	let controlsStartScale = 1;
	let mixer = null;
	const timer = new Timer();
	const viewStateEmitter = createFileViewerViewStateChangeEmitter();
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	const root = createElement("div", "model-viewer");
	const toolbar = createElement("div", "model-toolbar");
	const actions = createElement("div", "model-actions");
	const fitButton = createElement("button", void 0, t("model.toolbar.fit"));
	const rotateButton = createElement("button", void 0, t("model.toolbar.rotate"));
	const wireframeButton = createElement("button", void 0, t("model.toolbar.wireframe"));
	const gridButton = createElement("button", void 0, t("model.toolbar.grid"));
	const axesButton = createElement("button", void 0, t("model.toolbar.axes"));
	const meta = createElement("div", "model-meta");
	const typeText = createElement("strong", void 0, normalizedType.toUpperCase());
	const summaryText = createElement("span", void 0, objectSummary);
	const stage = createElement("div", "model-stage");
	const canvas = document.createElement("canvas");
	const state = createElement("div", "model-state", t("model.state.loading"));
	const buttons = [
		fitButton,
		rotateButton,
		wireframeButton,
		gridButton,
		axesButton
	];
	root.dataset.modelFormat = normalizedType;
	root.dataset.modelStatus = status;
	root.dataset.modelMeshCount = "0";
	buttons.forEach((button) => {
		button.type = "button";
	});
	actions.append(fitButton, rotateButton, wireframeButton, gridButton, axesButton);
	meta.append(typeText, summaryText);
	toolbar.append(actions, meta);
	stage.append(canvas, state);
	root.append(toolbar, stage);
	target.replaceChildren(createStyle(), root);
	const readText = () => {
		if (typeof TextDecoder === "function") return new TextDecoder("utf-8").decode(buffer);
		const bytes = new Uint8Array(buffer);
		let text = "";
		for (let index = 0; index < bytes.length; index += 1) text += String.fromCharCode(bytes[index]);
		return text;
	};
	const updateUi = () => {
		rotateButton.classList.toggle("active", autoRotate);
		wireframeButton.classList.toggle("active", wireframe);
		gridButton.classList.toggle("active", showGrid);
		axesButton.classList.toggle("active", showAxes);
		summaryText.textContent = objectSummary;
		root.dataset.modelStatus = status;
		root.dataset.modelMeshCount = String(modelMeshCount);
		state.hidden = status === "ready";
		state.classList.toggle("error", status === "error");
		if (status === "loading") state.textContent = t("model.state.loading");
		else if (status === "error") state.replaceChildren(createElement("strong", void 0, t("model.state.parseFailed")), createElement("span", void 0, errorMessage));
	};
	const updateHelperVisibility = () => {
		if (gridHelper) gridHelper.visible = showGrid;
		if (axesHelper) axesHelper.visible = showAxes;
		updateUi();
	};
	const vectorToArray = (vector) => {
		return vector ? [
			vector.x,
			vector.y,
			vector.z
		] : void 0;
	};
	const readVector = (value, fallback) => {
		if (!Array.isArray(value)) return fallback.clone();
		const [x, y, z] = value.map(Number);
		if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return fallback.clone();
		return new Vector3(x, y, z);
	};
	const getModelScale = () => {
		if (!camera || !controls || zoomBaselineDistance <= 0) return 1;
		const distance = camera.position.distanceTo(controls.target);
		return distance > 0 ? MathUtils.clamp(zoomBaselineDistance / distance, MODEL_MIN_ZOOM, MODEL_MAX_ZOOM) : 1;
	};
	const getModelZoomState = () => {
		const scale = getModelScale();
		const ready = status === "ready" && Boolean(modelRoot && camera && controls && zoomBaselineDistance > 0);
		return {
			scale,
			label: `${Math.round(scale * 100)}%`,
			canZoomIn: ready && scale < 19.999,
			canZoomOut: ready && scale > .101,
			canReset: ready && Math.abs(scale - 1) > .005,
			minScale: MODEL_MIN_ZOOM,
			maxScale: MODEL_MAX_ZOOM
		};
	};
	const setModelZoom = (requestedScale, source = "api", action = "zoom-change", notify = true) => {
		if (!camera || !controls || zoomBaselineDistance <= 0) return getModelZoomState();
		const scale = MathUtils.clamp(requestedScale, MODEL_MIN_ZOOM, MODEL_MAX_ZOOM);
		const direction = camera.position.clone().sub(controls.target);
		if (direction.lengthSq() < 1e-8) direction.set(1, .62, 1);
		direction.normalize();
		camera.position.copy(controls.target).addScaledVector(direction, zoomBaselineDistance / scale);
		camera.updateProjectionMatrix();
		controls.update();
		zoomEmitter.emit();
		if (notify) emitViewStateChange(action, source);
		return getModelZoomState();
	};
	const getModelViewState = () => {
		const zoom = getModelZoomState();
		return {
			renderer: "model",
			scale: zoom.scale,
			zoom,
			extra: {
				status,
				cameraPosition: vectorToArray(camera?.position),
				cameraTarget: vectorToArray(controls?.target),
				zoomBaselineDistance,
				autoRotate,
				wireframe,
				showGrid,
				showAxes
			}
		};
	};
	const emitViewStateChange = (action, source = "viewer") => {
		const state = getModelViewState();
		viewStateEmitter.emit(createFileViewerViewStateChange(state, {
			action,
			source
		}));
		return state;
	};
	const applyModelViewState = (state, applyOptions = {}) => {
		const source = applyOptions.source || "api";
		const action = applyOptions.action || "restore";
		const notify = applyOptions.notify !== false;
		const baseline = Number(state.extra?.zoomBaselineDistance);
		if (Number.isFinite(baseline) && baseline > 0) zoomBaselineDistance = baseline;
		const hasCameraSnapshot = Array.isArray(state.extra?.cameraPosition);
		if (camera) {
			camera.position.copy(readVector(state.extra?.cameraPosition, camera.position));
			camera.updateProjectionMatrix();
		}
		if (controls) {
			controls.target.copy(readVector(state.extra?.cameraTarget, controls.target));
			controls.update();
		}
		const requestedScale = Number(state.scale ?? state.zoom?.scale);
		if (!hasCameraSnapshot && Number.isFinite(requestedScale) && requestedScale > 0) setModelZoom(requestedScale, source, action, false);
		else zoomEmitter.emit();
		if (typeof state.extra?.autoRotate === "boolean") autoRotate = state.extra.autoRotate;
		if (typeof state.extra?.wireframe === "boolean") {
			wireframe = state.extra.wireframe;
			updateWireframe();
		}
		if (typeof state.extra?.showGrid === "boolean") showGrid = state.extra.showGrid;
		if (typeof state.extra?.showAxes === "boolean") showAxes = state.extra.showAxes;
		updateHelperVisibility();
		updateUi();
		if (notify) return emitViewStateChange(action, source);
		return getModelViewState();
	};
	const resize = () => {
		if (!renderer || !camera) return;
		syncModelViewport({
			renderer,
			camera,
			stage,
			canvas,
			devicePixelRatio: target.ownerDocument.defaultView?.devicePixelRatio || 1
		});
	};
	const findThemeHost = () => {
		let current = root;
		while (current) {
			if (current.hasAttribute("data-viewer-theme")) return current;
			const parentElement = current.parentElement;
			if (parentElement) {
				current = parentElement;
				continue;
			}
			const nodeRoot = current.getRootNode();
			current = "host" in nodeRoot ? nodeRoot.host : null;
		}
		return null;
	};
	const systemThemeQuery = target.ownerDocument.defaultView?.matchMedia?.("(prefers-color-scheme: dark)");
	const readDarkMode = () => {
		const themeValue = findThemeHost()?.dataset.viewerTheme || context?.options?.theme;
		return resolveFileViewerColorScheme(themeValue === "light" || themeValue === "dark" || themeValue === "system" ? themeValue : void 0, systemThemeQuery?.matches ?? false) === "dark";
	};
	const replaceGridHelper = (darkMode) => {
		if (!scene) return;
		const palette = darkMode ? MODEL_THEME_PALETTES.dark : MODEL_THEME_PALETTES.light;
		const previous = gridHelper;
		const next = new GridHelper(10, 10, palette.gridCenter, palette.gridLine);
		next.visible = showGrid;
		if (previous) {
			next.scale.copy(previous.scale);
			scene.remove(previous);
			disposeObject(previous);
		}
		gridHelper = next;
		scene.add(next);
	};
	const applyModelTheme = (force = false) => {
		const darkMode = readDarkMode();
		root.dataset.modelTheme = darkMode ? "dark" : "light";
		if (!force && activeDarkMode === darkMode) return;
		activeDarkMode = darkMode;
		const palette = darkMode ? MODEL_THEME_PALETTES.dark : MODEL_THEME_PALETTES.light;
		renderer?.setClearColor(palette.background, 1);
		if (scene) scene.background = new Color(palette.background);
		if (hemisphereLight) {
			hemisphereLight.color.setHex(palette.hemisphereSky);
			hemisphereLight.groundColor.setHex(palette.hemisphereGround);
		}
		canvas.style.colorScheme = darkMode ? "dark" : "light";
		replaceGridHelper(darkMode);
	};
	const observeModelTheme = () => {
		const themeHost = findThemeHost();
		const MutationObserverCtor = target.ownerDocument.defaultView?.MutationObserver;
		if (themeHost && MutationObserverCtor) {
			themeObserver = new MutationObserverCtor(() => applyModelTheme());
			themeObserver.observe(themeHost, {
				attributes: true,
				attributeFilter: ["data-viewer-theme"]
			});
		}
		if (!systemThemeQuery) return;
		const onSystemThemeChange = () => applyModelTheme();
		if (typeof systemThemeQuery.addEventListener === "function") {
			systemThemeQuery.addEventListener("change", onSystemThemeChange);
			stopSystemThemeListener = () => systemThemeQuery.removeEventListener("change", onSystemThemeChange);
		} else {
			systemThemeQuery.addListener(onSystemThemeChange);
			stopSystemThemeListener = () => systemThemeQuery.removeListener(onSystemThemeChange);
		}
	};
	const ensureScene = () => {
		const initializeTheme = !scene || !gridHelper;
		if (!renderer) {
			renderer = new WebGLRenderer({
				antialias: true,
				alpha: false,
				canvas,
				powerPreference: "high-performance"
			});
			renderer.outputColorSpace = SRGBColorSpace;
		}
		if (!scene) {
			scene = new Scene();
			hemisphereLight = new HemisphereLight(16777215, 14147304, 2.4);
			scene.add(hemisphereLight);
			const keyLight = new DirectionalLight(16777215, 2.2);
			keyLight.position.set(8, 10, 8);
			scene.add(keyLight);
			const fillLight = new DirectionalLight(16777215, .9);
			fillLight.position.set(-7, 5, -4);
			scene.add(fillLight);
			axesHelper = new AxesHelper(3);
			scene.add(axesHelper);
		}
		if (!camera) {
			camera = new PerspectiveCamera(45, 1, .01, 1e5);
			camera.position.set(5, 4, 6);
		}
		if (!controls && camera && renderer) {
			controls = new OrbitControls(camera, renderer.domElement);
			controls.enableDamping = true;
			controls.dampingFactor = .08;
			controls.screenSpacePanning = true;
			controls.autoRotateSpeed = 1.2;
		}
		applyModelTheme(initializeTheme);
		updateHelperVisibility();
		resize();
		if (!controls) throw new Error("Failed to initialize 3D controls.");
		return controls;
	};
	const clearModel = () => {
		if (modelRoot && scene) {
			mixer?.stopAllAction();
			mixer?.uncacheRoot(modelRoot);
			scene.remove(modelRoot);
			disposeObject(modelRoot);
		}
		modelRoot = null;
		modelMeshCount = 0;
		zoomBaselineDistance = 0;
		mixer = null;
		zoomEmitter.emit();
	};
	const createSurfaceMaterial = () => new MeshStandardMaterial({
		color: 5214138,
		metalness: .08,
		roughness: .78,
		side: 2,
		wireframe
	});
	const createPointMaterial = () => new PointsMaterial({
		color: 2062988,
		size: .035,
		sizeAttenuation: true
	});
	const applyDefaultMaterials = (object) => {
		object.traverse((child) => {
			const mesh = child;
			if (mesh.isMesh && !mesh.material) mesh.material = createSurfaceMaterial();
			if (mesh.isMesh && mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) => {
				if ("wireframe" in material) material.wireframe = wireframe;
				material.needsUpdate = true;
			});
		});
	};
	const countMeshes = (object) => {
		let meshes = 0;
		let points = 0;
		object.traverse((child) => {
			if (child.isMesh) meshes += 1;
			if (child.isPoints) points += 1;
		});
		return {
			meshes,
			points
		};
	};
	const summarizeModel = (object) => {
		const { meshes, points } = countMeshes(object);
		modelMeshCount = meshes;
		const parts = [];
		if (meshes) parts.push(t("model.summary.meshes", { count: meshes }));
		if (points) parts.push(t("model.summary.points", { count: points }));
		objectSummary = parts.length ? parts.join(" · ") : t("model.state.loaded");
		updateUi();
	};
	const normalizeObject = (object) => {
		const box = new Box3().setFromObject(object);
		if (box.isEmpty()) return {
			center: new Vector3(),
			size: new Vector3(4, 4, 4)
		};
		const center = box.getCenter(new Vector3());
		const size = box.getSize(new Vector3());
		object.position.sub(center);
		return {
			center: new Vector3(),
			size
		};
	};
	const fitToView = (source = "viewer", request) => {
		if (!modelRoot || !camera || !controls) return getModelZoomState();
		const box = new Box3().setFromObject(modelRoot);
		const center = box.getCenter(new Vector3());
		const sphere = box.getBoundingSphere(new Sphere());
		const radius = Math.max(sphere.radius, .5);
		const rect = stage.getBoundingClientRect();
		const width = Math.max(1, rect.width || canvas.clientWidth);
		const height = Math.max(1, rect.height || canvas.clientHeight);
		const aspect = Math.max(.01, width / height);
		const verticalFov = MathUtils.degToRad(camera.fov);
		const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
		const verticalDistance = radius / Math.max(Math.sin(verticalFov / 2), .01);
		const horizontalDistance = radius / Math.max(Math.sin(horizontalFov / 2), .01);
		const mode = request?.mode || "contain";
		let distance = mode === "cover" ? Math.min(verticalDistance, horizontalDistance) : mode === "width" ? horizontalDistance : mode === "height" ? verticalDistance : Math.max(verticalDistance, horizontalDistance);
		const padding = Math.max(0, request?.padding ?? 28);
		const paddingRatio = MathUtils.clamp(1 - padding * 2 / Math.min(width, height), .2, 1);
		distance = Math.max(distance / paddingRatio, .01);
		const direction = camera.position.clone().sub(controls.target);
		if (direction.lengthSq() < 1e-8) direction.set(1, .62, 1);
		direction.normalize();
		zoomBaselineDistance = distance;
		camera.near = Math.max(distance / 1e3, .01);
		camera.far = Math.max(distance * 1e3, 1e3);
		camera.position.copy(center).addScaledVector(direction, distance);
		camera.updateProjectionMatrix();
		controls.target.copy(center);
		controls.minDistance = distance / MODEL_MAX_ZOOM;
		controls.maxDistance = distance / MODEL_MIN_ZOOM;
		controls.update();
		zoomEmitter.emit();
		emitViewStateChange("fit", source);
		return getModelZoomState();
	};
	const applyModelFit = (request) => {
		if (!modelRoot || !camera || !controls) return {
			applied: false,
			mode: request.mode,
			resize: request.resize,
			source: request.source,
			reason: "not-ready",
			provider: "view-state"
		};
		const zoom = fitToView(request.source, request);
		const state = getModelViewState();
		return {
			applied: true,
			mode: request.mode,
			resize: request.resize,
			scale: zoom.scale,
			source: request.source,
			provider: "view-state",
			state
		};
	};
	const addModelToScene = async (object) => {
		if (!scene) return;
		clearModel();
		applyDefaultMaterials(object);
		const { size } = normalizeObject(object);
		modelRoot = object;
		scene.add(object);
		fitToView();
		summarizeModel(object);
		const maxSize = Math.max(size.x, size.y, size.z, 1);
		if (gridHelper) gridHelper.scale.setScalar(Math.max(maxSize / 10, 1));
	};
	const parseGlbOrGltf = async () => {
		const { GLTFLoader } = await import("./GLTFLoader-eugneLqP.js");
		const loader = new GLTFLoader();
		const resourcePath = getResourcePath(sourceUrl);
		const input = normalizedType === "gltf" ? readText() : buffer;
		return await new Promise((resolve, reject) => {
			loader.parse(input, resourcePath, (gltf) => {
				if (gltf.animations?.length) {
					mixer = new AnimationMixer(gltf.scene);
					gltf.animations.forEach((clip) => mixer?.clipAction(clip).play());
				}
				resolve(gltf.scene);
			}, reject);
		});
	};
	const parseObj = async () => {
		const { OBJLoader } = await import("./OBJLoader-B7IxU65x.js");
		return new OBJLoader().parse(readText());
	};
	const parseStl = async () => {
		const { STLLoader } = await import("./STLLoader-BxScYjuD.js");
		const geometry = new STLLoader().parse(buffer);
		geometry.computeVertexNormals();
		return new Mesh(geometry, createSurfaceMaterial());
	};
	const parsePly = async () => {
		const { PLYLoader } = await import("./PLYLoader-Bivtco08.js");
		const geometry = new PLYLoader().parse(buffer);
		geometry.computeVertexNormals();
		return new Mesh(geometry, createSurfaceMaterial());
	};
	const parseFbx = async () => {
		const { FBXLoader } = await import("./FBXLoader-CMfdsd-n.js");
		const object = new FBXLoader().parse(buffer, getResourcePath(sourceUrl));
		if (object.animations?.length) {
			mixer = new AnimationMixer(object);
			object.animations.forEach((clip) => mixer?.clipAction(clip).play());
		}
		return object;
	};
	const parseDae = async () => {
		const { ColladaLoader } = await import("./ColladaLoader-DwHVEoSh.js");
		const result = new ColladaLoader().parse(readText(), getResourcePath(sourceUrl));
		if (!result?.scene) throw new Error(t("model.error.daeEmpty"));
		return result.scene;
	};
	const parse3ds = async () => {
		const { TDSLoader } = await import("./TDSLoader-CAy7_1Wr.js");
		return new TDSLoader().parse(buffer, getResourcePath(sourceUrl));
	};
	const parse3mf = async () => {
		const { ThreeMFLoader } = await import("./3MFLoader-BqA3a9CG.js");
		return new ThreeMFLoader().parse(buffer);
	};
	const parseAmf = async () => {
		const { AMFLoader } = await import("./AMFLoader-BoSFT4kW.js");
		return new AMFLoader().parse(buffer);
	};
	const parseUsd = async () => {
		const { USDLoader } = await import("./USDLoader-nf6O2r_c.js");
		return new USDLoader().parse(buffer);
	};
	const parseKmz = async () => {
		const { KMZLoader } = await import("./KMZLoader-DytHMUO2.js");
		return new KMZLoader().parse(buffer).scene;
	};
	const parseOcct = async (modelType) => {
		const modelOptions = context?.options?.model;
		const documentBaseUrl = resolveFileViewerRuntimeAssetBaseUrl(target.ownerDocument);
		const assets = resolveFileViewerModelAssetUrls(modelOptions, documentBaseUrl);
		const params = Object.fromEntries([
			["linearUnit", modelOptions?.linearUnit],
			["linearDeflectionType", modelOptions?.linearDeflectionType],
			["linearDeflection", modelOptions?.linearDeflection],
			["angularDeflection", modelOptions?.angularDeflection]
		].filter(([, value]) => value !== void 0));
		const workerPreferred = modelOptions?.useWorker !== false && canUseWorkerUrlFromDocument(assets.workerUrl, target.ownerDocument);
		const importOptions = {
			...assets,
			useWorker: workerPreferred,
			timeoutMs: modelOptions?.workerTimeoutMs,
			params,
			signal: context?.signal
		};
		root.dataset.modelImport = workerPreferred ? "worker" : "main-thread";
		let result;
		try {
			result = await importOcctGeometryFile(buffer, modelType, importOptions);
		} catch (workerError) {
			if (!workerPreferred || context?.signal?.aborted || !isWorkerBootstrapFailure(workerError)) throw workerError;
			root.dataset.modelImport = "main-thread-fallback";
			try {
				result = await importOcctGeometryFile(buffer, modelType, {
					...importOptions,
					useWorker: false
				});
			} catch (fallbackError) {
				throw new Error(`${normalizeError(workerError)} Main-thread fallback failed: ${normalizeError(fallbackError)}`);
			}
		}
		return buildOcctThreeObject(result, wireframe).object;
	};
	const explainEngineeringModel = (modelType) => {
		const inspection = inspectGeometryKernelFile(buffer, modelType);
		const notice = formatGeometryKernelNotice(inspection.format || modelType, resolveFileViewerLocale(context?.options));
		throw new ModelPreviewNotice(`${inspection.signature ? t("model.notice.signature", { signature: inspection.signature }) : ""}${notice}${inspection.warnings.length ? ` ${inspection.warnings.join(" ")}` : ""}`);
	};
	const parsePcd = async () => {
		const { PCDLoader } = await import("./PCDLoader-BcQPG8Iz.js");
		return new PCDLoader().parse(buffer, sourceUrl || "model.pcd");
	};
	const parseVrml = async () => {
		const { VRMLLoader } = await import("./VRMLLoader-DGLVkRHX.js");
		return new VRMLLoader().parse(readText(), getResourcePath(sourceUrl));
	};
	const parseXyz = async () => {
		const { XYZLoader } = await import("./XYZLoader-DynMLSDd.js");
		const geometry = new XYZLoader().parse(readText());
		geometry.computeBoundingSphere();
		return new Points(geometry, createPointMaterial());
	};
	const parseVtk = async () => {
		const { VTKLoader } = await import("./VTKLoader-8Tre7j_g.js");
		const geometry = new VTKLoader().parse(buffer);
		geometry.computeVertexNormals();
		return new Mesh(geometry, createSurfaceMaterial());
	};
	const parseModel = (modelType) => {
		switch (modelType) {
			case "glb":
			case "gltf": return parseGlbOrGltf();
			case "obj": return parseObj();
			case "stl": return parseStl();
			case "ply": return parsePly();
			case "fbx": return parseFbx();
			case "dae": return parseDae();
			case "3ds": return parse3ds();
			case "3mf": return parse3mf();
			case "amf": return parseAmf();
			case "usd":
			case "usda":
			case "usdc":
			case "usdz": return parseUsd();
			case "kmz": return parseKmz();
			case "step":
			case "stp":
			case "iges":
			case "igs":
			case "brep": return parseOcct(modelType);
			case "ifc":
			case "3dm": return explainEngineeringModel(modelType);
			case "pcd": return parsePcd();
			case "wrl":
			case "vrml": return parseVrml();
			case "xyz": return parseXyz();
			case "vtk":
			case "vtp": return parseVtk();
			default:
				if (isGeometryKernelFormat(modelType)) return explainEngineeringModel(modelType);
				throw new Error(t("model.error.unsupported", { type: modelType }));
		}
	};
	const loadModel = async () => {
		const version = ++activeVersion;
		status = "loading";
		errorMessage = "";
		modelMeshCount = 0;
		objectSummary = t("model.state.loadingSummary");
		updateUi();
		ensureScene();
		try {
			const object = await parseModel(normalizedType);
			if (version !== activeVersion) {
				disposeObject(object);
				return;
			}
			await addModelToScene(object);
			status = "ready";
			updateUi();
			zoomEmitter.emit();
			emitViewStateChange("init", "viewer");
		} catch (reason) {
			if (version !== activeVersion) return;
			if (context?.signal?.aborted) return;
			if (!(reason instanceof ModelPreviewNotice)) console.error(reason);
			status = "error";
			modelMeshCount = 0;
			errorMessage = normalizeError(reason) || t("model.error.parseFailed", { type: normalizedType.toUpperCase() });
			updateUi();
			zoomEmitter.emit();
			throw reason instanceof Error ? reason : new Error(errorMessage);
		}
	};
	const renderFrame = (timestamp) => {
		if (!renderer || !scene || !camera || !controls) return;
		resize();
		timer.update(timestamp);
		const delta = timer.getDelta();
		controls.autoRotate = autoRotate;
		controls.update(delta);
		mixer?.update(delta);
		renderer.render(scene, camera);
		animationFrame = window.requestAnimationFrame(renderFrame);
	};
	const updateWireframe = () => {
		if (modelRoot) applyDefaultMaterials(modelRoot);
		updateUi();
	};
	const onControlsStart = () => {
		controlsStartScale = getModelScale();
	};
	const onControlsEnd = () => {
		const scale = getModelScale();
		if (Math.abs(scale - controlsStartScale) > .002) {
			zoomEmitter.emit();
			emitViewStateChange("zoom-change", "user");
			return;
		}
		emitViewStateChange("camera-change", "user");
	};
	fitButton.addEventListener("click", () => fitToView("user"));
	rotateButton.addEventListener("click", () => {
		autoRotate = !autoRotate;
		updateUi();
		emitViewStateChange("view-option-change", "user");
	});
	wireframeButton.addEventListener("click", () => {
		wireframe = !wireframe;
		updateWireframe();
		emitViewStateChange("view-option-change", "user");
	});
	gridButton.addEventListener("click", () => {
		showGrid = !showGrid;
		updateHelperVisibility();
		emitViewStateChange("view-option-change", "user");
	});
	axesButton.addEventListener("click", () => {
		showAxes = !showAxes;
		updateHelperVisibility();
		emitViewStateChange("view-option-change", "user");
	});
	const cleanup = () => {
		if (disposed) return;
		disposed = true;
		activeVersion += 1;
		window.cancelAnimationFrame(animationFrame);
		resizeObserver?.disconnect();
		resizeObserver = null;
		themeObserver?.disconnect();
		themeObserver = null;
		stopSystemThemeListener?.();
		stopSystemThemeListener = null;
		clearModel();
		controlsWithEvents?.removeEventListener("start", onControlsStart);
		controlsWithEvents?.removeEventListener("end", onControlsEnd);
		controlsWithEvents = null;
		unregisterFileViewerZoomProvider(root);
		unregisterFileViewerViewStateProvider(root);
		controls?.dispose();
		controls = null;
		if (scene) disposeObject(scene);
		renderer?.dispose();
		renderer?.renderLists.dispose();
		renderer = null;
		timer.dispose();
		scene = null;
		camera = null;
		gridHelper = null;
		axesHelper = null;
		hemisphereLight = null;
		target.replaceChildren();
	};
	try {
		updateUi();
		controlsWithEvents = ensureScene();
		observeModelTheme();
		controlsWithEvents.addEventListener("start", onControlsStart);
		controlsWithEvents.addEventListener("end", onControlsEnd);
		registerFileViewerZoomProvider(root, {
			zoomIn: () => setModelZoom(getModelScale() * MODEL_ZOOM_STEP, "user", "zoom-in"),
			zoomOut: () => setModelZoom(getModelScale() / MODEL_ZOOM_STEP, "user", "zoom-out"),
			resetZoom: () => setModelZoom(1, "user", "zoom-reset"),
			setZoom: (scale) => setModelZoom(scale, "api", "zoom-change"),
			fit: applyModelFit,
			getState: getModelZoomState,
			subscribe: zoomEmitter.subscribe
		});
		registerFileViewerViewStateProvider(root, {
			getState: getModelViewState,
			applyState: applyModelViewState,
			fit: applyModelFit,
			subscribe: viewStateEmitter.subscribe
		});
		resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(stage);
		timer.connect(target.ownerDocument);
		renderFrame();
		await loadModel();
	} catch (error) {
		cleanup();
		throw error;
	}
	return {
		$el: root,
		unmount() {
			cleanup();
		}
	};
}
//#endregion
export { renderModel as default };
