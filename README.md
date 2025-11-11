# DataCleanr

A full-stack web application that enables users to upload raw CSV or Excel datasets, preview them instantly, perform automated cleaning and harmonization operations, and then download the cleaned data in CSV or Excel format.

## Tech Stack

- Frontend: React + Vite + TailwindCSS
- Backend: FastAPI (Python 3.10+)
- Data Processing: Pandas, OpenPyXL, PyArrow
- File Upload & Download: Multipart/form-data via FastAPI

## Features

1. Upload raw CSV or Excel files
2. Preview data (first 20 rows)
3. Apply various cleaning operations:
   - Remove duplicates
   - Harmonize column names
   - Handle missing values
   - Trim whitespace
   - Standardize date formats
   - Reorder columns alphabetically
4. AI-powered cleaning suggestions
5. Download cleaned data as CSV or Excel

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the backend server:
   ```
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

   Or use the provided script:
   ```
   ./start.sh
   ```

   The backend will be available at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

   The frontend will be available at http://localhost:3000

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Upload a CSV or Excel file using the drag-and-drop area or file browser
3. Preview the raw data
4. Click "Clean Data Options" to select cleaning operations or use "Suggest Cleaning Steps" for AI recommendations
5. Click "Run Cleaning" to process the data
6. Preview the cleaned data
7. Download the cleaned file in CSV or Excel format

## API Endpoints

- `POST /api/upload` - Upload a file and get a preview
- `POST /api/suggest` - Get AI-suggested cleaning operations
- `POST /api/clean` - Clean the data with selected options
- `GET /api/download/{file_id}?format=csv|xlsx` - Download the cleaned file

## Sample Data

A sample dataset `sample_sales.csv` is included for testing purposes.

## Deployment

### Render

1. Create a new Web Service on Render
2. Connect your repository
3. Set the build command: `cd frontend && npm install && npm run build`
4. Set the start command: `cd backend && pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port $PORT`

### AWS

1. Deploy the frontend as a static website on S3
2. Deploy the backend as a container on ECS or use Elastic Beanstalk
3. Set up API Gateway if needed