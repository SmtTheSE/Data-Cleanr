# Fix for "Out of range float values are not JSON compliant: nan" Error

## Problem

When uploading files that contain NaN (Not a Number) values, the application was throwing a 500 Internal Server Error with the message:
```
Error processing file: Out of range float values are not JSON compliant: nan
```

This happened because pandas DataFrames with NaN values cannot be directly serialized to JSON, as NaN is not part of the JSON specification.

## Root Cause

In the upload endpoint, the code was trying to convert a DataFrame with NaN values directly to JSON without first handling these non-compliant values:

```python
preview_data = df.head(20)
return {
    "preview": preview_data.to_dict(orient='records'),  # This line failed with NaN values
    # ...
}
```

## Solution Implemented

1. Created a helper function `prepare_dataframe_for_json()` that:
   - Handles datetime columns by converting them to strings
   - Replaces NaN values with None (which is JSON compliant)
   - Works with a copy of the data to avoid modifying the original

2. Updated the upload endpoint to use this helper function before converting to JSON:
   ```python
   preview_data = df.head(20)
   # Handle NaN values and other non-JSON compliant data types
   preview_data = prepare_dataframe_for_json(preview_data)
   return JSONResponse(
       content={
           "file_id": file_id,
           "preview": preview_data.to_dict(orient='records'),
           "columns": list(df.columns)
       },
       headers={
           "Access-Control-Allow-Origin": "http://localhost:3000",
           "Access-Control-Allow-Credentials": "true"
       }
   )
   ```

3. The other endpoints were already properly handling NaN values, so they were left unchanged.

## Testing

To test the fix:
1. Restart the backend server
2. Try uploading a file that contains NaN values or empty cells
3. The upload should now succeed without the JSON serialization error

This fix ensures that all data returned from the backend API is properly formatted for JSON serialization, regardless of NaN values in the original data.