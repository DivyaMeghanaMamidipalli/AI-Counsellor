"""
Constants and options for onboarding and recommendations
"""

# Major categories (broader subject areas)
MAJOR_OPTIONS = [
    "Computer Science",
    "Engineering / Technology",
    "Science",
    "Business / Commerce",
    "Arts / Humanities",
    "Medicine / Healthcare",
    "Law",
    "Other"
]

# Field of study (more specific degree programs)
FIELD_OPTIONS = [
    "Computer Science / IT",
    "Engineering",
    "Business / MBA",
    "Data Science / Analytics",
    "Medicine / Public Health",
    "Arts / Design",
    "Law",
    "Other"
]

# Predefined country list
COUNTRY_OPTIONS = [
    "USA",
    "UK",
    "Canada",
    "Australia",
    "Germany",
    "Singapore",
    "New Zealand",
    "Ireland",
]

# Education levels
EDUCATION_LEVELS = [
    "Undergraduate",
    "Bachelor's",
    "Graduate",
    "Master's",
    "Other"
]

# Budget ranges
BUDGET_RANGES = [
    "0-30000",
    "30000-50000",
    "50000-70000",
    "70000+",
    "No budget limit"
]

# Funding types
FUNDING_TYPES = [
    "Scholarship-dependent",
    "Loan-dependent",
    "Self-funded",
    "Mixed funding"
]

# Exam statuses
EXAM_STATUSES = [
    "Not started",
    "Planned",
    "Scheduled",
    "In progress",
    "Completed"
]

# Task statuses
TASK_STATUSES = [
    "pending",
    "in_progress",
    "completed"
]

# Field-to-University mapping for better filtering and acceptance scoring
FIELD_CATEGORIES = {
    "Computer Science / IT": ["Computer Science", "IT", "Information Technology", "Software", "Data", "AI", "Machine Learning"],
    "Engineering": ["Engineering", "Mechanical", "Electrical", "Civil", "Software Engineering"],
    "Data Science / Analytics": ["Data Science", "Data Analytics", "Analytics", "Statistics", "Big Data"],
    "Business / MBA": ["Business", "MBA", "Commerce", "Management", "Accounting", "Finance"],
    "Medicine / Public Health": ["Medicine", "Healthcare", "Public Health", "Nursing", "Pharmacy"],
    "Arts / Design": ["Arts", "Design", "Humanities", "Liberal Arts", "Fine Arts"],
    "Law": ["Law", "Legal Studies"],
}

# Map major to potential fields
MAJOR_TO_FIELDS = {
    "Computer Science": ["Computer Science / IT", "Data Science / Analytics"],
    "Engineering / Technology": ["Engineering", "Computer Science / IT"],
    "Science": ["Data Science / Analytics", "Medicine / Public Health"],
    "Business / Commerce": ["Business / MBA"],
    "Arts / Humanities": ["Arts / Design", "Law"],
    "Medicine / Healthcare": ["Medicine / Public Health"],
    "Law": ["Law"],
}
