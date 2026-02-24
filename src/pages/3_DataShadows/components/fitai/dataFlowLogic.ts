/**
 * dataFlowLogic.ts
 * Data flow decision logic that combines privacy toggles with survey answers.
 */

// Consent options obtained from TermsAndConditions
export interface TermsConsent {
  privacySettings: {
    analytics: boolean
    marketing: boolean
    thirdParty: boolean
    dataRetention: boolean
    aiTraining: boolean
  }
  termsReadingProgress: number // 0-100
  uncheckedOptions?: string[]   // List of privacy options the user turned off
}

// Survey data collected from RegistrationSurvey
export interface SurveyData {
  name?: string
  avatar?: string
  bodyParts?: string[]
  workHours?: number
  occupation?: string
  locations?: string[]
  goals?: string[]
  height?: number
  weight?: number
  homeAddress?: string
  // Flags indicating whether optional sections were shown (used to detect user skipping)
  heightWeightVisible?: boolean
  occupationVisible?: boolean
  addressVisible?: boolean
}

// Data content definition for each node
export interface NodeData {
  enabled: boolean
  fields: string[]          // Names of fields being sent
  description: string       // Brief explanation of how the data is used
  sample?: any               // Example (optional)
}

export interface DataFlowResult {
  analytics: NodeData
  marketing: NodeData
  thirdParty: NodeData
  aiTraining: NodeData
  dataRetention: { enabled: boolean } // Long-term storage only controls retention, no actual data sent
  locationBased: NodeData   // New: location‑based services node
  healthAnalysis: NodeData  // New: health risk analysis node
}

// Default toggle values
const DEFAULT_PRIVACY = {
  analytics: false,
  marketing: false,
  thirdParty: false,
  dataRetention: false,
  aiTraining: false,
}

/**
 * Core decision function
 * @param terms  Consent options from TermsAndConditions
 * @param survey Data collected from RegistrationSurvey
 * @returns      Detailed data flow for each node
 */
