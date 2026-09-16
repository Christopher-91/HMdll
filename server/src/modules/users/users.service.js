import { query } from '../../config/database.js';
import { NotFoundError } from '../../middleware/errorHandler.js';

/**
 * Get full user profile
 */
export const getProfile = async (userId) => {
  const userResult = await query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.email_verified, u.avatar_url, u.auth_provider, u.created_at,
            sp.date_of_birth, sp.nationality, sp.country_of_residence, sp.preferred_language, sp.phone,
            sp.current_education_level, sp.school_university, sp.current_degree, sp.current_major,
            sp.graduation_year, sp.gpa, sp.gpa_scale, sp.class_10_percentage, sp.class_12_percentage,
            sp.bachelors_percentage, sp.bachelors_cgpa, sp.relevant_subjects,
            sp.desired_degree, sp.desired_field, sp.desired_specialization,
            sp.preferred_countries, sp.preferred_cities, sp.budget_min, sp.budget_max, sp.budget_currency,
            sp.preferred_tuition_max, sp.preferred_duration, sp.preferred_intake,
            sp.language_preferences, sp.university_type_pref, sp.campus_preference,
            sp.profile_completion, sp.onboarding_completed
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = userResult.rows[0];

  // Get test scores
  const scoresResult = await query(
    'SELECT id, test_name, overall_score, section_scores, test_date, expiry_date FROM student_test_scores WHERE user_id = $1 ORDER BY test_date DESC',
    [userId]
  );

  // Get career goals
  const careerResult = await query(
    `SELECT scg.id, scg.career_id, scg.custom_career, scg.is_primary,
            c.name as career_name, c.slug as career_slug
     FROM student_career_goals scg
     LEFT JOIN careers c ON c.id = scg.career_id
     WHERE scg.user_id = $1`,
    [userId]
  );

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    emailVerified: user.email_verified,
    avatarUrl: user.avatar_url,
    authProvider: user.auth_provider || 'local',
    createdAt: user.created_at,
    personal: {
      dateOfBirth: user.date_of_birth,
      nationality: user.nationality,
      countryOfResidence: user.country_of_residence,
      preferredLanguage: user.preferred_language,
      phone: user.phone,
    },
    academic: {
      currentEducationLevel: user.current_education_level,
      schoolUniversity: user.school_university,
      currentDegree: user.current_degree,
      currentMajor: user.current_major,
      graduationYear: user.graduation_year,
      gpa: user.gpa,
      gpaScale: user.gpa_scale,
      class10Percentage: user.class_10_percentage,
      class12Percentage: user.class_12_percentage,
      bachelorsPercentage: user.bachelors_percentage,
      bachelorsCgpa: user.bachelors_cgpa,
      relevantSubjects: user.relevant_subjects,
    },
    preferences: {
      desiredDegree: user.desired_degree,
      desiredField: user.desired_field,
      desiredSpecialization: user.desired_specialization,
      preferredCountries: user.preferred_countries,
      preferredCities: user.preferred_cities,
      budgetMin: user.budget_min,
      budgetMax: user.budget_max,
      budgetCurrency: user.budget_currency,
      preferredTuitionMax: user.preferred_tuition_max,
      preferredDuration: user.preferred_duration,
      preferredIntake: user.preferred_intake,
      languagePreferences: user.language_preferences,
      universityTypePref: user.university_type_pref,
      campusPreference: user.campus_preference,
    },
    testScores: scoresResult.rows.map(s => ({
      id: s.id,
      testName: s.test_name,
      overallScore: s.overall_score,
      sectionScores: s.section_scores,
      testDate: s.test_date,
      expiryDate: s.expiry_date,
    })),
    careerGoals: careerResult.rows.map(c => ({
      id: c.id,
      careerId: c.career_id,
      careerName: c.career_name,
      careerSlug: c.career_slug,
      customCareer: c.custom_career,
      isPrimary: c.is_primary,
    })),
    profileCompletion: user.profile_completion,
    onboardingCompleted: user.onboarding_completed,
  };
};

/**
 * Update user profile
 */
