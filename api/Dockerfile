FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    gfortran \
    libopenblas-dev \
    liblapack-dev \
    wget unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# libglib2.0-0 libsm6 libxext6 libxrender-dev libgl1-mesa-glx \

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# EXPOSE
EXPOSE 8080

# Run FastAPI app
CMD ["uvicorn", "fast:app", "--host", "0.0.0.0", "--port", "8080"]