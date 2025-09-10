"""
NestFest Competition Platform - Database Models
Django/SQLAlchemy-style models demonstrating schema usage patterns
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from enum import Enum
import uuid
import json

# =====================================================
# ENUMS AND CONSTANTS
# =====================================================

class CompetitionType(str, Enum):
    INDIVIDUAL = "individual"
    TEAM = "team"
    HYBRID = "hybrid"

class CompetitionStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class SubmissionStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    REVIEWED = "reviewed"
    DISQUALIFIED = "disqualified"

class VotingType(str, Enum):
    TRADITIONAL = "traditional"
    QUADRATIC = "quadratic"
    RANKED_CHOICE = "ranked_choice"
    APPROVAL = "approval"

class AccountStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    BANNED = "banned"
    PENDING = "pending"

# =====================================================
# DATABASE MODELS
# =====================================================

class Institution:
    """University or educational institution model"""
    
    def __init__(self, name: str, code: str, type: str, country: str):
        self.id = str(uuid.uuid4())
        self.name = name
        self.code = code
        self.type = type
        self.country = country
        self.verification_status = "pending"
        self.is_active = True
        self.created_at = datetime.utcnow()
    
    @classmethod
    def get_by_code(cls, code: str) -> Optional['Institution']:
        """Get institution by code"""
        query = """
        SELECT id, name, code, type, country, verification_status, is_active
        FROM institutions 
        WHERE code = %s AND is_active = true
        """
        # Execute query and return Institution object
        pass
    
    def verify(self) -> None:
        """Mark institution as verified"""
        query = """
        UPDATE institutions 
        SET verification_status = 'verified', updated_at = NOW()
        WHERE id = %s
        """
        # Execute update
        pass

class User:
    """Main user model with academic information"""
    
    def __init__(self, email: str, first_name: str, last_name: str):
        self.id = str(uuid.uuid4())
        self.email = email
        self.first_name = first_name
        self.last_name = last_name
        self.username = None
        self.institution_id = None
        self.program_id = None
        self.skills = []
        self.interests = []
        self.account_status = AccountStatus.ACTIVE
        self.email_verified = False
        self.created_at = datetime.utcnow()
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    def can_participate_in_competition(self, competition: 'Competition') -> tuple[bool, str]:
        """Check if user can participate in a competition"""
        if self.account_status != AccountStatus.ACTIVE:
            return False, "Account not active"
        
        if not self.email_verified:
            return False, "Email not verified"
        
        # Check if already registered
        existing_registration = self.get_registration_for_competition(competition.id)
        if existing_registration:
            return False, "Already registered for this competition"
        
        return True, "Can participate"
    
    def get_registration_for_competition(self, competition_id: str) -> Optional['Registration']:
        """Get user's registration for a specific competition"""
        query = """
        SELECT id, competition_id, participant_type, status, registered_at
        FROM registrations 
        WHERE competition_id = %s 
        AND participant_type = 'individual' 
        AND participant_id = %s
        """
        # Execute query and return Registration object
        pass
    
    def get_active_teams(self) -> List['Team']:
        """Get teams where user is an active member"""
        query = """
        SELECT t.id, t.name, t.captain_id, t.status, tm.role
        FROM teams t
        JOIN team_members tm ON t.id = tm.team_id
        WHERE tm.user_id = %s 
        AND tm.status = 'active' 
        AND t.status IN ('forming', 'active')
        """
        # Execute query and return Team objects
        pass

