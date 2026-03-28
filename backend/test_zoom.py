import base64
import requests

account_id = "vL4MLrS9RZWjMERcjzJQ2Q"
client_id = "AjAB2CWtSgS9CTjVvFll7Q"
client_secret = "gsaOZt9HRxCGbPCiTH0pg4C1g0vmcU39"

url = f"https://zoom.us/oauth/token?grant_type=account_credentials&account_id={account_id}"
auth_str = f"{client_id}:{client_secret}"
b64_auth = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
headers = {
    "Authorization": f"Basic {b64_auth}", 
    "Content-Type": "application/x-www-form-urlencoded"
}
res = requests.post(url, headers=headers)
print("Auth Code:", res.status_code)
print("Auth Response:", res.text)

if res.status_code == 200:
    token = res.json().get("access_token")
    zoom_url = "https://api.zoom.us/v2/users/me/meetings"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "topic": "Test Zoom Topic",
        "type": 2,
        "start_time": "2026-03-29T10:00:00Z",
        "duration": 60,
    }
    r2 = requests.post(zoom_url, headers=headers, json=payload)
    print("Meeting Code:", r2.status_code)
    print("Meeting Data:", r2.text)
