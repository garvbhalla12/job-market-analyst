
from pathlib import Path
import pandas as pd
import re

# Project root directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Cleaned dataset location
DATASET_PATH = PROJECT_ROOT / "dataset" / "jobs_cleaned.csv"

SKILL_DEMAND_PATH = PROJECT_ROOT / "dataset" / "skill_demand.csv"


# 1. Load cleaned job dataset
def load_jobs():

    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found at: {DATASET_PATH}"
        )

    df = pd.read_csv(DATASET_PATH)

    return df


# 2. Calculate dashboard overview
def get_overview():

    df = load_jobs()

    total_jobs = len(df)

    # Exclude placeholder company names
    known_companies = (
        df["company"]
        .dropna()
        .astype(str)
        .str.strip()
    )

    total_companies = known_companies[
        known_companies.ne("Unknown Company")
    ].nunique()

    # Salary disclosure statistics
    salary = (
        df["salary_range"]
        .fillna("Not Disclosed")
        .astype(str)
        .str.strip()
    )

    salary_disclosed = salary.ne("Not Disclosed").sum()
    salary_not_disclosed = salary.eq("Not Disclosed").sum()

    # Workplace distribution
    workplace_distribution = (
        df["workplace_type"]
        .fillna("Not Specified")
        .value_counts()
        .to_dict()
    )

    # Employment type distribution
    employment_distribution = (
        df["employment_type"]
        .fillna("Not Specified")
        .value_counts()
        .to_dict()
    )

    return {
        "total_jobs": int(total_jobs),
        "total_companies": int(total_companies),
        "salary_disclosed": int(salary_disclosed),
        "salary_not_disclosed": int(salary_not_disclosed),
        "workplace_distribution": workplace_distribution,
        "employment_distribution": employment_distribution
    }




# 3. Calculate technical skill demand
def get_skill_demand(limit=15):

    if not SKILL_DEMAND_PATH.exists():
        raise FileNotFoundError(
            f"Skill demand dataset not found: {SKILL_DEMAND_PATH}"
        )

    # Load skill demand dataset
    skills_df = pd.read_csv(SKILL_DEMAND_PATH)

    # Validate required columns
    required_columns = {"Skill", "Job_Count"}

    if not required_columns.issubset(skills_df.columns):
        raise ValueError(
            "skill_demand.csv must contain Skill and Job_Count columns"
        )

    # Load total number of job postings
    total_jobs = len(load_jobs())

    if total_jobs == 0:
        return []

    # Clean and prepare data
    skills_df["Skill"] = skills_df["Skill"].astype(str).str.strip()
    skills_df["Job_Count"] = pd.to_numeric(
        skills_df["Job_Count"], errors="coerce"
    ).fillna(0)

    # Sort skills by job count
    skills_df = skills_df.sort_values(
        by="Job_Count",
        ascending=False
    )

    # Calculate demand percentage
    skills_df["Demand_Percentage"] = (
        skills_df["Job_Count"] / total_jobs
    ) * 100

    # Return top demanded skills
    top_skills = skills_df.head(limit)

    result = []

    for _, row in top_skills.iterrows():

        result.append({
            "skill": row["Skill"],
            "job_count": int(row["Job_Count"]),
            "demand_percentage": round(
                float(row["Demand_Percentage"]), 2
            )
        })

    return result




# 4. Parse salary range into numerical values
def parse_salary_range(salary_text):

    if pd.isna(salary_text):
        return None

    salary_text = str(salary_text).strip()

    if salary_text.lower() == "not disclosed":
        return None

    # Extract numerical salary and pay period
    pattern = r"\$?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(K)?\s*/\s*(yr|hr)"

    matches = re.findall(pattern, salary_text, flags=re.IGNORECASE)

    if not matches:
        return None

    salaries = []
    pay_periods = []

    for value, suffix, period in matches:

        amount = float(value.replace(",", ""))

        # Convert K into thousands
        if suffix and suffix.upper() == "K":
            amount *= 1000

        salaries.append(amount)
        pay_periods.append(period.lower())

    # Avoid mixing annual and hourly salaries
    if len(set(pay_periods)) != 1:
        return None

    return {
        "minimum_salary": min(salaries),
        "maximum_salary": max(salaries),
        "pay_period": pay_periods[0]
    }




# Validate salary records before statistical analysis
def is_valid_salary(salary):

    if salary is None:
        return False

    minimum = salary["minimum_salary"]
    maximum = salary["maximum_salary"]
    period = salary["pay_period"]

    # Invalid or impossible ranges
    if minimum <= 0 or maximum <= 0:
        return False

    if minimum > maximum:
        return False

    # Annual salary validation
    if period == "yr" and minimum < 1000:
        return False

    # Hourly salary validation
    if period == "hr" and maximum > 500:
        return False

    return True




