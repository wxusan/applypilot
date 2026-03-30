"""
Content Generator — Phase 4D
Generates application content using OpenAI GPT-4o-mini.

Generates:
- Personal statements (650 words)
- University supplements (variable word count)
- Activity descriptions (150 chars)
- Teacher recommendation letters (500 words)
- Counsellor recommendation letters (500 words)
- Email responses to universities
"""

import logging
from typing import Dict, Optional
from openai import AsyncOpenAI

from core.config import settings

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

MODEL = "gpt-4o-mini"


async def generate_personal_statement(student_profile: Dict) -> str:
    """
    Generate a 650-word Common App personal statement.

    Args:
        student_profile: {
            'first_name', 'last_name', 'intended_major', 'background',
            'key_experiences', 'achievements', 'interests', 'values'
        }

    Returns:
        Generated essay text (approx 650 words)
    """
    try:
        # Build context from profile
        student_name = f"{student_profile.get('first_name', 'Student')} {student_profile.get('last_name', '')}"
        intended_major = student_profile.get('intended_major', 'undecided')
        background = student_profile.get('background', '')
        key_experiences = student_profile.get('key_experiences', '')
        achievements = student_profile.get('achievements', '')
        interests = student_profile.get('interests', '')
        values = student_profile.get('values', '')

        prompt = f"""You are an expert college essay writer. Write a compelling, authentic personal statement for the Common App prompt.

The essay should be approximately 650 words, written in the student's voice (first person), and avoid clichés.

Student Information:
- Name: {student_name}
- Intended Major: {intended_major}
- Background/Context: {background}
- Key Experiences: {key_experiences}
- Achievements: {achievements}
- Interests/Passions: {interests}
- Values/Philosophy: {values}

Instructions:
1. Write in first person from the student's perspective
2. Be authentic and specific—use concrete examples and details
3. Avoid overused phrases like "making a difference" or "changing the world"
4. Show vulnerability and growth where appropriate
5. Keep the tone conversational yet thoughtful
6. Target approximately 650 words
7. End with a strong conclusion that ties themes together

Write the essay now:"""

        response = await client.messages.create(
            model=MODEL,
            max_tokens=1500,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        essay = response.content[0].text
        logger.info(f"Generated personal statement for {student_name}")
        return essay

    except Exception as e:
        logger.error(f"Error generating personal statement: {e}")
        raise


async def generate_supplement(
    student_profile: Dict,
    university_name: str,
    question: str,
    word_limit: int = 250
) -> str:
    """
    Generate a university supplement answer.

    Args:
        student_profile: Student background info
        university_name: Name of university
        question: Supplement prompt/question
        word_limit: Target word count

    Returns:
        Generated supplement text
    """
    try:
        student_name = f"{student_profile.get('first_name', 'Student')} {student_profile.get('last_name', '')}"
        intended_major = student_profile.get('intended_major', 'undecided')
        interests = student_profile.get('interests', '')

        prompt = f"""You are an expert college essay writer. Write a compelling university supplement answer.

University: {university_name}
Prompt: {question}
Target Word Count: {word_limit}

Student Information:
- Name: {student_name}
- Intended Major: {intended_major}
- Interests: {interests}

Instructions:
1. Answer the specific prompt directly and thoroughly
2. Write in first person from the student's perspective
3. Be specific about why this university—mention programs, professors, opportunities
4. Show genuine interest and research
5. Keep to approximately {word_limit} words
6. Avoid generic statements; be specific and authentic

Write the supplement answer now:"""

        response = await client.messages.create(
            model=MODEL,
            max_tokens=800,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        supplement = response.content[0].text
        logger.info(f"Generated supplement for {university_name}")
        return supplement

    except Exception as e:
        logger.error(f"Error generating supplement: {e}")
        raise


async def generate_activity_description(activity: Dict) -> str:
    """
    Generate a 150-character activity description.

    Args:
        activity: {
            'title', 'type', 'organization', 'role', 'impact',
            'key_learnings'
        }

    Returns:
        Generated description (approx 150 chars)
    """
    try:
        title = activity.get('title', '')
        activity_type = activity.get('type', '')
        organization = activity.get('organization', '')
        role = activity.get('role', '')
        impact = activity.get('impact', '')
        learnings = activity.get('key_learnings', '')

        prompt = f"""Write a concise, impactful activity description for a college application (approximately 150 characters).

Activity Information:
- Title: {title}
- Type: {activity_type}
- Organization: {organization}
- Student's Role: {role}
- Impact/Outcomes: {impact}
- Key Learnings: {learnings}

Instructions:
1. Write in first person
2. Be specific and quantify impact where possible (e.g., "led team of 12", "raised $5,000")
3. Highlight what made this activity meaningful to you
4. Keep to approximately 150 characters (about 25-30 words)
5. Make every word count—be punchy and direct

Write the description now:"""

        response = await client.messages.create(
            model=MODEL,
            max_tokens=200,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        description = response.content[0].text
        logger.info(f"Generated activity description for {title}")
        return description

    except Exception as e:
        logger.error(f"Error generating activity description: {e}")
        raise


async def generate_rec_letter(
    student_profile: Dict,
    recommender_info: Dict,
    letter_type: str
) -> str:
    """
    Generate a recommendation letter.

    Args:
        student_profile: Student background info
        recommender_info: {
            'name', 'title', 'relationship_duration',
            'student_strengths', 'specific_examples'
        }
        letter_type: 'teacher' | 'counselor'

    Returns:
        Generated letter (approx 500 words)
    """
    try:
        student_name = f"{student_profile.get('first_name', '')} {student_profile.get('last_name', '')}"
        recommender_name = recommender_info.get('name', 'Recommender')
        recommender_title = recommender_info.get('title', 'Teacher')
        duration = recommender_info.get('relationship_duration', '1 year')
        strengths = recommender_info.get('student_strengths', '')
        examples = recommender_info.get('specific_examples', '')

        if letter_type == "teacher":
            letter_context = "an academic recommendation letter from a teacher"
        else:
            letter_context = "a school counselor recommendation letter"

        prompt = f"""You are an experienced educator writing {letter_context} for a college application.

Write from the perspective of: {recommender_name} ({recommender_title})

Student Information:
- Name: {student_name}
- Relationship Duration: {duration}
- Key Strengths: {strengths}
- Specific Examples: {examples}

Instructions for {letter_type.title()} Letter:
1. Write in first person from the recommender's perspective
2. Be specific with examples—cite actual situations, assignments, achievements
3. Comment on the student's intellectual curiosity, character, and potential
4. Be authentic and thoughtful, not over-the-top
5. Target approximately 500 words
6. Include:
   - How you know the student
   - Specific strengths and abilities
   - An anecdote or example that illustrates character
   - How the student interacts with peers and adults
   - Your assessment of the student's potential for success in college
7. Avoid generic praise; be specific and honest

{"For a teacher: Focus on academic abilities, classroom behavior, intellectual engagement." if letter_type == "teacher" else "For a counselor: Focus on character, personal growth, leadership, and how the student contributes to the school community."}

Write the recommendation letter now:"""

        response = await client.messages.create(
            model=MODEL,
            max_tokens=1500,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        letter = response.content[0].text
        logger.info(f"Generated {letter_type} recommendation letter for {student_name}")
        return letter

    except Exception as e:
        logger.error(f"Error generating recommendation letter: {e}")
        raise


async def generate_university_email_reply(
    email_subject: str,
    email_body: str,
    student_profile: Dict
) -> str:
    """
    Generate a draft email reply to a university.

    Args:
        email_subject: Subject of the incoming email
        email_body: Body of the incoming email
        student_profile: Student info for context

    Returns:
        Generated email reply text
    """
    try:
        student_name = f"{student_profile.get('first_name', '')} {student_profile.get('last_name', '')}"
        university_name = student_profile.get('interested_universities', [None])[0] or "the university"

        prompt = f"""You are helping a student draft a thoughtful email reply to a university.

Original Email Subject: {email_subject}
Original Email Body:
{email_body}

Student Information:
- Name: {student_name}

Instructions:
1. Write in first person as the student
2. Be professional, warm, and genuine
3. Reference specific details from the university's email
4. Express genuine interest if appropriate
5. Keep to 200-300 words
6. If this is a question (e.g., "Can you tell us why you chose our university?"),
   answer thoughtfully and specifically
7. If this is an interview request or deadline reminder, acknowledge and confirm
8. Close warmly with gratitude

Write the email reply now (without "To:", "From:", "Subject:" lines—just the body):"""

        response = await client.messages.create(
            model=MODEL,
            max_tokens=600,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        reply = response.content[0].text
        logger.info(f"Generated email reply for {student_name}")
        return reply

    except Exception as e:
        logger.error(f"Error generating email reply: {e}")
        raise