export const updateProfile = async (userId, data) => {
  const {
    firstName, lastName,
    personal = {}, academic = {}, preferences = {},
  } = data;

  // Update user basic info
  if (firstName || lastName) {
    const updates = [];
    const values = [];
    let i = 1;

    if (firstName) { updates.push(`first_name = $${i++}`); values.push(firstName); }
    if (lastName) { updates.push(`last_name = $${i++}`); values.push(lastName); }
    values.push(userId);

    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${i}`, values);
  }

  // Build profile update
  const profileFields = {
    // Personal
    date_of_birth: personal.dateOfBirth,
    nationality: personal.nationality,
    country_of_residence: personal.countryOfResidence,
    preferred_language: personal.preferredLanguage,
    phone: personal.phone,
    // Academic
    current_education_level: academic.currentEducationLevel,
    school_university: academic.schoolUniversity,
    current_degree: academic.currentDegree,
    current_major: academic.currentMajor,
    graduation_year: academic.graduationYear,
    gpa: academic.gpa,
    gpa_scale: academic.gpaScale,
    class_10_percentage: academic.class10Percentage,
    class_12_percentage: academic.class12Percentage,
    bachelors_percentage: academic.bachelorsPercentage,
    bachelors_cgpa: academic.bachelorsCgpa,
    relevant_subjects: academic.relevantSubjects,
    // Preferences
    desired_degree: preferences.desiredDegree,
    desired_field: preferences.desiredField,
    desired_specialization: preferences.desiredSpecialization,
    preferred_countries: preferences.preferredCountries,
    preferred_cities: preferences.preferredCities,
    budget_min: preferences.budgetMin,
    budget_max: preferences.budgetMax,
    budget_currency: preferences.budgetCurrency,
    preferred_tuition_max: preferences.preferredTuitionMax,
    preferred_duration: preferences.preferredDuration,
    preferred_intake: preferences.preferredIntake,
    language_preferences: preferences.languagePreferences,
    university_type_pref: preferences.universityTypePref,
    campus_preference: preferences.campusPreference,
  };

  // Filter out undefined values
  const entries = Object.entries(profileFields).filter(([, v]) => v !== undefined);

  if (entries.length > 0) {
    const sets = entries.map(([key], idx) => `${key} = $${idx + 1}`);
    const vals = entries.map(([, v]) => v);
    vals.push(userId);

    await query(
      `UPDATE student_profiles SET ${sets.join(', ')} WHERE user_id = $${vals.length}`,
      vals
    );
  }

  // Recalculate profile completion
  await updateProfileCompletion(userId);

  return getProfile(userId);
};

/**
 * Update test scores
 */
export const updateTestScores = async (userId, scores) => {
  // Delete existing and re-insert
  await query('DELETE FROM student_test_scores WHERE user_id = $1', [userId]);

  for (const score of scores) {
    await query(
      `INSERT INTO student_test_scores (user_id, test_name, overall_score, section_scores, test_date, expiry_date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, score.testName, score.overallScore, score.sectionScores || null, score.testDate || null, score.expiryDate || null]
    );
  }

  await updateProfileCompletion(userId);

  return getProfile(userId);
};

/**
 * Update career goals
 */
export const updateCareerGoals = async (userId, goals) => {
  await query('DELETE FROM student_career_goals WHERE user_id = $1', [userId]);

  for (const goal of goals) {
    await query(
      `INSERT INTO student_career_goals (user_id, career_id, custom_career, is_primary)
       VALUES ($1, $2, $3, $4)`,
      [userId, goal.careerId || null, goal.customCareer || null, goal.isPrimary || false]
    );
  }

  await updateProfileCompletion(userId);

  return getProfile(userId);
};

/**
 * Mark onboarding as completed
 */
export const completeOnboarding = async (userId) => {
  await query(
    'UPDATE student_profiles SET onboarding_completed = TRUE WHERE user_id = $1',
    [userId]
  );
  return getProfile(userId);
};

/**
 * Calculate and update profile completion percentage
 */
async function updateProfileCompletion(userId) {
  const profile = await query(
    'SELECT * FROM student_profiles WHERE user_id = $1',
    [userId]
  );

  if (profile.rows.length === 0) return;

  const p = profile.rows[0];
  let filled = 0;
  let total = 0;

  // Personal fields (5)
  const personalFields = ['nationality', 'country_of_residence', 'date_of_birth', 'preferred_language', 'phone'];
  for (const f of personalFields) { total++; if (p[f]) filled++; }

  // Academic fields (8)
  const academicFields = ['current_education_level', 'school_university', 'current_major', 'graduation_year', 'gpa'];
  for (const f of academicFields) { total++; if (p[f]) filled++; }

  // Preferences (5)
  const prefFields = ['desired_degree', 'desired_field', 'preferred_countries', 'budget_max'];
  for (const f of prefFields) { total++; if (p[f]) filled++; }

  // Test scores (1 point if any exist)
  total++;
  const scores = await query('SELECT COUNT(*) FROM student_test_scores WHERE user_id = $1', [userId]);
  if (parseInt(scores.rows[0].count) > 0) filled++;

  // Career goals (1 point if any exist)
  total++;
  const goals = await query('SELECT COUNT(*) FROM student_career_goals WHERE user_id = $1', [userId]);
  if (parseInt(goals.rows[0].count) > 0) filled++;

  const completion = Math.round((filled / total) * 100);

  await query(
    'UPDATE student_profiles SET profile_completion = $1 WHERE user_id = $2',
    [completion, userId]
  );
}

/**
 * Search users by name or username using pg_trgm similarity.
 * Strictly returns only public-safe fields — no emails, passwords, or private data.
 * Excludes the requesting user from results.
 *
 * @param {string} searchQuery - The raw search string from the client
 * @param {string} requesterId - The ID of the user performing the search
 */
export const searchUsers = async (searchQuery, requesterId) => {
  if (!searchQuery || searchQuery.trim().length < 2) return [];

  const q = searchQuery.trim();

  const result = await query(
    `SELECT
       u.id,
       u.first_name,
       u.last_name,
       u.username,
       u.avatar_url,
       u.role
     FROM users u
     WHERE u.id != $1
       AND u.is_active = TRUE
       AND (
         u.username ILIKE $2
         OR (u.first_name || ' ' || u.last_name) ILIKE $2
         OR similarity(u.first_name || ' ' || u.last_name, $3) > 0.2
       )
     ORDER BY
       similarity(u.first_name || ' ' || u.last_name, $3) DESC,
       u.first_name ASC
     LIMIT 15`,
    [requesterId, `%${q}%`, q]
  );

  return result.rows;
};
