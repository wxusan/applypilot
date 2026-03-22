"""
ApplyPilot — Complete Auth Fix Script
Fixes:
  1. Resets passwords for all accounts using supabase admin client (NOT raw HTTP)
  2. Confirms email addresses so login works without clicking email link
  3. Ensures users table rows exist with correct roles

Run: python3 database/fix_all.py
"""

import os
import sys
from pathlib import Path

# ── Load backend/.env ──────────────────────────────────────────────────────
env_path = Path(__file__).parent.parent / "backend" / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY  = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SERVICE_KEY:
    print("❌ SUPABASE_URL or SUPABASE_SERVICE_KEY missing in backend/.env")
    sys.exit(1)

try:
    from supabase import create_client
except ImportError:
    print("Installing supabase package...")
    os.system("pip3 install supabase --break-system-packages -q")
    from supabase import create_client

db = create_client(SUPABASE_URL, SERVICE_KEY)

# ── Accounts ───────────────────────────────────────────────────────────────
ACCOUNTS = [
    {
        "uid":       "1e2ded68-bdfd-4a19-8138-8bd8296abf56",
        "email":     "admin@premier.com",
        "password":  "ApplyPilot2024!",
        "full_name": "Sarah Johnson",
        "role":      "admin",
    },
    {
        "uid":       "0443d2ac-0735-4ae5-9bdc-c5143cd12068",
        "email":     "staff@premier.com",
        "password":  "ApplyPilot2024!",
        "full_name": "Michael Chen",
        "role":      "staff",
    },
    {
        "uid":       "8e59455e-6034-4981-83bb-b52fd76ead97",
        "email":     "admin@edupath.com",
        "password":  "ApplyPilot2024!",
        "full_name": "David Park",
        "role":      "admin",
    },
    {
        "uid":       "5ed17294-37f1-4afa-85e5-818e86f5d522",
        "email":     "owner@applypilot.com",
        "password":  "ApplyPilot2024!",
        "full_name": "Xusan",
        "role":      "super_admin",
    },
]

def fix_auth_user(account: dict) -> bool:
    """Reset password AND confirm email using supabase admin client."""
    uid   = account["uid"]
    email = account["email"]
    try:
        # This uses the service role key correctly — no HTTP PATCH issues
        result = db.auth.admin.update_user_by_id(
            uid,
            {
                "password":         account["password"],
                "email_confirm":    True,   # ← confirms email so login works immediately
            }
        )
        if result.user:
            print(f"  ✅ Auth fixed → {email}  (password reset + email confirmed)")
            return True
        else:
            print(f"  ❌ Auth update returned no user → {email}")
            return False
    except Exception as e:
        print(f"  ❌ Auth error → {email}: {e}")
        return False


def fix_users_row(account: dict) -> bool:
    """Ensure row exists in public.users with correct role."""
    uid      = account["uid"]
    email    = account["email"]
    name     = account["full_name"]
    role     = account["role"]
    try:
        existing = db.table("users").select("id, role").eq("id", uid).execute()
        if existing.data:
            db.table("users").update({
                "role":      role,
                "full_name": name,
                "email":     email,
            }).eq("id", uid).execute()
            print(f"  ✅ users table updated → {email}  (role={role})")
        else:
            db.table("users").insert({
                "id":        uid,
                "email":     email,
                "full_name": name,
                "role":      role,
            }).execute()
            print(f"  ✅ users table created → {email}  (role={role})")
        return True
    except Exception as e:
        print(f"  ❌ users table error → {email}: {e}")
        return False


def fix_agency_members() -> None:
    """Ensure agency_members links are correct."""
    print("\n→ Checking agency_members links...")

    # Premier Education agency
    premier_id = None
    edupath_id = None

    agencies = db.table("agencies").select("id, name").execute()
    for ag in (agencies.data or []):
        name = ag["name"].lower()
        if "premier" in name:
            premier_id = ag["id"]
        elif "edupath" in name or "edu" in name:
            edupath_id = ag["id"]

    print(f"  Premier agency id: {premier_id}")
    print(f"  EduPath agency id: {edupath_id}")

    # Links: admin@premier + staff@premier → Premier; admin@edupath → EduPath
    links = [
        ("1e2ded68-bdfd-4a19-8138-8bd8296abf56", premier_id, "admin"),
        ("0443d2ac-0735-4ae5-9bdc-c5143cd12068", premier_id, "staff"),
    ]
    if edupath_id:
        links.append(("8e59455e-6034-4981-83bb-b52fd76ead97", edupath_id, "admin"))

    for uid, agency_id, role in links:
        if not agency_id:
            continue
        try:
            existing = db.table("agency_members").select("user_id").eq("user_id", uid).eq("agency_id", agency_id).execute()
            if existing.data:
                print(f"  ✅ agency_members already linked → uid={uid[:8]}...")
            else:
                db.table("agency_members").insert({
                    "user_id":   uid,
                    "agency_id": agency_id,
                    "role":      role,
                }).execute()
                print(f"  ✅ agency_members linked → uid={uid[:8]}...  role={role}")
        except Exception as e:
            print(f"  ❌ agency_members error → {uid[:8]}...: {e}")


def main():
    print("\n🔧 ApplyPilot — Complete Auth Fix\n" + "=" * 50)

    all_ok = True
    for account in ACCOUNTS:
        print(f"\n→ {account['email']}  ({account['role']})")
        ok1 = fix_auth_user(account)
        ok2 = fix_users_row(account)
        if not (ok1 and ok2):
            all_ok = False

    fix_agency_members()

    print("\n" + "=" * 50)
    if all_ok:
        print("✅ All accounts fixed!\n")
    else:
        print("⚠️  Some operations failed — check errors above\n")

    print("Login credentials (once you fix the anon key in .env.local):")
    print("  admin@premier.com    /  ApplyPilot2024!")
    print("  staff@premier.com    /  ApplyPilot2024!")
    print("  admin@edupath.com    /  ApplyPilot2024!")
    print("  owner@applypilot.com /  ApplyPilot2024!")


if __name__ == "__main__":
    main()
