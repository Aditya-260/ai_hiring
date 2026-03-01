import motor.motor_asyncio
from app.config import MONGODB_URI

client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
db = client["ai_hiring"]

# Collections
users_collection = db["users"]
companies_collection = db["companies"]
jobs_collection = db["jobs"]
preset_jobs_collection = db["preset_jobs"]  # kept for data compatibility
applications_collection = db["applications"]
aptitude_questions_collection = db["aptitude_questions"]
interview_records_collection = db["interview_records"]
system_logs_collection = db["system_logs"]
