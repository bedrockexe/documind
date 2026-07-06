from dotenv import load_dotenv
load_dotenv()  # load LANGFUSE_* before anything else so tracing is configured

import json
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama
from langfuse import observe, get_client
from rag import ask, build_prompt, retrieve_with_sources, MODEL, LLM_PROVIDER, groq_client

langfuse = get_client()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Question(BaseModel):
    question: str


@app.post("/ask")
def ask_endpoint(body: Question):
    return {"answer": ask(body.question)}   # ask() is already traced in rag.py


@observe(as_type="generation", transform_to_string=lambda chunks: "".join(chunks))
def _generate_stream(prompt):
    usage = {}
    if LLM_PROVIDER == "groq":
        stream = groq_client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
            stream_options={"include_usage": True},  # ask for a final usage chunk
        )
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
            if chunk.usage:  # only the final chunk carries token counts
                usage = {"input": chunk.usage.prompt_tokens, "output": chunk.usage.completion_tokens}
    else:  # ollama (local dev) — unchanged behaviour
        stream = ollama.chat(model=MODEL, messages=[{"role": "user", "content": prompt}], stream=True)
        for part in stream:
            content = part["message"]["content"]
            try:
                if part["done"]:
                    usage = {"input": part["prompt_eval_count"], "output": part["eval_count"]}
            except Exception:
                pass
            yield content
    langfuse.update_current_generation(model=MODEL, usage_details=usage or None)


@observe(name="ask-stream")
def generate(question):
    hits = retrieve_with_sources(question)              # traced retriever span
    yield json.dumps(hits) + "\n"                        # first line = list of {text, source}
    prompt = build_prompt(question, [h["text"] for h in hits])
    yield from _generate_stream(prompt)                 # traced generation span, streamed


@app.post("/ask-stream")
def ask_stream(body: Question):
    return StreamingResponse(generate(body.question), media_type="text/plain")