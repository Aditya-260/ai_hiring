import json
import random
import uuid
from typing import Optional

from app.config import GROQ_API_KEY

# Initialize Groq client if API key is available
_groq_client = None
if GROQ_API_KEY:
    try:
        from groq import Groq
        _groq_client = Groq(api_key=GROQ_API_KEY)
    except ImportError:
        pass


def _difficulty_for_experience(experience: str) -> str:
    exp = experience.lower().strip()
    if "fresher" in exp or "0" in exp:
        return "easy"
    elif "1" in exp or "2" in exp or "3" in exp:
        return "medium"
    else:
        return "hard"


# ──────────────────────────────────────────────────────────────
#  GROQ-POWERED INTERVIEW QUESTION GENERATION
# ──────────────────────────────────────────────────────────────

def _generate_questions_with_groq(
    role: str, skills: list[str], experience: str, difficulty: str, num_questions: int
) -> list[dict]:
    """Use Groq LLM to generate high-quality interview questions."""
    skills_str = ", ".join(skills) if skills else "general knowledge"
    prompt = f"""Generate exactly {num_questions} interview questions for a {role} position.

Candidate experience level: {experience} ({difficulty} difficulty)
Required skills: {skills_str}

Requirements:
- Questions should match the {difficulty} difficulty level
- Cover different skills from the list
- Be specific and practical, not generic
- For "easy": test fundamental understanding
- For "medium": test applied knowledge and problem-solving
- For "hard": test system design, architecture, and deep expertise

Return ONLY a valid JSON array with objects having these keys:
- "question": the interview question text
- "difficulty": "{difficulty}"

Example: [{{"question": "...", "difficulty": "{difficulty}"}}]"""

    try:
        response = _groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert technical interviewer. Return ONLY valid JSON, no markdown, no extra text."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=2000,
        )
        content = response.choices[0].message.content.strip()

        # Extract JSON from response (handle markdown code blocks)
        if "```" in content:
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        questions_data = json.loads(content)
        questions = []
        for q in questions_data[:num_questions]:
            questions.append({
                "question_id": str(uuid.uuid4()),
                "question": q["question"],
                "difficulty": difficulty,
            })
        return questions
    except Exception as e:
        print(f"[Groq] Question generation failed, falling back to rule-based: {e}")
        return None


def _generate_questions_rule_based(
    role: str, skills: list[str], experience: str, difficulty: str, num_questions: int
) -> list[dict]:
    """Fallback: rule-based question generation using templates."""
    templates = {
        "easy": [
            "Can you explain what {skill} is and why it is used?",
            "What are the basic concepts of {skill} that a beginner should know?",
            "Describe a simple project you have built or studied using {skill}.",
            "What are the advantages of using {skill} in a {role} position?",
            "How would you explain {skill} to someone with no technical background?",
        ],
        "medium": [
            "Describe a challenging problem you solved using {skill} in a professional setting.",
            "How would you optimize a {role} workflow that heavily uses {skill}?",
            "What are common pitfalls when working with {skill} and how do you avoid them?",
            "Explain the difference between beginner and advanced usage of {skill}.",
            "Walk me through how you would design a solution for a {role} task using {skill}.",
        ],
        "hard": [
            "How would you architect a large-scale system as a {role} using {skill}? Discuss trade-offs.",
            "Describe a production-level failure related to {skill} and how you diagnosed and fixed it.",
            "What advanced patterns or strategies in {skill} have you applied in senior-level {role} work?",
            "How do you evaluate and choose between {skill} and its alternatives for a {role} project?",
            "Discuss how you would mentor a junior developer on best practices for {skill} in a {role} context.",
        ],
    }
    tmpl = templates.get(difficulty, templates["medium"])
    questions = []
    for i in range(num_questions):
        skill = skills[i % len(skills)] if skills else "general knowledge"
        text = tmpl[i % len(tmpl)].format(skill=skill, role=role)
        questions.append({
            "question_id": str(uuid.uuid4()),
            "question": text,
            "difficulty": difficulty,
        })
    return questions


