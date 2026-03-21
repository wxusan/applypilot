"""
Seed script — creates test super admin and two test agencies with sample data.
Run: python3 database/seed.py

Requires: SUPABASE_URL and SUPABASE_SERVICE_KEY in backend/.env
"""

import os
import sys
import asyncio
from pathlib import Path

# Load env from backend/.env
env_path = Path(__file__).parent.parent / "backend" / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

db = create_client(SUPABASE_URL, SERVICE_KEY)


def create_auth_user(email: str, password: str, full_name: str) -> str:
    """Create a Supabase auth user and return their ID."""
    result = db.auth.admin.create_user({
        "email": email,
        "password": password,
        "email_confirm": True,
        "user_metadata": {"full_name": full_name},
    })
    return result.user.id


def run_seed():
    print("🌱 Seeding ApplyPilot database...\n")

    # =============================================
    # Agency 1 — Premier College Consulting
    # =============================================
    print("Creating Agency 1: Premier College Consulting")
    agency1 = db.table("agencies").insert({
        "name": "Premier College Consulting",
        "slug": "premier-consulting",
        "primary_color": "#1D9E75",
        "timezone": "Asia/Tashkent",
        "subscription_plan": "professional",
        "max_staff": 5,
    }).execute().data[0]

    # Admin user for agency 1
    admin1_id = create_auth_user(
        email="admin@premier.com",
        password="ApplyPilot2024!",
        full_name="Sarah Johnson",
    )
    db.table("users").insert({
        "id": admin1_id,
        "email": "admin@premier.com",
        "full_name": "Sarah Johnson",
        "role": "admin",
    }).execute()
    db.table("agency_members").insert({
        "agency_id": agency1["id"],
        "user_id": admin1_id,
        "role": "admin",
    }).execute()
    print(f"  ✓ Admin: admin@premier.com / ApplyPilot2024!")

    # Staff user for agency 1
    staff1_id = create_auth_user(
        email="staff@premier.com",
        password="ApplyPilot2024!",
        full_name="Michael Chen",
    )
    db.table("users").insert({
        "id": staff1_id,
        "email": "staff@premier.com",
        "full_name": "Michael Chen",
        "role": "staff",
    }).execute()
    db.table("agency_members").insert({
        "agency_id": agency1["id"],
        "user_id": staff1_id,
        "role": "staff",
    }).execute()
    print(f"  ✓ Staff: staff@premier.com / ApplyPilot2024!")

    # Sample students for agency 1
    student1 = db.table("students").insert({
        "agency_id": agency1["id"],
        "assigned_staff_id": staff1_id,
        "full_name": "Alisher Tashmatov",
        "preferred_name": "Ali",
        "nationality": "Uzbek",
        "email": "ali.tashmatov@email.com",
        "high_school_name": "Tashkent International School",
        "high_school_country": "Uzbekistan",
        "graduation_year": 2025,
        "gpa": 3.92,
        "gpa_scale": 4.0,
        "sat_total": 1510,
        "sat_math": 790,
        "sat_reading": 720,
        "toefl_score": 112,
        "intended_major": "Computer Science",
        "application_type": "freshman",
        "status": "writing",
        "season": "2024-25",
        "activities": [
            {"name": "Math Olympiad", "description": "National champion, 2024"},
            {"name": "Robotics Club", "description": "Team leader, built autonomous drone"},
        ],
        "awards": [
            {"name": "National Math Olympiad Gold", "year": 2024},
            {"name": "International Science Fair Finalist", "year": 2023},
        ],
    }).execute().data[0]

    student2 = db.table("students").insert({
        "agency_id": agency1["id"],
        "assigned_staff_id": staff1_id,
        "full_name": "Nilufar Rashidova",
        "preferred_name": "Nilu",
        "nationality": "Uzbek",
        "email": "n.rashidova@email.com",
        "high_school_name": "Westminster International University",
        "high_school_country": "Uzbekistan",
        "graduation_year": 2025,
        "gpa": 3.78,
        "gpa_scale": 4.0,
        "sat_total": 1450,
        "toefl_score": 108,
        "intended_major": "Economics",
        "status": "forms",
        "season": "2024-25",
    }).execute().data[0]

    # Sample applications
    import datetime
    db.table("applications").insert({
        "agency_id": agency1["id"],
        "student_id": student1["id"],
        "university_name": "MIT",
        "application_type": "early_action",
        "deadline_regular": "2024-11-01",
        "status": "in_progress",
    }).execute()
    db.table("applications").insert({
        "agency_id": agency1["id"],
        "student_id": student1["id"],
        "university_name": "Stanford University",
        "application_type": "regular",
        "deadline_regular": "2025-01-02",
        "status": "not_started",
    }).execute()
    db.table("applications").insert({
        "agency_id": agency1["id"],
        "student_id": student2["id"],
        "university_name": "Cornell University",
        "application_type": "regular",
        "deadline_regular": "2025-01-02",
        "status": "not_started",
    }).execute()

    # Sample deadlines
    db.table("deadlines").insert({
        "agency_id": agency1["id"],
        "student_id": student1["id"],
        "title": "MIT Early Action Deadline",
        "type": "application",
        "due_date": "2024-11-01",
    }).execute()
    db.table("deadlines").insert({
        "agency_id": agency1["id"],
        "student_id": student1["id"],
        "title": "SAT Retake Registration",
        "type": "test",
        "due_date": "2024-10-05",
    }).execute()

    print(f"  ✓ 2 students with applications and deadlines\n")

    # =============================================
    # Agency 2 — EduPath Consulting (isolation test)
    # =============================================
    print("Creating Agency 2: EduPath Consulting (isolation test)")
    agency2 = db.table("agencies").insert({
        "name": "EduPath Consulting",
        "slug": "edupath-consulting",
        "primary_color": "#185FA5",
        "timezone": "Asia/Tashkent",
        "subscription_plan": "starter",
        "max_staff": 2,
    }).execute().data[0]

    admin2_id = create_auth_user(
        email="admin@edupath.com",
        password="ApplyPilot2024!",
        full_name="David Park",
    )
    db.table("users").insert({
        "id": admin2_id,
        "email": "admin@edupath.com",
        "full_name": "David Park",
        "role": "admin",
    }).execute()
    db.table("agency_members").insert({
        "agency_id": agency2["id"],
        "user_id": admin2_id,
        "role": "admin",
    }).execute()

    db.table("students").insert({
        "agency_id": agency2["id"],
        "full_name": "Elena Kim",
        "nationality": "Korean",
        "high_school_name": "Seoul International School",
        "graduation_year": 2025,
        "gpa": 3.95,
        "sat_total": 1540,
        "intended_major": "Biology",
        "status": "intake",
        "season": "2024-25",
    }).execute()

    print(f"  ✓ Admin: admin@edupath.com / ApplyPilot2024!")
    print(f"  ✓ 1 student (Agency 1 CANNOT see this student)\n")

    print("=" * 50)
    print("✅ Seed complete!")
    print()
    print("TEST CREDENTIALS:")
    print("  Agency 1 Admin:  admin@premier.com  / ApplyPilot2024!")
    print("  Agency 1 Staff:  staff@premier.com  / ApplyPilot2024!")
    print("  Agency 2 Admin:  admin@edupath.com  / ApplyPilot2024!")
    print()
    print("ISOLATION TEST:")
    print("  Log in as Agency 2 admin — you should NOT see Agency 1's students.")
    print("  Agency 1 has: Alisher Tashmatov, Nilufar Rashidova")
    print("  Agency 2 has: Elena Kim")


if __name__ == "__main__":
    run_seed()
