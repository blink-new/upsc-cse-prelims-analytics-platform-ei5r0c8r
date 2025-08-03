import React, { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Heatmap, Cell } from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Brain, Clock, Target, Zap } from 'lucide-react'
import { blink } from '../blink/client'

interface AnalyticsData {
  // 1. Knowledge & Syllabus Coverage (12 metrics)
  knowledgeCoverage: {
    topicWiseAccuracy: { [topic: string]: number }
    subTopicWiseAccuracy: { [subTopic: string]: number }
    syllabusCoverageRatio: number
    unattemptedTopicsCount: number
    weightedTopicMastery: number
    criticalTopicGapScore: number
    questionExposureDiversity: number
    depthOfKnowledgeIndex: number
    textbookVsPyqAlignment: number
    conceptTagCoverageScore: number
    revisionCoverageBalance: number
    longTailTopicEngagement: number
  }
  
  // 2. Question Difficulty Profile (10 metrics)
  difficultyProfile: {
    easyAttemptedPercent: number
    mediumAttemptedPercent: number
    hardAttemptedPercent: number
    difficultyBandAccuracy: { [band: string]: number }
    difficultyBandTimeSpent: { [band: string]: number }
    difficultyTransitionSuccess: number
    cumulativeDifficultyCurve: Array<{ rank: number, accuracy: number }>
    peakDifficultyStreaks: number
    difficultyDrift: number
    weightedDifficultyScore: number
    selfRatedVsActualCorrelation: number
    skipRateByDifficulty: { [difficulty: string]: number }
  }
  
  // 3. Time Management (8 metrics)
  timeManagement: {
    avgTimePerQuestion: number
    timeVariance: number
    questionsOverTargetTimePercent: number
    idleWastedTime: number
    pacingAccuracy: number
    timePressureAccuracy: number
    earlyFinishRate: number
    timeRecoveryEfficiency: number
  }
  
  // 4. Answer Strategy (10 metrics)
  answerStrategy: {
    firstAttemptAccuracy: number
    optionEliminationSuccessRate: number
    guessAccuracyRate: number
    skipThenReturnSuccess: number
    changeAnswerSuccessRate: number
    distractorTrapRate: number
    strategicSkipRate: number
    optionConfidenceAlignment: number
    useOfHintToolRate: number
    timeSpentVsStrategyCorrelation: number
  }
  
  // 5. Conceptual Errors (12 metrics)
  conceptualErrors: {
    misconceptionClusterCount: number
    top5RepeatedErrorTypes: string[]
    conceptOverlapMistakeFreq: number
    errorSeverityIndex: number
    errorRecoveryRate: number
    errorCorrelationMatrix: { [error1: string]: { [error2: string]: number } }
    textbookConceptFailureRate: number
    questionTypeErrorDistribution: { [type: string]: number }
    conceptTagConfusionScore: number
    rootCauseKeywordAnalysis: string[]
    errorFixRecommendationCount: number
    postErrorCorrectionSuccess: number
  }
  
  // 6. Confidence Calibration (8 metrics)
  confidenceCalibration: {
    selfRatedConfidencePerQ: number[]
    confidenceVsCorrectnessDeltas: number[]
    overconfidenceIncidence: number
    underconfidenceIncidence: number
    calibrationCurve: Array<{ confidenceBin: number, accuracy: number }>
    confidenceChangeTrend: number[]
    highConfidenceWrongCount: number
    lowConfidenceRightCount: number
  }
  
  // 7. Question Statement Analytics (10 metrics)
  questionAnalytics: {
    keywordRecognitionRate: number
    distractorTriggerIndex: number
    questionLengthEffect: Array<{ length: number, accuracy: number }>
    stemComplexityScore: number
    dataInterpretationAccuracy: number
    graphImagePerformance: number
    multiSentenceComprehensionTime: number
    directiveWordErrorRate: number
    questionTypeBreakdownAccuracy: { [type: string]: number }
    anchorWordExtractionSuccess: number
  }
  
  // 8. Learning Velocity & Retention (10 metrics)
  learningVelocity: {
    scoreImprovementRate: number
    topicMasteryVelocity: { [topic: string]: number }
    retentionIndex: number
    spacedRepetitionReadiness: number
    reviewComplianceRate: number
    learningCurveFittingScore: number
    revisionRetentionDelta: number
    masteryPlateauDetection: string[]
    adaptiveRevisionEffectiveness: number
    learningMomentumScore: number
  }
  
