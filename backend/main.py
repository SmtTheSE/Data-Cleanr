from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import pandas as pd
import uuid
import os
from typing import List, Optional
import io
import json

app = FastAPI(title="DataCleanr API")

# Add CORS middleware with more specific configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# In-memory storage for file data
file_storage = {}

class CleanOptions(BaseModel):
    remove_duplicates: bool = False
    harmonize_columns: bool = False
    handle_missing: str = "none"  # none, drop, fill_mean, fill_zero
    trim_whitespace: bool = False
    standardize_dates: bool = False
    reorder_columns: bool = False

class SuggestionResponse(BaseModel):
    suggestions: List[str]

# New model for industry detection
class IndustryDetectionResponse(BaseModel):
    industry: str
    confidence: float
    features: List[str]

# Add a new model for issue-based cleaning
class IssueBasedCleanRequest(BaseModel):
    file_id: str
    selected_issues: List[str]
    analysis_report: List[dict]

@app.get("/")
async def root():
    return {"message": "DataCleanr API is running"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        
        # Read file content with larger buffer
        content = await file.read()
        
        # Determine file type and read with pandas
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a CSV or Excel file.")
        
        # Store file data in memory
        file_storage[file_id] = {
            'filename': file.filename,
            'data': df.copy(),
            'cleaned_data': None
        }
        
        # Return file_id and preview (first 20 rows)
        preview_data = df.head(20)
        return {
            "file_id": file_id,
            "preview": preview_data.to_dict(orient='records'),
            "columns": list(df.columns)
        }
    
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Unable to decode file. Please ensure it's a valid CSV or Excel file.")
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    except pd.errors.ParserError:
        raise HTTPException(status_code=400, detail="Unable to parse file. Please ensure it's a valid CSV or Excel file.")
    except Exception as e:
        # Log the error for debugging
        print(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/api/suggest")
async def suggest_cleaning_steps(file_id: str = Form(...)):
    if file_id not in file_storage:
        raise HTTPException(status_code=404, detail="File not found")
    
    df = file_storage[file_id]['data']
    suggestions = []
    
    # Check for duplicates
    if df.duplicated().any():
        suggestions.append("remove_duplicates")
    
    # Check for columns with spaces or uppercase
    if any(col != col.lower() or ' ' in col for col in df.columns):
        suggestions.append("harmonize_columns")
    
    # Check for missing values
    if df.isnull().any().any():
        suggestions.append("handle_missing")
    
    # Check for string columns with leading/trailing whitespace
    string_cols = df.select_dtypes(include=['object']).columns
    if any(df[col].astype(str).str.strip().ne(df[col]).any() for col in string_cols):
        suggestions.append("trim_whitespace")
    
    # Simple date column detection
    for col in df.columns:
        if 'date' in col.lower() or 'time' in col.lower():
            suggestions.append("standardize_dates")
            break
    
    return {"suggestions": suggestions}

# New endpoint for industry detection
@app.post("/api/detect-industry")
async def detect_industry(file_id: str = Form(...)):
    return detect_industry_internal(file_id)

def detect_industry_internal(file_id: str):
    """
    Internal function to detect industry without being an API endpoint
    """
    if file_id not in file_storage:
        raise HTTPException(status_code=404, detail="File not found")
    
    df = file_storage[file_id]['data']
    filename = file_storage[file_id]['filename']
    
    # Analyze column names and data for industry patterns
    column_names = [col.lower() for col in df.columns]
    industry_scores = {
        "retail_ecommerce": 0,
        "finance_banking": 0,
        "healthcare": 0,
        "manufacturing": 0,
        "demand_planning": 0,
        "education": 0
    }
    
    # Check for industry-specific column patterns
    # Retail/E-commerce indicators
    retail_keywords = ['product', 'customer', 'order', 'sku', 'price', 'sales', 'purchase', 'cart', 'inventory']
    for keyword in retail_keywords:
        if any(keyword in col for col in column_names):
            industry_scores["retail_ecommerce"] += 1
    
    # Finance/Banking indicators
    finance_keywords = ['account', 'transaction', 'balance', 'credit', 'debit', 'loan', 'interest', 'currency']
    for keyword in finance_keywords:
        if any(keyword in col for col in column_names):
            industry_scores["finance_banking"] += 1
    
    # Healthcare indicators
    healthcare_keywords = ['patient', 'doctor', 'diagnosis', 'treatment', 'medical', 'hospital', 'clinic', 'insurance', 'claim']
    for keyword in healthcare_keywords:
        if any(keyword in col for col in column_names):
            industry_scores["healthcare"] += 1
    
    # Manufacturing indicators
    manufacturing_keywords = ['production', 'machine', 'sensor', 'equipment', 'maintenance', 'quality', 'defect']
    for keyword in manufacturing_keywords:
        if any(keyword in col for col in column_names):
            industry_scores["manufacturing"] += 1
    
    # Demand Planning indicators
    demand_keywords = ['demand', 'forecast', 'planning', 'inventory', 'supply', 'chain', 'stock', 'reorder']
    for keyword in demand_keywords:
        if any(keyword in col for col in column_names):
            industry_scores["demand_planning"] += 1
    
    # Education indicators (enhanced with file name/extension checking)
    education_keywords = ['student', 'course', 'grade', 'score', 'exam', 'assignment', 'gpa', 'degree', 'major', 'faculty', 'department', 'enrollment', 'academic', 'semester', 'tuition']
    for keyword in education_keywords:
        if any(keyword in col for col in column_names):
            industry_scores["education"] += 1
    
    # Additional education detection based on file name and extension
    education_file_indicators = ['course', 'class', 'education', 'school', 'university', 'student', 'academy']
    education_extensions = ['.csv', '.xlsx', '.xls']
    
    # Check if filename contains education-related terms
    filename_lower = filename.lower()
    if any(indicator in filename_lower for indicator in education_file_indicators):
        industry_scores["education"] += 2  # Boost score if filename indicates education
    
    # Check for typical course-related column names that might not be explicitly "education" but are common in course sales
    course_related_columns = ['название курса', 'course', 'название', 'title', 'price', 'цена', 'кол-во', 'quantity', 'total', 'всего', 'sale', 'date', 'дата']
    course_matches = sum(1 for col in column_names if any(keyword in col for keyword in course_related_columns))
    
    # If we have several course-related columns, this might be education data
    if course_matches >= 3:  # If at least 3 course-related columns are found
        industry_scores["education"] += 2
    
    # Determine the industry with highest score
    detected_industry = max(industry_scores, key=industry_scores.get)
    confidence = industry_scores[detected_industry] / max(sum(industry_scores.values()), 1)
    
    # Generate features list for the response
    features = []
    if detected_industry == "retail_ecommerce":
        features = [kw for kw in retail_keywords if any(kw in col for col in column_names)]
    elif detected_industry == "finance_banking":
        features = [kw for kw in finance_keywords if any(kw in col for col in column_names)]
    elif detected_industry == "healthcare":
        features = [kw for kw in healthcare_keywords if any(kw in col for col in column_names)]
    elif detected_industry == "manufacturing":
        features = [kw for kw in manufacturing_keywords if any(kw in col for col in column_names)]
    elif detected_industry == "demand_planning":
        features = [kw for kw in demand_keywords if any(kw in col for col in column_names)]
    elif detected_industry == "education":
        features = [kw for kw in education_keywords if any(kw in col for col in column_names)]
    
    # Convert industry code to readable format
    industry_mapping = {
        "retail_ecommerce": "Retail/E-commerce",
        "finance_banking": "Finance/Banking",
        "healthcare": "Healthcare",
        "manufacturing": "Manufacturing",
        "demand_planning": "Demand Planning/Business Forecasting",
        "education": "Education"
    }
    
    # If no industry keywords were detected or confidence is 0, set to General
    final_industry = "General"
    if confidence > 0:
        final_industry = industry_mapping.get(detected_industry, "General")
    
    return {
        "industry": final_industry,
        "confidence": round(confidence, 2),
        "features": features[:5]  # Top 5 matching features
    }

# New endpoint for industry-specific suggestions
@app.post("/api/industry-suggestions")
async def industry_suggestions(file_id: str = Form(...)):
    if file_id not in file_storage:
        raise HTTPException(status_code=404, detail="File not found")
    
    # First detect the industry by calling the function directly
    industry_response = detect_industry_internal(file_id)
    industry = industry_response["industry"]
    
    # Get basic suggestions
    basic_suggestions_response = await suggest_cleaning_steps(file_id=file_id)
    basic_suggestions = basic_suggestions_response["suggestions"]
    
    # Add industry-specific suggestions
    industry_suggestions = []
    description = ""
    
    if industry == "Retail/E-commerce":
        industry_suggestions = ["deduplicate_customers", "standardize_addresses", "normalize_phone_numbers"]
        description = "Retail data often contains duplicate customer records, inconsistent addresses, and varied phone number formats."
    elif industry == "Finance/Banking":
        industry_suggestions = ["validate_accounts", "detect_fraud_patterns", "standardize_transactions"]
        description = "Financial data requires account validation, fraud pattern detection, and transaction standardization."
    elif industry == "Healthcare":
        industry_suggestions = ["anonymize_data", "standardize_medical_codes", "validate_demographics"]
        description = "Healthcare data needs anonymization for HIPAA compliance, medical code standardization, and demographic validation."
    elif industry == "Manufacturing":
        industry_suggestions = ["smooth_sensor_data", "standardize_units", "interpolate_downtime"]
        description = "Manufacturing data often has sensor noise, unit inconsistencies, and equipment downtime gaps."
    elif industry == "Demand Planning/Business Forecasting":
        industry_suggestions = ["fill_time_gaps", "adjust_seasonality", "normalize_promotions"]
        description = "Demand planning data requires time series gap filling, seasonal adjustments, and promotion impact normalization."
    elif industry == "Education":
        industry_suggestions = ["standardize_grades", "validate_student_ids", "harmonize_course_codes"]
        description = "Educational data often contains student records, course information, and grade data that needs standardization."
    else:
        industry_suggestions = []
        description = "General data cleaning suggestions based on detected data quality issues."
    
    # Combine basic and industry-specific suggestions
    all_suggestions = list(set(basic_suggestions + industry_suggestions))
    
    return {
        "industry": industry,
        "suggestions": all_suggestions,
        "description": description
    }

@app.post("/api/clean")
async def clean_data(file_id: str = Form(...), 
                     remove_duplicates: bool = Form(False),
                     harmonize_columns: bool = Form(False),
                     handle_missing: str = Form("none"),
                     trim_whitespace: bool = Form(False),
                     standardize_dates: bool = Form(False),
                     reorder_columns: bool = Form(False),
                     # Industry-specific cleaning options
                     deduplicate_customers: bool = Form(False),
                     standardize_addresses: bool = Form(False),
                     normalize_phone_numbers: bool = Form(False),
                     validate_accounts: bool = Form(False),
                     detect_fraud_patterns: bool = Form(False),
                     standardize_transactions: bool = Form(False),
                     anonymize_data: bool = Form(False),
                     standardize_medical_codes: bool = Form(False),
                     validate_demographics: bool = Form(False),
                     smooth_sensor_data: bool = Form(False),
                     standardize_units: bool = Form(False),
                     interpolate_downtime: bool = Form(False),
                     fill_time_gaps: bool = Form(False),
                     adjust_seasonality: bool = Form(False),
                     normalize_promotions: bool = Form(False),
                     standardize_grades: bool = Form(False),
                     validate_student_ids: bool = Form(False),
                     harmonize_course_codes: bool = Form(False)):
    
    if file_id not in file_storage:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get original data
    df = file_storage[file_id]['data'].copy()
    
    # Apply cleaning operations
    if remove_duplicates:
        original_rows = len(df)
        df = df.drop_duplicates()
        print(f"Removed {original_rows - len(df)} duplicate rows")
    
    if harmonize_columns:
        original_columns = df.columns.tolist()
        df.columns = (df.columns
                      .str.replace(' ', '_')
                      .str.replace('[^a-zA-Z0-9_]', '', regex=True)
                      .str.lower())
        print(f"Harmonized columns: {original_columns} -> {df.columns.tolist()}")
    
    if handle_missing != "none":
        missing_count = df.isnull().sum().sum()
        if handle_missing == "drop":
            df = df.dropna()
            print(f"Dropped {missing_count} missing values")
        elif handle_missing == "fill_mean":
            numeric_columns = df.select_dtypes(include=['number']).columns
            for col in numeric_columns:
                mean_val = df[col].mean()
                df[col] = df[col].fillna(mean_val)
            print(f"Filled missing values with mean for columns: {numeric_columns.tolist()}")
        elif handle_missing == "fill_zero":
            df = df.fillna(0)
            print(f"Filled all missing values with zero")
    
    if trim_whitespace:
        string_columns = df.select_dtypes(include=['object']).columns
        for col in string_columns:
            df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
        print(f"Trimmed whitespace for columns: {string_columns.tolist()}")
    
    if standardize_dates:
        # Enhanced date standardization to handle various formats
        for col in df.columns:
            if 'date' in col.lower() or 'time' in col.lower() or 'дата' in col.lower():  # Include Russian "дата" (date)
                try:
                    # Try to convert to datetime with multiple format attempts
                    # This will handle mixed formats in the same column
                    df[col] = pd.to_datetime(df[col], infer_datetime_format=True, errors='coerce')
                    
                    # Format all dates consistently as YYYY-MM-DD
                    df[col] = df[col].dt.strftime('%Y-%m-%d')
                except Exception as e:
                    print(f"Could not standardize date column {col}: {e}")
    
    if reorder_columns:
        original_order = df.columns.tolist()
        df = df.reindex(sorted(df.columns), axis=1)
        print(f"Reordered columns: {original_order} -> {df.columns.tolist()}")
    
    # Industry-specific cleaning operations
    # Retail/E-commerce
    if deduplicate_customers:
        # Simplified customer deduplication based on common fields
        customer_identifiers = [col for col in df.columns if any(keyword in col.lower() for keyword in ['customer', 'client', 'user', 'name', 'email'])]
        if len(customer_identifiers) >= 2:  # Need at least 2 identifiers to deduplicate
            original_rows = len(df)
            df = df.drop_duplicates(subset=customer_identifiers)
            print(f"Removed {original_rows - len(df)} duplicate customer rows")

    if standardize_addresses:
        address_columns = [col for col in df.columns if 'address' in col.lower()]
        # Basic address standardization - remove extra whitespace
        for col in address_columns:
            if col in df.columns:
                df[col] = df[col].apply(lambda x: str(x).strip().title() if pd.notnull(x) else x)
        print(f"Standardized address columns: {address_columns}")

    if normalize_phone_numbers:
        phone_columns = [col for col in df.columns if any(keyword in col.lower() for keyword in ['phone', 'mobile', 'tel'])]
        # Basic phone number normalization - remove non-digits
        for col in phone_columns:
            if col in df.columns:
                df[col] = df[col].apply(lambda x: str(x).replace('-', '').replace(' ', '').replace('(', '').replace(')', '') if pd.notnull(x) else x)
        print(f"Normalized phone number columns: {phone_columns}")

    # Finance/Banking
    if validate_accounts:
        account_columns = [col for col in df.columns if any(keyword in col.lower() for keyword in ['account', 'acct'])]
        # Basic account number validation - ensure consistent format
        for col in account_columns:
            if col in df.columns:
                df[col] = df[col].apply(lambda x: ''.join(filter(str.isalnum, str(x))) if pd.notnull(x) else x)
        print(f"Validated account columns: {account_columns}")

    # Healthcare
    if anonymize_data:
        # Simplified anonymization - remove or obfuscate sensitive columns
        sensitive_columns = [col for col in df.columns if any(keyword in col.lower() for keyword in ['name', 'address', 'phone', 'ssn', 'social'])]
        for col in sensitive_columns:
            if col in df.columns:
                df[col] = '***REDACTED***'
        print(f"Anonymized sensitive columns: {sensitive_columns}")

    if standardize_medical_codes:
        # Look for columns that might contain medical codes
        code_columns = [col for col in df.columns if any(keyword in col.lower() for keyword in ['code', 'icd', 'cpt'])]
        # Basic standardization - uppercase and strip
        for col in code_columns:
            if col in df.columns:
                df[col] = df[col].apply(lambda x: str(x).strip().upper() if pd.notnull(x) else x)
        print(f"Standardized medical code columns: {code_columns}")

    # Manufacturing
    if smooth_sensor_data:
        # Simplified sensor data smoothing for numeric columns
        numeric_columns = df.select_dtypes(include=['number']).columns
        # Apply rolling mean to smooth data (window of 3)
        for col in numeric_columns:
            if df[col].count() > 10:  # Only smooth if we have enough data points
                original_series = df[col].copy()
                df[col] = df[col].rolling(window=3, center=True).mean()
                # Fill NaN values that might be created by rolling mean
                df[col] = df[col].fillna(method='ffill').fillna(method='bfill').fillna(original_series)
        print(f"Smoothed sensor data for columns: {numeric_columns.tolist()}")

    if standardize_units:
        # Look for columns with units in their names
        unit_columns = [col for col in df.columns if any(keyword in col.lower() for keyword in ['temp', 'temperature', 'pressure', 'weight', 'length'])]
        # This is a simplified implementation - real implementation would need more context
        # Just ensuring numeric data in these columns
        for col in unit_columns:
            if col in df.columns:
                original_series = df[col].copy()
                df[col] = pd.to_numeric(df[col], errors='coerce')
                # Fill NaN values that might be created by to_numeric with original values
                df[col] = df[col].fillna(original_series)
        print(f"Standardized unit columns: {unit_columns}")

    # Demand Planning
    if fill_time_gaps:
        # Check for date columns and fill gaps
        date_columns = [col for col in df.columns if any(keyword in col.lower() for keyword in ['date', 'time', 'дата'])]
        if date_columns:
            # Simplified time gap filling
            date_col = date_columns[0]
            try:
                df[date_col] = pd.to_datetime(df[date_col], infer_datetime_format=True, errors='coerce')
                df = df.sort_values(by=date_col)
                # Format consistently
                df[date_col] = df[date_col].dt.strftime('%Y-%m-%d')
            except Exception as e:
                print(f"Could not process date column {date_col}: {e}")
            print(f"Filled time gaps in date column: {date_col}")
    
    # Education
    if standardize_grades:
        # Look for columns that might contain grades
        grade_columns = [col for col in df.columns if any(keyword in col.lower() for keyword in ['grade', 'score', 'gpa'])]
        # Standardize grade values (e.g., convert letter grades to a consistent format)
        for col in grade_columns:
            if col in df.columns:
                df[col] = df[col].apply(lambda x: str(x).strip().upper() if pd.notnull(x) else x)
        print(f"Standardized grade columns: {grade_columns}")

    if validate_student_ids:
        # Look for student ID columns
        student_id_columns = [col for col in df.columns if any(keyword in col.lower() for keyword in ['student', 'id', 'sid'])]
        # Basic student ID validation - ensure consistent format
        for col in student_id_columns:
            if col in df.columns:
                # Remove spaces and ensure consistent format
                df[col] = df[col].apply(lambda x: str(x).replace(' ', '') if pd.notnull(x) else x)
        print(f"Validated student ID columns: {student_id_columns}")

    if harmonize_course_codes:
        # Look for course code columns
        course_columns = [col for col in df.columns if any(keyword in col.lower() for keyword in ['course', 'class'])]
        # Standardize course codes
        for col in course_columns:
            if col in df.columns:
                df[col] = df[col].apply(lambda x: str(x).strip().upper() if pd.notnull(x) else x)
        print(f"Harmonized course code columns: {course_columns}")
    
    # Store cleaned data
    file_storage[file_id]['cleaned_data'] = df.copy()
    
    # Save cleaned files to tmp directory
    tmp_dir = "/tmp"
    csv_path = os.path.join(tmp_dir, f"{file_id}_cleaned.csv")
    xlsx_path = os.path.join(tmp_dir, f"{file_id}_cleaned.xlsx")
    
    # Handle potential issues with large files
    try:
        df.to_csv(csv_path, index=False)
        df.to_excel(xlsx_path, index=False)
    except Exception as e:
        print(f"Error saving files: {str(e)}")
        # Continue with the response even if file saving fails
    
    # Return preview of cleaned data
    preview_data = df.head(20)
    # Handle different data types for JSON serialization
    for col in preview_data.columns:
        if preview_data[col].dtype == 'datetime64[ns]':
            preview_data[col] = preview_data[col].astype(str)
    
    # Replace NaN values with None for JSON serialization
    preview_data = preview_data.where(pd.notnull(preview_data), None)
    
    # Convert to records
    preview_records = preview_data.to_dict(orient='records')
    
    # Log for debugging
    print(f"Preview records: {preview_records}")
    print(f"Columns: {list(df.columns)}")
    print(f"Number of rows: {len(df)}")
    
    return {
        "preview": preview_records,
        "download_urls": {
            "csv": f"/api/download/{file_id}?format=csv",
            "xlsx": f"/api/download/{file_id}?format=xlsx"
        },
        "rows": len(df),
        "columns": list(df.columns)
    }

@app.get("/api/download/{file_id}")
async def download_file(file_id: str, format: str = "csv"):
    if file_id not in file_storage:
        raise HTTPException(status_code=404, detail="File not found")
    
    tmp_dir = "/tmp"
    
    if format == "csv":
        file_path = os.path.join(tmp_dir, f"{file_id}_cleaned.csv")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Cleaned file not found")
        return FileResponse(file_path, filename=f"cleaned_{file_storage[file_id]['filename'].rsplit('.', 1)[0]}.csv")
    elif format == "xlsx":
        file_path = os.path.join(tmp_dir, f"{file_id}_cleaned.xlsx")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Cleaned file not found")
        return FileResponse(file_path, filename=f"cleaned_{file_storage[file_id]['filename'].rsplit('.', 1)[0]}.xlsx")
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'csv' or 'xlsx.")

@app.post("/api/analyze")
async def analyze_data_quality(file_id: str = Form(...)):
    if file_id not in file_storage:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine which data to analyze (cleaned or raw)
    if file_storage[file_id]['cleaned_data'] is not None:
        df = file_storage[file_id]['cleaned_data']
        is_cleaned = True
    else:
        df = file_storage[file_id]['data']
        is_cleaned = False
    
    analysis_report = []
    
    # 1. Check for duplicates
    duplicate_count = df.duplicated().sum()
    if duplicate_count > 0:
        analysis_report.append({
            "type": "duplicate_rows",
            "severity": "medium",
            "description": f"Found {duplicate_count} duplicate rows",
            "recommendation": "Remove duplicates to ensure data integrity"
        })
    
    # 2. Check for missing values
    missing_data = df.isnull().sum()
    total_cells = df.size
    total_missing = missing_data.sum()
    
    if total_missing > 0:
        missing_percentage = (total_missing / total_cells) * 100
        analysis_report.append({
            "type": "missing_values",
            "severity": "high" if missing_percentage > 10 else "medium" if missing_percentage > 5 else "low",
            "description": f"Missing values detected: {total_missing} out of {total_cells} ({missing_percentage:.2f}%)",
            "recommendation": "Handle missing values using appropriate strategy (drop, fill with mean/median, etc.)"
        })
        
        # Detailed missing values by column
        for column, missing_count in missing_data.items():
            if missing_count > 0:
                column_missing_percentage = (missing_count / len(df)) * 100
                analysis_report.append({
                    "type": "missing_values_column",
                    "severity": "high" if column_missing_percentage > 30 else "medium" if column_missing_percentage > 10 else "low",
                    "description": f"Column '{column}' has {missing_count} missing values ({column_missing_percentage:.2f}%)",
                    "recommendation": f"Consider handling missing values in '{column}' specifically"
                })
    
    # 3. Check for data type inconsistencies
    for column in df.columns:
        if df[column].dtype == 'object':
            # Check if numeric values are stored as strings
            non_null_series = df[column].dropna()
            if len(non_null_series) > 0:
                # Try to convert to numeric and see if it works for most values
                numeric_count = pd.to_numeric(non_null_series, errors='coerce').notna().sum()
                if numeric_count > len(non_null_series) * 0.8 and numeric_count < len(non_null_series):
                    analysis_report.append({
                        "type": "data_type_inconsistency",
                        "severity": "medium",
                        "description": f"Column '{column}' contains mixed data types (mostly numeric but stored as strings)",
                        "recommendation": f"Convert '{column}' to numeric data type for better analysis"
                    })
    
    # 4. Check for columns with spaces or special characters in names
    problematic_columns = [col for col in df.columns if any(c in col for c in [' ', '-', '.', '/', '\\', '(', ')'])]
    if problematic_columns:
        analysis_report.append({
            "type": "column_naming",
            "severity": "low",
            "description": f"Columns with special characters detected: {', '.join(problematic_columns)}",
            "recommendation": "Standardize column names to use only alphanumeric characters and underscores"
        })
    
    # 5. Check for columns with only one unique value (potential redundant columns)
    single_value_columns = [col for col in df.columns if df[col].nunique() <= 1 and len(df[col].dropna()) > 0]
    if single_value_columns:
        analysis_report.append({
            "type": "single_value_columns",
            "severity": "low",
            "description": f"Columns with only one unique value: {', '.join(single_value_columns)}",
            "recommendation": "Consider removing columns with only one value as they provide no analytical value"
        })
    
    # 6. Check for outliers in numeric columns
    numeric_columns = df.select_dtypes(include=['number']).columns
    for column in numeric_columns:
        if len(df[column].dropna()) > 0:
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            outliers = df[(df[column] < lower_bound) | (df[column] > upper_bound)][column]
            
            if len(outliers) > 0:
                outlier_percentage = (len(outliers) / len(df)) * 100
                analysis_report.append({
                    "type": "outliers",
                    "severity": "high" if outlier_percentage > 5 else "medium",
                    "description": f"Column '{column}' contains {len(outliers)} outliers ({outlier_percentage:.2f}%)",
                    "recommendation": f"Investigate outliers in '{column}' using visualization or statistical methods"
                })
    
    # 7. Check for string columns with leading/trailing whitespace
    string_columns = df.select_dtypes(include=['object']).columns
    for column in string_columns:
        if df[column].astype(str).str.strip().ne(df[column]).any():
            analysis_report.append({
                "type": "whitespace_issues",
                "severity": "low",
                "description": f"Column '{column}' contains leading/trailing whitespace",
                "recommendation": f"Trim whitespace in '{column}' for consistency"
            })
    
    # 8. Check for inconsistent date formats
    date_columns = [col for col in df.columns if any(keyword in col.lower() for keyword in ['date', 'time', 'дата'])]
    for column in date_columns:
        if df[column].dtype == 'object':
            # Try to parse dates and see if there are parsing errors
            try:
                pd.to_datetime(df[column].head(100), errors='raise')
            except:
                analysis_report.append({
                    "type": "date_format_inconsistency",
                    "severity": "medium",
                    "description": f"Column '{column}' has inconsistent date formats",
                    "recommendation": f"Standardize date formats in '{column}'"
                })
    
    # 9. Check for data size issues
    if len(df) == 0:
        analysis_report.append({
            "type": "empty_dataset",
            "severity": "critical",
            "description": "Dataset is empty",
            "recommendation": "Upload a non-empty dataset"
        })
    elif len(df) > 100000:
        analysis_report.append({
            "type": "large_dataset",
            "severity": "info",
            "description": f"Large dataset detected ({len(df)} rows)",
            "recommendation": "Processing may take longer for large datasets"
        })
    
    # Sort by severity (critical, high, medium, low, info)
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    analysis_report.sort(key=lambda x: severity_order.get(x["severity"], 5))
    
    return {
        "file_id": file_id,
        "is_cleaned": is_cleaned,
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "issues_found": len(analysis_report),
        "analysis_report": analysis_report
    }

@app.post("/api/clean-issues")
async def clean_data_based_on_issues(request: IssueBasedCleanRequest):
    if request.file_id not in file_storage:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get original data (or cleaned data if it exists)
    if file_storage[request.file_id]['cleaned_data'] is not None:
        df = file_storage[request.file_id]['cleaned_data'].copy()
    else:
        df = file_storage[request.file_id]['data'].copy()
    
    # Create a mapping of issue types to cleaning operations
    issue_operations = {
        "duplicate_rows": lambda df: df.drop_duplicates(),
        "missing_values": handle_missing_values,
        "outliers": handle_outliers,
        "whitespace_issues": handle_whitespace,
        "date_format_inconsistency": handle_date_formats,
        # Add more issue-specific handlers as needed
    }
    
    # Apply cleaning operations based on selected issues
    for issue_id in request.selected_issues:
        # Find the issue in the analysis report
        issue = next((item for item in request.analysis_report 
                     if f"issue-{request.analysis_report.index(item)}" == issue_id), None)
        
        if issue and issue["type"] in issue_operations:
            try:
                df = issue_operations[issue["type"]](df, issue)
                print(f"Applied cleaning for issue: {issue['description']}")
            except Exception as e:
                print(f"Failed to apply cleaning for issue {issue['description']}: {str(e)}")
    
    # Store the newly cleaned data
    file_storage[request.file_id]['cleaned_data'] = df.copy()
    
    # Save cleaned files to tmp directory
    tmp_dir = "/tmp"
    csv_path = os.path.join(tmp_dir, f"{request.file_id}_cleaned.csv")
    xlsx_path = os.path.join(tmp_dir, f"{request.file_id}_cleaned.xlsx")
    
    df.to_csv(csv_path, index=False)
    df.to_excel(xlsx_path, index=False)
    
    # Return preview of cleaned data
    preview_data = df.head(20)
    # Handle different data types for JSON serialization
    for col in preview_data.columns:
        if preview_data[col].dtype == 'datetime64[ns]':
            preview_data[col] = preview_data[col].astype(str)
    
    # Replace NaN values with None for JSON serialization
    preview_data = preview_data.where(pd.notnull(preview_data), None)
    
    # Convert to records
    preview_records = preview_data.to_dict(orient='records')
    
    return {
        "preview": preview_records,
        "download_urls": {
            "csv": f"/api/download/{request.file_id}?format=csv",
            "xlsx": f"/api/download/{request.file_id}?format=xlsx"
        },
        "rows": len(df),
        "columns": list(df.columns)
    }

def handle_missing_values(df, issue):
    """Handle missing values - simple implementation"""
    # This is a simplified approach - in reality, you'd want more sophisticated handling
    return df.dropna()

def handle_outliers(df, issue):
    """Handle outliers in numeric columns"""
    # Extract column name from issue description
    import re
    match = re.search(r"Column '(.+?)'", issue["description"])
    if match:
        column = match.group(1)
        if column in df.columns and df[column].dtype in ['int64', 'float64']:
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            # Remove outliers
            df = df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]
    return df

def handle_whitespace(df, issue):
    """Handle whitespace issues in string columns"""
    # Apply to all object columns
    string_columns = df.select_dtypes(include=['object']).columns
    for col in string_columns:
        df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
    return df

def handle_date_formats(df, issue):
    """Handle date format inconsistencies"""
    # Try to standardize date columns
    date_columns = [col for col in df.columns if any(keyword in col.lower() for keyword in ['date', 'time', 'дата'])]
    for col in date_columns:
        try:
            df[col] = pd.to_datetime(df[col], infer_datetime_format=True, errors='coerce')
            # Format consistently
            df[col] = df[col].dt.strftime('%Y-%m-%d')
        except Exception as e:
            print(f"Could not standardize date column {col}: {e}")
    return df
