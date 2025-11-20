import pandas as pd
import numpy as np
import sys
import os

# Add the backend directory to the path so we can import the function
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from main import prepare_dataframe_for_json

# Create a test DataFrame with NaN values
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie', 'David'],
    'age': [25, np.nan, 30, 22],
    'score': [85.5, 90.0, np.nan, 75.5],
    'date': pd.to_datetime(['2023-01-01', '2023-01-02', np.nan, '2023-01-04'])
})

print("Original DataFrame:")
print(df)
print("\nDataFrame dtypes:")
print(df.dtypes)

# Test the prepare_dataframe_for_json function
try:
    result = prepare_dataframe_for_json(df)
    print("\nAfter prepare_dataframe_for_json:")
    print(result)
    print("\nResult dtypes:")
    print(result.dtypes)
    
    # Try to convert to JSON
    json_result = result.to_dict(orient='records')
    print("\nJSON conversion successful:")
    print(json_result)
    
except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()