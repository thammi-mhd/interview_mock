# setup_dataset.py

import os
import sys

os.environ["DATASETS_AUDIO_BACKEND"] = "soundfile"

import soundfile as sf
import numpy as np
import librosa
import pandas as pd
from datasets import load_dataset

# ─── Config ───────────────────────────────────────────────
MAX_SAMPLES_INDIAN  = 250   # from PolyAI/minds14 en-IN
MAX_SAMPLES_ENGLISH = 250   # from librispeech
OUTPUT_DIR  = "dataset"
AUDIO_DIR   = os.path.join(OUTPUT_DIR, "audio")
CSV_PATH    = os.path.join(OUTPUT_DIR, "transcripts.csv")
TARGET_SR   = 16000
# ──────────────────────────────────────────────────────────

def save_sample(audio_array, sample_rate, transcript, count):
    """Resample if needed and save .wav. Returns row dict or None."""
    transcript = transcript.strip()
    if not transcript:
        return None

    if sample_rate != TARGET_SR:
        audio_array = librosa.resample(
            audio_array.astype(np.float32),
            orig_sr=sample_rate,
            target_sr=TARGET_SR,
        )

    audio_path = os.path.join(AUDIO_DIR, f"sample_{count:04d}.wav")
    sf.write(audio_path, audio_array.astype(np.float32), TARGET_SR)
    return {"file": audio_path, "text": transcript}


def collect_indian_english(rows, errors, start_count):
    """PolyAI/minds14 en-IN — only has 'train' split."""
    print("\n── Indian English (PolyAI/minds14 en-IN) ──")
    count = start_count

    try:
        ds = load_dataset(
            "PolyAI/minds14",
            "en-IN",
            split="train",      # ← only split that exists
            streaming=True,
        )
        print("  ✅ Loaded minds14 en-IN")
    except Exception as e:
        print(f"  ❌ Could not load minds14 en-IN: {e}")
        return count

    for sample in ds:
        if count - start_count >= MAX_SAMPLES_INDIAN:
            break
        try:
            transcript = sample.get("transcription") or sample.get("english_transcription", "")
            row = save_sample(
                np.array(sample["audio"]["array"]),
                sample["audio"]["sampling_rate"],
                transcript,
                count,
            )
            if row:
                row["accent"] = "indian"
                rows.append(row)
                count += 1
                if count % 50 == 0:
                    print(f"  💾 Indian samples: {count - start_count}")
        except Exception as e:
            errors.append({"index": count, "error": str(e)})

    print(f"  ✅ Indian English done: {count - start_count} samples")
    return count


def collect_normal_english(rows, errors, start_count):
    """librispeech_asr clean — reliable, no login needed."""
    print("\n── Normal English (librispeech clean.100) ──")
    count = start_count

    try:
        ds = load_dataset(
            "openslr/librispeech_asr",
            "clean",
            split="train.100",
            streaming=True,
            trust_remote_code=True,
        )
        print("  ✅ Loaded librispeech clean")
    except Exception as e:
        print(f"  ❌ Could not load librispeech: {e}")
        return count

    for sample in ds:
        if count - start_count >= MAX_SAMPLES_ENGLISH:
            break
        try:
            transcript = sample.get("text", "")
            row = save_sample(
                np.array(sample["audio"]["array"]),
                sample["audio"]["sampling_rate"],
                transcript,
                count,
            )
            if row:
                row["accent"] = "neutral"
                rows.append(row)
                count += 1
                if count % 50 == 0:
                    print(f"  💾 English samples: {count - start_count}")
        except Exception as e:
            errors.append({"index": count, "error": str(e)})

    print(f"  ✅ Normal English done: {count - start_count} samples")
    return count


def main():
    os.makedirs(AUDIO_DIR, exist_ok=True)

    rows   = []
    errors = []

    count = collect_indian_english(rows, errors, start_count=0)
    count = collect_normal_english(rows, errors, start_count=count)

    if not rows:
        print("\n❌ No samples saved. Check your internet connection.")
        sys.exit(1)

    df = pd.DataFrame(rows)
    df.to_csv(CSV_PATH, index=False)

    print(f"\n{'─'*50}")
    print(f"✅  Total saved : {len(df)} samples")
    print(f"🇮🇳  Indian EN   : {len(df[df['accent']=='indian'])}")
    print(f"🇺🇸  Normal EN   : {len(df[df['accent']=='neutral'])}")
    print(f"📄  CSV         : {CSV_PATH}")
    print(f"🔊  Audio       : {AUDIO_DIR}/")
    print(f"❌  Errors      : {len(errors)}")
    print(f"{'─'*50}")
    print(df[["file", "text", "accent"]].head(5).to_string(index=False))

    if errors:
        pd.DataFrame(errors).to_csv(
            os.path.join(OUTPUT_DIR, "errors.csv"), index=False
        )

if __name__ == "__main__":
    main()