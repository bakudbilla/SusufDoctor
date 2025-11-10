FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy your entire project
COPY . .

# Create model cache directory
RUN mkdir -p /app/model_cache

# Pre-download and cache the model during build
ENV HF_HOME=/app/model_cache
RUN python3 << 'EOF'
import os
os.environ['TRANSFORMERS_CACHE'] = '/app/model_cache'

try:
    from transformers import AutoModelForVision2Seq, AutoProcessor
    
    HF_TOKEN = os.getenv('HF_TOKEN', '')
    BASE_MODEL_ID = "HuggingFaceTB/SmolVLM-500M-Instruct"
    
    print("Downloading base model...")
    AutoModelForVision2Seq.from_pretrained(
        BASE_MODEL_ID,
        trust_remote_code=True,
        cache_dir='/app/model_cache',
        token=HF_TOKEN
    )
    
    print("Downloading processor...")
    AutoProcessor.from_pretrained(
        BASE_MODEL_ID,
        trust_remote_code=True,
        cache_dir='/app/model_cache',
        token=HF_TOKEN
    )
    
    print("Model cached successfully!")
except Exception as e:
    print(f"Warning: Model pre-caching failed: {e}")
    print("Model will be downloaded on first request")
EOF

# Expose port
EXPOSE 8080

# Set environment for model caching
ENV TRANSFORMERS_CACHE=/app/model_cache
ENV HF_HOME=/app/model_cache

# Run the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]