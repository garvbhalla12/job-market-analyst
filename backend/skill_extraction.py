
SKILLS = [
    "Python",
    "Java",
    "C++",
    "JavaScript",
    "TypeScript",
    "SQL",
    "MongoDB",
    "PostgreSQL",
    "React",
    "Node.js",
    "Express.js",
    "FastAPI",
    "Django",
    "Flask",
    "Machine Learning",
    "Deep Learning",
    "Natural Language Processing",
    "TensorFlow",
    "PyTorch",
    "Scikit-learn",
    "Generative AI",
    "LLM",
    "LangChain",
    "AWS",
    "Azure",
    "Google Cloud",
    "Docker",
    "Kubernetes",
    "Git",
    "HTML",
    "CSS",
    "Redis",
    "Spark",
    "Hadoop"
]




import pandas as pd
import re
from collections import Counter


def extract_skills(description):

    if pd.isna(description):
        return []

    description = str(description)

    found_skills = []

    for skill in SKILLS:

        # Match complete skill names rather than
        # accidentally matching parts of other words.
        pattern = (
            r"(?<![A-Za-z0-9])"
            + re.escape(skill)
            + r"(?![A-Za-z0-9])"
        )

        if re.search(pattern, description, re.IGNORECASE):
            found_skills.append(skill)

    return found_skills


def analyze_skills(df):

    all_skills = []

    for description in df["description"]:
        extracted = extract_skills(description)
        all_skills.extend(extracted)

    skill_counts = Counter(all_skills)

    result = pd.DataFrame(
        skill_counts.items(),
        columns=["Skill", "Job_Count"]
    )

    result = result.sort_values(
        by="Job_Count",
        ascending=False
    )

    return result




if __name__ == "__main__":

    # Load cleaned dataset
    df = pd.read_csv("dataset/jobs_cleaned.csv")

    # Extract and count skills
    skill_results = analyze_skills(df)

    print("\nTOP 15 IN-DEMAND TECHNICAL SKILLS")
    print("--------------------------------")

    print(skill_results.head(15).to_string(index=False))

    # Save results
    skill_results.to_csv(
        "dataset/skill_demand.csv",
        index=False
    )

    # Save extracted skills against each job
    df["extracted_skills"] = df["description"].apply(
        extract_skills
    )

    df["extracted_skills"] = df["extracted_skills"].apply(
        lambda skills: ", ".join(skills)
    )

    df.to_csv(
        "dataset/jobs_with_skills.csv",
        index=False
    )

    print("\nSkill extraction completed!")
    print("Total skills identified:", len(skill_results))
