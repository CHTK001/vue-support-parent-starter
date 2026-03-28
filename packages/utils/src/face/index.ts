type FaceApiModule = typeof import("face-api.js");
type TensorflowModule = typeof import("@tensorflow/tfjs");

export type FaceApiBackend = "cpu" | "webgl";
export type FaceApiDetector = "tiny" | "ssd";
export type FaceApiDescriptorLike = Float32Array | number[];
export type FaceApiInput =
  | Blob
  | File
  | HTMLCanvasElement
  | HTMLImageElement
  | HTMLVideoElement
  | ImageData
  | OffscreenCanvas
  | string;
export type FaceApiModelName =
  | "ageGenderNet"
  | "faceExpressionNet"
  | "faceLandmark68Net"
  | "faceLandmark68TinyNet"
  | "faceRecognitionNet"
  | "ssdMobilenetv1"
  | "tinyFaceDetector";

export interface FaceApiServiceOptions {
  autoLoadModels?: boolean;
  backend?: FaceApiBackend;
  defaultDetector?: FaceApiDetector;
  defaultMinConfidence?: number;
  defaultTinyInputSize?: 160 | 224 | 320 | 416 | 512 | 608;
  modelPath?: string;
}

export interface FaceApiModelLoadOptions {
  backend?: FaceApiBackend;
  modelPath?: string;
  models?: FaceApiModelName[];
}

export interface FaceApiDetectionOptions {
  backend?: FaceApiBackend;
  detector?: FaceApiDetector;
  inputSize?: 160 | 224 | 320 | 416 | 512 | 608;
  maxResults?: number;
  minConfidence?: number;
  modelPath?: string;
  useTinyLandmarkNet?: boolean;
  withAgeAndGender?: boolean;
  withDescriptor?: boolean;
  withExpressions?: boolean;
  withLandmarks?: boolean;
}

export interface FaceApiDescriptorMatchResult {
  distance: number;
  matched: boolean;
  threshold: number;
}

export interface FaceApiLabeledDescriptorInput {
  descriptors: FaceApiDescriptorLike[];
  label: string;
}

export interface FaceApiService {
  compareDescriptors: (
    left: FaceApiDescriptorLike,
    right: FaceApiDescriptorLike,
    threshold?: number,
  ) => FaceApiDescriptorMatchResult;
  compareInputs: (
    left: FaceApiInput,
    right: FaceApiInput,
    options?: FaceApiDetectionOptions & { threshold?: number },
  ) => Promise<FaceApiDescriptorMatchResult | null>;
  createMatcher: (
    labeledDescriptors: FaceApiLabeledDescriptorInput[],
    threshold?: number,
  ) => Promise<InstanceType<FaceApiModule["FaceMatcher"]>>;
  detectAllFaces: (
    input: FaceApiInput,
    options?: FaceApiDetectionOptions,
  ) => Promise<unknown[]>;
  detectSingleFace: (
    input: FaceApiInput,
    options?: FaceApiDetectionOptions,
  ) => Promise<unknown | null>;
  ensureBackend: (backend?: FaceApiBackend) => Promise<FaceApiBackend>;
  extractDescriptor: (
    input: FaceApiInput,
    options?: FaceApiDetectionOptions,
  ) => Promise<Float32Array | null>;
  loadModels: (options?: FaceApiModelLoadOptions) => Promise<FaceApiModelName[]>;
}

interface FaceApiRuntime {
  faceapi: FaceApiModule;
  tf: TensorflowModule;
}

const DEFAULT_FACE_API_MODELS: FaceApiModelName[] = [
  "tinyFaceDetector",
  "faceLandmark68Net",
  "faceRecognitionNet",
];
const DEFAULT_MATCH_THRESHOLD = 0.6;

let runtimePromise: Promise<FaceApiRuntime> | null = null;
const loadedModelCache = new Set<string>();

const normalizeDescriptor = (
  descriptor: FaceApiDescriptorLike,
): Float32Array =>
  descriptor instanceof Float32Array
    ? descriptor
    : new Float32Array(descriptor);

