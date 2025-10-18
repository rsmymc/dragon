// constants/index.js - Dragon Boat App Constants

// Membership Role Constants
export const MEMBERSHIP_ROLES = {
  PLAYER: 1,
  CAPTAIN: 2,
  COACH: 3,
  MANAGER: 4,
};

export const MEMBERSHIP_ROLE_LABELS = {
  [MEMBERSHIP_ROLES.PLAYER]: "Player",
  [MEMBERSHIP_ROLES.CAPTAIN]: "Captain",
  [MEMBERSHIP_ROLES.COACH]: "Coach",
  [MEMBERSHIP_ROLES.MANAGER]: "Manager",
};

// Person Side Constants
export const PERSON_SIDES = {
  BOTH: 0,
  LEFT: 1,
  RIGHT: 2,
};

export const PERSON_SIDE_LABELS = {
  [PERSON_SIDES.BOTH]: "Both Sides",
  [PERSON_SIDES.LEFT]: "Left Side",
  [PERSON_SIDES.RIGHT]: "Right Side",
};

// Team Status Constants
export const TEAM_STATUS = {
  ACTIVE: true,
  INACTIVE: false,
};

// API Response Status
export const API_STATUS = {
  SUCCESS: "success",
  ERROR: "error",
  LOADING: "loading",
};

// Form Validation Rules
export const VALIDATION_RULES = {
  REQUIRED: "required",
  EMAIL: "email",
  PHONE: "phone",
  MIN_LENGTH: "min_length",
  MAX_LENGTH: "max_length",
  NUMERIC: "numeric",
};

// Dragon Boat Team Limits
export const TEAM_LIMITS = {
  MIN_MEMBERS: 1,
  MAX_MEMBERS: 22,
  DEFAULT_MAX_MEMBERS: 22,
  ALMOST_FULL_THRESHOLD: 0.8, // 80%
};

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Sort Options
export const SORT_OPTIONS = {
  NAME_ASC: "name",
  NAME_DESC: "-name",
  CREATED_ASC: "created_at",
  CREATED_DESC: "-created_at",
  HEIGHT_ASC: "height",
  HEIGHT_DESC: "-height",
  WEIGHT_ASC: "weight",
  WEIGHT_DESC: "-weight",
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
  TEAM_FULL: "This team is already at maximum capacity.",
  PERSON_EXISTS: "This person is already a member of this team.",
};

// Success Messages
export const SUCCESS_MESSAGES = {
  PERSON_CREATED: "Person created successfully",
  PERSON_UPDATED: "Person updated successfully",
  PERSON_DELETED: "Person deleted successfully",
  TEAM_CREATED: "Team created successfully",
  TEAM_UPDATED: "Team updated successfully",
  TEAM_DELETED: "Team deleted successfully",
  MEMBERSHIP_CREATED: "Person added to team successfully",
  MEMBERSHIP_UPDATED: "Membership updated successfully",
  MEMBERSHIP_DELETED: "Person removed from team successfully",
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "dragon_boat_auth_token",
  USER_PREFERENCES: "dragon_boat_user_prefs",
  RECENT_TEAMS: "dragon_boat_recent_teams",
};

// Date Format Options
export const DATE_FORMATS = {
  SHORT: { year: "numeric", month: "short", day: "numeric" },
  LONG: { year: "numeric", month: "long", day: "numeric", weekday: "long" },
  TIME: { hour: "2-digit", minute: "2-digit" },
  DATETIME: {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
};

// Feature Flags
export const FEATURES = {
  ENABLE_PROFILE_PICTURES: true,
  ENABLE_TEAM_CHAT: false,
  ENABLE_PERFORMANCE_TRACKING: true,
  ENABLE_NOTIFICATIONS: true,
};

// Responsive Breakpoints (matching common CSS frameworks)
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  DESKTOP: 1024,
  LARGE: 1280,
};

// Animation Durations (in milliseconds)
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Default Form Values
export const DEFAULT_FORM_VALUES = {
  PERSON: {
    name: "",
    phone: "",
    height: null,
    weight: null,
    side: PERSON_SIDES.BOTH,
    profile_picture_url: "",
  },
  TEAM: {
    name: "",
    city: "",
    max_members: TEAM_LIMITS.DEFAULT_MAX_MEMBERS,
    is_active: true,
  },
  MEMBERSHIP: {
    role: MEMBERSHIP_ROLES.PLAYER,
  },
};

// Export all constants as a single object for convenience
export default {
  MEMBERSHIP_ROLES,
  MEMBERSHIP_ROLE_LABELS,
  PERSON_SIDES,
  PERSON_SIDE_LABELS,
  TEAM_STATUS,
  API_STATUS,
  VALIDATION_RULES,
  TEAM_LIMITS,
  PAGINATION,
  SORT_OPTIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STORAGE_KEYS,
  DATE_FORMATS,
  FEATURES,
  BREAKPOINTS,
  ANIMATIONS,
  DEFAULT_FORM_VALUES,
};
