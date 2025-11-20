import pandas as pd
import io
import requests

# Create a sample retail dataset similar to the one described
retail_data = """Type,Days for shipping (real),Days for shipment (scheduled),Benefit per order,Sales per customer,Delivery Status,Late_delivery_risk,Category Id,Category Name,Customer City,Customer Country,Customer Segment
Transaction1,2,3,25.50,120.00,Shipping on time,0,101,Electronics,New York,USA,Consumer
Transaction2,5,3,18.75,150.75,Late delivery,1,102,Clothing,Chicago,USA,Corporate
Transaction3,1,2,30.25,200.00,Advance shipping,0,103,Books,Los Angeles,USA,Home Office
Transaction4,4,5,18.90,95.50,Late delivery,1,104,Clothing,Houston,USA,Consumer
Transaction5,3,3,22.75,150.25,Shipping on time,0,101,Electronics,Phoenix,USA,Corporate"""

# Convert to DataFrame
df = pd.read_csv(io.StringIO(retail_data))

# Save to CSV
df.to_csv('retail_sample.csv', index=False)

print("Created sample retail dataset: retail_sample.csv")
print("Columns:", list(df.columns))
print("\nFirst few rows:")
print(df.head())

# Test the industry detection API
try:
    # Upload the file
    upload_url = 'http://localhost:8000/api/upload'
    files = {'file': open('retail_sample.csv', 'rb')}
    upload_response = requests.post(upload_url, files=files)
    
    if upload_response.status_code == 200:
        file_data = upload_response.json()
        file_id = file_data['file_id']
        print(f"\nFile uploaded successfully with ID: {file_id}")
        
        # Test industry detection
        url = 'http://localhost:8000/api/detect-industry'
        data = {'file_id': file_id}
        response = requests.post(url, data=data)
        
        if response.status_code == 200:
            industry_data = response.json()
            print("\nIndustry Detection Results:")
            print(f"Industry: {industry_data['industry']}")
            print(f"Confidence: {industry_data['confidence']}")
            print(f"Features: {industry_data['features']}")
        else:
            print(f"Error detecting industry: {response.status_code}")
            print(response.text)
    else:
        print(f"Error uploading file: {upload_response.status_code}")
        print(upload_response.text)
except Exception as e:
    print(f"Error testing API: {e}")