const loadImageElement = (src: string): Promise<HTMLImageElement> => {
  if (typeof Image === "undefined") {
    throw new Error(
      "[face-api] 当前运行环境不支持 Image 构造函数，无法解析图片资源。",
    );
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error(`[face-api] 图片资源加载失败: ${src}`));
    image.src = src;
  });
};

const resolveFaceApiInput = async (input: FaceApiInput): Promise<any> => {
  if (typeof input === "string") {
    return loadImageElement(input);
  }

  if (typeof Blob !== "undefined" && input instanceof Blob) {
    if (
      typeof URL === "undefined" ||
      typeof URL.createObjectURL !== "function"
    ) {
      throw new Error("[face-api] 当前环境不支持 Blob 图片解析。");
    }
    const objectUrl = URL.createObjectURL(input);
    try {
      return await loadImageElement(objectUrl);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  return input;
};

const normalizeFaceApiModels = (
  models?: FaceApiModelName[],
): FaceApiModelName[] =>
  [...new Set(models?.length ? models : DEFAULT_FACE_API_MODELS)];

const calculateFaceDescriptorDistance = (
  left: FaceApiDescriptorLike,
  right: FaceApiDescriptorLike,
): number => {
  const normalizedLeft = normalizeDescriptor(left);
  const normalizedRight = normalizeDescriptor(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    throw new Error("[face-api] Descriptor length mismatch.");
  }

  let squaredDistance = 0;
  for (let index = 0; index < normalizedLeft.length; index += 1) {
    const delta = normalizedLeft[index] - normalizedRight[index];
    squaredDistance += delta * delta;
  }

  return Math.sqrt(squaredDistance);
};

const isFaceDescriptorMatch = (
  left: FaceApiDescriptorLike,
  right: FaceApiDescriptorLike,
  threshold = DEFAULT_MATCH_THRESHOLD,
): FaceApiDescriptorMatchResult => {
  const distance = calculateFaceDescriptorDistance(left, right);
  return {
    distance,
    matched: distance <= threshold,
    threshold,
  };
};

const resolveRequiredModels = (
  options: FaceApiDetectionOptions,
  defaultDetector: FaceApiDetector,
): FaceApiModelName[] => {
  const detector = options.detector ?? defaultDetector;
  const models: FaceApiModelName[] = [
    detector === "ssd" ? "ssdMobilenetv1" : "tinyFaceDetector",
  ];

  if (options.withLandmarks || options.withDescriptor) {
    models.push(
      options.useTinyLandmarkNet
        ? "faceLandmark68TinyNet"
        : "faceLandmark68Net",
    );
  }

  if (options.withDescriptor) {
    models.push("faceRecognitionNet");
  }

  if (options.withExpressions) {
    models.push("faceExpressionNet");
  }

  if (options.withAgeAndGender) {
    models.push("ageGenderNet");
  }

  return normalizeFaceApiModels(models);
};

const getFaceApiRuntime = async (): Promise<FaceApiRuntime> => {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      const [tf, faceapi] = await Promise.all([
        import("@tensorflow/tfjs"),
        import("face-api.js"),
      ]);
      return { faceapi, tf };
    })();
  }

  return runtimePromise;
};

const ensureFaceApiBackend = async (
  backend: FaceApiBackend = "webgl",
): Promise<FaceApiBackend> => {
  const { tf } = await getFaceApiRuntime();
  const requestedBackend = backend === "cpu" ? "cpu" : "webgl";
  const fallbackBackend = requestedBackend === "webgl" ? "cpu" : "webgl";

  try {
    if (tf.getBackend() !== requestedBackend) {
      await tf.setBackend(requestedBackend);
    }
    await tf.ready();
    return requestedBackend as FaceApiBackend;
  } catch (error) {
    if (requestedBackend === fallbackBackend) {
      throw error;
    }
    if (tf.getBackend() !== fallbackBackend) {
      await tf.setBackend(fallbackBackend);
    }
    await tf.ready();
    return fallbackBackend as FaceApiBackend;
  }
};

