FROM python:3.12-slim

# Some Python packages compile from source on slim images
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# CPU-only PyTorch first, so we don't pull huge CUDA wheels
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# The rest of the backend deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the reranker so the container starts instantly and runs offline
RUN python -c "from sentence_transformers import CrossEncoder; CrossEncoder('BAAI/bge-reranker-base', device='cpu')"

# Copy only the backend code
COPY main.py rag.py ingest.py ./

EXPOSE 8000
# 0.0.0.0 (not localhost) so the port is reachable from outside the container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]