# Calculate validated salary analytics
def get_salary_analytics():

    df = load_jobs()

    parsed_salaries = []

    for original_salary in df["salary_range"]:

        parsed = parse_salary_range(original_salary)

        if parsed is not None:

            parsed_salaries.append({
                **parsed,
                "original_salary": original_salary
            })

    # Convert records into DataFrame
    salary_df = pd.DataFrame(parsed_salaries)

    if salary_df.empty:
        return {
            "total_parsed_jobs": 0,
            "valid_jobs": 0,
            "excluded_jobs": 0,
            "salary_by_period": {}
        }

    # Identify invalid salary records
    valid_mask = salary_df.apply(
        lambda row: is_valid_salary(row.to_dict()),
        axis=1
    )

    valid_df = salary_df[valid_mask].copy()

    excluded_df = salary_df[~valid_mask].copy()

    # Calculate midpoint
    valid_df["midpoint_salary"] = (
        valid_df["minimum_salary"] +
        valid_df["maximum_salary"]
    ) / 2

    results = {}

    for period in ["yr", "hr"]:

        period_df = valid_df[
            valid_df["pay_period"] == period
        ]

        if period_df.empty:
            continue

        results[period] = {
            "job_count": int(len(period_df)),

            "minimum_salary": round(
                float(period_df["minimum_salary"].min()), 2
            ),

            "maximum_salary": round(
                float(period_df["maximum_salary"].max()), 2
            ),

            "average_salary": round(
                float(period_df["midpoint_salary"].mean()), 2
            ),

            "median_salary": round(
                float(period_df["midpoint_salary"].median()), 2
            )
        }

    return {
        "total_parsed_jobs": int(len(salary_df)),
        "valid_jobs": int(len(valid_df)),
        "excluded_jobs": int(len(excluded_df)),
        "salary_by_period": results
    }




# 6. Analyze job locations
def get_location_analytics(limit=15):

    df = load_jobs()

    # Clean location values without merging different locations
    locations = (
        df["location"]
        .fillna("Not Specified")
        .astype(str)
        .str.strip()
    )

    locations = locations.replace("", "Not Specified")

    # Count jobs per location
    location_counts = locations.value_counts()

    total_jobs = len(df)

    top_locations = []

    for location, count in location_counts.head(limit).items():

        top_locations.append({
            "location": location,
            "job_count": int(count),
            "percentage": round(
                (count / total_jobs) * 100, 2
            )
        })

    # Broad geographic labels
    broad_locations = {
        "United States",
        "California, United States"
    }

    broad_location_jobs = int(
        locations.isin(broad_locations).sum()
    )

    return {
        "total_unique_locations": int(locations.nunique()),
        "top_locations": top_locations,
        "broad_location_jobs": broad_location_jobs
    }


# 7. Analyze workplace distribution
def get_workplace_analytics():

    df = load_jobs()

    workplace = (
        df["workplace_type"]
        .fillna("Not Specified")
        .astype(str)
        .str.strip()
    )

    workplace = workplace.replace("", "Not Specified")

    counts = workplace.value_counts()

    total_jobs = len(df)

    results = []

    for workplace_type, count in counts.items():

        results.append({
            "workplace_type": workplace_type,
            "job_count": int(count),
            "percentage": round(
                (count / total_jobs) * 100, 2
            )
        })

    return {
        "total_jobs": int(total_jobs),
        "workplace_distribution": results
    }


# 8. Analyze locations with remote opportunities
def get_remote_location_analytics(limit=15):

    df = load_jobs()

    # Select only remote jobs
    remote_df = df[
        df["workplace_type"]
        .fillna("")
        .astype(str)
        .str.strip()
        .str.casefold() == "remote"
    ]

    locations = (
        remote_df["location"]
        .fillna("Not Specified")
        .astype(str)
        .str.strip()
    )

    locations = locations.replace("", "Not Specified")

    remote_counts = locations.value_counts()

    results = []

    for location, count in remote_counts.head(limit).items():

        results.append({
            "location": location,
            "remote_job_count": int(count)
        })

    return {
        "total_remote_jobs": int(len(remote_df)),
        "top_remote_locations": results
    }




# 9. Analyze employment types
def get_employment_analytics():

    df = load_jobs()

    employment = (
        df["employment_type"]
        .fillna("Not Specified")
        .astype(str)
        .str.strip()
    )

    employment = employment.replace("", "Not Specified")

    counts = employment.value_counts()

    total_jobs = len(df)

    results = []

    for employment_type, count in counts.items():

        results.append({
            "employment_type": employment_type,
            "job_count": int(count),
            "percentage": round(
                (count / total_jobs) * 100, 2
            )
        })

    return {
        "total_jobs": int(total_jobs),
        "employment_distribution": results
    }



