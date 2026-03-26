import os
from google_auth_oauthlib.flow import InstalledAppFlow

# Permissions we need
SCOPES = ['https://www.googleapis.com/auth/drive.file']

def get_token():
    if not os.path.exists('credentials.json'):
        print("❌ Error: credentials.json not found! Please download it from Google Cloud.")
        return

    flow = InstalledAppFlow.from_client_secrets_file(
        'credentials.json', SCOPES)
    
    print("🚀 Opening browser... Please login with the INSTRUCTOR'S Google Account.")
    creds = flow.run_local_server(port=0)

    # Save the token for the backend to use later
    with open('token.json', 'w') as token:
        token.write(creds.to_json())
    
    print("✅ Success! 'token.json' has been created.")
    print("You can now run your backend.")

if __name__ == '__main__':
    get_token()