class Team:
    """Team model for team-based competitions"""
    
    def __init__(self, name: str, captain_id: str, max_members: int = 4):
        self.id = str(uuid.uuid4())
        self.name = name
        self.captain_id = captain_id
        self.max_members = max_members
        self.current_member_count = 1
        self.status = "forming"
        self.invite_code = self._generate_invite_code()
        self.created_at = datetime.utcnow()
    
    def _generate_invite_code(self) -> str:
        """Generate unique 8-character invite code"""
        import secrets
        import string
        return ''.join(secrets.choice(string.ascii_uppercase + string.digits) 
                      for _ in range(8))
    
    def can_add_member(self) -> tuple[bool, str]:
        """Check if team can accept new members"""
        if self.status != "forming":
            return False, "Team is not accepting new members"
        
        if self.current_member_count >= self.max_members:
            return False, "Team is full"
        
        return True, "Can add member"
    
    def invite_member(self, user_id: str, invited_by: str, message: str = "") -> 'TeamInvitation':
        """Send invitation to user"""
        can_add, reason = self.can_add_member()
        if not can_add:
            raise ValueError(reason)
        
        invitation = TeamInvitation(
            team_id=self.id,
            user_id=user_id,
            invited_by=invited_by,
            type="invitation",
            message=message
        )
        return invitation
    
    def get_members(self) -> List[Dict[str, Any]]:
        """Get all active team members with details"""
        query = """
        SELECT 
            u.id, u.first_name, u.last_name, u.email,
            tm.role, tm.joined_at,
            i.name as institution_name
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        LEFT JOIN institutions i ON u.institution_id = i.id
        WHERE tm.team_id = %s AND tm.status = 'active'
        ORDER BY 
            CASE tm.role 
                WHEN 'captain' THEN 1 
                WHEN 'co_captain' THEN 2 
                ELSE 3 
            END,
            tm.joined_at
        """
        # Execute query and return member data
        pass

class Competition:
    """Main competition model with flexible configuration"""
    
    def __init__(self, name: str, category_id: str, created_by: str):
        self.id = str(uuid.uuid4())
        self.name = name
        self.slug = self._generate_slug(name)
        self.category_id = category_id
        self.type = CompetitionType.INDIVIDUAL
        self.status = CompetitionStatus.DRAFT
        self.submission_requirements = {}
        self.file_types_allowed = ["pdf", "docx", "pptx", "mp4", "zip"]
        self.max_file_size_mb = 100
        self.rules = {}
        self.judging_criteria = []
        self.created_by = created_by
        self.created_at = datetime.utcnow()
    
    def _generate_slug(self, name: str) -> str:
        """Generate URL-safe slug from competition name"""
        import re
        slug = re.sub(r'[^\w\s-]', '', name.lower())
        slug = re.sub(r'[\s_-]+', '-', slug)
        return slug.strip('-')
    
    @property
    def is_registration_open(self) -> bool:
        """Check if registration is currently open"""
        now = datetime.utcnow()
        return (self.status == CompetitionStatus.PUBLISHED and 
                self.registration_start <= now <= self.registration_end)
    
    @property
    def is_submission_open(self) -> bool:
        """Check if submissions are currently being accepted"""
        now = datetime.utcnow()
        return (self.status == CompetitionStatus.ACTIVE and 
                self.competition_start <= now <= self.competition_end)
    
    def can_user_register(self, user: User) -> tuple[bool, str]:
        """Check if user can register for this competition"""
        if not self.is_registration_open:
            return False, "Registration is not open"
        
        return user.can_participate_in_competition(self)
    
    def register_participant(self, participant_id: str, participant_type: str, 
                           registration_data: Dict[str, Any] = None) -> 'Registration':
        """Register a participant (individual or team) for competition"""
        can_register, reason = self._validate_registration(participant_id, participant_type)
        if not can_register:
            raise ValueError(reason)
        
        registration = Registration(
            competition_id=self.id,
            participant_type=participant_type,
            participant_id=participant_id,
            registration_data=registration_data or {}
        )
        return registration
    
    def _validate_registration(self, participant_id: str, participant_type: str) -> tuple[bool, str]:
        """Validate registration requirements"""
        if participant_type not in ['individual', 'team']:
            return False, "Invalid participant type"
        
        if participant_type == 'individual' and self.type == CompetitionType.TEAM:
            return False, "Individual registration not allowed for team competition"
        
        if participant_type == 'team' and self.type == CompetitionType.INDIVIDUAL:
            return False, "Team registration not allowed for individual competition"
        
        return True, "Registration valid"
    
    def get_leaderboard(self, round_id: str = None) -> List[Dict[str, Any]]:
        """Get competition leaderboard with rankings"""
        query = """
        SELECT 
            participant_name,
            participant_type,
            average_score,
            total_reviews
        FROM get_competition_leaderboard(%s, %s)
        ORDER BY average_score DESC
        LIMIT 100
        """
        # Execute stored function and return leaderboard data
        pass