def categorize_job_role(title):
    title = str(title).lower()

    # Order matters: check more specific roles first.
    categories = [
        ("AI / Machine Learning", r"\b(ai|artificial intelligence|machine learning|ml|deep learning|nlp|llm)\b"),
        ("Data Engineering / Analytics", r"\b(data engineer|data analyst|data scientist|analytics engineer|data science)\b"),
        ("DevOps / Cloud", r"\b(devops|cloud engineer|site reliability|sre|platform engineer|kubernetes)\b"),
        ("QA / Testing", r"\b(qa|quality assurance|test engineer|software tester|automation tester)\b"),
        ("Mobile Development", r"\b(android|ios|flutter|react native|mobile developer|mobile engineer)\b"),
        ("Frontend Development", r"\b(frontend|front-end|front end|react developer|angular developer|vue developer|ui developer)\b"),
        ("Backend Development", r"\b(backend|back-end|back end|api developer|server-side)\b"),
        ("Full Stack Development", r"\b(full.?stack)\b"),
        ("Java Development", r"\bjava\b"),
        ("Python Development", r"\bpython\b"),
        ("Software Engineering", r"\b(software engineer|software developer|software engineering)\b"),
        ("Web Development", r"\b(web developer|web development)\b"),
    ]

    for category, pattern in categories:
        if re.search(pattern, title):
            return category

    return "Other"


def get_job_role_analytics():
    df = load_jobs()

    df["job_role_category"] = df["title"].apply(categorize_job_role)

    counts = df["job_role_category"].value_counts()

    total_jobs = len(df)
    results = []

    for category, count in counts.items():
        results.append({
            "category": category,
            "job_count": int(count),
            "percentage": round((count / total_jobs) * 100, 2)
        })

    return {
        "total_jobs": int(total_jobs),
        "role_distribution": results
    }




def get_company_analytics(limit=15):
    df = load_jobs()

    # Remove placeholder company names
    companies = df[
        df["company"].notna()
        & (df["company"].astype(str).str.strip() != "")
        & (df["company"].astype(str).str.strip() != "Unknown Company")
    ]

    total_jobs = len(df)

    company_counts = (
        companies["company"]
        .astype(str)
        .str.strip()
        .value_counts()
        .head(limit)
    )

    results = []

    for company, count in company_counts.items():
        results.append({
            "company": company,
            "job_count": int(count),
            "percentage": round((count / total_jobs) * 100, 2)
        })

    return {
        "total_companies": int(companies["company"].nunique()),
        "total_jobs": int(total_jobs),
        "top_companies": results
    }




def get_fresher_analytics():
    df = load_jobs()

    # Keywords indicating entry-level opportunities
    fresher_keywords = [
        "fresher",
        "entry level",
        "entry-level",
        "junior",
        "graduate",
        "new grad",
        "recent graduate",
        "trainee",
        "associate",
        "early career"
    ]

    title_text = df["title"].fillna("").astype(str).str.lower()
    description_text = df["description"].fillna("").astype(str).str.lower()

    # Check both job title and description
    title_match = title_text.apply(
        lambda title: any(keyword in title for keyword in fresher_keywords)
    )

    description_match = description_text.apply(
        lambda description: any(
            keyword in description for keyword in fresher_keywords
        )
    )

    fresher_mask = title_match | description_match

    fresher_jobs = df[fresher_mask]

    internship_jobs = df[
        df["employment_type"].str.contains(
            "internship", case=False, na=False
        )
    ]

    return {
        "total_jobs": int(len(df)),
        "fresher_jobs": int(len(fresher_jobs)),
        "internship_jobs": int(len(internship_jobs)),
        "fresher_percentage": round(
            len(fresher_jobs) / len(df) * 100, 2
        ),
        "internship_percentage": round(
            len(internship_jobs) / len(df) * 100, 2
        ),
        "fresher_and_internship_overlap": int(
            (fresher_mask & df["employment_type"].str.contains(
                "internship", case=False, na=False
            )).sum()
        )
    }




