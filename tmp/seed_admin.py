import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv("backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

supabase = create_client(url, key)

EMAIL = "owner@applypilot.com"
PASSWORD = "ApplyPilot2024!"

print(f"Creating super admin: {EMAIL}")

# 1. Create in auth schema using admin api
try:
    res = supabase.auth.admin.create_user({
        "email": EMAIL,
        "password": PASSWORD,
        "email_confirm": True,
        "user_metadata": {"full_name": "Platform Owner"}
    })
    user_id = res.user.id
    print(f"Auth User created: {user_id}")
    
    # 2. Insert into public.users with super_admin role
    supabase.table("users").upsert({
        "id": user_id,
        "email": EMAIL,
        "full_name": "Platform Owner",
        "role": "super_admin"
    }).execute()
    
    print("✅ Inserted into public.users as 'super_admin'")
    
except Exception as e:
    print(f"Error creating auth user (Might already exist): {e}")
    # Force update the role just via DB lookup
    user_res = supabase.table("users").select("id").eq("email", EMAIL).execute()
    if user_res.data:
        uid = user_res.data[0]['id']
        supabase.table("users").update({"role": "super_admin"}).eq("id", uid).execute()
        print(f"✅ Modified existing user {uid} to 'super_admin'")

print("Done!")