class Submission:
    """Submission model with version control"""
    
    def __init__(self, competition_id: str, round_id: str, registration_id: str, title: str):
        self.id = str(uuid.uuid4())
        self.competition_id = competition_id
        self.round_id = round_id
        self.registration_id = registration_id
        self.title = title
        self.description = ""
        self.version = 1
        self.status = SubmissionStatus.DRAFT
        self.submission_data = {}
        self.created_at = datetime.utcnow()
    
    def can_submit(self) -> tuple[bool, str]:
        """Check if submission can be finalized"""
        if self.status != SubmissionStatus.DRAFT:
            return False, "Submission already finalized"
        
        if not self.has_required_files():
            return False, "Missing required files"
        
        # Check submission deadline
        round_info = self.get_round_info()
        if round_info and round_info['submission_deadline']:
            if datetime.utcnow() > round_info['submission_deadline']:
                return False, "Submission deadline has passed"
        
        return True, "Can submit"
    
    def submit(self) -> None:
        """Finalize submission"""
        can_submit, reason = self.can_submit()
        if not can_submit:
            raise ValueError(reason)
        
        self.status = SubmissionStatus.SUBMITTED
        self.submitted_at = datetime.utcnow()
        self.is_final = True
        
        # Create new version if changes made after submission
        query = """
        UPDATE submissions 
        SET status = %s, submitted_at = %s, is_final = %s
        WHERE id = %s
        """
        # Execute update
    
    def has_required_files(self) -> bool:
        """Check if submission has all required files"""
        query = """
        SELECT COUNT(*) as file_count
        FROM submission_files sf
        JOIN files f ON sf.file_id = f.id
        WHERE sf.submission_id = %s
        """
        # Execute query and check file requirements
        return True  # Placeholder
    
    def get_round_info(self) -> Dict[str, Any]:
        """Get competition round information"""
        query = """
        SELECT name, submission_deadline, judging_deadline, requirements
        FROM competition_rounds 
        WHERE id = %s
        """
        # Execute query and return round data
        pass
    
    def attach_file(self, file_id: str, category: str = "main_document", 
                   is_primary: bool = False) -> None:
        """Attach file to submission"""
        query = """
        INSERT INTO submission_files (submission_id, file_id, file_category, is_primary)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (submission_id, file_id) DO UPDATE 
        SET file_category = EXCLUDED.file_category, is_primary = EXCLUDED.is_primary
        """
        # Execute insert

