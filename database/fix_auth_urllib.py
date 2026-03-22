"""
Fix all 4 ApplyPilot auth accounts using only stdlib urllib.
Calls Supabase Admin REST API directly — no external packages required.
"""
import json
import urllib.request
import urllib.error

SUPABASE_URL    = "https://hhvgwniixxmawdsryrep.supabase.co"
SERVICE_KEY     = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhodmd3bmlpeHhtYXdkc3J5cmVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA1NTI5NSwiZXhwIjoyMDg5NjMxMjk1fQ.Wa9qQb6XMC2rlAMWMfmmzFIzkA3m14Qgyw2c0Y2UNoY"

ACCOUNTS = [
    {"uid": "1e2ded68-bdfd-4a19-8138-8bd8296abf56", "email": "admin@premier.com",    "password": "ApplyPilot2024!", "full_name": "Sarah Johnson", "role": "admin"},
    {"uid": "0443d2ac-0735-4ae5-9bdc-c5143cd12068", "email": "staff@premier.com",    "password": "ApplyPilot2024!", "full_name": "Michael Chen",  "role": "staff"},
    {"uid": "8e59455e-6034-4981-83bb-b52fd76ead97", "email": "admin@edupath.com",    "password": "ApplyPilot2024!", "full_name": "David Park",    "role": "admin"},
    {"uid": "5ed17294-37f1-4afa-85e5-818e86f5d522", "email": "owner@applypilot.com", "password": "ApplyPilot2024!", "full_name": "Xusan",         "role": "super_admin"},
]

def supabase_request(method, path, body=None):
    url  = f"{SUPABASE_URL}{path}"
    data = json.dumps(body).encode() if body else None
    req  = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey",        SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    req.add_header("Content-Type",  "application/json")
    req.add_header("Prefer",        "return=representation")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def fix_auth_user(account):
    status, body = supabase_request(
        "PUT",
        f"/auth/v1/admin/users/{account['uid']}",
        {"password": account["password"], "email_confirm": True}
    )
    if status in (200, 201):
        print(f"  ✅ Auth fixed → {account['email']}  (status {status})")
        return True
    else:
        print(f"  ❌ Auth error → {account['email']}  (status {status}): {body}")
        return False

def fix_users_row(account):
    # Check if row exists
    status, body = supabase_request("GET", f"/rest/v1/users?id=eq.{account['uid']}&select=id,role")
    if status == 200 and body:
        # Update
        status2, _ = supabase_request(
            "PATCH",
            f"/rest/v1/users?id=eq.{account['uid']}",
            {"role": account["role"], "full_name": account["full_name"], "email": account["email"]}
        )
        ok = status2 in (200, 201, 204)
        print(f"  {'✅' if ok else '❌'} users table updated → {account['email']}  (status {status2})")
        return ok
    else:
        # Insert
        status2, _ = supabase_request(
            "POST",
            "/rest/v1/users",
            {"id": account["uid"], "email": account["email"], "full_name": account["full_name"], "role": account["role"]}
        )
        ok = status2 in (200, 201, 204)
        print(f"  {'✅' if ok else '❌'} users table created → {account['email']}  (status {status2})")
        return ok

def fix_agency_members():
    print("\n→ Checking agency_members links...")
    status, agencies = supabase_request("GET", "/rest/v1/agencies?select=id,name")
    if status != 200:
        print(f"  ❌ Could not fetch agencies: {agencies}")
        return

    premier_id = edupath_id = None
    for ag in agencies:
        name = ag["name"].lower()
        if "premier" in name:
            premier_id = ag["id"]
        elif "edupath" in name or "edu" in name:
            edupath_id = ag["id"]

    print(f"  Premier agency: {premier_id}")
    print(f"  EduPath agency: {edupath_id}")

    links = [
        ("1e2ded68-bdfd-4a19-8138-8bd8296abf56", premier_id, "admin"),
        ("0443d2ac-0735-4ae5-9bdc-c5143cd12068", premier_id, "staff"),
    ]
    if edupath_id:
        links.append(("8e59455e-6034-4981-83bb-b52fd76ead97", edupath_id, "admin"))

    for uid, agency_id, role in links:
        if not agency_id:
            continue
        status, existing = supabase_request(
            "GET", f"/rest/v1/agency_members?user_id=eq.{uid}&agency_id=eq.{agency_id}&select=user_id"
        )
        if status == 200 and existing:
            print(f"  ✅ agency_members already linked → {uid[:8]}...")
            # Make sure is_active=true
            supabase_request("PATCH", f"/rest/v1/agency_members?user_id=eq.{uid}&agency_id=eq.{agency_id}", {"is_active": True, "role": role})
        else:
            status2, _ = supabase_request(
                "POST",
                "/rest/v1/agency_members",
                {"user_id": uid, "agency_id": agency_id, "role": role, "is_active": True}
            )
            ok = status2 in (200, 201, 204)
            print(f"  {'✅' if ok else '❌'} agency_members linked → {uid[:8]}...  role={role}  (status {status2})")

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

    print("Login credentials:")
    print("  admin@premier.com    /  ApplyPilot2024!")
    print("  staff@premier.com    /  ApplyPilot2024!")
    print("  admin@edupath.com    /  ApplyPilot2024!")
    print("  owner@applypilot.com /  ApplyPilot2024!")

if __name__ == "__main__":
    main()
