-- ============================================================
-- AdmitQ Database Schema
-- Personalized Higher-Education Discovery Platform
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- ─── ENUM Types ─────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('student', 'counselor', 'university_rep', 'admin');
CREATE TYPE education_level AS ENUM ('high_school', 'class_11', 'class_12', 'bachelors', 'masters', 'phd', 'professional');
CREATE TYPE degree_type AS ENUM ('high_school', 'diploma', 'bachelors', 'masters', 'phd', 'professional', 'certificate');
CREATE TYPE university_type AS ENUM ('public', 'private', 'community', 'research', 'liberal_arts');
CREATE TYPE application_status AS ENUM ('planning', 'preparing', 'documents_pending', 'ready_to_apply', 'submitted', 'under_review', 'accepted', 'rejected', 'waitlisted');
CREATE TYPE document_status AS ENUM ('not_started', 'in_progress', 'completed', 'submitted');
CREATE TYPE verification_status AS ENUM ('unverified', 'verified', 'outdated', 'disputed');
CREATE TYPE saved_item_type AS ENUM ('university', 'program', 'scholarship', 'country');
CREATE TYPE deadline_type AS ENUM ('application', 'scholarship', 'test', 'visa', 'document_expiry', 'other');
CREATE TYPE scholarship_coverage AS ENUM ('full', 'partial', 'tuition_only', 'living_expenses', 'travel', 'other');
CREATE TYPE conversation_type AS ENUM ('DIRECT', 'GROUP', 'COMMUNITY');
CREATE TYPE participant_role AS ENUM ('member', 'admin');

