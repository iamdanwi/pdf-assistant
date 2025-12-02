import sys
import os

print(f"Python Executable: {sys.executable}")
print(f"Python Version: {sys.version}")
print(f"Current Working Directory: {os.getcwd()}")
print("sys.path:")
for p in sys.path:
    print(f"  - {p}")

try:
    import fitz
    print(f"\nSUCCESS: Imported fitz from {fitz.__file__}")
    print(f"fitz version: {fitz.version}")
except ImportError as e:
    print(f"\nERROR: Could not import fitz: {e}")

try:
    import pymupdf
    print(f"SUCCESS: Imported pymupdf from {pymupdf.__file__}")
except ImportError as e:
    print(f"ERROR: Could not import pymupdf: {e}")
