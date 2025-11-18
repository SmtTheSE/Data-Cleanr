# CORS Troubleshooting Guide

## Problem Description

When uploading files, you may encounter this error:
```
Access to XMLHttpRequest at 'http://localhost:8000/api/upload' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause

This error occurs when the frontend (running on `http://localhost:3000`) tries to communicate with the backend (running on `http://localhost:8000`), but the CORS headers are not properly configured or there's a mismatch in the expected origins.

## Solutions

### 1. Check Backend CORS Configuration

The backend should have the following CORS configuration:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)
```

### 2. Restart Both Servers

After making changes to the backend CORS configuration:

1. Stop both the frontend and backend servers
2. Start the backend server first:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

3. Start the frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

### 3. Check Browser Cache

Sometimes browsers cache CORS preflight responses. Try:

1. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
2. Open the browser's developer tools
3. Disable cache in the Network tab
4. Try uploading the file again

### 4. Test with cURL

You can test if the backend is working correctly with cURL:

```bash
curl -X POST "http://localhost:8000/api/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/your/file.csv"
```

### 5. Check File Format

Ensure you're uploading a valid CSV or Excel file. The backend only accepts files with the following extensions:
- .csv
- .xlsx
- .xls

### 6. Verify Ports

Make sure:
- Frontend is running on `http://localhost:3000` (or similar)
- Backend is running on `http://localhost:8000`
- These ports match the CORS configuration

## Common Issues and Fixes

### Issue: Backend starts on a different port
If you see a message like "Port 8000 is in use, trying another one", the backend may start on a different port. Check the terminal output for the actual port and update the frontend API configuration accordingly.

### Issue: CORS configuration not applied
If you've made changes to the CORS configuration but they're not taking effect:
1. Make sure you've saved the file
2. Restart the backend server
3. Check for any syntax errors in the Python code

## Additional Debugging Steps

1. Check browser developer tools Network tab for detailed error messages
2. Check backend terminal for any error messages
3. Verify both servers are running without errors
4. Try uploading a simple test CSV file with just a few rows

If the issue persists after trying all these solutions, please check:
1. That all servers are properly started
2. That there are no firewall or network restrictions
3. That the file you're trying to upload is not corrupted