"""
Seed script — populates the database with realistic sample data for development.

Usage:
    cd backend
    python seed.py

Requirements:
    .env file must be present with SUPABASE_URL and SUPABASE_SERVICE_KEY.
    ENCRYPTION_KEY must also be set (used to encrypt fake portal passwords).

What it creates:
    - 1 agency
    - 1 admin user  +  1 staff user (agency_members)
    - 5 students in various pipeline stages
    - 12 applications across those students
    - 8 deadlines (mix of past and future)
    - 3 essays (draft / approved)
    - 2 recommenders
    - 3 agent_jobs (completed / awaiting_approval)
    - 5 audit_log entries

Safe to run multiple times — uses upsert where possible. Prints what it creates.

IMPORTANT — Auth UIDs:
    The `users` table rows must match real Supabase Auth user IDs.
    Before running this script you must create the two users in Supabase Auth
    (Dashboard → Authentication → Users → "Invite user"), then copy their UUIDs
    into ADMIN_UID and STAFF_UID below. Random UUIDs will fail with FK violations.

    export SEED_ADMIN_UID=<uuid from Supabase Auth>
    export SEED_STAFF_UID=<uuid from Supabase Auth>
"""

import os
import sys
import uuid
from datetime import datetime, timedelta, date, timezone
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# ── Bootstrap ────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
ENCRYPTION_KEY = os.environ["ENCRYPTION_KEY"]

from supabase import create_client
db = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

fernet = Fernet(ENCRYPTION_KEY.encode())


def encrypt(val: str) -> str:
    return fernet.encrypt(val.encode()).decode()


def uid() -> str:
    return str(uuid.uuid4())


def iso(d: date) -> str:
    return d.isoformat()


now = datetime.now(timezone.utc)


def print_ok(msg: str):
    print(f"  ✓ {msg}")


# ── Agency ───────────────────────────────────────────────────────────────────
print("\n── Agency ──")
agency_id = uid()
db.table("agencies").upsert({
    "id": agency_id,
    "name": "Bright Futures Consulting",
    "subscription_plan": "pro",
    "max_staff": 5,
    "primary_color": "#1D9E75",
    "language": "en",
    "timezone": "Asia/Tashkent",
    "created_at": now.isoformat(),
    "updated_at": now.isoformat(),
}, on_conflict="id").execute()
print_ok(f"Agency: Bright Futures Consulting ({agency_id})")

# ── Users ────────────────────────────────────────────────────────────────────
print("\n── Users ──")
# Use real Supabase Auth UIDs if provided via env vars; otherwise generate random ones
# (random UUIDs will cause FK violations — see the IMPORTANT note at the top of this file)
admin_id = os.environ.get("SEED_ADMIN_UID") or uid()
staff_id = os.environ.get("SEED_STAFF_UID") or uid()
if not os.environ.get("SEED_ADMIN_UID"):
    print("  ⚠️  SEED_ADMIN_UID not set — using random UUID (may fail FK check)")
if not os.environ.get("SEED_STAFF_UID"):
    print("  ⚠️  SEED_STAFF_UID not set — using random UUID (may fail FK check)")

for u in [
    {
        "id": admin_id,
        "email": "admin@brightfutures.co",
        "full_name": "Amir Karimov",
        "telegram_chat_id": "111111111",
        "created_at": now.isoformat(),
    },
    {
        "id": staff_id,
        "email": "staff@brightfutures.co",
        "full_name": "Dilnoza Yusupova",
        "telegram_chat_id": "222222222",
        "created_at": now.isoformat(),
    },
]:
    db.table("users").upsert(u, on_conflict="id").execute()
    print_ok(f"User: {u['full_name']} ({u['email']})")

