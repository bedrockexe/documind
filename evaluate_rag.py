# evaluate_rag.py — Phase 3, Step 2b: first RAGAS quality scores (local judge, $0)
# System under test: your 3B RAG. Judge: qwen3:8b (offline, thinking OFF + JSON ON).

# --- Shim: RAGAS 0.4.3 imports a Vertex AI class from a path modern langchain
#     removed. We never use Vertex AI; hand Python a harmless stub so import works.
import sys, types
_stub = types.ModuleType("langchain_community.chat_models.vertexai")
_stub.ChatVertexAI = type("ChatVertexAI", (), {})
sys.modules.setdefault("langchain_community.chat_models.vertexai", _stub)

import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

from ragas import EvaluationDataset, SingleTurnSample, evaluate, RunConfig
from ragas.metrics import faithfulness, answer_relevancy, context_precision
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from langchain_ollama import ChatOllama, OllamaEmbeddings

from eval_data import EVAL_SET
from rag import ask, retrieve_with_sources

OLLAMA_URL = "http://localhost:11434"

# --- 1. Run YOUR RAG over each golden question ------------------------------
# Record the answer your 3B model gives + the chunks it retrieved. Retrieval is
# deterministic, so these are the same chunks the answer was built from.
samples = []
for i, item in enumerate(EVAL_SET, 1):
    q = item["question"]
    print(f"[{i}/{len(EVAL_SET)}] answering: {q}")
    contexts = [h["text"] for h in retrieve_with_sources(q)]
    answer = ask(q)
    samples.append(SingleTurnSample(
        user_input=q,
        retrieved_contexts=contexts,
        response=answer,
        reference=item["ground_truth"],
    ))

dataset = EvaluationDataset(samples=samples)

# --- 2. Configure the local judge + embeddings ------------------------------
# reasoning=False -> stops qwen3's <think> blocks (they'd corrupt the JSON)
# format="json"   -> forces clean JSON the metrics can parse (this kills NaNs)
# temperature=0   -> consistent, repeatable grading
# num_ctx=8192    -> room for answer + contexts (avoids silent truncation)
judge = LangchainLLMWrapper(ChatOllama(
    model="qwen3:8b",
    base_url=OLLAMA_URL,
    reasoning=False,
    format="json",
    temperature=0,
    num_ctx=8192,
))

embeddings = LangchainEmbeddingsWrapper(OllamaEmbeddings(
    model="nomic-embed-text",
    base_url=OLLAMA_URL,
))

# --- 3. Score ---------------------------------------------------------------
# max_workers=1 -> send judge calls ONE AT A TIME. Your single local Ollama
#                  can't handle 16 at once; overlapping them caused the NaNs.
# timeout=300   -> plenty of time per call on 6 GB VRAM.
run_config = RunConfig(max_workers=1, timeout=300)

print("\nScoring with qwen3:8b (one call at a time) — slower but reliable. Give it several minutes...\n")
result = evaluate(
    dataset=dataset,
    metrics=[faithfulness, answer_relevancy, context_precision],
    llm=judge,
    embeddings=embeddings,
    run_config=run_config,
    raise_exceptions=False,
)

# --- 4. Report --------------------------------------------------------------
print("\n===== RAGAS SCORES (0.0-1.0, higher is better) =====")
print(result)

df = result.to_pandas()
metric_cols = [c for c in df.columns if c not in ("user_input", "retrieved_contexts", "response", "reference")]
print("\nFailures per metric (want 0):")
for c in metric_cols:
    print(f"  {c}: {df[c].isna().sum()} NaN out of {len(df)}")

print("\nPer-question scores:")
show = df.copy()
show["question"] = show["user_input"].str.slice(0, 45)
print(show[["question"] + metric_cols].to_string(index=False))