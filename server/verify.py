import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def test_health():
    print("Testing Health Check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(response.json())
    except Exception as e:
        print(f"Health check failed: {e}")

def test_ingest():
    print("\nTesting Ingestion...")
    # Create a dummy PDF
    with open("test.pdf", "wb") as f:
        f.write(b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Hello World from DocuMind!) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000157 00000 n\n0000000307 00000 n\n0000000394 00000 n\ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n492\n%%EOF")

    files = {'files': ('test.pdf', open('test.pdf', 'rb'), 'application/pdf')}
    response = requests.post(f"{BASE_URL}/ingest", files=files)
    print(response.json())

def test_chat():
    print("\nTesting Chat...")

    time.sleep(2)
    
    payload = {"message": "What does the document say?", "session_id": "test_session"}
    
    with requests.post(f"{BASE_URL}/chat", json=payload, stream=True) as r:
        print("Streaming response:")
        for line in r.iter_lines():
            if line:
                try:
                    data = json.loads(line)
                    if "token" in data:
                        print(data["token"], end="", flush=True)
                    elif "sources" in data:
                        print(f"\n\nSources: {data['sources']}")
                except json.JSONDecodeError:
                    print(f"Raw line: {line}")
    print("\n")

def test_clear():
    print("\nTesting Clear DB...")
    response = requests.delete(f"{BASE_URL}/clear")
    print(response.json())

if __name__ == "__main__":
    test_health()
    test_ingest()
    test_chat()
    test_clear()
