"""
Whisper-based Speech-to-Text Service
Uses a fine-tuned Whisper model for accurate audio transcription
"""
import io
import os
import torch
import librosa
import numpy as np
from pathlib import Path
from transformers import WhisperProcessor, WhisperForConditionalGeneration

# Model configuration
MODEL_DIR = os.getenv("WHISPER_MODEL_PATH", "./speech-recognition/whisper-finetuned")
SAMPLE_RATE = 16000
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Global model cache to avoid reloading
_processor = None
_model = None
_model_loaded = False


def load_whisper_model():
    """Load the fine-tuned Whisper model into memory."""
    global _processor, _model, _model_loaded
    
    if _model_loaded:
        return _processor, _model
    
    try:
        print(f"Loading Whisper model from {MODEL_DIR} on {DEVICE}...")
        
        # Check if model directory exists
        if not os.path.exists(MODEL_DIR):
            raise FileNotFoundError(f"Model directory not found: {MODEL_DIR}")
        
        # Load processor and model
        _processor = WhisperProcessor.from_pretrained(MODEL_DIR)
        _model = WhisperForConditionalGeneration.from_pretrained(MODEL_DIR)
        _model.to(DEVICE)
        _model.eval()
        
        _model_loaded = True
        print(f"Whisper model loaded successfully on {DEVICE}")
        return _processor, _model
    except Exception as e:
        print(f"Error loading Whisper model: {e}")
        raise


def transcribe_audio_file(audio_bytes: bytes, audio_format: str = "wav") -> tuple:
    """
    Transcribe audio using fine-tuned Whisper model.
    
    Args:
        audio_bytes: Raw audio data
        audio_format: Audio format (wav, mp3, etc.)
    
    Returns:
        Tuple of (result_dict, status_code)
    """
    try:
        # Load model
        processor, model = load_whisper_model()
        
        # Convert bytes to audio array
        print(f"Processing {len(audio_bytes)} bytes of audio...")
        audio_file = io.BytesIO(audio_bytes)
        
        # Load audio with librosa
        audio, sr = librosa.load(audio_file, sr=SAMPLE_RATE, mono=True)
        
        if len(audio) == 0:
            return {"error": "Audio file is empty", "success": False}, 400
        
        print(f"Audio loaded: {len(audio)} samples at {SAMPLE_RATE}Hz")
        
        # Prepare inputs
        inputs = processor(audio, sampling_rate=SAMPLE_RATE, return_tensors="pt")
        inputs = {k: v.to(DEVICE) for k, v in inputs.items()}
        
        # Generate transcription
        print("Generating transcription...")
        with torch.no_grad():
            predicted_ids = model.generate(inputs["input_features"])
        
        # Decode transcription
        transcript = processor.batch_decode(predicted_ids, skip_special_tokens=True)
        transcribed_text = transcript[0].strip()
        
        if not transcribed_text:
            return {
                "error": "Could not transcribe audio. Please speak clearly.",
                "success": False
            }, 400
        
        print(f"Transcription: {transcribed_text}")
        return {
            "text": transcribed_text,
            "success": True,
            "model": "whisper-finetuned"
        }, 200
        
    except FileNotFoundError as e:
        print(f"Model file error: {e}")
        return {
            "error": f"Transcription model not found. Please train or download the model first.",
            "success": False
        }, 500
    except RuntimeError as e:
        print(f"Runtime error (possibly CUDA): {e}")
        return {
            "error": f"Transcription service error: {str(e)}",
            "success": False
        }, 500
    except Exception as e:
        print(f"Unexpected error in transcription: {e}")
        return {
            "error": f"Failed to transcribe audio: {str(e)}",
            "success": False
        }, 500


def transcribe_audio_from_file_path(audio_path: str) -> tuple:
    """
    Transcribe audio from a file path.
    
    Args:
        audio_path: Path to audio file
    
    Returns:
        Tuple of (result_dict, status_code)
    """
    try:
        if not os.path.exists(audio_path):
            return {"error": f"Audio file not found: {audio_path}", "success": False}, 404
        
        with open(audio_path, "rb") as f:
            audio_bytes = f.read()
        
        return transcribe_audio_file(audio_bytes)
    except Exception as e:
        print(f"Error reading audio file: {e}")
        return {"error": f"Failed to read audio file: {str(e)}", "success": False}, 500


def get_model_info() -> dict:
    """Get information about the loaded model."""
    try:
        processor, model = load_whisper_model()
        return {
            "model_loaded": _model_loaded,
            "device": DEVICE,
            "sample_rate": SAMPLE_RATE,
            "model_type": "Whisper-Finetuned",
            "parameters": sum(p.numel() for p in model.parameters())
        }
    except Exception as e:
        return {
            "model_loaded": False,
            "error": str(e)
        }
