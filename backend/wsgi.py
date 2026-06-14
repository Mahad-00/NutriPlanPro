import os, sys
from app import create_app

app = create_app()
print(f"APP_READY pid={os.getpid()}", file=sys.stderr, flush=True)
