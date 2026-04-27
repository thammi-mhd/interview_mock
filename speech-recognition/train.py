import os
import pandas as pd
import librosa
import torch
import numpy as np
from datasets import Dataset
from dataclasses import dataclass
from typing import Any, Dict, List
from transformers import (
    WhisperProcessor,
    WhisperForConditionalGeneration,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
)
import evaluate

# ─── Config ────────────────────────────────────────────────
MODEL_NAME  = "openai/whisper-tiny"   # tiny = much lighter than small
CSV_PATH    = "dataset/transcripts.csv"
OUTPUT_DIR  = "./whisper-finetuned"
EPOCHS      = 1                        # 1 epoch is enough to test
BATCH_SIZE  = 2                        # low batch size for 8GB RAM
SAMPLE_RATE = 16000
# ───────────────────────────────────────────────────────────

# ─── Load Processor & Model ────────────────────────────────
print("Loading processor and model...")
processor = WhisperProcessor.from_pretrained(MODEL_NAME, language="English", task="transcribe")
model     = WhisperForConditionalGeneration.from_pretrained(MODEL_NAME)

model.generation_config.language         = "english"
model.generation_config.task             = "transcribe"
model.generation_config.forced_decoder_ids = None

# ─── Load & Validate Dataset ───────────────────────────────
print("Loading dataset...")
df = pd.read_csv(CSV_PATH)

assert "file" in df.columns and "text" in df.columns, \
    "❌ CSV must have 'file' and 'text' columns"

df = df[df["file"].apply(os.path.exists)].reset_index(drop=True)
print(f"✅ {len(df)} valid audio samples found")

dataset = Dataset.from_pandas(df)
dataset = dataset.train_test_split(test_size=0.1, seed=42)

# ─── Preprocessing ─────────────────────────────────────────
def preprocess(example):
    try:
        audio, _ = librosa.load(example["file"], sr=SAMPLE_RATE, mono=True)
    except Exception as e:
        print(f"⚠️  Could not load {example['file']}: {e}")
        audio = np.zeros(SAMPLE_RATE, dtype=np.float32)

    audio  = audio.astype(np.float32)
    inputs = processor(audio, sampling_rate=SAMPLE_RATE, return_tensors="pt")
    example["input_features"] = inputs.input_features[0].numpy()

    text = example["text"].strip().lower()
    example["labels"] = processor.tokenizer(text).input_ids

    return example

print("Preprocessing dataset (this may take a few minutes)...")
dataset = dataset.map(
    preprocess,
    remove_columns=["file", "text"],
    desc="Preprocessing audio"
)

# ─── Data Collator ─────────────────────────────────────────
@dataclass
class DataCollatorSpeechSeq2SeqWithPadding:
    processor: Any

    def __call__(self, features: List[Dict[str, Any]]) -> Dict[str, torch.Tensor]:
        input_features = [
            {"input_features": torch.tensor(f["input_features"])} for f in features
        ]
        batch = self.processor.feature_extractor.pad(
            input_features, return_tensors="pt"
        )

        label_features = [{"input_ids": f["labels"]} for f in features]
        labels_batch   = self.processor.tokenizer.pad(
            label_features, return_tensors="pt"
        )

        labels = labels_batch["input_ids"].masked_fill(
            labels_batch.attention_mask.ne(1), -100
        )

        if (labels[:, 0] == self.processor.tokenizer.bos_token_id).all().cpu().item():
            labels = labels[:, 1:]

        batch["labels"] = labels
        return batch

data_collator = DataCollatorSpeechSeq2SeqWithPadding(processor=processor)

# ─── Metrics ───────────────────────────────────────────────
wer_metric = evaluate.load("wer")

def compute_metrics(pred):
    pred_ids  = pred.predictions
    label_ids = pred.label_ids

    label_ids[label_ids == -100] = processor.tokenizer.pad_token_id

    pred_str  = processor.batch_decode(pred_ids,  skip_special_tokens=True)
    label_str = processor.batch_decode(label_ids, skip_special_tokens=True)

    wer = wer_metric.compute(predictions=pred_str, references=label_str)
    print(f"\n📊 WER: {round(wer * 100, 2)}%")
    return {"wer": wer}

# ─── Training Arguments ────────────────────────────────────
training_args = Seq2SeqTrainingArguments(
    output_dir=OUTPUT_DIR,
    per_device_train_batch_size=BATCH_SIZE,
    per_device_eval_batch_size=BATCH_SIZE,
    num_train_epochs=EPOCHS,
    eval_strategy="epoch",
    save_strategy="epoch",
    logging_steps=25,
    learning_rate=1e-5,
    warmup_steps=50,
    predict_with_generate=True,
    generation_max_length=225,
    fp16=False,                          # no GPU, must be False
    gradient_accumulation_steps=4,       # simulates batch of 8, saves RAM
    load_best_model_at_end=True,
    metric_for_best_model="wer",
    greater_is_better=False,
    report_to="none",
    dataloader_num_workers=0,
)

# ─── Trainer ───────────────────────────────────────────────
trainer = Seq2SeqTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],
    data_collator=data_collator,
    compute_metrics=compute_metrics,
    processing_class=processor.feature_extractor,
)

print("🚀 Starting training...")
trainer.train()

# ─── Save ──────────────────────────────────────────────────
print(f"\n✅ Training done! Saving to {OUTPUT_DIR}")
model.save_pretrained(OUTPUT_DIR)
processor.save_pretrained(OUTPUT_DIR)
print("🎉 Model saved successfully!")