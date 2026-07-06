from dotenv import load_dotenv
load_dotenv()  # loads LANGFUSE_* keys from .env so tracing works wherever rag is used
import os
import chromadb
import ollama
from sentence_transformers import CrossEncoder
from langfuse import observe, get_client

langfuse = get_client()

client = chromadb.HttpClient(
    host=os.getenv("CHROMA_HOST", "localhost"),
    port=int(os.getenv("CHROMA_PORT", "8001")),
)
collection = client.get_or_create_collection(name="docs")

# MODEL = "llama3.2:3b"

# --- LLM provider: "ollama" for local dev (default), "groq" for the deployed app ---
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")

if LLM_PROVIDER == "groq":
    from openai import OpenAI
    groq_client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.environ["GROQ_API_KEY"],
    )
    MODEL = os.getenv("LLM_MODEL", "llama-3.1-8b-instant")
else:
    groq_client = None
    MODEL = os.getenv("LLM_MODEL", "llama3.2:3b")

reranker = CrossEncoder("BAAI/bge-reranker-base", device="cpu")


@observe(as_type="retriever")
def retrieve(question, k=4, fetch=20):
    results = collection.query(query_texts=[question], n_results=fetch)
    docs = results["documents"][0]
    scores = reranker.predict([(question, d) for d in docs])
    ranked = [d for _, d in sorted(zip(scores, docs), key=lambda x: x[0], reverse=True)]
    return ranked[:k]


@observe(as_type="retriever")
def retrieve_with_sources(question, k=4, fetch=20):
    results = collection.query(query_texts=[question], n_results=fetch)
    docs = results["documents"][0]
    metas = results["metadatas"][0]
    scores = reranker.predict([(question, d) for d in docs])
    ranked = sorted(zip(scores, docs, metas), key=lambda x: x[0], reverse=True)
    return [{"text": d, "source": m.get("source", "unknown")} for _, d, m in ranked[:k]]


def build_prompt(question, chunks):
    context = "\n\n---\n\n".join(chunks)
    return f"""Answer the question using ONLY the context below.
If the answer isn't in the context, say you don't know.

Context:
{context}

Question: {question}

Answer:"""


@observe(as_type="generation")
def _generate(prompt):
    if LLM_PROVIDER == "groq":
        resp = groq_client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        usage = {"input": resp.usage.prompt_tokens, "output": resp.usage.completion_tokens}
        content = resp.choices[0].message.content
    else:  # ollama (local dev) — unchanged behaviour
        resp = ollama.chat(model=MODEL, messages=[{"role": "user", "content": prompt}])
        usage = {}
        try:
            usage = {"input": resp["prompt_eval_count"], "output": resp["eval_count"]}
        except Exception:
            pass
        content = resp["message"]["content"]
    langfuse.update_current_generation(model=MODEL, usage_details=usage or None)
    return content


@observe()
def ask(question):
    chunks = retrieve(question)
    prompt = build_prompt(question, chunks)
    return _generate(prompt)


if __name__ == "__main__":
    q = input("Ask a question: ")
    print("\n" + ask(q))
    langfuse.flush()  # push the trace before this short-lived script exits