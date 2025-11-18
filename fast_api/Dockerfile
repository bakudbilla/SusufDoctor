FROM python:3.10-slim

# System dependencies
RUN apt-get update && apt-get install -y \
    git wget curl build-essential \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . /app

# Upgrade pip
RUN pip install --upgrade pip

# Install CPU Torch
RUN pip install --no-cache-dir \
    torch==2.2.0+cpu \
    torchvision==0.17.0+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Install the rest of your requirements
RUN pip install --no-cache-dir -r requirements.txt

# Cloud Run settings
ENV PORT=8080
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
