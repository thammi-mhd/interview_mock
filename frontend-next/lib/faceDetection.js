import * as faceapi from 'face-api.js';

export const DETECTION_INTERVAL_MS = 1500;

export async function loadModels() {
  const MODEL_URL = '/models';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
  ]);
}

export async function detectFace(videoElement) {
  if (!videoElement || videoElement.readyState < 2) {
    return { faceDetected: false, multipleFaces: false, lookingAway: false, lookingDown: false, confidence: 0 };
  }
  try {
    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    if (!detections || detections.length === 0) {
      return { faceDetected: false, multipleFaces: false, lookingAway: false, lookingDown: false, confidence: 0 };
    }
    if (detections.length > 1) {
      return { faceDetected: true, multipleFaces: true, lookingAway: false, lookingDown: false, confidence: 1 };
    }

    const landmarks = detections[0].landmarks;
    const positions = landmarks.positions;
    const noseTip = positions[30];
    const chin = positions[8];
    const leftEye = positions[36];
    const rightEye = positions[45];
    const leftCheek = positions[0];
    const rightCheek = positions[16];

    const faceWidth = rightCheek.x - leftCheek.x;
    const faceCenterX = (leftCheek.x + rightCheek.x) / 2;
    const eyeMidY = (leftEye.y + rightEye.y) / 2;
    const noseOffset = Math.abs(noseTip.x - faceCenterX);
    const lookingAway = noseOffset > faceWidth * 0.25;
    const noseToChinDist = chin.y - noseTip.y;
    const noseToEyeDist = noseTip.y - eyeMidY;
    const lookingDown = noseToEyeDist < noseToChinDist * 0.2;

    return {
      faceDetected: true,
      multipleFaces: false,
      lookingAway,
      lookingDown,
      confidence: detections[0].detection.score,
    };
  } catch (err) {
    console.error('[faceDetection]', err);
    return { faceDetected: false, multipleFaces: false, lookingAway: false, lookingDown: false, confidence: 0 };
  }
}