  // 9. Comparative Benchmarking (11 metrics)
  benchmarking: {
    peerPercentileRank: number
    cohortDemographicComparison: { [demographic: string]: number }
    historicalSelfComparison: number[]
    topicWisePeerBenchmark: { [topic: string]: number }
    difficultyBandPeerBenchmark: { [band: string]: number }
    timeManagementPeerBenchmark: number
    confidenceBenchmarkVsPeers: number
    strategyBenchmark: { [strategy: string]: number }
    topPerformerInsights: string[]
    gapFromTop10Percent: number
    improvementVelocityVsPeers: number
  }
  
  // 10. Current Affairs Linkage (8 metrics)
  currentAffairs: {
    caTaggedQuestionAccuracy: number
    newsToTopicMappingCoverage: number
    freshNewsSuccessRate: number
    caRevisionCompliance: number
    caQuizPerformanceTrend: number[]
    newsGapDetection: string[]
    caRetentionScore: number
    caDepthIndex: number
  }
  
  // 11. Psychological & Behavioral Signals (10 metrics)
  behavioralSignals: {
    stressPointIdentification: Array<{ questionId: string, stressLevel: number }>
    fatigueIndicator: number[]
    skipPatternAnalysis: { [pattern: string]: number }
    bounceBackRate: number
    engagementHeatmap: Array<{ time: number, engagement: number }>
    focusDriftScore: number
    motivationDropSignals: string[]
    testAnxietyIndex: number
    endTestRushRate: number
    persistenceScore: number
  }
  
  // 12. Predictive Readiness Score (10 metrics)
  predictiveReadiness: {
    compositeReadinessIndex: number
    riskZoneTopicsCount: number
    confidenceAdjustedProjection: number
    timeAdjustedProjection: number
    topicWeightedProjection: number
    passProbabilityEstimate: number
    scoreVarianceForecast: { lower: number, upper: number }
    focusPriorityList: string[]
    effortToGainRatio: { [topic: string]: number }
    adaptiveDriveIndicator: number
  }
}

