"""
Pydantic models for request/response validation
"""
from models.schemas import (
    # Auth
    UserRegister,
    UserLogin,
    AuthResponse,
    CreateCuratorRequest,
    CompleteCuratorRegistration,
    # CRECI
    CreciValidationRequest,
    CreciValidationResponse,
    # Buyer
    BuyerInterest,
    BuyerInterestCreate,
    BuyerInterestUpdate,
    FullInterestCreate,
    BuyerProfile,
    DeleteReason,
    # Agent
    AgentProfile,
    # Match
    Match,
    MatchCreate,
    MatchCreateWithProperty,
    PropertyInfo,
    # Visit
    Visit,
    ScheduleVisitRequest,
    # Bot
    BotMessage,
    BotConversation,
    SendMessageRequest,
    # Curator
    CurationDecision,
    FollowUpCreate,
    FollowUp,
)

__all__ = [
    'UserRegister', 'UserLogin', 'AuthResponse', 'CreateCuratorRequest', 'CompleteCuratorRegistration',
    'CreciValidationRequest', 'CreciValidationResponse',
    'BuyerInterest', 'BuyerInterestCreate', 'BuyerInterestUpdate', 'FullInterestCreate', 'BuyerProfile', 'DeleteReason',
    'AgentProfile',
    'Match', 'MatchCreate', 'MatchCreateWithProperty', 'PropertyInfo',
    'Visit', 'ScheduleVisitRequest',
    'BotMessage', 'BotConversation', 'SendMessageRequest',
    'CurationDecision', 'FollowUpCreate', 'FollowUp',
]
