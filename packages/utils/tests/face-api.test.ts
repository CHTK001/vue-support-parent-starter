import {
  calculateFaceDescriptorDistance,
  isFaceDescriptorMatch,
  normalizeFaceApiModels,
} from "../src/face";

describe("face api helpers", () => {
  it("computes euclidean descriptor distance", () => {
    expect(calculateFaceDescriptorDistance([0, 0], [3, 4])).toBe(5);
  });

  it("evaluates descriptor match with threshold", () => {
    expect(isFaceDescriptorMatch([0, 0], [0.1, 0.1], 0.2)).toEqual({
      distance: expect.closeTo(0.1414213562, 6),
      matched: true,
      threshold: 0.2,
    });
  });

  it("normalizes requested model list without duplicates", () => {
    expect(
      normalizeFaceApiModels([
        "tinyFaceDetector",
        "faceRecognitionNet",
        "tinyFaceDetector",
      ]),
    ).toEqual(["tinyFaceDetector", "faceRecognitionNet"]);
  });
});
