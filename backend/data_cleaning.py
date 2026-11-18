
import pandas as pd
import numpy as np


def clean_job_data(df):

    # Create a copy so the original data remains unchanged
    df = df.copy()

    # 1. Remove duplicate rows
    df = df.drop_duplicates()

    # 2. Handle missing company names
    df["company"] = df["company"].fillna("Unknown Company")

    # 3. Handle missing salary
    df["salary_range"] = df["salary_range"].fillna("Not Disclosed")

    # 4. Handle missing workplace type
    df["workplace_type"] = df["workplace_type"].fillna("Not Specified")

    # 5. Handle missing employment type
    df["employment_type"] = df["employment_type"].fillna("Not Specified")

    # 6. Standardize text columns
    text_columns = [
        "title",
        "company",
        "location",
        "workplace_type",
        "employment_type"
    ]

    for column in text_columns:
        df[column] = df[column].str.strip()

    return df


if __name__ == "__main__":

    df = pd.read_csv("dataset/jobs.csv")

    cleaned_df = clean_job_data(df)

    cleaned_df.to_csv(
        "dataset/jobs_cleaned.csv",
        index=False
    )

    print("Data cleaning completed!")

    print("Original shape:", df.shape)
    print("Cleaned shape:", cleaned_df.shape)

    print("\nRemaining missing values:")
    print(cleaned_df.isnull().sum())
