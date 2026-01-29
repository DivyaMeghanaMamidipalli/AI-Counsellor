// Frontend constants matching backend
export const MAJOR_OPTIONS = [
  "Computer Science",
  "Engineering / Technology",
  "Science",
  "Business / Commerce",
  "Arts / Humanities",
  "Medicine / Healthcare",
  "Law",
  "Other"
];

export const FIELD_OPTIONS = [
  "Computer Science / IT",
  "Engineering",
  "Business / MBA",
  "Data Science / Analytics",
  "Medicine / Public Health",
  "Arts / Design",
  "Law",
  "Other"
];

export const COUNTRY_OPTIONS = [
  "USA",
  "UK",
  "Canada",
  "Australia",
  "Germany",
  "Singapore",
  "New Zealand",
  "Ireland",
];

export const EDUCATION_LEVELS = [
  "Undergraduate",
  "Bachelor's",
  "Graduate",
  "Master's",
  "Other"
];

export const BUDGET_RANGES = [
  "0-30000",
  "30000-50000",
  "50000-70000",
  "70000+",
  "No budget limit"
];

export const FUNDING_TYPES = [
  "Scholarship-dependent",
  "Loan-dependent",
  "Self-funded",
  "Mixed funding"
];

export const EXAM_STATUSES = [
  "Not started",
  "Planned",
  "Scheduled",
  "In progress",
  "Completed"
];

// Map major to potential fields for cascading selection
export const MAJOR_TO_FIELDS: Record<string, string[]> = {
  "Computer Science": ["Computer Science / IT", "Data Science / Analytics"],
  "Engineering / Technology": ["Engineering", "Computer Science / IT"],
  "Science": ["Data Science / Analytics", "Medicine / Public Health"],
  "Business / Commerce": ["Business / MBA"],
  "Arts / Humanities": ["Arts / Design", "Law"],
  "Medicine / Healthcare": ["Medicine / Public Health"],
  "Law": ["Law"],
};
