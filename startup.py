# startup.py — runs once when the backend boots, BEFORE the API starts.
# Waits for Chroma + Ollama, pulls the model if needed, and indexes any PDFs
# in data/ that aren't indexed yet. Turns a fresh machine into a working app.
import os
import sys
import time

import chromadb
import ollama

CHROMA_HOST = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8001"))
MODEL = os.getenv("MODEL", "llama3.2:3b")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")
DATA_DIR = "data"


def wait_for_chroma():
    print("Waiting for Chroma...", flush=True)
    for _ in range(90):
        try:
            client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
            client.heartbeat()
            print("Chroma is up.", flush=True)
            return client
        except Exception:
            time.sleep(2)
    sys.exit("ERROR: Chroma did not become reachable in time.")


def wait_for_ollama():
    print("Waiting for Ollama...", flush=True)
    for _ in range(90):
        try:
            ollama.list()
            print("Ollama is up.", flush=True)
            return
        except Exception:
            time.sleep(2)
    sys.exit("ERROR: Ollama did not become reachable in time.")


def ensure_model():
    # ollama.pull is idempotent: downloads (~2 GB) on first run, quick check after.
    print(f"Ensuring model '{MODEL}' is available (first run downloads ~2 GB)...", flush=True)
    ollama.pull(MODEL)
    print(f"Model '{MODEL}' ready.", flush=True)


def ensure_ingested(client):
    collection = client.get_or_create_collection("docs")

    already = set()
    try:
        got = collection.get(include=["metadatas"])
        for meta in got.get("metadatas") or []:
            if meta and meta.get("source"):
                already.add(meta["source"])
    except Exception:
        pass

    pdfs = [f for f in os.listdir(DATA_DIR) if f.lower().endswith(".pdf")] if os.path.isdir(DATA_DIR) else []
    new_pdfs = [f for f in pdfs if f not in already]

    if collection.count() > 0 and not new_pdfs:
        print(f"All {len(pdfs)} PDF(s) already indexed ({collection.count()} chunks).", flush=True)
        return

    print(f"Indexing PDFs in {DATA_DIR}/ ...", flush=True)
    import ingest
    ingest.ingest_folder(DATA_DIR)


if __name__ == "__main__":
    client = wait_for_chroma()
    if LLM_PROVIDER == "ollama":
        wait_for_ollama()
        ensure_model()
    ensure_ingested(client)
    print("Startup complete — launching API.", flush=True)