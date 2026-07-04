import os
from pypdf import PdfReader
import chromadb

# Connect to a local, on-disk database (just a folder)
client = chromadb.PersistentClient(path="./chroma_db")

# A "collection" is like a table that holds your chunks
collection = client.get_or_create_collection(name="docs")


def load_pdf(path):
    reader = PdfReader(path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


def chunk_text(text, chunk_size=800, overlap=100):
    # Break text into ~800-character pieces that overlap by 100,
    # so a sentence split across two chunks isn't lost.
    chunks = []
    start = 0
    while start < len(text):
        chunks.append(text[start:start + chunk_size])
        start += chunk_size - overlap
    return chunks


def ingest_folder(folder="data"):
    for filename in os.listdir(folder):
        if not filename.endswith(".pdf"):
            continue
        print(f"Reading {filename}...")
        text = load_pdf(os.path.join(folder, filename))
        chunks = chunk_text(text)

        collection.upsert(
            documents=chunks,
            ids=[f"{filename}-{i}" for i in range(len(chunks))],
            metadatas=[{"source": filename} for _ in chunks],
        )
        print(f"  Added {len(chunks)} chunks.")

    print("Done. Total chunks in database:", collection.count())


if __name__ == "__main__":
    ingest_folder()