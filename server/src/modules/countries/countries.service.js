import { query } from '../../config/database.js';
import { NotFoundError } from '../../middleware/errorHandler.js';

export const listCountries = async () => {
  const result = await query(
    `SELECT c.id, c.name, c.code, c.slug, c.flag_emoji, c.continent,
            c.avg_tuition_min_usd, c.avg_tuition_max_usd, c.avg_living_cost_usd,
            c.currency, c.currency_symbol, c.official_languages,
            c.popular_student_cities, c.post_study_work_duration,
            c.work_hours_per_week, c.student_work_rights,
            (SELECT COUNT(*) FROM universities u WHERE u.country_id = c.id AND u.is_active = TRUE) as university_count
     FROM countries c 
     ORDER BY CASE 
       WHEN c.code = 'US' THEN 1
       WHEN c.code = 'GB' THEN 2
       WHEN c.code = 'CA' THEN 3
       WHEN c.code = 'AU' THEN 4
       WHEN c.code = 'NZ' THEN 5
       WHEN c.code = 'IE' THEN 6
       ELSE 7 
     END ASC, c.name ASC`
  );

  return result.rows.map(c => ({
    id: c.id, name: c.name, code: c.code, slug: c.slug,
    flagEmoji: c.flag_emoji, continent: c.continent,
    avgTuitionMinUsd: c.avg_tuition_min_usd, avgTuitionMaxUsd: c.avg_tuition_max_usd,
    avgLivingCostUsd: c.avg_living_cost_usd,
    currency: c.currency, currencySymbol: c.currency_symbol,
    officialLanguages: c.official_languages,
    popularStudentCities: c.popular_student_cities,
    postStudyWorkDuration: c.post_study_work_duration,
    workHoursPerWeek: c.work_hours_per_week,
    studentWorkRights: c.student_work_rights,
    universityCount: parseInt(c.university_count),
  }));
};

export const getCountry = async (idOrSlug) => {
  const isUuid = /^[0-9a-f]{8}-/.test(idOrSlug);
  const field = isUuid ? 'id' : 'slug';

  const result = await query(`SELECT * FROM countries WHERE ${field} = $1`, [idOrSlug]);
  if (result.rows.length === 0) throw new NotFoundError('Country not found');

  const c = result.rows[0];

  // Get universities
  const universities = await query(
    `SELECT id, name, slug, city, university_type, qs_ranking, avg_tuition_usd, logo_url, website,
            (SELECT COUNT(*) FROM programs WHERE university_id = u.id AND is_active = TRUE) as program_count
     FROM universities u WHERE country_id = $1 AND is_active = TRUE AND name IS NOT NULL AND TRIM(name) != '' ORDER BY qs_ranking NULLS LAST, name`,
    [c.id]
  );

  // Get scholarships
  const scholarships = await query(
    `SELECT id, name, slug, amount_usd, coverage, deadline, provider
     FROM scholarships WHERE country_id = $1 AND is_active = TRUE ORDER BY deadline NULLS LAST`,
    [c.id]
  );

  return {
    id: c.id, name: c.name, code: c.code, slug: c.slug,
    flagEmoji: c.flag_emoji, continent: c.continent, description: c.description,
    education: {
      educationSystem: c.education_system, popularDegrees: c.popular_degrees,
      academicCalendar: c.academic_calendar,
    },
    costs: {
      avgTuitionMinUsd: c.avg_tuition_min_usd, avgTuitionMaxUsd: c.avg_tuition_max_usd,
      avgLivingCostUsd: c.avg_living_cost_usd, avgRentUsd: c.avg_rent_usd,
      currency: c.currency, currencySymbol: c.currency_symbol,
    },
    visa: {
      studentVisaInfo: c.student_visa_info, visaCostUsd: c.visa_cost_usd,
      studentWorkRights: c.student_work_rights, workHoursPerWeek: c.work_hours_per_week,
      postStudyWork: c.post_study_work, postStudyWorkDuration: c.post_study_work_duration,
    },
    general: {
      languageRequirements: c.language_requirements, officialLanguages: c.official_languages,
      popularStudentCities: c.popular_student_cities,
      employmentEnvironment: c.employment_environment,
      scholarshipOpportunities: c.scholarship_opportunities,
      applicationProcess: c.application_process,
    },
    dataVerification: { sourceUrl: c.source_url, lastVerified: c.last_verified, verificationStatus: c.verification_status },
    universities: universities.rows.map(u => ({
      id: u.id, name: u.name, slug: u.slug, city: u.city,
      universityType: u.university_type, qsRanking: u.qs_ranking,
      avgTuitionUsd: u.avg_tuition_usd, logoUrl: u.logo_url, website: u.website,
      programCount: parseInt(u.program_count),
    })),
    scholarships: scholarships.rows,
  };
};

export const compareCountries = async (slugs) => {
  const result = await query(
    `SELECT c.*,
            (SELECT COUNT(*) FROM universities u WHERE u.country_id = c.id AND u.is_active = TRUE) as university_count
     FROM countries c WHERE c.slug = ANY($1)`,
    [slugs]
  );
  return result.rows.map(c => ({
    id: c.id, name: c.name, code: c.code, slug: c.slug, flagEmoji: c.flag_emoji,
    avgTuitionMinUsd: c.avg_tuition_min_usd, avgTuitionMaxUsd: c.avg_tuition_max_usd,
    avgLivingCostUsd: c.avg_living_cost_usd, avgRentUsd: c.avg_rent_usd,
    currency: c.currency, visaCostUsd: c.visa_cost_usd,
    workHoursPerWeek: c.work_hours_per_week, postStudyWorkDuration: c.post_study_work_duration,
    studentWorkRights: c.student_work_rights, officialLanguages: c.official_languages,
    universityCount: parseInt(c.university_count),
  }));
};