# agency_members
for member in [
    {"id": uid(), "agency_id": agency_id, "user_id": admin_id, "role": "admin", "is_active": True, "joined_at": now.isoformat()},
    {"id": uid(), "agency_id": agency_id, "user_id": staff_id, "role": "staff", "is_active": True, "joined_at": now.isoformat()},
]:
    try:
        db.table("agency_members").insert(member).execute()
        print_ok(f"Agency member: {member['role']}")
    except Exception:
        # Member already exists — skip silently
        pass

# ── Students ─────────────────────────────────────────────────────────────────
print("\n── Students ──")
students_data = [
    {
        "full_name": "Jasur Toshmatov",
        "preferred_name": "Jas",
        "email": "jasur@example.com",
        "status": "active",
        "season": "2024-25",
        "graduation_year": 2025,
        "gpa": 3.9,
        "gpa_scale": 4.0,
        "sat_total": 1480,
        "act_score": None,
        "nationality": "Uzbek",
        "high_school_name": "Tashkent International School",
        "intended_major": "Computer Science",
    },
    {
        "full_name": "Malika Rashidova",
        "preferred_name": None,
        "email": "malika@example.com",
        "status": "writing",
        "season": "2024-25",
        "graduation_year": 2025,
        "gpa": 3.7,
        "gpa_scale": 4.0,
        "sat_total": 1390,
        "act_score": 32,
        "nationality": "Uzbek",
        "high_school_name": "Westminster International University",
        "intended_major": "Economics",
    },
    {
        "full_name": "Bobur Umarov",
        "preferred_name": "Bob",
        "email": "bobur@example.com",
        "status": "submitted",
        "season": "2024-25",
        "graduation_year": 2024,
        "gpa": 4.0,
        "gpa_scale": 4.0,
        "sat_total": 1560,
        "act_score": None,
        "nationality": "Uzbek",
        "high_school_name": "Academic Lyceum",
        "intended_major": "Physics",
    },
    {
        "full_name": "Zulfiya Nazarova",
        "preferred_name": "Zulfi",
        "email": "zulfiya@example.com",
        "status": "accepted",
        "season": "2023-24",
        "graduation_year": 2024,
        "gpa": 3.85,
        "gpa_scale": 4.0,
        "sat_total": 1430,
        "act_score": None,
        "nationality": "Uzbek",
        "high_school_name": "Tashkent Lyceum #1",
        "intended_major": "Business Administration",
    },
    {
        "full_name": "Nodir Hamidov",
        "preferred_name": None,
        "email": "nodir@example.com",
        "status": "intake",
        "season": "2025-26",
        "graduation_year": 2026,
        "gpa": 3.6,
        "gpa_scale": 4.0,
        "sat_total": None,
        "act_score": None,
        "nationality": "Uzbek",
        "high_school_name": "INHA University High School",
        "intended_major": "Electrical Engineering",
    },
]

student_ids = []
for s in students_data:
    sid = uid()
    student_ids.append(sid)
    db.table("students").insert({
        "id": sid,
        "agency_id": agency_id,
        "assigned_staff_id": admin_id,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        **s,
    }).execute()
    print_ok(f"Student: {s['full_name']} (status={s['status']})")

# ── Applications ──────────────────────────────────────────────────────────────
print("\n── Applications ──")

today = date.today()