class VotingSession:
    """Live voting session for competitions"""
    
    def __init__(self, competition_id: str, name: str, voting_type: VotingType, created_by: str):
        self.id = str(uuid.uuid4())
        self.competition_id = competition_id
        self.name = name
        self.voting_type = voting_type
        self.voter_eligibility = {}
        self.requires_authentication = True
        self.status = "draft"
        self.votes_per_voter = 1
        self.created_by = created_by
        self.created_at = datetime.utcnow()
    
    @property
    def is_active(self) -> bool:
        """Check if voting session is currently active"""
        if self.status != "active":
            return False
        
        now = datetime.utcnow()
        return self.start_time <= now <= self.end_time
    
    def can_user_vote(self, user: User) -> tuple[bool, str]:
        """Check if user is eligible to vote"""
        if not self.is_active:
            return False, "Voting session is not active"
        
        if self.requires_authentication and not user.email_verified:
            return False, "Email verification required"
        
        # Check if user already voted (if vote changing not allowed)
        if hasattr(self, 'prevent_vote_changing') and self.prevent_vote_changing:
            if self.has_user_voted(user.id):
                return False, "Already voted in this session"
        
        return True, "Can vote"
    
    def has_user_voted(self, user_id: str) -> bool:
        """Check if user has already voted in this session"""
        query = """
        SELECT COUNT(*) as vote_count
        FROM votes 
        WHERE voting_session_id = %s AND voter_id = %s
        """
        # Execute query
        return False  # Placeholder
    
    def cast_vote(self, voter_id: str, vote_option_id: str, vote_weight: float = 1.0, 
                 voter_ip: str = None) -> 'Vote':
        """Cast a vote in the session"""
        # Validate voting eligibility
        # Create vote record
        # Update vote totals
        # Apply fraud detection
        pass
    
    def get_results(self, include_real_time: bool = False) -> Dict[str, Any]:
        """Get voting results"""
        if not include_real_time and not self.show_results_after_voting:
            return {"error": "Results not available yet"}
        
        query = """
        SELECT 
            vo.title,
            vo.id,
            COUNT(v.id) as vote_count,
            SUM(v.vote_weight) as total_weight
        FROM vote_options vo
        LEFT JOIN votes v ON vo.id = v.vote_option_id
        WHERE vo.voting_session_id = %s
        GROUP BY vo.id, vo.title
        ORDER BY total_weight DESC
        """
        # Execute query and return results
        pass

# =====================================================
# SERVICE LAYER CLASSES
# =====================================================

class CompetitionService:
    """Service class for competition-related operations"""
    
    @staticmethod
    def create_competition(data: Dict[str, Any], created_by: str) -> Competition:
        """Create a new competition with validation"""
        # Validate required fields
        required_fields = ['name', 'category_id', 'registration_start', 'registration_end', 
                          'competition_start', 'competition_end']
        
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")
        
        # Create competition
        competition = Competition(
            name=data['name'],
            category_id=data['category_id'],
            created_by=created_by
        )
        
        # Set additional properties
        competition.description = data.get('description', '')
        competition.type = data.get('type', CompetitionType.INDIVIDUAL)
        competition.registration_start = data['registration_start']
        competition.registration_end = data['registration_end']
        competition.competition_start = data['competition_start']
        competition.competition_end = data['competition_end']
        
        return competition
    
    @staticmethod
    def register_for_competition(competition_id: str, user: User, 
                               team_id: str = None) -> 'Registration':
        """Register user or team for competition"""
        competition = Competition.get_by_id(competition_id)
        if not competition:
            raise ValueError("Competition not found")
        
        if team_id:
            # Team registration
            team = Team.get_by_id(team_id)
            if not team:
                raise ValueError("Team not found")
            
            # Verify user is team captain or authorized member
            if team.captain_id != user.id:
                raise ValueError("Only team captain can register team")
            
            return competition.register_participant(team_id, 'team')
        else:
            # Individual registration
            return competition.register_participant(user.id, 'individual')

class JudgingService:
    """Service class for judging and review operations"""
    
    @staticmethod
    def assign_judges_to_competition(competition_id: str, judge_ids: List[str], 
                                   assignment_method: str = 'manual') -> List['JudgeAssignment']:
        """Assign judges to competition"""
        assignments = []
        
        for judge_id in judge_ids:
            assignment = JudgeAssignment(
                competition_id=competition_id,
                judge_id=judge_id,
                assignment_method=assignment_method
            )
            assignments.append(assignment)
        
        return assignments
    
    @staticmethod
    def auto_assign_submissions(competition_id: str, round_id: str = None) -> Dict[str, int]:
        """Automatically assign submissions to judges"""
        # Load balancing algorithm
        # Conflict of interest checking
        # Expertise matching
        
        query = """
        WITH judge_workload AS (
            SELECT 
                ja.judge_id,
                j.max_concurrent_reviews,
                COUNT(r.id) as current_reviews
            FROM judge_assignments ja
            JOIN judges j ON ja.judge_id = j.id
            LEFT JOIN reviews r ON j.id = r.judge_id AND r.status != 'final'
            WHERE ja.competition_id = %s 
            AND ja.status = 'active'
            GROUP BY ja.judge_id, j.max_concurrent_reviews
            HAVING COUNT(r.id) < j.max_concurrent_reviews
        )
        SELECT judge_id, max_concurrent_reviews - current_reviews as available_slots
        FROM judge_workload
        ORDER BY available_slots DESC
        """
        # Execute assignment logic
        return {"assignments_created": 0}  # Placeholder