-- ═══════════════════════════════════════════════════════════
-- 1. USER & AUTH TABLES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  username      VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  role          user_role NOT NULL DEFAULT 'student',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url    VARCHAR(500),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(500) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE password_resets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(255) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE email_verifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(255) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 2. STUDENT PROFILE TABLES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE student_profiles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Personal
  date_of_birth         DATE,
  nationality           VARCHAR(100),
  country_of_residence  VARCHAR(100),
  preferred_language    VARCHAR(50) DEFAULT 'English',
  phone                 VARCHAR(30),
  
  -- Academic
  current_education_level education_level,
  school_university     VARCHAR(255),
  current_degree        VARCHAR(100),
  current_major         VARCHAR(100),
  graduation_year       INTEGER,
  gpa                   NUMERIC(4,2),
  gpa_scale             NUMERIC(4,2) DEFAULT 4.0,
  class_10_percentage   NUMERIC(5,2),
  class_12_percentage   NUMERIC(5,2),
  bachelors_percentage  NUMERIC(5,2),
  bachelors_cgpa        NUMERIC(4,2),
  relevant_subjects     TEXT[],
  
  -- Preferences
  desired_degree        degree_type,
  desired_field         VARCHAR(150),
  desired_specialization VARCHAR(150),
  preferred_countries   TEXT[],
  preferred_cities      TEXT[],
  budget_min            NUMERIC(12,2),
  budget_max            NUMERIC(12,2),
  budget_currency       VARCHAR(3) DEFAULT 'USD',
  preferred_tuition_max NUMERIC(12,2),
  preferred_duration    VARCHAR(50),
  preferred_intake      VARCHAR(50),
  language_preferences  TEXT[],
  university_type_pref  university_type,
  campus_preference     VARCHAR(20), -- 'on_campus', 'online', 'hybrid'
  
  -- Profile completion
  profile_completion    INTEGER NOT NULL DEFAULT 0,
  onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_test_scores (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_name   VARCHAR(50) NOT NULL,  -- IELTS, TOEFL, GRE, GMAT, SAT, ACT, PTE
  overall_score NUMERIC(6,2),
  section_scores JSONB,  -- {"reading": 8.0, "writing": 7.5, ...}
  test_date   DATE,
  expiry_date DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 3. CAREER TABLES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE careers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(150) UNIQUE NOT NULL,
  slug              VARCHAR(150) UNIQUE NOT NULL,
  description       TEXT,
  required_skills   TEXT[],
  typical_industries TEXT[],
  potential_employers TEXT[],
  related_careers   TEXT[],
  recommended_countries TEXT[],
  avg_salary_usd    NUMERIC(12,2),
  growth_outlook    VARCHAR(50),  -- 'high', 'moderate', 'low'
  icon              VARCHAR(50),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE career_degree_mappings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  career_id   UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  degree_type degree_type NOT NULL,
  field       VARCHAR(150) NOT NULL,
  specialization VARCHAR(150),
  relevance   INTEGER NOT NULL DEFAULT 5,  -- 1-10 scale
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_career_goals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  career_id   UUID REFERENCES careers(id) ON DELETE SET NULL,
  custom_career VARCHAR(200),
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 4. COUNTRY TABLES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE countries (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  VARCHAR(100) UNIQUE NOT NULL,
  code                  VARCHAR(3) UNIQUE NOT NULL,
  slug                  VARCHAR(100) UNIQUE NOT NULL,
  description           TEXT,
  flag_emoji            VARCHAR(10),
  continent             VARCHAR(50),
  
  -- Education
  education_system      TEXT,
  popular_degrees       TEXT[],
  academic_calendar     VARCHAR(100),
  
  -- Costs
  avg_tuition_min_usd   NUMERIC(12,2),
  avg_tuition_max_usd   NUMERIC(12,2),
  avg_living_cost_usd   NUMERIC(12,2),  -- monthly
  avg_rent_usd          NUMERIC(12,2),  -- monthly
  currency              VARCHAR(3),
  currency_symbol       VARCHAR(5),
  
  -- Visa & Work
  student_visa_info     TEXT,
  visa_cost_usd         NUMERIC(8,2),
  student_work_rights   TEXT,
  work_hours_per_week   INTEGER,
  post_study_work       TEXT,
  post_study_work_duration VARCHAR(50),
  
  -- General
  language_requirements TEXT,
  official_languages    TEXT[],
  popular_student_cities TEXT[],
  employment_environment TEXT,
  scholarship_opportunities TEXT,
  application_process   TEXT,
  
  -- Data verification
  source_url            VARCHAR(500),
  last_verified         TIMESTAMPTZ,
  verification_status   verification_status DEFAULT 'unverified',
  
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 5. UNIVERSITY TABLES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE universities (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(300) NOT NULL,
  slug              VARCHAR(300) UNIQUE NOT NULL,
  country_id        UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  city              VARCHAR(150),
  state_province    VARCHAR(150),
  
  -- Basic info
  website           VARCHAR(500),
  university_type   university_type,
  institution_type  VARCHAR(50),
  distinction       VARCHAR(50),
  founded_year      INTEGER,
  description       TEXT,
  logo_url          VARCHAR(500),
  cover_image_url   VARCHAR(500),
  
  -- Academic
  faculties         TEXT[],
  departments       TEXT[],
  total_students    INTEGER,
  international_students_pct NUMERIC(5,2),
  student_faculty_ratio VARCHAR(20),
  languages_of_instruction TEXT[],
  intakes           TEXT[],  -- ['Fall', 'Spring', 'Winter']
  
  -- Rankings
  qs_ranking        INTEGER,
  the_ranking       INTEGER,
  arwu_ranking      INTEGER,
  national_ranking  INTEGER,
  
  -- Financial
  application_fee_usd  NUMERIC(8,2),
  avg_tuition_usd      NUMERIC(12,2),
  avg_living_cost_usd  NUMERIC(12,2), -- yearly
  accommodation_usd    NUMERIC(12,2), -- yearly
  insurance_usd        NUMERIC(8,2),  -- yearly
  
  -- Requirements (general minimums)
  min_gpa              NUMERIC(4,2),
  min_ielts            NUMERIC(3,1),
  min_toefl            INTEGER,
  min_gre              INTEGER,
  min_gmat             INTEGER,
  
  -- Application
  application_portal   VARCHAR(500),
  
  -- Data verification
  source_url           VARCHAR(500),
  last_verified        TIMESTAMPTZ,
  verification_status  verification_status DEFAULT 'unverified',
  
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 6. PROGRAM / COURSE TABLES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE programs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id       UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name                VARCHAR(300) NOT NULL,
  slug                VARCHAR(350) NOT NULL,
  degree              degree_type NOT NULL,
  degree_type         VARCHAR(20),          -- e.g. MSc, MBA, MEng, PhD, BSc, BA
  field               VARCHAR(150) NOT NULL,
  department          VARCHAR(150),         -- e.g. 'School of Engineering'
  specialization      VARCHAR(150),
  
  -- Details
  description         TEXT,
  duration_months     INTEGER,
  duration_label      VARCHAR(50),  -- '2 years', '4 semesters'
  language            VARCHAR(50) DEFAULT 'English',
  delivery_mode       VARCHAR(20) DEFAULT 'on_campus',  -- 'on_campus', 'online', 'hybrid'
  
  -- Intake & Deadlines
  intakes             TEXT[],
  application_deadline VARCHAR(100),
  application_deadline_date DATE,
  early_deadline_date DATE,
  application_method  VARCHAR(100),         -- e.g. 'Uni-Assist', 'Direct Portal'
  
  -- Financial
  tuition_usd         NUMERIC(12,2),
  tuition_local       NUMERIC(12,2),
  tuition_currency    VARCHAR(3),
  tuition_per         VARCHAR(20) DEFAULT 'year',  -- 'year', 'semester', 'total'
  scholarship_available BOOLEAN DEFAULT FALSE,
  
  -- Requirements
  min_gpa             NUMERIC(4,2),
  min_ielts           NUMERIC(3,1),
  min_toefl           INTEGER,
  min_pte             INTEGER,
  min_gre             INTEGER,
  min_gmat            INTEGER,
  min_sat             INTEGER,
  min_act             INTEGER,
  work_experience_years INTEGER DEFAULT 0,
  prerequisite_courses TEXT[],
  required_documents  TEXT[],
  
  -- Career
  career_outcomes     TEXT[],
  employment_rate     NUMERIC(5,2),
  avg_salary_after_usd NUMERIC(12,2),
  
  -- Data verification
  source_url          VARCHAR(500),         -- official program page URL
  official_requirements_url VARCHAR(500),   -- separate URL for requirements/entry criteria
  last_verified       TIMESTAMPTZ,
  verification_status verification_status DEFAULT 'unverified',
  
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(university_id, slug)
);


-- ═══════════════════════════════════════════════════════════
-- 7. SCHOLARSHIP TABLES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE scholarships (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  VARCHAR(300) NOT NULL,
  slug                  VARCHAR(300) UNIQUE NOT NULL,
  provider              VARCHAR(200),
  country_id            UUID REFERENCES countries(id) ON DELETE SET NULL,
  university_id         UUID REFERENCES universities(id) ON DELETE SET NULL,
  
  -- Eligibility
  degree_eligibility    degree_type[],
  field_eligibility     TEXT[],
  nationality_eligibility TEXT[],
  min_gpa               NUMERIC(4,2),
  income_requirement    TEXT,
  other_requirements    TEXT,
  
  -- Financial
  amount_usd            NUMERIC(12,2),
  amount_local          NUMERIC(12,2),
  amount_currency       VARCHAR(3),
  coverage              scholarship_coverage,
  coverage_details      TEXT,
  
  -- Application
  deadline              DATE,
  deadline_label        VARCHAR(100),
  required_documents    TEXT[],
  application_url       VARCHAR(500),
  
  -- Description
  description           TEXT,
  
  -- Data verification
  source_url            VARCHAR(500),
  last_verified         TIMESTAMPTZ,
  verification_status   verification_status DEFAULT 'unverified',
  
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 8. APPLICATION TRACKING TABLES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE applications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id      UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  university_id   UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  
  status          application_status NOT NULL DEFAULT 'planning',
  intake          VARCHAR(50),
  intake_year     INTEGER,
  progress        INTEGER NOT NULL DEFAULT 0,  -- 0-100
  notes           TEXT,
  
  -- Dates
  submitted_at    TIMESTAMPTZ,
  decision_at     TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, program_id)
);

CREATE TABLE application_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_type   VARCHAR(100) NOT NULL,  -- 'transcript', 'sop', 'lor', 'passport', etc.
  status          document_status NOT NULL DEFAULT 'not_started',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 9. DEADLINE TABLES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE deadlines (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id  UUID REFERENCES applications(id) ON DELETE SET NULL,
  
  title           VARCHAR(300) NOT NULL,
  description     TEXT,
  deadline_date   TIMESTAMPTZ NOT NULL,
  deadline_type   VARCHAR(50) NOT NULL DEFAULT 'other',
  
  reminder_days   INTEGER DEFAULT 7,  -- days before to remind
  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 10. SAVED ITEMS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE saved_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type   saved_item_type NOT NULL,
  item_id     UUID NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, item_type, item_id)
);

