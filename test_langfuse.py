# test_langfuse.py — one-off: confirm Langfuse credentials + connection work.
from dotenv import load_dotenv
load_dotenv()  # reads your .env

from langfuse import get_client, observe

langfuse = get_client()  # picks up the keys + host from .env

# 1) Are the keys + host valid?
if langfuse.auth_check():
    print("AUTH OK — connected to Langfuse.")
else:
    print("AUTH FAILED — check your keys and LANGFUSE_HOST in .env.")
    raise SystemExit(1)

# 2) Send one trace so you can watch it land in the dashboard.
@observe()
def documind_connection_test():
    return "Hello from DocuMind — this is a test trace."

documind_connection_test()
langfuse.flush()  # push the trace before the script exits
print("Sent a test trace. Open Langfuse -> Tracing to find 'documind_connection_test'.")