export function determineDataFlow(
  terms: TermsConsent,
  survey: SurveyData
): DataFlowResult {
  const privacy = terms.privacySettings || DEFAULT_PRIVACY

  // Helper: check if a field exists and is not empty
  const hasField = (field: keyof SurveyData): boolean =>
    survey[field] !== undefined && survey[field] !== null && survey[field] !== ''

  // ---- Analytics node ----
  // Only if toggle is ON, send anonymised usage data (no personally identifiable information)
  const analyticsFields: string[] = []
  if (privacy.analytics) {
    // Anonymised data: reading progress, completion steps, feature usage, etc.
    // Here we simulate survey‑based anonymous indicators
    if (hasField('bodyParts')) analyticsFields.push('bodyParts')
    if (hasField('workHours')) analyticsFields.push('workHours')
    if (hasField('locations')) analyticsFields.push('locations')
    if (hasField('goals')) analyticsFields.push('goals')
    // Optional fields like height/weight are not included unless de‑identified
  }

  // ---- Marketing node ----
  // Only if toggle is ON, send data suitable for marketing
  const marketingFields: string[] = []
  if (privacy.marketing) {
    // Name can be used for personalisation
    if (hasField('name')) marketingFields.push('name')
    // Goals for relevant content suggestions
    if (hasField('goals')) marketingFields.push('goals')
    // Occupation for targeted messaging
    if (hasField('occupation')) marketingFields.push('occupation')
    // City‑level location (simplified: we keep the raw address field as a placeholder)
    if (hasField('homeAddress')) marketingFields.push('homeAddress_city')
  }

  // ---- Third‑Party Sharing node ----
  // Only if toggle is ON, send fully anonymised research data
  const thirdPartyFields: string[] = []
  if (privacy.thirdParty) {
    // De‑identified body data
    if (hasField('bodyParts')) thirdPartyFields.push('bodyParts_aggregated')
    if (hasField('height') && hasField('weight')) thirdPartyFields.push('bmi_category')
    if (hasField('workHours')) thirdPartyFields.push('workHours')
    if (hasField('occupation')) thirdPartyFields.push('occupation_category')
    if (hasField('locations')) thirdPartyFields.push('locations')
    if (hasField('goals')) thirdPartyFields.push('goals')
    // No name, no exact address
  }

  // ---- AI Training node ----
  // Only if toggle is ON, send data for model training (may contain richer features, but still anonymised)
  const aiTrainingFields: string[] = []
  if (privacy.aiTraining) {
    if (hasField('bodyParts')) aiTrainingFields.push('bodyParts')
    if (hasField('workHours')) aiTrainingFields.push('workHours')
    if (hasField('occupation')) aiTrainingFields.push('occupation')
    if (hasField('locations')) aiTrainingFields.push('locations')
    if (hasField('goals')) aiTrainingFields.push('goals')
    if (hasField('height') && hasField('weight')) aiTrainingFields.push('height_weight')
    // Address for location‑related features (not stored as exact coordinates)
    if (hasField('homeAddress')) aiTrainingFields.push('homeAddress_region')
  }

  // ---- Location‑Based Services node ----
  // If the user provided an address and location services are allowed
  // (here we assume it's linked to thirdParty; could be a separate toggle)
  const locationBasedFields: string[] = []
  if (privacy.thirdParty && hasField('homeAddress')) {
    locationBasedFields.push('homeAddress_city') // only city level
  }

  // ---- Health Risk Analysis node ----
  // If the user provided height/weight and either thirdParty or aiTraining is ON
  const healthAnalysisFields: string[] = []
  if ((privacy.thirdParty || privacy.aiTraining) && hasField('height') && hasField('weight')) {
    healthAnalysisFields.push('bmi')
  }

  // Calculate privacy score: +20 per enabled toggle, -5 per optional field filled (more data revealed), clamped 0‑100
  const enabledCount = Object.values(privacy).filter(Boolean).length
  const optionalFilledCount = [
    hasField('height') && hasField('weight'),
    hasField('occupation'),
    hasField('homeAddress')
  ].filter(Boolean).length
  const privacyScore = Math.min(100, Math.max(0, enabledCount * 20 - optionalFilledCount * 5))

  return {
    analytics: {
      enabled: privacy.analytics,
      fields: analyticsFields,
      description: 'Anonymised usage data used to improve app performance and user experience.',
      sample: privacy.analytics ? { bodyParts: ['Chest', 'Abs'], workHours: 8 } : undefined,
    },
    marketing: {
      enabled: privacy.marketing,
      fields: marketingFields,
      description: 'Used to send personalised recommendations, offers and fitness news.',
      sample: privacy.marketing ? { name: 'Alex', goals: ['Weight Loss'] } : undefined,
    },
    thirdParty: {
      enabled: privacy.thirdParty,
      fields: thirdPartyFields,
      description: 'Anonymised research data shared with partners for health trend analysis.',
      sample: privacy.thirdParty ? { bmi_category: 'Normal', workHours: 8 } : undefined,
    },
    aiTraining: {
      enabled: privacy.aiTraining,
      fields: aiTrainingFields,
      description: 'Used to train and improve FitAI’s algorithms.',
      sample: privacy.aiTraining ? { bodyParts: ['Legs'], occupation_category: 'office' } : undefined,
    },
    dataRetention: {
      enabled: privacy.dataRetention,
    },
    locationBased: {
      enabled: privacy.thirdParty && hasField('homeAddress'),
      fields: locationBasedFields,
      description: 'Used to recommend nearby gyms and trainers.',
      sample: (privacy.thirdParty && hasField('homeAddress')) ? { homeAddress_city: 'New York' } : undefined,
    },
    healthAnalysis: {
      enabled: (privacy.thirdParty || privacy.aiTraining) && hasField('height') && hasField('weight'),
      fields: healthAnalysisFields,
      description: 'Anonymous health risk analysis based on body metrics.',
      sample: ((privacy.thirdParty || privacy.aiTraining) && hasField('height') && hasField('weight')) ? { bmi: 22.5 } : undefined,
    },
  }
}

// Node definitions for the diagram component
export interface FlowNodeDef {
  id: keyof DataFlowResult
  label: string
  shortLabel: string
  description: string
}

export const FLOW_NODES: FlowNodeDef[] = [
  { id: 'analytics', label: 'Usage Analytics', shortLabel: 'Analytics', description: 'Anonymised usage data used to improve the app.' },
  { id: 'marketing', label: 'Marketing & Communications', shortLabel: 'Marketing', description: 'Personalised recommendations and news.' },
  { id: 'thirdParty', label: 'Third-Party Sharing', shortLabel: 'Third Party', description: 'Anonymised research data shared with partners.' },
  { id: 'aiTraining', label: 'AI Model Training', shortLabel: 'AI Training', description: 'Data used to train and optimise algorithms.' },
  { id: 'dataRetention', label: 'Long-Term Data Retention', shortLabel: 'Long-Term Storage', description: 'Policy for keeping your data over time.' },
  { id: 'locationBased', label: 'Location-Based Services', shortLabel: 'Location', description: 'Services that use your location, e.g. nearby recommendations.' },
  { id: 'healthAnalysis', label: 'Health Risk Analysis', shortLabel: 'Health Analysis', description: 'Assessment of health risks based on your metrics.' },
]