-- ═══════════════════════════════════════════════════════════
-- 11. AUDIT LOG
-- ═══════════════════════════════════════════════════════════

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity      VARCHAR(100),
  entity_id   UUID,
  details     JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- Refresh tokens
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- Profiles
CREATE INDEX idx_profiles_user ON student_profiles(user_id);

-- Test scores
CREATE INDEX idx_test_scores_user ON student_test_scores(user_id);

-- Career goals
CREATE INDEX idx_career_goals_user ON student_career_goals(user_id);
CREATE INDEX idx_career_degree_map ON career_degree_mappings(career_id);

-- Countries
CREATE INDEX idx_countries_code ON countries(code);
CREATE INDEX idx_countries_slug ON countries(slug);

-- Universities
CREATE INDEX idx_universities_country ON universities(country_id);
CREATE INDEX idx_universities_slug ON universities(slug);
CREATE INDEX idx_universities_name_trgm ON universities USING gin(name gin_trgm_ops);
CREATE INDEX idx_universities_city ON universities(city);
CREATE INDEX idx_universities_type ON universities(university_type);

-- Programs
CREATE INDEX idx_programs_university ON programs(university_id);
CREATE INDEX idx_programs_degree ON programs(degree);
CREATE INDEX idx_programs_field ON programs(field);
CREATE INDEX idx_programs_name_trgm ON programs USING gin(name gin_trgm_ops);
CREATE INDEX idx_programs_slug ON programs(slug);

