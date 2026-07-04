import chromadb
import ollama
from sentence_transformers import CrossEncoder

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(name="docs")

MODEL = "llama3.2:3b"

# The reranker — a model that re-scores chunks for true relevance
reranker = CrossEncoder("BAAI/bge-reranker-base", device="cpu")



def retrieve(question, k=4, fetch=20):
    # 1. Cast a wide net — grab 20 candidate chunks from the database
    results = collection.query(query_texts=[question], n_results=fetch)
    docs = results["documents"][0]

    # 2. Re-score every candidate against the question
    scores = reranker.predict([(question, d) for d in docs])

    # 3. Sort by score (best first) and keep the true top 4
    ranked = [d for _, d in sorted(zip(scores, docs), key=lambda x: x[0], reverse=True)]
    return ranked[:k]


def build_prompt(question, chunks):
    context = "\n\n---\n\n".join(chunks)
    return f"""Answer the question using ONLY the context below.
If the answer isn't in the context, say you don't know.

Context:
{context}

Question: {question}

Answer:"""


def ask(question):
    chunks = retrieve(question)
    prompt = build_prompt(question, chunks)
    response = ollama.chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    return response["message"]["content"]


if __name__ == "__main__":
    q = input("Ask a question: ")
    print("\n" + ask(q))