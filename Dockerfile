FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the reranker so the container starts fast and works offline
RUN python -c "from sentence_transformers import CrossEncoder; CrossEncoder('BAAI/bge-reranker-base', device='cpu')"

# Best-effort: warm the Chroma embedding model into the image (non-fatal)
RUN python -c "import chromadb; c=chromadb.Client(); col=c.get_or_create_collection('warm'); col.add(documents=['warm up'], ids=['1'])" || echo "embedding warm-up skipped; will download at runtime"

# Backend code (now includes the startup script)
COPY main.py rag.py ingest.py startup.py ./

EXPOSE 8000
# On boot: wait for deps, pull model, index PDFs, THEN serve.
CMD ["sh", "-c", "python startup.py && exec uvicorn main:app --host 0.0.0.0 --port 8000"]