-- Scholarships
CREATE INDEX idx_scholarships_country ON scholarships(country_id);
CREATE INDEX idx_scholarships_university ON scholarships(university_id);
CREATE INDEX idx_scholarships_deadline ON scholarships(deadline);
CREATE INDEX idx_scholarships_slug ON scholarships(slug);

-- Applications
CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_program ON applications(program_id);
CREATE INDEX idx_applications_status ON applications(status);

-- Deadlines
CREATE INDEX idx_deadlines_user ON deadlines(user_id);
CREATE INDEX idx_deadlines_date ON deadlines(deadline_date);

-- Saved items
CREATE INDEX idx_saved_items_user ON saved_items(user_id);
CREATE INDEX idx_saved_items_type ON saved_items(item_type);

-- Audit
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS: auto-update updated_at
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_test_scores_updated BEFORE UPDATE ON student_test_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_careers_updated BEFORE UPDATE ON careers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_countries_updated BEFORE UPDATE ON countries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_universities_updated BEFORE UPDATE ON universities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_programs_updated BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_scholarships_updated BEFORE UPDATE ON scholarships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_app_docs_updated BEFORE UPDATE ON application_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_deadlines_updated BEFORE UPDATE ON deadlines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════
-- 12. CHAT & MESSAGING
-- ═══════════════════════════════════════════════════════════

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type conversation_type NOT NULL,
  name VARCHAR(255),
  direct_key VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role participant_role NOT NULL DEFAULT 'member',
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_direct_key ON conversations(direct_key);
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE TRIGGER trg_conversations_updated BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
