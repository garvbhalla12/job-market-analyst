import pandas as pd

df = pd.read_json("dataset/jobs.json")

df.to_csv("dataset/jobs.csv", index=False)

print("dataset converted to csv successfully")
print("shape: ", df.shape)
print("\ncolumns: ")
print(df.columns.tolist())

print("\nfirst 5 records")
print(df.head())