const getModelLoaders = (faceapi: FaceApiModule) =>
  ({
    ageGenderNet: () => faceapi.nets.ageGenderNet.loadFromUri,
    faceExpressionNet: () => faceapi.nets.faceExpressionNet.loadFromUri,
    faceLandmark68Net: () => faceapi.nets.faceLandmark68Net.loadFromUri,
    faceLandmark68TinyNet: () => faceapi.nets.faceLandmark68TinyNet.loadFromUri,
    faceRecognitionNet: () => faceapi.nets.faceRecognitionNet.loadFromUri,
    ssdMobilenetv1: () => faceapi.nets.ssdMobilenetv1.loadFromUri,
    tinyFaceDetector: () => faceapi.nets.tinyFaceDetector.loadFromUri,
  }) satisfies Record<FaceApiModelName, () => (uri: string) => Promise<unknown>>;

const loadFaceApiModels = async (
  options: FaceApiModelLoadOptions = {},
): Promise<FaceApiModelName[]> => {
  const modelPath = options.modelPath;
  if (!modelPath) {
    throw new Error("[face-api] 未提供模型目录 modelPath。");
  }

  const backend = await ensureFaceApiBackend(options.backend);
  const models = normalizeFaceApiModels(options.models);
  const { faceapi } = await getFaceApiRuntime();
  const modelLoaders = getModelLoaders(faceapi);

  await Promise.all(
    models.map(async (modelName) => {
      const cacheKey = `${modelPath}::${modelName}`;
      if (loadedModelCache.has(cacheKey)) {
        return;
      }

      const loadModel = modelLoaders[modelName]();
      await loadModel(modelPath);
      loadedModelCache.add(cacheKey);
    }),
  );

  return backend ? models : models;
};

const createDetectorOptions = (
  faceapi: FaceApiModule,
  options: FaceApiDetectionOptions,
  defaultDetector: FaceApiDetector,
) => {
  const detector = options.detector ?? defaultDetector;
  if (detector === "ssd") {
    return new faceapi.SsdMobilenetv1Options({
      maxResults: options.maxResults ?? 100,
      minConfidence: options.minConfidence ?? 0.5,
    });
  }

  return new faceapi.TinyFaceDetectorOptions({
    inputSize: options.inputSize ?? 320,
    scoreThreshold: options.minConfidence ?? 0.5,
  });
};

const runFaceDetection = async (
  faceapi: FaceApiModule,
  input: any,
  options: FaceApiDetectionOptions,
  defaultDetector: FaceApiDetector,
  detectAll = false,
) => {
  const detectorOptions = createDetectorOptions(
    faceapi,
    options,
    defaultDetector,
  );
  let task: any = detectAll
    ? faceapi.detectAllFaces(input, detectorOptions)
    : faceapi.detectSingleFace(input, detectorOptions);

  if (options.withLandmarks || options.withDescriptor) {
    task = task.withFaceLandmarks(Boolean(options.useTinyLandmarkNet));
  }
  if (options.withDescriptor) {
    task = task.withFaceDescriptors();
  }
  if (options.withExpressions) {
    task = task.withFaceExpressions();
  }
  if (options.withAgeAndGender) {
    task = task.withAgeAndGender();
  }

  return task;
};

const maybeAutoLoadModels = async (
  serviceOptions: Required<FaceApiServiceOptions>,
  detectionOptions: FaceApiDetectionOptions,
) => {
  const modelPath = detectionOptions.modelPath ?? serviceOptions.modelPath;
  if (!modelPath) {
    return;
  }

  if (!serviceOptions.autoLoadModels && !detectionOptions.modelPath) {
    return;
  }

  await loadFaceApiModels({
    backend: detectionOptions.backend ?? serviceOptions.backend,
    modelPath,
    models: resolveRequiredModels(
      detectionOptions,
      serviceOptions.defaultDetector,
    ),
  });
};

