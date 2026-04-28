export type FaceCheckCode =
  | "ok"
  | "no_face"
  | "multiple_faces"
  | "unreadable"
  | "too_large";

export type FaceCheckResult = {
  ok: boolean;
  code: FaceCheckCode;
  reason?: string;
  tip?: string;
};

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function imageHasFace(file: File): Promise<FaceCheckResult> {
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      code: "too_large",
      reason: "This photo is larger than 8 MB.",
      tip: "Resize or compress the image, then try again.",
    };
  }

  // @ts-ignore experimental
  if (typeof window === "undefined" || !("FaceDetector" in window)) {
    return { ok: true, code: "ok" };
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return {
      ok: false,
      code: "unreadable",
      reason: "We couldn't read this image file.",
      tip: "Use a JPG or PNG photo and try again.",
    };
  }
  try {
    // @ts-ignore
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
    const faces = await detector.detect(bitmap);
    if (!faces || faces.length === 0) {
      return {
        ok: false,
        code: "no_face",
        reason: "We couldn't detect a face in this photo.",
        tip: "Use a clear, well-lit photo of yourself looking at the camera. Avoid sunglasses or heavy filters.",
      };
    }
    if (faces.length > 1) {
      return {
        ok: false,
        code: "multiple_faces",
        reason: "We detected more than one person in this photo.",
        tip: "Use a solo photo so matches can clearly see you.",
      };
    }
    return { ok: true, code: "ok" };
  } catch {
    return { ok: true, code: "ok" };
  }
}