applications_data = [
    # Jasur — active
    (student_ids[0], "MIT", "active", today + timedelta(days=45), None, encrypt("CommonApp2024!")),
    (student_ids[0], "Stanford University", "active", today + timedelta(days=52), None, encrypt("CommonApp2024!")),
    (student_ids[0], "UC Berkeley", "active", today + timedelta(days=30), None, encrypt("CommonApp2024!")),
    # Malika — writing
    (student_ids[1], "NYU", "active", today + timedelta(days=20), None, encrypt("MyPortal#99")),
    (student_ids[1], "Boston University", "active", today + timedelta(days=25), None, encrypt("MyPortal#99")),
    # Bobur — submitted
    (student_ids[2], "Caltech", "submitted", today - timedelta(days=10), "accepted", encrypt("Cal2024Pass!")),
    (student_ids[2], "Carnegie Mellon University", "submitted", today - timedelta(days=15), "waitlisted", encrypt("Cal2024Pass!")),
    # Zulfiya — accepted
    (student_ids[3], "University of Michigan", "submitted", today - timedelta(days=30), "accepted", encrypt("Mich2024!")),
    (student_ids[3], "University of Virginia", "submitted", today - timedelta(days=35), "rejected", encrypt("Mich2024!")),
    # Nodir — intake
    (student_ids[4], "Georgia Tech", "active", today + timedelta(days=90), None, encrypt("GaTech2025")),
    (student_ids[4], "University of Washington", "active", today + timedelta(days=95), None, encrypt("GaTech2025")),
    (student_ids[4], "Purdue University", "active", today + timedelta(days=80), None, encrypt("GaTech2025")),
]

app_ids = []
for student_id, uni, status, deadline, decision, pwd in applications_data:
    aid = uid()
    app_ids.append(aid)
    db.table("applications").insert({
        "id": aid,
        "agency_id": agency_id,
        "student_id": student_id,
        "university_name": uni,
        "status": status,
        "deadline_regular": iso(deadline),
        "decision": decision,
        "portal_password_encrypted": pwd,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }).execute()
    print_ok(f"Application: {uni} → {status}" + (f" ({decision})" if decision else ""))

# ── Deadlines ─────────────────────────────────────────────────────────────────
print("\n── Deadlines ──")
deadlines = [
    (student_ids[0], "Common App Essays Finalized", today + timedelta(days=7), False),
    (student_ids[0], "MIT Application Submit", today + timedelta(days=45), False),
    (student_ids[1], "NYU Supplement Due", today + timedelta(days=20), False),
    (student_ids[1], "Financial Aid Forms", today + timedelta(days=14), False),
    (student_ids[2], "Caltech Interview Prep", today - timedelta(days=20), True),
    (student_ids[3], "Accept Offer — Michigan", today + timedelta(days=10), False),
    (student_ids[4], "SAT Registration", today + timedelta(days=30), False),
    (student_ids[4], "Initial Intake Meeting", today - timedelta(days=5), True),
]

for student_id, title, due, complete in deadlines:
    db.table("deadlines").insert({
        "id": uid(),
        "agency_id": agency_id,
        "student_id": student_id,
        "title": title,
        "due_date": iso(due),
        "is_complete": complete,
        "created_at": now.isoformat(),
    }).execute()
    print_ok(f"Deadline: {title} ({'done' if complete else iso(due)})")

# ── Essays ─────────────────────────────────────────────────────────────────────
print("\n── Essays ──")
essay_data = [
    (student_ids[0], app_ids[0], "Common App Essay", "Tell us about yourself.",
     "Growing up between two cultures taught me to see the world through multiple lenses. My journey from Tashkent to an international classroom shaped my perspective on collaboration and problem-solving in ways that textbooks never could.",
     "approved", 88),
    (student_ids[1], app_ids[3], "Why NYU", "Why are you applying to NYU?",
     "NYU's interdisciplinary approach to economics aligns perfectly with my goal of understanding markets in emerging economies. The Stern School's proximity to Wall Street combined with its global campuses creates an unmatched environment for my aspirations.",
     "draft", 75),
    (student_ids[0], app_ids[1], "Stanford Supplemental", "What matters to you, and why?",
     "Open-source software matters to me because it democratizes access to technology. I have contributed to three open-source projects in the past year, helping developers in underserved communities build tools they could not afford otherwise.",
     "approved", 92),
]

for student_id, app_id, title, prompt_text, content, status, score in essay_data:
    db.table("essays").insert({
        "id": uid(),
        "agency_id": agency_id,
        "student_id": student_id,
        "application_id": app_id,
        "title": title,
        "prompt_text": prompt_text,
        "content": content,
        "status": status,
        "ai_score": score,
        "word_count": len(content.split()),
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }).execute()
    print_ok(f"Essay: '{title}' (status={status}, score={score})")

