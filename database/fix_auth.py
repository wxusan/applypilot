"""
One-time fix script — resets passwords for all accounts + ensures
owner@applypilot.com has super_admin role in the users table.

Run: python3 database/fix_auth.py
"""

import os
import sys
from pathlib import Path

# Load backend/.env
env_path = Path(__file__).parent.parent / "backend" / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

import requests

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_KEY  = os.environ["SUPABASE_SERVICE_KEY"]

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}

# ── All accounts to fix ────────────────────────────────────────────────────
ACCOUNTS = [
    # (uid_from_supabase_dashboard, email, new_password, full_name, role)
    (
        "1e2ded68-bdfd-4a19-8138-8bd8296abf56",
        "admin@premier.com",
        "ApplyPilot2024!",
        "Sarah Johnson",
        "admin",
    ),
    (
        "0443d2ac-0735-4ae5-9bdc-c5143cd12068",
        "staff@premier.com",
        "ApplyPilot2024!",
        "Michael Chen",
        "staff",
    ),
    (
        "8e59455e-6034-4981-83bb-b52fd76ead97",
        "admin@edupath.com",
        "ApplyPilot2024!",
        "David Park",
        "admin",
    ),
    (
        "5ed17294-37f1-4afa-85e5-818e86f5d522",
        "owner@applypilot.com",
        "ApplyPilot2024!",   # ← you can change this to whatever you want
        "Xusan",
        "super_admin",
    ),
]

# ── Supabase client (service role) ─────────────────────────────────────────
from supabase import create_client
db = create_client(SUPABASE_URL, SERVICE_KEY)


def reset_password(uid: str, new_password: str, email: str) -> bool:
    """Use Supabase Admin API to set a new password for a user."""
    url = f"{SUPABASE_URL}/auth/v1/admin/users/{uid}"
    res = requests.patch(url, headers=HEADERS, json={"password": new_password})
    if res.status_code == 200:
        print(f"  ✅ Password reset → {email}")
        return True
    else:
        print(f"  ❌ Failed ({res.status_code}): {email} — {res.text}")
        return False


def ensure_users_row(uid: str, email: str, full_name: str, role: str) -> None:
    """Make sure a row exists in the public.users table with the correct role."""
    existing = db.table("users").select("id, role").eq("id", uid).execute()

    if existing.data:
        # Update role in case it's wrong
        db.table("users").update({"role": role, "full_name": full_name}).eq("id", uid).execute()
        print(f"  ✅ users table row updated → {email}  (role={role})")
    else:
        # Insert fresh row
        db.table("users").insert({
            "id": uid,
            "email": email,
            "full_name": full_name,
            "role": role,
        }).execute()
        print(f"  ✅ users table row created → {email}  (role={role})")


def ensure_super_admin_users_row(uid: str, email: str, full_name: str) -> None:
    """Super admin doesn't belong to any agency, just needs the users row."""
    ensure_users_row(uid, email, full_name, "super_admin")


def main():
    print("\n🔧 ApplyPilot — Auth Fix Script\n" + "=" * 45)

    for uid, email, password, name, role in ACCOUNTS:
        print(f"\n→ {email}  ({role})")
        reset_password(uid, password, email)
        ensure_users_row(uid, email, name, role)

    print("\n" + "=" * 45)
    print("✅ Done!\n")
    print("Login credentials:")
    print("  admin@premier.com    /  ApplyPilot2024!  (Agency admin)")
    print("  staff@premier.com    /  ApplyPilot2024!  (Agency staff)")
    print("  admin@edupath.com    /  ApplyPilot2024!  (Agency admin)")
    print("  owner@applypilot.com /  ApplyPilot2024!  (Super admin → /admin)")
    print()
    print("⚠️  Change owner@applypilot.com password after first login!")


if __name__ == "__main__":
    main()
