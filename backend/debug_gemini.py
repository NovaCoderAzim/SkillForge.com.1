import google.generativeai as genai
import os

# ✅ YOUR API KEY
api_key = "AIzaSyBgfLU5nf8l3KbhtsPmcg3f1s7k4irU3UU" # <--- MAKE SURE THIS IS CORRECT

print(f"🔍 Checking API Key: {api_key[:10]}...")

try:
    genai.configure(api_key=api_key)
    
    print("\n📡 Connecting to Google AI...")
    models = list(genai.list_models())
    
    print(f"\n✅ FOUND {len(models)} MODELS:")
    print("-" * 40)
    
    supported_models = []
    for m in models:
        # Check if model supports content generation (text)
        if 'generateContent' in m.supported_generation_methods:
            print(f"🟢 AVAILABLE: {m.name}")
            supported_models.append(m.name)
        else:
            print(f"⚪ (Other):   {m.name}")
            
    print("-" * 40)
    
    if not supported_models:
        print("❌ NO models found that support text generation!")
    else:
        print(f"\n👉 SUGGESTION: Update your main.py to use one of the '🟢 AVAILABLE' names above.")
        
except Exception as e:
    print(f"\n🔥 CRITICAL ERROR: {str(e)}")
    print("Double check your API KEY and Internet Connection.")