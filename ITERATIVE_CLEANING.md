# Iterative Data Cleaning Feature

## Overview

The Iterative Data Cleaning feature allows users to apply cleaning operations to their datasets repeatedly, with the ability to choose between traditional cleaning options and issue-based cleaning. This enables users to progressively refine their data quality through multiple rounds of targeted operations.

## How It Works

### Two Cleaning Approaches

1. **Traditional Cleaning**
   - Predefined cleaning operations with configurable options
   - Industry-specific cleaning functions
   - Familiar interface for users accustomed to traditional data cleaning workflows

2. **Issue-Based Cleaning**
   - Data quality issues automatically detected and presented in a checklist
   - Users can select specific issues to address
   - Operations applied based on the nature of each selected issue

### Iterative Process

Users can clean their data multiple times in sequence:
1. Upload dataset
2. Perform initial cleaning (either traditional or issue-based)
3. Analyze cleaned data to identify remaining issues
4. Perform additional cleaning operations on the already cleaned data
5. Repeat steps 3-4 as needed

## Technical Implementation

### Frontend

- Tab-based interface in the Clean Options modal to switch between cleaning approaches
- State management for tracking selected issues in issue-based cleaning
- Integration with existing data flow and analysis components

### Backend

- New `/api/clean-issues` endpoint for issue-based cleaning operations
- Functions to handle specific data quality issues:
  - Duplicate row removal
  - Missing value handling
  - Outlier detection and removal
  - Whitespace normalization
  - Date format standardization
- Progressive data storage that preserves cleaning history

## User Benefits

1. **Granular Control**: Users can address specific data quality issues rather than applying broad cleaning operations
2. **Iterative Refinement**: Users can progressively improve data quality through multiple cleaning steps
3. **Flexible Workflow**: Users can switch between traditional and issue-based cleaning approaches as needed
4. **Transparent Process**: Each cleaning operation is clearly identified and can be selectively applied

## Example Workflow

1. User uploads a dataset with outliers in the 'Quantity' column and missing values in the 'UnitPrice' column
2. System detects these issues and presents them in the Issue-Based Cleaning tab
3. User selects both issues and clicks "Apply Selected Issues"
4. System removes outliers and fills missing values
5. User analyzes the cleaned data and discovers new issues
6. User repeats the process with the newly identified issues
7. Process continues until data quality is satisfactory

## Future Enhancements

1. **Enhanced Issue Detection**: More sophisticated algorithms for identifying data quality issues
2. **Custom Cleaning Operations**: Allow users to define their own cleaning operations
3. **Cleaning History**: Track and display the sequence of cleaning operations applied
4. **Undo Functionality**: Allow users to revert specific cleaning operations