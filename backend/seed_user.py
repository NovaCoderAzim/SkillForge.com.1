import requests

# API URL
url = "http://127.0.0.1:8000/api/v1/users"

def create_account(payload):
    role = payload.get("role", "user")
    email = payload.get("email", "unknown")
    
    try:
        response = requests.post(url, json=payload)
        
        if response.status_code == 201:
            print(f"✅ SUCCESS: {role.capitalize()} created! ({email})")
        elif response.status_code == 400:
            print(f"⚠️  {role.capitalize()} already exists in the database. ({email})")
        else:
            print(f"❌ Failed to create {role}. Status Code: {response.status_code}")
            print("Error Details:", response.json()) # This will print the exact missing field if it's a 422 error
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")

# 1. Define the payload (Now including phone_number)
instructor_data = {
    "email": "instructor@iqmath.com",
    "password": "password123",
    "name": "Admin Instructor",
    "role": "instructor",
    "phone_number": "1234567890" 
}

student_data = {
    "email": "student@iqmath.com",
    "password": "password123",
    "name": "Test Student",
    "role": "student",
    "phone_number": "0987654321" 
}

# 2. Actually call the function to execute the requests
print("--- Starting Database Seed ---")

print("\nCreating Instructor...")
create_account(instructor_data)

print("\nCreating Student...")
create_account(student_data)

print("\n--- Finished ---")