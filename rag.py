import chromadb
import ollama

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(name="docs")

MODEL = "qwen3:8b"


def retrieve(question, k=4):
    # Ask the database for the 4 chunks closest in meaning to the question
    results = collection.query(query_texts=[question], n_results=k)
    return results["documents"][0]  # the hits for our one question


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