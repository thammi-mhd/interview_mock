FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
# - gcc: compile C extensions (psycopg2, bcrypt, etc.)
# - libpq-dev: PostgreSQL client headers for psycopg2
# - libsndfile1: required by librosa/soundfile
# - ffmpeg: required by pydub for audio processing
# - curl: for HEALTHCHECK
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libsndfile1 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (Docker layer caching — deps rebuild only when requirements change)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code only
COPY app/ ./app/

# Create non-root user for security
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Expose the port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run with gunicorn for production, uvicorn workers for async support
CMD ["gunicorn", "app.main:app", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
