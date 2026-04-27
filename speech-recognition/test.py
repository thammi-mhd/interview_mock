import torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import librosa

MODEL_DIR   = "./whisper-finetuned"
TEST_AUDIO  = "dataset/audio/sample_0000.wav"
SAMPLE_RATE = 16000

processor = WhisperProcessor.from_pretrained(MODEL_DIR)
model     = WhisperForConditionalGeneration.from_pretrained(MODEL_DIR)
model.eval()

audio, _ = librosa.load(TEST_AUDIO, sr=SAMPLE_RATE, mono=True)
inputs   = processor(audio, sampling_rate=SAMPLE_RATE, return_tensors="pt")

with torch.no_grad():
    predicted_ids = model.generate(inputs.input_features)

transcript = processor.batch_decode(predicted_ids, skip_special_tokens=True)
print(f"📝 Transcript: {transcript[0]}")