export const createFaceApiService = (
  serviceOptions: FaceApiServiceOptions = {},
): FaceApiService => {
  const resolvedOptions: Required<FaceApiServiceOptions> = {
    autoLoadModels: serviceOptions.autoLoadModels ?? true,
    backend: serviceOptions.backend ?? "webgl",
    defaultDetector: serviceOptions.defaultDetector ?? "tiny",
    defaultMinConfidence: serviceOptions.defaultMinConfidence ?? 0.5,
    defaultTinyInputSize: serviceOptions.defaultTinyInputSize ?? 320,
    modelPath: serviceOptions.modelPath ?? "",
  };

  const service: FaceApiService = {
    compareDescriptors: (
      left,
      right,
      threshold = DEFAULT_MATCH_THRESHOLD,
    ) => isFaceDescriptorMatch(left, right, threshold),

    compareInputs: async (
      left,
      right,
      options = {},
    ): Promise<FaceApiDescriptorMatchResult | null> => {
      const leftDescriptor = await service.extractDescriptor(left, {
        ...options,
        withDescriptor: true,
      });
      if (!leftDescriptor) {
        return null;
      }

      const rightDescriptor = await service.extractDescriptor(right, {
        ...options,
        withDescriptor: true,
      });
      if (!rightDescriptor) {
        return null;
      }

      return isFaceDescriptorMatch(
        leftDescriptor,
        rightDescriptor,
        options.threshold ?? DEFAULT_MATCH_THRESHOLD,
      );
    },

    createMatcher: async (
      labeledDescriptors,
      threshold = DEFAULT_MATCH_THRESHOLD,
    ) => {
      const { faceapi } = await getFaceApiRuntime();
      return new faceapi.FaceMatcher(
        labeledDescriptors.map(
          (item) =>
            new faceapi.LabeledFaceDescriptors(
              item.label,
              item.descriptors.map((descriptor) => normalizeDescriptor(descriptor)),
            ),
        ),
        threshold,
      );
    },

    detectAllFaces: async (input, options = {}) => {
      const mergedOptions: FaceApiDetectionOptions = {
        ...options,
        inputSize: options.inputSize ?? resolvedOptions.defaultTinyInputSize,
        minConfidence:
          options.minConfidence ?? resolvedOptions.defaultMinConfidence,
      };
      await maybeAutoLoadModels(resolvedOptions, mergedOptions);
      await ensureFaceApiBackend(mergedOptions.backend ?? resolvedOptions.backend);
      const { faceapi } = await getFaceApiRuntime();
      const resolvedInput = await resolveFaceApiInput(input);
      return (await runFaceDetection(
        faceapi,
        resolvedInput,
        mergedOptions,
        resolvedOptions.defaultDetector,
        true,
      )) as unknown[];
    },

    detectSingleFace: async (input, options = {}) => {
      const mergedOptions: FaceApiDetectionOptions = {
        ...options,
        inputSize: options.inputSize ?? resolvedOptions.defaultTinyInputSize,
        minConfidence:
          options.minConfidence ?? resolvedOptions.defaultMinConfidence,
      };
      await maybeAutoLoadModels(resolvedOptions, mergedOptions);
      await ensureFaceApiBackend(mergedOptions.backend ?? resolvedOptions.backend);
      const { faceapi } = await getFaceApiRuntime();
      const resolvedInput = await resolveFaceApiInput(input);
      return (await runFaceDetection(
        faceapi,
        resolvedInput,
        mergedOptions,
        resolvedOptions.defaultDetector,
      )) as unknown | null;
    },

    ensureBackend: (backend) =>
      ensureFaceApiBackend(backend ?? resolvedOptions.backend),

    extractDescriptor: async (input, options = {}) => {
      const result: any = await service.detectSingleFace(input, {
        ...options,
        withDescriptor: true,
      });
      if (!result?.descriptor) {
        return null;
      }

      return normalizeDescriptor(result.descriptor);
    },

    loadModels: async (options = {}) =>
      loadFaceApiModels({
        backend: options.backend ?? resolvedOptions.backend,
        modelPath: options.modelPath ?? resolvedOptions.modelPath,
        models: options.models,
      }),
  };

  return service;
};

export {
  DEFAULT_FACE_API_MODELS,
  calculateFaceDescriptorDistance,
  ensureFaceApiBackend,
  isFaceDescriptorMatch,
  loadFaceApiModels,
  normalizeFaceApiModels,
};
