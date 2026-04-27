import io
import os
import speech_recognition as sr
from google import genai
from app.config import GEMINI_API_KEY
from app.services.whisper_service import transcribe_audio_file
import json

client = genai.Client(api_key=GEMINI_API_KEY)
GEMINI_MODEL = "gemini-2.0-flash"

# Flag to use Whisper model (set to False to fall back to Google Speech Recognition)
USE_WHISPER_MODEL = os.getenv("USE_WHISPER_MODEL", "true").lower() == "true"


async def extract_text_from_audio(audio_bytes: bytes, audio_format: str = "wav") -> tuple:
    """
    Convert audio (wav/mp3) to text using fine-tuned Whisper model or Google Speech Recognition.
    Falls back to Google if Whisper model is unavailable.
    """
    
    # Try Whisper model first if enabled
    if USE_WHISPER_MODEL:
        try:
            return transcribe_audio_file(audio_bytes, audio_format)
        except Exception as e:
            print(f"Whisper model failed, falling back to Google Speech Recognition: {e}")
    
    # Fallback to Google Speech Recognition
    try:
        recognizer = sr.Recognizer()
        audio_file = io.BytesIO(audio_bytes)
        
        try:
            with sr.AudioFile(audio_file) as source:
                audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
            return {"text": text, "success": True, "model": "google-speech-recognition"}, 200
        except sr.UnknownValueValue:
            return {"error": "Could not understand audio. Please speak clearly.", "success": False}, 400
        except sr.RequestError as e:
            return {"error": f"Speech recognition service error: {str(e)}", "success": False}, 500
    except Exception as e:
        print(f"[audio_service] Error extracting text: {e}")
        return {"error": "Failed to process audio", "success": False}, 500


async def generate_speech(text: str) -> tuple:
    """Convert text to speech using Gemini (returns audio content)."""
    try:
        # Note: This uses Gemini's text generation. For actual speech synthesis,
        # consider using Google Cloud Text-to-Speech API or similar
        prompt = f"Convert this text to natural speech format: {text}"
        response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
        
        # Return the text response - frontend will use Web Audio API or similar
        return {"audio_ready": True, "text": text}, 200
    except Exception as e:
        print(f"[audio_service] Error generating speech: {e}")
        return {"error": "Failed to generate speech", "success": False}, 500
