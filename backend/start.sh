#!/bin/bash
# Install dependencies
pip install -r requirements.txt

# Run the FastAPI application with increased timeout settings and body size limit
uvicorn main:app --host 0.0.0.0 --port 8000 --reload --timeout-keep-alive 300 --limit-max-requests 0