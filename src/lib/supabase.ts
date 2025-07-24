import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
  profile: Record<string, any>
  preferences: Record<string, any>
  study_goals: Record<string, any>
  performance_summary: Record<string, any>
}

export interface Test {
  id: string
  title: string
  description?: string
  created_by: string
  test_pdf_url?: string
  solution_pdf_url?: string
  questions: any[]
  solutions: any[]
  metadata: Record<string, any>
  difficulty_distribution: Record<string, any>
  topic_coverage: Record<string, any>
  time_limit: number
  total_questions: number
  negative_marking: number
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface TestSession {
  id: string
  user_id: string
  test_id: string
  started_at: string
  completed_at?: string
  time_taken?: number
  score?: number
  raw_score?: number
  negative_marks?: number
  total_attempted?: number
  total_correct?: number
  total_wrong?: number
  total_skipped?: number
  session_data: Record<string, any>
  behavioral_metrics: Record<string, any>
  pacing_data: Record<string, any>
  confidence_data: Record<string, any>
  strategy_metrics: Record<string, any>
  is_completed: boolean
}

export interface QuestionAttempt {
  id: string
  session_id: string
  question_id: string
  user_answer?: string
  correct_answer?: string
  is_correct?: boolean
  confidence_level?: number
  time_taken?: number
  attempt_sequence?: number
  option_changes: any[]
  elimination_pattern: Record<string, any>
  behavioral_signals: Record<string, any>
  question_metadata: Record<string, any>
  topic?: string
  subtopic?: string
  difficulty_level?: string
  question_type?: string
  attempted_at: string
}

export interface VoiceMemo {
  id: string
  user_id: string
  question_attempt_id: string
  audio_url?: string
  transcript?: string
  duration?: number
  trigger_type?: string
  prompt_used?: string
  ai_analysis: Record<string, any>
  learning_insights: Record<string, any>
  concepts_identified: any[]
  misconceptions: any[]
  created_at: string
  processed_at?: string
  is_processed: boolean
}

export interface AIFeedback {
  id: string
  voice_memo_id: string
  feedback_text?: string
  key_insights: any[]
  missing_concepts: any[]
  logic_errors: any[]
  recommendations: any[]
  clarifications?: string
  counterpoints?: string
  confidence_score?: number
  created_at: string
}

export interface Flashcard {
  id: string
  user_id: string
  voice_memo_id: string
  question_content?: string
  user_explanation?: string
  ai_correction?: string
  concept_tags: any[]
  mastery_level: number
  review_count: number
  next_review_date?: string
  last_reviewed_at?: string
  created_at: string
}

export interface AnalyticsMetric {
  id: string
  user_id: string
  session_id?: string
  metric_category?: string
  metric_name?: string
  metric_value?: number
  metric_metadata: Record<string, any>
  calculation_date: string
  is_current: boolean
}

export interface KnowledgeBase {
  id: string
  user_id: string
  title?: string
  content_type?: string
  file_url?: string
  processed_content: Record<string, any>
  chunks: any[]
  topics: any[]
  concepts: any[]
  embeddings: any[]
  upload_date: string
  processed_date?: string
  is_processed: boolean
}

export interface AIDebate {
  id: string
  user_id: string
  topic?: string
  debate_context?: string
  persona_a_stance?: string
  persona_b_stance?: string
  conversation: any[]
  user_interactions: any[]
  learning_outcomes: any[]
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface StudyGroup {
  id: string
  name?: string
  description?: string
  created_by: string
  members: any[]
  shared_resources: any[]
  group_analytics: Record<string, any>
  created_at: string
  is_active: boolean
}