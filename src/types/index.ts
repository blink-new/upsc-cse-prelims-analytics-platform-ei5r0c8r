// Core types for UPSC Analytics Platform

export interface User {
  id: string
  email: string
  displayName?: string
}

export interface UserProfile {
  id: string
  userId: string
  displayName?: string
  targetExamDate?: string
  preparationMonths: number
  currentLevel: 'beginner' | 'intermediate' | 'advanced'
  preferredSubjects: string[]
  studyHoursPerDay: number
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  explanation?: string
  topic: string
  subTopic?: string
  difficultyLevel: 'easy' | 'medium' | 'hard'
  year?: number
  source: 'PYQ' | 'mock' | 'custom'
  tags: string[]
  imageUrl?: string
  createdAt: string
}

export interface TestSession {
  id: string
  userId: string
  testName: string
  testType: 'practice' | 'mock' | 'adaptive'
  totalQuestions: number
  durationMinutes: number
  startedAt: string
  completedAt?: string
  isCompleted: boolean
  finalScore: number
  totalAttempted: number
  correctAnswers: number
  negativeMarks: number
  timeTakenSeconds: number
}

export interface QuestionAttempt {
  id: string
  userId: string
  sessionId: string
  questionId: string
  selectedAnswer?: 'A' | 'B' | 'C' | 'D'
  isCorrect: boolean
  confidenceLevel?: number // 1-5 scale
  timeTakenSeconds: number
  optionChanges: number
  wasSkipped: boolean
  wasReturnedTo: boolean
  attemptOrder: number
  createdAt: string
}

export interface AnalyticsMetric {
  id: string
  userId: string
  sessionId?: string
  metricCategory: string
  metricName: string
  metricValue: number
  metricMetadata?: any
  calculatedAt: string
}

export interface PDFUpload {
  id: string
  userId: string
  fileName: string
  fileUrl: string
  fileType: 'questions' | 'solutions' | 'notes' | 'books'
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  extractedQuestionsCount: number
  ocrText?: string
  uploadDate: string
}

export interface VoiceMemo {
  id: string
  userId: string
  questionId: string
  sessionId?: string
  audioUrl: string
  transcript?: string
  aiFeedback?: string
  durationSeconds: number
  createdAt: string
}

export interface KnowledgeBaseEntry {
  id: string
  userId: string
  title: string
  content: string
  contentType: 'note' | 'concept' | 'formula' | 'fact'
  topic?: string
  subTopic?: string
  tags: string[]
  sourcePdfId?: string
  vectorEmbedding?: string
  createdAt: string
  updatedAt: string
}

export interface StudyGroup {
  id: string
  name: string
  description?: string
  createdBy: string
  memberCount: number
  isPublic: boolean
  createdAt: string
}

export interface AIDebate {
  id: string
  userId: string
  topic: string
  currentAffairsTag?: string
  debateMessages: any[]
  userEngagementScore: number
  createdAt: string
}

// Analytics Dashboard Types
export interface DashboardStats {
  totalTests: number
  averageScore: number
  totalStudyHours: number
  readinessScore: number
  strongTopics: string[]
  weakTopics: string[]
  recentPerformance: number[]
}

export interface TopicMastery {
  topic: string
  accuracy: number
  questionsAttempted: number
  averageTime: number
  confidenceLevel: number
  lastAttempted: string
}

export interface PerformanceMetrics {
  knowledge: {
    topicWiseAccuracy: Record<string, number>
    syllabusCoverage: number
    unattemptedTopics: number
    weightedMastery: number
  }
  difficulty: {
    easyAccuracy: number
    mediumAccuracy: number
    hardAccuracy: number
    difficultyTransition: number
  }
  timeManagement: {
    avgTimePerQuestion: number
    timeVariance: number
    pacingAccuracy: number
    timePressureAccuracy: number
  }
  strategy: {
    firstAttemptAccuracy: number
    eliminationSuccess: number
    guessAccuracy: number
    changeAnswerSuccess: number
  }
  confidence: {
    calibrationScore: number
    overconfidenceRate: number
    underconfidenceRate: number
    confidenceAccuracyDelta: number
  }
  behavioral: {
    stressPoints: number
    fatigueIndicator: number
    focusDrift: number
    persistenceScore: number
  }
}

export interface ReadinessScore {
  overall: number
  knowledge: number
  speed: number
  accuracy: number
  strategy: number
  confidence: number
  passprobability: number
  riskZoneTopics: string[]
  focusPriority: string[]
}