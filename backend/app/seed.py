"""
Seed script: populates the database with sample aptitude questions, preset jobs, and an admin account.
Run: python -m app.seed
"""
import asyncio
from app.database import aptitude_questions_collection, users_collection, preset_jobs_collection
from app.auth import hash_password

PRESET_JOBS = [
    {
        "preset_id": "frontend",
        "title": "Frontend Developer",
        "role": "Frontend Developer",
        "experience": "0-3 years",
        "skills": ["React", "HTML/CSS", "JavaScript", "TypeScript", "Tailwind"],
        "description": "Build beautiful, responsive user interfaces and web experiences.",
        "icon": "🎨",
        "color": "#3B82F6",
        "color_light": "#EFF6FF",
        "salary_range": "₹6L – ₹18L / yr",
        "work_mode": "Remote",
        "job_type": "Full-time",
        "openings": 5,
        "assessment_level": "Intermediate",
        "is_active": True,
    },
    {
        "preset_id": "backend",
        "title": "Backend Developer",
        "role": "Backend Developer",
        "experience": "0-3 years",
        "skills": ["Python", "Node.js", "REST APIs", "SQL", "MongoDB"],
        "description": "Design and build robust server-side systems, APIs and databases.",
        "icon": "⚙️",
        "color": "#10B981",
        "color_light": "#ECFDF5",
        "salary_range": "₹7L – ₹20L / yr",
        "work_mode": "Hybrid",
        "job_type": "Full-time",
        "openings": 4,
        "assessment_level": "Intermediate",
        "is_active": True,
    },
    {
        "preset_id": "cloud",
        "title": "Cloud Engineer",
        "role": "Cloud Engineer",
        "experience": "0-3 years",
        "skills": ["AWS", "Azure", "Kubernetes", "Docker", "Terraform"],
        "description": "Architect, deploy and manage scalable cloud infrastructure.",
        "icon": "☁️",
        "color": "#8B5CF6",
        "color_light": "#F5F3FF",
        "salary_range": "₹8L – ₹22L / yr",
        "work_mode": "Remote",
        "job_type": "Full-time",
        "openings": 3,
        "assessment_level": "Advanced",
        "is_active": True,
    },
    {
        "preset_id": "aiml",
        "title": "AI / ML Engineer",
        "role": "AI/ML Engineer",
        "experience": "0-3 years",
        "skills": ["Python", "TensorFlow", "PyTorch", "LLMs", "Data Science"],
        "description": "Research, develop and deploy machine learning models and AI systems.",
        "icon": "🤖",
        "color": "#F59E0B",
        "color_light": "#FFFBEB",
        "salary_range": "₹10L – ₹28L / yr",
        "work_mode": "Hybrid",
        "job_type": "Full-time",
        "openings": 3,
        "assessment_level": "Advanced",
        "is_active": True,
    },
    {
        "preset_id": "cybersecurity",
        "title": "Cybersecurity Analyst",
        "role": "Cybersecurity Analyst",
        "experience": "0-3 years",
        "skills": ["Penetration Testing", "SIEM", "Networking", "Python", "Compliance"],
        "description": "Protect systems and data from cyber threats via assessments and incident response.",
        "icon": "🛡️",
        "color": "#EF4444",
        "color_light": "#FEF2F2",
        "salary_range": "₹7L – ₹20L / yr",
        "work_mode": "On-site",
        "job_type": "Full-time",
        "openings": 2,
        "assessment_level": "Advanced",
        "is_active": True,
    },
    {
        "preset_id": "fullstack",
        "title": "Full-Stack Developer",
        "role": "Full-Stack Developer",
        "experience": "0-3 years",
        "skills": ["React", "Node.js", "Databases", "REST APIs", "TypeScript"],
        "description": "Build end-to-end web applications from database to UI.",
        "icon": "🚀",
        "color": "#EC4899",
        "color_light": "#FDF2F8",
        "salary_range": "₹8L – ₹24L / yr",
        "work_mode": "Remote",
        "job_type": "Full-time",
        "openings": 6,
        "assessment_level": "Intermediate",
        "is_active": True,
    },
]