# ── Recommenders ──────────────────────────────────────────────────────────────
print("\n── Recommenders ──")
for name, email, role, student_id in [
    ("Dr. Akmal Yusupov", "akmal@tashkent-intl.edu", "Math Teacher", student_ids[0]),
    ("Ms. Feruza Alimova", "feruza@tashkent-intl.edu", "English Teacher", student_ids[0]),
]:
    db.table("recommenders").insert({
        "id": uid(),
        "agency_id": agency_id,
        "student_id": student_id,
        "name": name,
        "email": email,
        "role": role,
        "status": "requested",
        "created_at": now.isoformat(),
    }).execute()
    print_ok(f"Recommender: {name} ({role})")

# ── Agent Jobs ────────────────────────────────────────────────────────────────
print("\n── Agent Jobs ──")
agent_jobs = [
    {
        "id": uid(),
        "agency_id": agency_id,
        "student_id": student_ids[0],
        "application_id": app_ids[0],
        "agent_type": "writer",
        "job_type": "essay",
        "status": "completed",
        "requires_approval": True,
        "output_data": {"essay_id": None, "ai_score": 88, "word_count": 342},
        "created_at": (now - timedelta(hours=3)).isoformat(),
        "completed_at": (now - timedelta(hours=2)).isoformat(),
    },
    {
        "id": uid(),
        "agency_id": agency_id,
        "student_id": student_ids[1],
        "application_id": app_ids[3],
        "agent_type": "writer",
        "job_type": "essay",
        "status": "awaiting_approval",
        "requires_approval": True,
        "approval_message": "📝 Essay draft ready: 'Why NYU' (75/100). Review and approve?",
        "output_data": {"ai_score": 75, "word_count": 187},
        "created_at": (now - timedelta(minutes=30)).isoformat(),
    },
    {
        "id": uid(),
        "agency_id": agency_id,
        "student_id": student_ids[0],
        "application_id": app_ids[0],
        "agent_type": "browser",
        "job_type": "fill_common_app",
        "status": "completed",
        "requires_approval": True,
        "output_data": {"step": 10, "completed_steps": list(range(10))},
        "created_at": (now - timedelta(days=2)).isoformat(),
        "completed_at": (now - timedelta(days=2, hours=-1)).isoformat(),
    },
]

for job in agent_jobs:
    db.table("agent_jobs").insert(job).execute()
    print_ok(f"Agent job: {job['agent_type']}/{job['job_type']} → {job['status']}")

# ── Audit Logs ─────────────────────────────────────────────────────────────────
print("\n── Audit Logs ──")
audit_entries = [
    ("student.created", "student", student_ids[0], student_ids[0], None),
    ("student.created", "student", student_ids[1], student_ids[1], None),
    ("essay.approved", "essay", student_ids[0], None, "Essay 'Common App Essay' approved"),
    ("browser.submitted", "agent_job", student_ids[0], None, "Application submitted via browser agent"),
    ("deadline.completed", "deadline", student_ids[2], None, "Caltech Interview Prep marked complete"),
]

for action, entity_type, student_id, entity_id, note in audit_entries:
    db.table("audit_logs").insert({
        "id": uid(),
        "agency_id": agency_id,
        "user_id": admin_id,
        "student_id": student_id,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id or uid(),
        "new_value": {"note": note} if note else {},
        "created_at": (now - timedelta(hours=abs(hash(action)) % 24)).isoformat(),
    }).execute()
    print_ok(f"Audit: {action}")

print("\n✅ Seed complete!\n")
print("Admin login:  admin@brightfutures.co")
print("Staff login:  staff@brightfutures.co")
print("(Create these users in Supabase Auth, then run this script)\n")