class AnalyticsService:
    """Service class for analytics and reporting"""
    
    @staticmethod
    def track_event(user_id: str, event_type: str, event_data: Dict[str, Any], 
                   session_id: str = None, ip_address: str = None) -> None:
        """Track user event for analytics"""
        query = """
        INSERT INTO analytics_events 
        (user_id, session_id, event_type, event_data, ip_address, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        # Execute insert with current timestamp partition routing
    
    @staticmethod
    def get_competition_stats(competition_id: str, date_range: tuple = None) -> Dict[str, Any]:
        """Get comprehensive competition statistics"""
        base_query = """
        SELECT 
            COUNT(DISTINCT r.id) as total_registrations,
            COUNT(DISTINCT CASE WHEN r.participant_type = 'individual' THEN r.id END) as individual_registrations,
            COUNT(DISTINCT CASE WHEN r.participant_type = 'team' THEN r.id END) as team_registrations,
            COUNT(DISTINCT s.id) as total_submissions,
            COUNT(DISTINCT CASE WHEN s.submitted_at <= cr.submission_deadline THEN s.id END) as on_time_submissions,
            AVG(rev.overall_score) as average_score
        FROM competitions c
        LEFT JOIN registrations r ON c.id = r.competition_id
        LEFT JOIN submissions s ON r.id = s.registration_id
        LEFT JOIN competition_rounds cr ON s.round_id = cr.id
        LEFT JOIN reviews rev ON s.id = rev.submission_id AND rev.status = 'final'
        WHERE c.id = %s
        """
        # Execute query with date filtering if provided
        return {}  # Placeholder

# =====================================================
# USAGE EXAMPLES
# =====================================================

def example_usage():
    """Demonstrate common database operations"""
    
    # Create a user
    user = User(
        email="student@university.edu",
        first_name="John",
        last_name="Doe"
    )
    user.institution_id = "univ-123"
    user.skills = ["Python", "Machine Learning", "Web Development"]
    
    # Create a competition
    competition_data = {
        'name': 'AI Innovation Challenge 2024',
        'category_id': 'tech-001',
        'description': 'Build innovative AI solutions',
        'type': CompetitionType.TEAM,
        'registration_start': datetime.utcnow(),
        'registration_end': datetime.utcnow() + timedelta(days=30),
        'competition_start': datetime.utcnow() + timedelta(days=35),
        'competition_end': datetime.utcnow() + timedelta(days=90)
    }
    
    competition = CompetitionService.create_competition(competition_data, user.id)
    
    # Create and join a team
    team = Team(
        name="AI Innovators",
        captain_id=user.id,
        max_members=4
    )
    
    # Register team for competition
    registration = CompetitionService.register_for_competition(
        competition.id, user, team_id=team.id
    )
    
    # Create submission
    submission = Submission(
        competition_id=competition.id,
        round_id="round-001",
        registration_id=registration.id,
        title="Revolutionary AI Solution"
    )
    
    # Submit when ready
    try:
        submission.submit()
        print("Submission successful!")
    except ValueError as e:
        print(f"Submission failed: {e}")
    
    # Track analytics event
    AnalyticsService.track_event(
        user_id=user.id,
        event_type="submission_created",
        event_data={
            "competition_id": competition.id,
            "submission_id": submission.id,
            "team_id": team.id
        }
    )

if __name__ == "__main__":
    example_usage()