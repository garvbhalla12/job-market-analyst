
from security import hash_password, verify_password

password = "Garv@12345"

# Generate hash
hashed = hash_password(password)

print("Original password:", password)
print("Hashed password:", hashed)

# Verify correct password
print("\nCorrect password:", verify_password(
    "Garv@12345", hashed
))

# Verify incorrect password
print("Wrong password:", verify_password(
    "WrongPassword", hashed
))