SAMPLE_QUESTIONS = [
    # ── Quantitative (7 questions) ──────────────────────────
    {
        "text": "A shop offers a 20% discount on an item marked at ₹1500. After the discount, GST of 10% is applied on the discounted price. What is the final price the customer pays?",
        "options": ["₹1200", "₹1320", "₹1350", "₹1400"],
        "correct_answer": "₹1320",
        "category": "quantitative",
        "difficulty": "medium",
        "explanation": "Discounted price = 1500 × 0.8 = 1200. GST 10% on 1200 = 120. Final price = 1200 + 120 = 1320.",
    },
    {
        "text": "A and B together can complete a task in 12 days. A alone can complete the same task in 20 days. In how many days can B alone complete the task?",
        "options": ["24 days", "30 days", "40 days", "60 days"],
        "correct_answer": "30 days",
        "category": "quantitative",
        "difficulty": "medium",
        "explanation": "1/AB = 1/12, 1/A = 1/20 ⇒ 1/B = 1/12 − 1/20 = 2/60 = 1/30. So B takes 30 days.",
    },
    {
        "text": "The average of 5 numbers is 28. If one number 38 is removed, what is the average of the remaining numbers?",
        "options": ["25.5", "26", "26.5", "27"],
        "correct_answer": "25.5",
        "category": "quantitative",
        "difficulty": "medium",
        "explanation": "Total of 5 numbers = 5 × 28 = 140. Removing 38 gives 102. New average = 102 ÷ 4 = 25.5.",
    },
    {
        "text": "A sum of ₹8000 amounts to ₹9200 in 2 years at simple interest. What is the rate of interest per annum?",
        "options": ["6%", "7.5%", "8%", "10%"],
        "correct_answer": "7.5%",
        "category": "quantitative",
        "difficulty": "medium",
        "explanation": "Interest = 9200 − 8000 = 1200. Per year = 600. Rate = (600 × 100) ÷ 8000 = 7.5%.",
    },
    {
        "text": "A train 150 m long passes a pole in 12 seconds. What is its speed in km/h?",
        "options": ["30 km/h", "37.5 km/h", "45 km/h", "50 km/h"],
        "correct_answer": "45 km/h",
        "category": "quantitative",
        "difficulty": "medium",
        "explanation": "Speed = 150/12 = 12.5 m/s. In km/h = 12.5 × 18/5 = 45 km/h.",
    },
    {
        "text": "The ratio of boys to girls in a class is 3:2. If there are 30 students in the class, how many boys are there?",
        "options": ["12", "15", "18", "20"],
        "correct_answer": "18",
        "category": "quantitative",
        "difficulty": "medium",
        "explanation": "Total parts = 3 + 2 = 5. Each part = 30 ÷ 5 = 6. Boys = 3 × 6 = 18.",
    },
    {
        "text": "A person walks at 5 km/h for 2 hours and then at 4 km/h for 3 hours. What is the average speed for the whole journey?",
        "options": ["4.4 km/h", "4.6 km/h", "4.8 km/h", "5 km/h"],
        "correct_answer": "4.4 km/h",
        "category": "quantitative",
        "difficulty": "medium",
        "explanation": "Total distance = 5×2 + 4×3 = 10 + 12 = 22 km. Total time = 5 h. Average speed = 22 ÷ 5 = 4.4 km/h.",
    },
    # ── Logical (6 questions) ───────────────────────────────
    {
        "text": "If in a certain code, 'EARTH' is written as 'FBSUI', how is 'MOON' written in that code?",
        "options": ["NPPQ", "NPPN", "LNNM", "NPOO"],
        "correct_answer": "NPPQ",
        "category": "logical",
        "difficulty": "medium",
        "explanation": "Each letter is shifted by +1: M→N, O→P, O→P, N→O, so 'MOON' becomes 'NPPQ'.",
    },
    {
        "text": "Statements: All developers are coders. Some coders are testers. Conclusions: I. Some developers are testers. II. Some testers are coders. Which is correct?",
        "options": ["Only I follows", "Only II follows", "Both I and II follow", "Neither I nor II follows"],
        "correct_answer": "Only II follows",
        "category": "logical",
        "difficulty": "medium",
        "explanation": "II follows directly from 'Some coders are testers'. I is not guaranteed from the statements.",
    },
    {
        "text": "Find the missing term in the series: 3, 8, 15, 24, 35, ?",
        "options": ["48", "46", "47", "49"],
        "correct_answer": "48",
        "category": "logical",
        "difficulty": "medium",
        "explanation": "Differences: 5, 7, 9, 11 → next difference 13. So next term = 35 + 13 = 48.",
    },
    {
        "text": "Ravi is 7th from the top in a queue and 12th from the bottom. How many people are there in the queue?",
        "options": ["17", "18", "19", "20"],
        "correct_answer": "18",
        "category": "logical",
        "difficulty": "medium",
        "explanation": "Total = top position + bottom position − 1 = 7 + 12 − 1 = 18.",
    },
    {
        "text": "Choose the odd one out: 2, 6, 12, 20, 30, 41",
        "options": ["6", "12", "30", "41"],
        "correct_answer": "41",
        "category": "logical",
        "difficulty": "medium",
        "explanation": "All except 41 follow n(n+1): 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30. 41 does not fit.",
    },
    {
        "text": "In a certain code language, 'DATA' is written as '4941'. If 'CODE' is written using the same logic, which of the following could be its code?",
        "options": ["3185", "3945", "3845", "3985"],
        "correct_answer": "3845",
        "category": "logical",
        "difficulty": "medium",
        "explanation": "Based on positional mapping: C=3, O=8, D=4, E=5 → 3845.",
    },
    # ── Verbal (7 questions) ────────────────────────────────
    {
        "text": "Choose the option that best completes the sentence: \"The manager insisted that every report ______ submitted before Friday.\"",
        "options": ["is", "was", "be", "has been"],
        "correct_answer": "be",
        "category": "verbal",
        "difficulty": "medium",
        "explanation": "After 'insisted that', formal English uses the subjunctive: 'be submitted'.",
    },
    {
        "text": "Identify the correctly spelled word.",
        "options": ["Accomodation", "Acommodation", "Accommodation", "Accommadation"],
        "correct_answer": "Accommodation",
        "category": "verbal",
        "difficulty": "medium",
        "explanation": "The correct spelling is 'Accommodation' with double 'c' and double 'm'.",
    },
    {
        "text": "Choose the most appropriate synonym for the word 'mitigate'.",
        "options": ["Increase", "Worsen", "Alleviate", "Ignore"],
        "correct_answer": "Alleviate",
        "category": "verbal",
        "difficulty": "medium",
        "explanation": "'Mitigate' means to make less severe; 'alleviate' is closest in meaning.",
    },
    {
        "text": "Fill in the blank: \"She was not only intelligent ______ extremely hard-working.\"",
        "options": ["and", "but also", "however", "therefore"],
        "correct_answer": "but also",
        "category": "verbal",
        "difficulty": "medium",
        "explanation": "Standard correlative pair is 'not only ... but also'.",
    },
    {
        "text": "Choose the option that best improves the underlined part: \"Each of the candidates have submitted their documents.\"",
        "options": ["have submitted his documents", "has submitted their documents", "has submitted his or her documents", "have submitted the documents"],
        "correct_answer": "has submitted his or her documents",
        "category": "verbal",
        "difficulty": "medium",
        "explanation": "'Each' takes singular verb 'has'; formal pronoun is 'his or her'.",
    },
    {
        "text": "Choose the option that is closest in meaning to the phrase 'rule out'.",
        "options": ["Consider", "Include", "Eliminate", "Delay"],
        "correct_answer": "Eliminate",
        "category": "verbal",
        "difficulty": "medium",
        "explanation": "'Rule out' commonly means to eliminate or exclude something as a possibility.",
    },
    {
        "text": "Fill in the blank: \"The team ______ the project by the end of this month.\"",
        "options": ["completes", "will completed", "will have completed", "has completing"],
        "correct_answer": "will have completed",
        "category": "verbal",
        "difficulty": "medium",
        "explanation": "For a future action finished before a specified time, use future perfect: 'will have completed'.",
    },
]


async def seed():
    # Replace questions with the latest dataset
    await aptitude_questions_collection.delete_many({})
    await aptitude_questions_collection.insert_many(SAMPLE_QUESTIONS)
    print(f"✓ Seeded {len(SAMPLE_QUESTIONS)} aptitude questions (replaced old data)")

    # Seed / refresh preset jobs (6 role categories)
    await preset_jobs_collection.delete_many({})
    await preset_jobs_collection.insert_many(PRESET_JOBS)
    print(f"✓ Seeded {len(PRESET_JOBS)} preset job categories")

    # Seed admin account
    admin = await users_collection.find_one({"email": "admin@aihiring.com"})
    if not admin:
        await users_collection.insert_one({
            "name": "Admin",
            "email": "admin@aihiring.com",
            "password": hash_password("admin123"),
            "role": "admin",
            "blocked": False,
            "created_at": "2024-01-01T00:00:00",
        })
        print("✓ Created admin account (admin@aihiring.com / admin123)")
    else:
        print("✓ Admin account already exists")


if __name__ == "__main__":
    asyncio.run(seed())
