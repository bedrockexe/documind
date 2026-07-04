from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama
from rag import ask, retrieve, build_prompt, MODEL

app = FastAPI()

# Allow the React app (port 5173) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Question(BaseModel):
    question: str


@app.post("/ask")
def ask_endpoint(body: Question):
    return {"answer": ask(body.question)}


def generate(question):
    prompt = build_prompt(question, retrieve(question))
    stream = ollama.chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )
    for part in stream:
        yield part["message"]["content"]


@app.post("/ask-stream")
def ask_stream(body: Question):
    return StreamingResponse(generate(body.question), media_type="text/plain")