def get_job_explorer(
    search=None,
    workplace_type=None,
    employment_type=None,
    location=None,
    limit=50
):
    df = load_jobs()

    # Search by title or company
    if search:
        search = search.strip().lower()

        mask = (
            df["title"].fillna("").str.lower().str.contains(search, regex=False)
            | df["company"].fillna("").str.lower().str.contains(search, regex=False)
        )

        df = df[mask]

    # Filter workplace type
    if workplace_type:
        df = df[
            df["workplace_type"].str.lower() == workplace_type.lower()
        ]

    # Filter employment type
    if employment_type:
        df = df[
            df["employment_type"].str.lower() == employment_type.lower()
        ]

    # Filter location
    if location:
        df = df[
            df["location"].fillna("").str.lower().str.contains(
                location.lower(), regex=False
            )
        ]

    total_results = len(df)

    # Return only the requested number of jobs
    df = df.head(max(1, min(limit, 100)))

    jobs = df[
        [
            "id",
            "title",
            "company",
            "location",
            "salary_range",
            "workplace_type",
            "employment_type"
        ]
    ].fillna("").to_dict(orient="records")

    return {
        "total_results": int(total_results),
        "returned_results": len(jobs),
        "jobs": jobs
    }





# 3. Run analytics directly for testing
if __name__ == "__main__":

    overview = get_overview()

    print("\n========== JOB MARKET OVERVIEW ==========\n")

    for key, value in overview.items():
        print(f"{key}: {value}")

    print("\n========== TOP 15 DEMANDED SKILLS ==========\n")

    skills = get_skill_demand()

    for index, skill in enumerate(skills, start=1):

        print(
            f"{index}. {skill['skill']} | "
            f"Jobs: {skill['job_count']} | "
            f"Demand: {skill['demand_percentage']}%"
        )


    print("\n========== VALIDATED SALARY ANALYTICS ==========\n")

    salary_data = get_salary_analytics()

    print("Total parsed jobs:", salary_data["total_parsed_jobs"])
    print("Valid salary records:", salary_data["valid_jobs"])
    print("Excluded suspicious records:", salary_data["excluded_jobs"])

    for period, metrics in salary_data["salary_by_period"].items():

        label = "Annual" if period == "yr" else "Hourly"

        print(f"\n{label} Salary Statistics:")

        for key, value in metrics.items():
            print(f"{key}: {value}")


    # Location analytics
    print("\n========== LOCATION ANALYTICS ==========\n")

    location_data = get_location_analytics()

    print("Unique locations:", location_data["total_unique_locations"])
    print("Broad location postings:", location_data["broad_location_jobs"])

    print("\nTop Hiring Locations:")

    for index, item in enumerate(
        location_data["top_locations"], start=1
    ):
        print(
            f"{index}. {item['location']} | "
            f"Jobs: {item['job_count']} | "
            f"Share: {item['percentage']}%"
        )


    # Workplace analytics
    print("\n========== WORKPLACE ANALYTICS ==========\n")

    workplace_data = get_workplace_analytics()

    for item in workplace_data["workplace_distribution"]:
        print(
            f"{item['workplace_type']}: "
            f"{item['job_count']} jobs "
            f"({item['percentage']}%)"
        )


    # Remote location analytics
    print("\n========== REMOTE LOCATION ANALYTICS ==========\n")

    remote_data = get_remote_location_analytics()

    print("Total remote jobs:", remote_data["total_remote_jobs"])

    for item in remote_data["top_remote_locations"]:
        print(
            f"{item['location']}: "
            f"{item['remote_job_count']} remote jobs"
        )


    # Employment analytics
    print("\n========== EMPLOYMENT TYPE ANALYTICS ==========\n")

    employment_data = get_employment_analytics()

    for item in employment_data["employment_distribution"]:

        print(
            f"{item['employment_type']}: "
            f"{item['job_count']} jobs "
            f"({item['percentage']}%)"
        )


    print("\n========== JOB ROLE ANALYTICS ==========")

    role_data = get_job_role_analytics()

    for item in role_data["role_distribution"]:
        print(
            f"{item['category']}: "
            f"{item['job_count']} jobs "
            f"({item['percentage']}%)"
        )


    print("\n========== TOP HIRING COMPANIES ==========")

    company_data = get_company_analytics()

    print("Total Companies:", company_data["total_companies"])

    for item in company_data["top_companies"]:
        print(
            f"{item['company']}: "
            f"{item['job_count']} jobs "
            f"({item['percentage']}%)"
        )

    print("\n========== FRESHER & INTERNSHIP ANALYTICS ==========")

    fresher_data = get_fresher_analytics()

    for key, value in fresher_data.items():
        print(f"{key}: {value}")


    print("\n========== JOB EXPLORER TEST ==========")

    explorer_data = get_job_explorer(
        search="software engineer",
        workplace_type="Remote",
        limit=5
    )

    print("Total matching jobs:", explorer_data["total_results"])

    for job in explorer_data["jobs"]:
        print(job)








