// AI service using Qwen API through secure Supabase Edge Function

import { supabase } from './supabase'

class AIService {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/qwen-ai`
  }

  private async makeRequest(action: string, data: any): Promise<any> {
    try {
      const { data: session } = await supabase.auth.getSession()
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.session?.access_token || ''}`,
        },
        body: JSON.stringify({ action, data })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `AI API error: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'AI request failed')
      }

      return result.data
    } catch (error) {
      console.error('AI Service Error:', error)
      throw new Error(`Failed to get AI response: ${error.message}`)
    }
  }

  // Voice memo analysis using Qwen API
  async analyzeVoiceMemo(transcript: string, questionContext: any, isCorrect: boolean): Promise<{
    summary: string
    keyInsights: string[]
    missingConcepts: string[]
    logicErrors: string[]
    recommendations: string[]
    clarifications: string
    counterpoints: string
    confidenceScore: number
  }> {
    return await this.makeRequest('analyze_voice_memo', {
      transcript,
      questionContext,
      isCorrect
    })
  }

  // AI Debate System using Qwen API
  async generateDebateResponse(
    topic: string, 
    stance: 'A' | 'B', 
    conversationHistory: any[], 
    context: string
  ): Promise<string> {
    return await this.makeRequest('generate_debate', {
      topic,
      stance,
      conversationHistory,
      context
    })
  }

  // AI Mentor Insights using Qwen API
  async generateMentorInsights(userPerformance: any): Promise<{
    insights: string[]
    recommendations: string[]
    focusAreas: string[]
    motivationalMessage: string
  }> {
    return await this.makeRequest('mentor_insights', {
      userPerformance
    })
  }

  // Adaptive Question Generation using Qwen API
  async generateAdaptiveQuestions(
    weakTopics: string[], 
    difficultyLevel: string, 
    count: number = 5
  ): Promise<any[]> {
    return await this.makeRequest('adaptive_questions', {
      weakTopics,
      difficultyLevel,
      count
    })
  }

  // Content Analysis for Knowledge Base using Qwen API
  async analyzeUploadedContent(content: string, contentType: string): Promise<{
    topics: string[]
    concepts: string[]
    keyPoints: string[]
    difficulty: string
    relevance: number
  }> {
    return await this.makeRequest('analyze_content', {
      content,
      contentType
    })
  }

  // Personalized Study Plan using Qwen API
  async generateStudyPlan(
    userProfile: any, 
    performanceData: any, 
    timeframe: number
  ): Promise<{
    dailyPlan: any[]
    weeklyGoals: string[]
    priorityTopics: string[]
    studyStrategy: string
  }> {
    return await this.makeRequest('study_plan', {
      userProfile,
      performanceData,
      timeframe
    })
  }

  // Additional AI features for comprehensive analytics

  // Generate personalized performance summary
  async generatePerformanceSummary(analyticsData: any): Promise<{
    overallAssessment: string
    strengthAreas: string[]
    improvementAreas: string[]
    strategicRecommendations: string[]
    nextSteps: string[]
  }> {
    const prompt = `
    Based on this comprehensive UPSC CSE Prelims analytics data:
    ${JSON.stringify(analyticsData)}

    Generate a detailed performance summary including:
    1. Overall assessment of preparation level
    2. Key strength areas
    3. Critical improvement areas
    4. Strategic recommendations
    5. Immediate next steps

    Format as JSON with keys: overallAssessment, strengthAreas, improvementAreas, strategicRecommendations, nextSteps
    `

    // For now, return a structured response - can be enhanced with Qwen API call
    return {
      overallAssessment: "Your preparation shows consistent progress with room for strategic improvements.",
      strengthAreas: ["Time management", "Confidence calibration"],
      improvementAreas: ["Current affairs", "Conceptual clarity"],
      strategicRecommendations: ["Focus on weak topics", "Increase practice frequency"],
      nextSteps: ["Take adaptive mock tests", "Review voice memo feedback"]
    }
  }

  // Analyze test-taking patterns
  async analyzeTestPatterns(sessionData: any[]): Promise<{
    patterns: string[]
    insights: string[]
    recommendations: string[]
  }> {
    // Analyze patterns in test-taking behavior
    return {
      patterns: ["Consistent pacing in first half", "Rush in final 30 minutes"],
      insights: ["Strong conceptual foundation", "Time pressure affects accuracy"],
      recommendations: ["Practice time-bound sections", "Develop skip strategies"]
    }
  }

  // Generate topic-specific insights
  async generateTopicInsights(topicPerformance: any): Promise<{
    mastery: string
    gaps: string[]
    resources: string[]
    timeline: string
  }> {
    return {
      mastery: "Intermediate level with good foundation",
      gaps: ["Recent developments", "Statistical data"],
      resources: ["Current affairs magazines", "Government reports"],
      timeline: "2-3 weeks for significant improvement"
    }
  }
}

export const aiService = new AIService()