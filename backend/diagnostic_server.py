"""Minimal HTTP server for Railway diagnostic."""
import os, sys, json
from http.server import HTTPServer, BaseHTTPRequestHandler


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        sys.stderr.write(f"[DIAG] {args[0]} {args[1]} {args[2]}\n")

    def _respond(self, code, body):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        print(f"[DIAG] REQ: GET {self.path}", file=sys.stderr, flush=True)
        if self.path == "/api/health":
            body = json.dumps({"status": "ok"}).encode()
            self._respond(200, body)
        else:
            body = json.dumps({"status": "ok", "message": "API server running"}).encode()
            self._respond(200, body)
        print(f"[DIAG] RES: GET {self.path} -> 200", file=sys.stderr, flush=True)

    do_POST = do_GET
    do_PUT = do_GET
    do_DELETE = do_GET
    do_OPTIONS = do_GET


port = int(os.environ.get("PORT", 8080))
print(f"[DIAG] Starting diagnostic server on port {port}...", file=sys.stderr, flush=True)
server = HTTPServer(("0.0.0.0", port), Handler)
print(f"[DIAG] Server ready on http://0.0.0.0:{port}", file=sys.stderr, flush=True)
server.serve_forever()
