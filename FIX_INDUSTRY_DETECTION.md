# Fix for Incorrect Industry Detection

## Problem Description

The industry detection algorithm incorrectly identifies crime-related datasets as "Education" with 100% confidence. This happens because the current algorithm has flaws in how it evaluates and scores different industries.

## Root Cause Analysis

Looking at the current [detect_industry_internal](file:///Users/sittminthar/Desktop/Data%20Cleanr/backend/main.py#L103-L216) function in [backend/main.py](file:///Users/sittminthar/Desktop/Data%20Cleanr/backend/main.py):

1. The algorithm counts keywords for each industry but doesn't properly weight them
2. The education detection has special cases that boost scores based on file names and "course-related" terms
3. The confidence calculation is flawed - it divides the winning industry score by the sum of all scores, but when all scores are 0, this can lead to unexpected behavior
4. The crime dataset doesn't contain obvious education keywords, yet it's still being classified as education

## Recommended Fixes

### 1. Improve Industry Scoring Logic

Replace the current simplistic keyword counting with a more robust scoring system:

```python
# Better confidence calculation
total_score = sum(industry_scores.values())
if total_score > 0:
    confidence = industry_scores[detected_industry] / total_score
else:
    confidence = 0.0
```

### 2. Add Law Enforcement/Criminal Justice Industry Category

Since this is clearly a criminal justice dataset, add a new industry category:

```python
# Add to industry_scores
"law_enforcement": 0

# Add law enforcement keywords
law_enforcement_keywords = [
    'crime', 'offense', 'incident', 'case', 'arrest', 'charge', 'violation', 
    'weapon', 'battery', 'assault', 'robbery', 'theft', 'trespass', 
    'domestic', 'location', 'date', 'primary_type', 'description'
]
```

### 3. Improve Confidence Calculation

Instead of dividing by the sum of all scores, calculate confidence as a percentage of matched keywords vs. total possible keywords:

```python
# More accurate confidence calculation
max_possible_score = len(education_keywords)  # Or whatever industry keywords
if max_possible_score > 0:
    confidence = industry_scores[detected_industry] / max_possible_score
else:
    confidence = 0.0
```

### 4. Add Minimum Threshold

Only assign an industry if the confidence score meets a minimum threshold:

```python
# Only classify if confidence is above threshold
MIN_CONFIDENCE_THRESHOLD = 0.1
if confidence >= MIN_CONFIDENCE_THRESHOLD:
    final_industry = industry_mapping.get(detected_industry, "General")
else:
    final_industry = "General"
```

## Implementation Steps

1. Add "Law Enforcement" as a new industry category with appropriate keywords
2. Fix the confidence calculation to be more accurate
3. Add a minimum threshold for industry classification
4. Re-test with the crime dataset to ensure it's properly categorized

## Testing

After implementing these changes, test with:
1. The crime dataset that was incorrectly classified
2. Actual education datasets to ensure they still work
3. Other industry datasets to ensure no regressions

This should significantly improve the accuracy of industry detection.