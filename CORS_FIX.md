# CORS Fix for Large File Uploads

## Problem
When uploading large files close to 1GB, the CORS policy blocks the request with the error:
```
Access to XMLHttpRequest at 'http://localhost:8000/api/upload' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause
The issue occurs because when large files are processed, the server might timeout or encounter errors that don't properly include CORS headers in the response. Even though CORS middleware is configured, exception handlers might not be sending the required headers.

## Solution Implemented
1. Added explicit CORS headers to all exception handlers
2. Ensured that the upload endpoint returns proper CORS headers even in successful responses
3. Increased the max_age parameter in CORS configuration for better caching

## Changes Made
In `backend/main.py`:
1. Added custom exception handlers that explicitly include CORS headers
2. Modified the upload endpoint to return a JSONResponse with explicit CORS headers
3. Added max_age parameter to CORS middleware for better performance

These changes ensure that CORS headers are always included in responses, even when errors occur during large file processing.