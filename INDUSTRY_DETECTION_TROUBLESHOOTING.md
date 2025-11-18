# Industry Detection Troubleshooting Guide

## Problem Description

When uploading files, you may encounter issues with the industry detection feature, including:
- 404 Not Found errors when accessing `/api/detect-industry`
- No industry being detected even when the dataset contains industry-specific keywords
- Industry detection returning incorrect results

## Root Causes and Solutions

### 1. 404 Not Found Error

This error typically occurs when the endpoint is not properly registered or there's a conflict in the API route definitions.

**Solution:**
- Ensure the `detect_industry` function is properly decorated with `@app.post("/api/detect-industry")`
- Check that there are no duplicate route definitions
- Restart the backend server after making changes

### 2. No Industry Detected

When no industry-specific keywords are found in the dataset, the system will default to "General" industry classification.

**How it works:**
- The system scans column names for industry-specific keywords
- If no keywords are found, it assigns "General" as the industry
- Confidence score will be 0.0 in this case

**Keywords by Industry:**
- **Retail/E-commerce**: product, customer, order, sku, price, sales, purchase, cart, inventory
- **Finance/Banking**: account, transaction, balance, credit, debit, loan, interest, currency
- **Healthcare**: patient, doctor, diagnosis, treatment, medical, hospital, clinic, insurance, claim
- **Manufacturing**: production, machine, sensor, equipment, maintenance, quality, defect
- **Demand Planning**: demand, forecast, planning, inventory, supply, chain, stock, reorder

### 3. Incorrect Industry Detection

If the wrong industry is being detected, it might be due to overlapping keywords or a dataset with mixed domain concepts.

**Solution:**
- The system uses a scoring mechanism where each matching keyword adds 1 point to an industry
- The industry with the highest score is selected
- If there's a tie, the system will select one based on dictionary order

## Testing Industry Detection

You can test the industry detection endpoint directly with cURL:

```bash
# First upload a file to get a file_id
curl -X POST "http://localhost:8000/api/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/your/file.csv"

# Then use the file_id to detect industry
curl -X POST "http://localhost:8000/api/detect-industry" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "file_id=YOUR_FILE_ID_HERE"
```

## Improving Industry Detection

To improve industry detection accuracy:

1. **Use descriptive column names**: Include industry-specific terms in your column names
2. **Avoid ambiguous terms**: Terms that could belong to multiple industries may cause incorrect detection
3. **Include multiple keywords**: Using several industry-specific keywords increases confidence

## Example Datasets

### Retail Dataset (Good Example)
```csv
product_id,customer_name,order_date,sku,price,quantity
1,John Doe,2023-01-15,P12345,29.99,2
```

This would likely be correctly identified as Retail/E-commerce with high confidence.

### Ambiguous Dataset (Poor Example)
```csv
id,name,date,value
1,Item A,2023-01-15,100.00
```

This would be classified as "General" since there are no industry-specific keywords.

## Common Issues and Fixes

### Issue: Industry detection always returns "General"
**Cause**: No industry-specific keywords found in column names
**Fix**: Rename columns to include industry-specific terms

### Issue: Wrong industry detected
**Cause**: Multiple industries have similar keywords or one industry has more matching keywords
**Fix**: Review column names and adjust to better reflect the primary domain

### Issue: Low confidence score
**Cause**: Only a few industry-specific keywords found
**Fix**: Include more descriptive column names with industry-specific terms

## Debugging Tips

1. Check the backend console for any error messages
2. Verify the file was uploaded successfully and has a valid file_id
3. Examine the column names in your dataset for industry-specific keywords
4. Test with sample datasets that clearly belong to specific industries