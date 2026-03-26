import requests

token = ""

# get token
res = requests.post("http://127.0.0.1:8000/api/v1/login", data={"username": "instructor@iqmath.com", "password": "password123"})
if res.status_code == 200:
    token = res.json()["access_token"]
else:
    print("Failed to login", res.text)

# create student
payload = {
    "full_name": "Azim Test",
    "email": "azim@gmail.com",
    "password": "password123",
    "course_ids": []
}

res2 = requests.post(
    "http://127.0.0.1:8000/api/v1/admin/admit-student",
    json=payload,
    headers={"Authorization": f"Bearer {token}"}
)
print(res2.status_code)
print(res2.text)
