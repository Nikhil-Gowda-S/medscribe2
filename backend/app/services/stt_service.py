import httpx
from typing import Optional
from fastapi import HTTPException
from app.core.config import settings

def transcribe_audio_file(file_bytes: bytes, filename: str) -> str:
    """Transcribes audio using Groq Whisper API (whisper-large-v3)."""
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "dummy_key":
        raise HTTPException(status_code=500, detail="Transcription service not configured. Please set GROQ_API_KEY.")
        
    try:
        headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
        mime_types = {
            ".wav": "audio/wav", ".mp3": "audio/mpeg", ".m4a": "audio/mp4",
            ".webm": "audio/webm", ".ogg": "audio/ogg", ".mp4": "audio/mp4",
        }
        extension = f".{filename.lower().rsplit('.', 1)[-1]}" if "." in filename else ""
        files = {"file": (filename, file_bytes, mime_types.get(extension, "application/octet-stream"))}
        data = {"model": "whisper-large-v3", "response_format": "text"}
        with httpx.Client(timeout=60.0) as client:
            res = client.post("https://api.groq.com/openai/v1/audio/transcriptions", headers=headers, files=files, data=data)
            if res.status_code == 200:
                return res.text
            raise HTTPException(status_code=502, detail="Transcription provider could not process the audio")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Whisper transcription error: {e}")
        raise HTTPException(status_code=502, detail="Transcription service is temporarily unavailable")