export default function CompleteAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [selectedDimension, setSelectedDimension] = useState<string>('knowledgeCoverage')
  const [loading, setLoading] = useState(true)

  const calculateComprehensiveAnalytics = async (testSessions: any[], questionAttempts: any[]): Promise<AnalyticsData> => {
    // This would be a complex calculation function
    // For demo purposes, returning mock data with realistic values
    return {
      knowledgeCoverage: {
        topicWiseAccuracy: {
          'History': 78.5,
          'Geography': 82.3,
          'Polity': 75.8,
          'Economy': 68.9,
          'Environment': 85.2,
          'Science & Technology': 72.4,
          'Current Affairs': 79.1
        },
        subTopicWiseAccuracy: {
          'Ancient History': 82.1,
          'Medieval History': 75.3,
          'Modern History': 78.9,
          'Physical Geography': 84.7,
          'Human Geography': 79.8,
          'Indian Geography': 83.2
        },
        syllabusCoverageRatio: 0.847,
        unattemptedTopicsCount: 23,
        weightedTopicMastery: 76.8,
        criticalTopicGapScore: 3.2,
        questionExposureDiversity: 0.892,
        depthOfKnowledgeIndex: 2.34,
        textbookVsPyqAlignment: 0.789,
        conceptTagCoverageScore: 0.823,
        revisionCoverageBalance: 0.756,
        longTailTopicEngagement: 0.234
      },
      
      difficultyProfile: {
        easyAttemptedPercent: 89.2,
        mediumAttemptedPercent: 76.8,
        hardAttemptedPercent: 45.3,
        difficultyBandAccuracy: {
          'Easy': 87.4,
          'Medium': 72.1,
          'Hard': 52.8
        },
        difficultyBandTimeSpent: {
          'Easy': 45.2,
          'Medium': 78.6,
          'Hard': 125.8
        },
        difficultyTransitionSuccess: 0.678,
        cumulativeDifficultyCurve: [
          { rank: 1, accuracy: 95.2 },
          { rank: 25, accuracy: 88.7 },
          { rank: 50, accuracy: 76.3 },
          { rank: 75, accuracy: 62.1 },
          { rank: 100, accuracy: 48.9 }
        ],
        peakDifficultyStreaks: 3.2,
        difficultyDrift: -0.12,
        weightedDifficultyScore: 2.34,
        selfRatedVsActualCorrelation: 0.723,
        skipRateByDifficulty: {
          'Easy': 0.023,
          'Medium': 0.087,
          'Hard': 0.234
        }
      },
      
      timeManagement: {
        avgTimePerQuestion: 72.3,
        timeVariance: 28.7,
        questionsOverTargetTimePercent: 23.4,
        idleWastedTime: 4.2,
        pacingAccuracy: 0.789,
        timePressureAccuracy: 0.623,
        earlyFinishRate: 0.156,
        timeRecoveryEfficiency: 0.734
      },
      
      answerStrategy: {
        firstAttemptAccuracy: 0.782,
        optionEliminationSuccessRate: 0.856,
        guessAccuracyRate: 0.267,
        skipThenReturnSuccess: 0.634,
        changeAnswerSuccessRate: 0.423,
        distractorTrapRate: 0.187,
        strategicSkipRate: 0.089,
        optionConfidenceAlignment: 0.745,
        useOfHintToolRate: 0.234,
        timeSpentVsStrategyCorrelation: 0.567
      },
      
      conceptualErrors: {
        misconceptionClusterCount: 7,
        top5RepeatedErrorTypes: [
          'Constitutional Amendment Process',
          'GDP vs GNP Calculation',
          'Monsoon Pattern Confusion',
          'Historical Timeline Errors',
          'Environmental Treaty Mix-ups'
        ],
        conceptOverlapMistakeFreq: 0.234,
        errorSeverityIndex: 2.8,
        errorRecoveryRate: 0.678,
        errorCorrelationMatrix: {
          'Constitutional Errors': { 'Legal Procedure Errors': 0.67 },
          'Economic Calculation': { 'Statistical Interpretation': 0.78 }
        },
        textbookConceptFailureRate: 0.156,
        questionTypeErrorDistribution: {
          'Factual': 0.12,
          'Analytical': 0.28,
          'Application': 0.34
        },
        conceptTagConfusionScore: 0.189,
        rootCauseKeywordAnalysis: [
          'except', 'not', 'incorrect', 'false', 'never'
        ],
        errorFixRecommendationCount: 23,
        postErrorCorrectionSuccess: 0.734
      },
      
      confidenceCalibration: {
        selfRatedConfidencePerQ: [3.2, 4.1, 2.8, 3.9, 4.5, 2.1, 3.7],
        confidenceVsCorrectnessDeltas: [0.2, -0.8, 1.2, -0.3, -1.1, 0.9, -0.4],
        overconfidenceIncidence: 0.234,
        underconfidenceIncidence: 0.189,
        calibrationCurve: [
          { confidenceBin: 1, accuracy: 0.23 },
          { confidenceBin: 2, accuracy: 0.45 },
          { confidenceBin: 3, accuracy: 0.67 },
          { confidenceBin: 4, accuracy: 0.82 },
          { confidenceBin: 5, accuracy: 0.91 }
        ],
        confidenceChangeTrend: [3.2, 3.4, 3.1, 3.6, 3.8, 3.5, 3.9],
        highConfidenceWrongCount: 12,
        lowConfidenceRightCount: 18
      },
      
      questionAnalytics: {
        keywordRecognitionRate: 0.823,
        distractorTriggerIndex: 0.267,
        questionLengthEffect: [
          { length: 50, accuracy: 0.89 },
          { length: 100, accuracy: 0.78 },
          { length: 150, accuracy: 0.67 },
          { length: 200, accuracy: 0.56 }
        ],
        stemComplexityScore: 2.34,
        dataInterpretationAccuracy: 0.689,
        graphImagePerformance: 0.723,
        multiSentenceComprehensionTime: 89.7,
        directiveWordErrorRate: 0.234,
        questionTypeBreakdownAccuracy: {
          'Factual': 0.87,
          'Conceptual': 0.72,
          'Analytical': 0.64,
          'Application': 0.58
        },
        anchorWordExtractionSuccess: 0.789
      },
      
      learningVelocity: {
        scoreImprovementRate: 0.123,
        topicMasteryVelocity: {
          'History': 0.089,
          'Geography': 0.156,
          'Polity': 0.067,
          'Economy': 0.234
        },
        retentionIndex: 0.789,
        spacedRepetitionReadiness: 0.634,
        reviewComplianceRate: 0.823,
        learningCurveFittingScore: 0.892,
        revisionRetentionDelta: 0.156,
        masteryPlateauDetection: ['Economy', 'Science & Technology'],
        adaptiveRevisionEffectiveness: 0.734,
        learningMomentumScore: 0.678
      },
      
      benchmarking: {
        peerPercentileRank: 78.5,
        cohortDemographicComparison: {
          'Freshers': 0.234,
          'Working Professionals': -0.123,
          'Previous Attempt': 0.456
        },
        historicalSelfComparison: [65.2, 68.9, 72.1, 75.8, 78.5],
        topicWisePeerBenchmark: {
          'History': 0.123,
          'Geography': -0.089,
          'Polity': 0.234
        },
        difficultyBandPeerBenchmark: {
          'Easy': 0.089,
          'Medium': -0.045,
          'Hard': 0.167
        },
        timeManagementPeerBenchmark: 0.156,
        confidenceBenchmarkVsPeers: -0.089,
        strategyBenchmark: {
          'Elimination': 0.123,
          'Guessing': -0.067,
          'Skipping': 0.234
        },
        topPerformerInsights: [
          'Spend more time on medium difficulty questions',
          'Improve confidence calibration',
          'Focus on Economy and S&T topics'
        ],
        gapFromTop10Percent: 12.3,
        improvementVelocityVsPeers: 0.189
      },
      
      currentAffairs: {
        caTaggedQuestionAccuracy: 0.723,
        newsToTopicMappingCoverage: 0.834,
        freshNewsSuccessRate: 0.567,
        caRevisionCompliance: 0.789,
        caQuizPerformanceTrend: [65.2, 68.9, 72.1, 75.8],
        newsGapDetection: [
          'Recent Economic Policies',
          'International Relations Updates',
          'Environmental Agreements'
        ],
        caRetentionScore: 0.678,
        caDepthIndex: 2.34
      },
      
      behavioralSignals: {
        stressPointIdentification: [
          { questionId: 'q_45', stressLevel: 0.89 },
          { questionId: 'q_67', stressLevel: 0.78 },
          { questionId: 'q_89', stressLevel: 0.92 }
        ],
        fatigueIndicator: [0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9],
        skipPatternAnalysis: {
          'Early Skip': 0.123,
          'Mid Test Skip': 0.234,
          'End Rush Skip': 0.456
        },
        bounceBackRate: 0.678,
        engagementHeatmap: [
          { time: 0, engagement: 0.9 },
          { time: 30, engagement: 0.8 },
          { time: 60, engagement: 0.6 },
          { time: 90, engagement: 0.4 },
          { time: 120, engagement: 0.7 }
        ],
        focusDriftScore: 0.234,
        motivationDropSignals: [
          'Consecutive skips after question 45',
          'Long pause at question 67',
          'Rapid answering in last 15 minutes'
        ],
        testAnxietyIndex: 0.456,
        endTestRushRate: 0.789,
        persistenceScore: 0.634
      },
      
      predictiveReadiness: {
        compositeReadinessIndex: 72.8,
        riskZoneTopicsCount: 5,
        confidenceAdjustedProjection: 68.9,
        timeAdjustedProjection: 71.2,
        topicWeightedProjection: 74.5,
        passProbabilityEstimate: 0.823,
        scoreVarianceForecast: { lower: 65.2, upper: 78.9 },
        focusPriorityList: [
          'Economy - Monetary Policy',
          'Science & Technology - Recent Developments',
          'Current Affairs - International Relations',
          'Polity - Constitutional Amendments',
          'Environment - Climate Change Policies'
        ],
        effortToGainRatio: {
          'Economy': 2.34,
          'Science & Technology': 1.89,
          'Current Affairs': 1.56,
          'Polity': 2.78,
          'Environment': 1.23
        },
        adaptiveDriveIndicator: 0.678
      }
    }
  }

  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        const user = await blink.auth.me()
        
        // Fetch all test sessions and attempts for comprehensive analysis
        const testSessions = await blink.db.testSessions.list({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        })
        
        const questionAttempts = await blink.db.questionAttempts.list({
          where: { userId: user.id }
        })
        
        // Calculate all 120+ metrics
        const analytics = await calculateComprehensiveAnalytics(testSessions, questionAttempts)
        setAnalyticsData(analytics)
        
      } catch (error) {
        console.error('Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadAnalyticsData()
  }, [])

  const dimensions = [
    { key: 'knowledgeCoverage', label: 'Knowledge & Syllabus Coverage', icon: Brain, count: 12 },
    { key: 'difficultyProfile', label: 'Question Difficulty Profile', icon: TrendingUp, count: 10 },
    { key: 'timeManagement', label: 'Time Management', icon: Clock, count: 8 },
    { key: 'answerStrategy', label: 'Answer Strategy', icon: Target, count: 10 },
    { key: 'conceptualErrors', label: 'Conceptual Errors', icon: AlertTriangle, count: 12 },
    { key: 'confidenceCalibration', label: 'Confidence Calibration', icon: CheckCircle, count: 8 },
    { key: 'questionAnalytics', label: 'Question Statement Analytics', icon: Zap, count: 10 },
    { key: 'learningVelocity', label: 'Learning Velocity & Retention', icon: TrendingUp, count: 10 },
    { key: 'benchmarking', label: 'Comparative Benchmarking', icon: TrendingUp, count: 11 },
    { key: 'currentAffairs', label: 'Current Affairs Linkage', icon: Brain, count: 8 },
    { key: 'behavioralSignals', label: 'Psychological & Behavioral Signals', icon: Brain, count: 10 },
    { key: 'predictiveReadiness', label: 'Predictive Readiness Score', icon: Target, count: 10 }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading comprehensive analytics...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600">Take some tests to see your comprehensive analytics</p>
      </div>
    )
  }

  const renderDimensionContent = () => {
    const data = analyticsData[selectedDimension as keyof AnalyticsData]
    
    switch (selectedDimension) {
      case 'knowledgeCoverage':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-1">Syllabus Coverage</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {(data.syllabusCoverageRatio * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-1">Weighted Mastery</h4>
                <p className="text-2xl font-bold text-green-600">
                  {data.weightedTopicMastery.toFixed(1)}%
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-1">Unattempted Topics</h4>
                <p className="text-2xl font-bold text-red-600">{data.unattemptedTopicsCount}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-4">Topic-wise Accuracy</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(data.topicWiseAccuracy).map(([topic, accuracy]) => ({ topic, accuracy }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="topic" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
        
      case 'difficultyProfile':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-1">Easy Questions</h4>
                <p className="text-2xl font-bold text-green-600">
                  {data.easyAttemptedPercent.toFixed(1)}%
                </p>
                <p className="text-sm text-green-700">Attempted</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-1">Medium Questions</h4>
                <p className="text-2xl font-bold text-yellow-600">
                  {data.mediumAttemptedPercent.toFixed(1)}%
                </p>
                <p className="text-sm text-yellow-700">Attempted</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-1">Hard Questions</h4>
                <p className="text-2xl font-bold text-red-600">
                  {data.hardAttemptedPercent.toFixed(1)}%
                </p>
                <p className="text-sm text-red-700">Attempted</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-4">Cumulative Difficulty Curve</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.cumulativeDifficultyCurve}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rank" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="accuracy" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
        
      case 'predictiveReadiness':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <h3 className="text-2xl font-bold mb-2">Composite Readiness Index</h3>
              <p className="text-4xl font-bold">{data.compositeReadinessIndex.toFixed(1)}/100</p>
              <p className="text-blue-100 mt-2">
                Pass Probability: {(data.passProbabilityEstimate * 100).toFixed(1)}%
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4">Score Projections</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Confidence Adjusted:</span>
                    <span className="font-semibold">{data.confidenceAdjustedProjection.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Adjusted:</span>
                    <span className="font-semibold">{data.timeAdjustedProjection.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Topic Weighted:</span>
                    <span className="font-semibold">{data.topicWeightedProjection.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4">Focus Priority List</h4>
                <div className="space-y-2">
                  {data.focusPriorityList.map((topic, index) => (
                    <div key={index} className="flex items-center">
                      <span className="w-6 h-6 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      <span className="text-sm">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
        
      default:
        return (
          <div className="bg-white rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-4">
              {dimensions.find(d => d.key === selectedDimension)?.label} Analytics
            </h4>
            <p className="text-gray-600">
              Detailed analytics for this dimension will be displayed here with all {dimensions.find(d => d.key === selectedDimension)?.count} metrics.
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm text-gray-700 overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Analytics Dashboard</h1>
        <p className="text-gray-600">120+ metrics across 12 analytical dimensions</p>
      </div>

      {/* Dimension Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {dimensions.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setSelectedDimension(key)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedDimension === key
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Icon className={`w-6 h-6 mb-2 ${
              selectedDimension === key ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <h3 className="font-medium text-gray-900 text-sm mb-1">{label}</h3>
            <p className="text-xs text-gray-500">{count} metrics</p>
          </button>
        ))}
      </div>

      {/* Selected Dimension Content */}
      <div className="mb-8">
        {renderDimensionContent()}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Analytics Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">120+</p>
            <p className="text-sm text-gray-600">Total Metrics</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">12</p>
            <p className="text-sm text-gray-600">Dimensions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {analyticsData.predictiveReadiness.compositeReadinessIndex.toFixed(0)}
            </p>
            <p className="text-sm text-gray-600">Readiness Score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {(analyticsData.predictiveReadiness.passProbabilityEstimate * 100).toFixed(0)}%
            </p>
            <p className="text-sm text-gray-600">Pass Probability</p>
          </div>
        </div>
      </div>
    </div>
  )
}