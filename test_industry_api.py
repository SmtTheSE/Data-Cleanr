import requests

# Test the industry detection API
url = 'http://localhost:8000/api/detect-industry'

# First, upload the file
upload_url = 'http://localhost:8000/api/upload'
files = {'file': open('crime_sample.csv', 'rb')}
upload_response = requests.post(upload_url, files=files)

if upload_response.status_code == 200:
    file_data = upload_response.json()
    file_id = file_data['file_id']
    print(f"File uploaded successfully with ID: {file_id}")
    
    # Now test industry detection
    data = {'file_id': file_id}
    response = requests.post(url, data=data)
    
    if response.status_code == 200:
        industry_data = response.json()
        print("Industry Detection Results:")
        print(f"Industry: {industry_data['industry']}")
        print(f"Confidence: {industry_data['confidence']}")
        print(f"Features: {industry_data['features']}")
    else:
        print(f"Error detecting industry: {response.status_code}")
        print(response.text)
else:
    print(f"Error uploading file: {upload_response.status_code}")
    print(upload_response.text)