def generate_interview_questions(
    role: str, skills: list[str], experience: str, num_questions: int = 5,
) -> list[dict]:
    difficulty = _difficulty_for_experience(experience)
    # Try Groq first, fall back to rule-based
    if _groq_client:
        result = _generate_questions_with_groq(role, skills, experience, difficulty, num_questions)
        if result:
            return result
    return _generate_questions_rule_based(role, skills, experience, difficulty, num_questions)


# ──────────────────────────────────────────────────────────────
#  GROQ-POWERED ANSWER EVALUATION
# ──────────────────────────────────────────────────────────────

def _evaluate_answer_with_groq(question: str, answer: str) -> Optional[dict]:
    """Use Groq LLM to evaluate an interview answer."""
    if not answer or len(answer.strip()) < 10:
        return {"score": 0.0, "feedback": "Answer is too short or empty. Please provide a detailed response."}

    prompt = f"""Evaluate this interview answer.

Question: {question}
Answer: {answer}

Score the answer from 1-10 based on:
- Relevance to the question
- Technical depth and accuracy
- Use of concrete examples
- Clarity of explanation

Return ONLY valid JSON with these keys:
- "score": number between 0.0 and 10.0
- "feedback": one-sentence feedback (max 30 words)

Example: {{"score": 7.5, "feedback": "Good explanation with relevant examples, but could elaborate more on edge cases."}}"""

    try:
        response = _groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert interview evaluator. Return ONLY valid JSON, no markdown."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=200,
        )
        content = response.choices[0].message.content.strip()
        if "```" in content:
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        result = json.loads(content)
        score = max(0.0, min(10.0, float(result["score"])))
        return {"score": round(score, 1), "feedback": result.get("feedback", "")}
    except Exception as e:
        print(f"[Groq] Answer evaluation failed, falling back to rule-based: {e}")
        return None


_GOOD_SIGNALS = [
    "because", "for example", "such as", "specifically", "in my experience",
    "i implemented", "i built", "i designed", "the advantage", "trade-off",
    "optimize", "architecture", "pattern", "performance", "scalable",
    "i used", "approach", "solution", "methodology", "framework",
]


def _evaluate_answer_rule_based(question: str, answer: str) -> dict:
    """Fallback: rule-based answer scoring using heuristics."""
    if not answer or len(answer.strip()) < 10:
        return {"score": 0.0, "feedback": "Answer is too short or empty. Please provide a detailed response."}

    answer_lower = answer.lower()
    word_count = len(answer.split())

    if word_count >= 100:
        score = 6.0
    elif word_count >= 50:
        score = 5.0
    elif word_count >= 25:
        score = 4.0
    else:
        score = 3.0

    signal_count = sum(1 for s in _GOOD_SIGNALS if s in answer_lower)
    score += min(signal_count * 0.5, 3.0)
    score = min(round(score, 1), 10.0)

    if score >= 8:
        feedback = "Excellent, detailed response demonstrating strong expertise."
    elif score >= 6:
        feedback = "Good response with relevant points. Could include more specific examples."
    elif score >= 4:
        feedback = "Adequate response but lacks depth. Consider providing concrete examples."
    else:
        feedback = "Response needs significant improvement. Provide detailed, specific answers."

    return {"score": score, "feedback": feedback}


def evaluate_answer(question: str, answer: str) -> dict:
    if _groq_client:
        result = _evaluate_answer_with_groq(question, answer)
        if result:
            return result
    return _evaluate_answer_rule_based(question, answer)


# ──────────────────────────────────────────────────────────────
#  RANKING & RECOMMENDATION
# ──────────────────────────────────────────────────────────────

def compute_final_score(aptitude_score: float, interview_score: float) -> float:
    """Aptitude = 40%, Interview = 60%."""
    return round(aptitude_score * 0.4 + interview_score * 0.6, 2)


def get_recommendation(final_score: float) -> str:
    if final_score >= 70:
        return "Highly Recommended"
    elif final_score >= 50:
        return "Recommended"
    else:
        return "Not Recommended"


def rank_candidates(applications: list[dict]) -> list[dict]:
    for app in applications:
        apt = app.get("aptitude_score", 0) or 0
        intv = app.get("interview_score", 0) or 0
        app["final_score"] = compute_final_score(apt, intv)
        app["recommendation"] = get_recommendation(app["final_score"])
    return sorted(applications, key=lambda x: x["final_score"], reverse=True)
