# groq_test.py — standalone check that your Groq key + model work
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",   # the /v1 matters — leaving it off 404s
    api_key=os.environ["GROQ_API_KEY"],
)

resp = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[{"role": "user", "content": "Reply with exactly: Groq is working."}],
)

print(resp.choices[0].message.content)
print("tokens in/out:", resp.usage.prompt_tokens, resp.usage.completion_tokens)