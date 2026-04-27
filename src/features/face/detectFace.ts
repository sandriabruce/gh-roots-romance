export async function imageHasFace(file: File): Promise<{ ok: boolean; reason?: string }> {
  // @ts-ignore experimental
  if (typeof window === "undefined" || !("FaceDetector" in window)) {
    return { ok: true };
  }
  try {
    const bitmap = await createImageBitmap(file);
    // @ts-ignore
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
    const faces = await detector.detect(bitmap);
    if (!faces || faces.length === 0) {
      return { ok: false, reason: "We couldn't detect a face in this photo. Please use a clear photo of yourself." };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}