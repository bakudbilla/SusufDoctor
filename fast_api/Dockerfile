# Use NVIDIA CUDA runtime with Ubuntu 22.04
FROM nvidia/cuda:12.2.0-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install Python + system tools
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv python3-dev \
    git wget curl build-essential \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Make python3 default
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 1

WORKDIR /app
COPY . /app

# Upgrade pip
RUN pip install --upgrade pip

# Install Python deps
RUN pip install --no-cache-dir -r requirements.txt

# Install CUDA-enabled torch and torchvision (matching CUDA 12.1)
RUN pip install --no-cache-dir \
    torch==2.2.0+cu121 \
    torchvision==0.17.0+cu121 \
    --extra-index-url https://download.pytorch.org/whl/cu121

# Environment setup for Cloud Run
ENV PORT=8080
EXPOSE 8080

# Start FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
