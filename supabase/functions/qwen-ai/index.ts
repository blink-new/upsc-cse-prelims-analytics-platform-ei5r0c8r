import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface QwenRequest {
  action: 'analyze_voice_memo' | 'generate_debate' | 'mentor_insights' | 'adaptive_questions' | 'analyze_content' | 'study_plan';
  data: any;
}

interface QwenResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function callQwenAPI(messages: Array<{ role: string; content: string }>, temperature = 0.7): Promise<string> {
  const qwenApiKey = Deno.env.get('QWEN_API_KEY');
  
  if (!qwenApiKey) {
    throw new Error('QWEN_API_KEY not found in environment variables');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${qwenApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://upsc-analytics.blink.new',
        'X-Title': 'UPSC CSE Prelims Analytics Platform'
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-72b-instruct',
        messages,
        temperature,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Qwen API error: ${response.status} - ${errorText}`);
    }

    const data: QwenResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Qwen API Error:', error);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
}

async function analyzeVoiceMemo(transcript: string, questionContext: any, isCorrect: boolean) {
  const prompt = `
  Analyze this UPSC CSE Prelims student's voice memo explanation:

  Question Context: ${JSON.stringify(questionContext)}
  Student's Answer: ${isCorrect ? 'Correct' : 'Incorrect'}
  Student's Explanation: "${transcript}"

  Provide a comprehensive analysis with:
  1. Summary of student's reasoning
  2. Key insights from their thinking
  3. Missing concepts they should know
  4. Logic errors in their reasoning
  5. Specific recommendations for improvement
  6. Clarifications on the topic
  7. Counterpoints to deepen understanding
  8. Confidence score (0-1) of their understanding

  Format as JSON with keys: summary, keyInsights, missingConcepts, logicErrors, recommendations, clarifications, counterpoints, confidenceScore
  `;

  const messages = [
    { role: 'system', content: 'You are an expert UPSC CSE mentor analyzing student reasoning patterns.' },
    { role: 'user', content: prompt }
  ];

  const response = await callQwenAPI(messages, 0.3);
  
  try {
    return JSON.parse(response);
  } catch {
    return {
      summary: response.substring(0, 200),
      keyInsights: [response.substring(200, 400)],
      missingConcepts: ['Analysis pending'],
      logicErrors: ['Review needed'],
      recommendations: ['Continue practice'],
      clarifications: response.substring(400, 600),
      counterpoints: response.substring(600, 800),
      confidenceScore: 0.5
    };
  }
}

async function generateDebateResponse(topic: string, stance: 'A' | 'B', conversationHistory: any[], context: string) {
  const stanceDescription = stance === 'A' 
    ? 'You are arguing FOR the policy/position' 
    : 'You are arguing AGAINST the policy/position';

  const prompt = `
  Topic: ${topic}
  Context: ${context}
  Your Role: ${stanceDescription}
  
  Previous conversation: ${JSON.stringify(conversationHistory.slice(-4))}
  
  Provide a compelling argument from your assigned perspective. Be factual, cite relevant examples, and engage with previous points. Keep it concise (2-3 paragraphs).
  `;

  const messages = [
    { 
      role: 'system', 
      content: `You are an expert policy debater for UPSC CSE current affairs. ${stanceDescription}. Always maintain your assigned position while being factual and educational.` 
    },
    { role: 'user', content: prompt }
  ];

  return await callQwenAPI(messages, 0.8);
}

async function generateMentorInsights(userPerformance: any) {
  const prompt = `
  Analyze this UPSC CSE Prelims student's performance data:
  ${JSON.stringify(userPerformance)}

  Generate personalized mentor insights including:
  1. Key performance insights (3-4 points)
  2. Specific recommendations for improvement
  3. Priority focus areas for study
  4. Motivational message

  Format as JSON with keys: insights, recommendations, focusAreas, motivationalMessage
  `;

  const messages = [
    { role: 'system', content: 'You are an experienced UPSC CSE mentor providing personalized guidance.' },
    { role: 'user', content: prompt }
  ];

  const response = await callQwenAPI(messages, 0.5);
  
  try {
    return JSON.parse(response);
  } catch {
    return {
      insights: ['Performance analysis in progress'],
      recommendations: ['Continue regular practice'],
      focusAreas: ['General Studies'],
      motivationalMessage: 'Keep up the consistent effort!'
    };
  }
}

async function generateAdaptiveQuestions(weakTopics: string[], difficultyLevel: string, count: number = 5) {
  const prompt = `
  Generate ${count} UPSC CSE Prelims questions for these weak topics: ${weakTopics.join(', ')}
  Difficulty level: ${difficultyLevel}

  Each question should have:
  - Question text
  - 4 options (A, B, C, D)
  - Correct answer
  - Explanation
  - Topic and subtopic
  - Difficulty level
  - Source/reference

  Format as JSON array of question objects.
  `;

  const messages = [
    { role: 'system', content: 'You are an expert UPSC question paper setter creating high-quality practice questions.' },
    { role: 'user', content: prompt }
  ];

  const response = await callQwenAPI(messages, 0.6);
  
  try {
    return JSON.parse(response);
  } catch {
    return [];
  }
}

async function analyzeContent(content: string, contentType: string) {
  const prompt = `
  Analyze this UPSC CSE study material:
  Content Type: ${contentType}
  Content: ${content.substring(0, 2000)}...

  Extract:
  1. Main topics covered
  2. Key concepts
  3. Important points for UPSC preparation
  4. Difficulty level (Easy/Medium/Hard)
  5. Relevance score for UPSC CSE (0-1)

  Format as JSON with keys: topics, concepts, keyPoints, difficulty, relevance
  `;

  const messages = [
    { role: 'system', content: 'You are a UPSC CSE content analyzer specializing in study material assessment.' },
    { role: 'user', content: prompt }
  ];

  const response = await callQwenAPI(messages, 0.3);
  
  try {
    return JSON.parse(response);
  } catch {
    return {
      topics: ['General Studies'],
      concepts: ['Analysis pending'],
      keyPoints: ['Content uploaded successfully'],
      difficulty: 'Medium',
      relevance: 0.7
    };
  }
}

async function generateStudyPlan(userProfile: any, performanceData: any, timeframe: number) {
  const prompt = `
  Create a personalized ${timeframe}-day UPSC CSE Prelims study plan:
  
  User Profile: ${JSON.stringify(userProfile)}
  Performance Data: ${JSON.stringify(performanceData)}
  
  Generate:
  1. Daily study plan with time allocation
  2. Weekly goals and milestones
  3. Priority topics based on performance
  4. Overall study strategy

  Format as JSON with keys: dailyPlan, weeklyGoals, priorityTopics, studyStrategy
  `;

  const messages = [
    { role: 'system', content: 'You are a UPSC CSE study planner creating personalized preparation strategies.' },
    { role: 'user', content: prompt }
  ];

  const response = await callQwenAPI(messages, 0.4);
  
  try {
    return JSON.parse(response);
  } catch {
    return {
      dailyPlan: [{ day: 1, topics: ['General Studies'], duration: '4 hours' }],
      weeklyGoals: ['Complete current affairs revision'],
      priorityTopics: ['History', 'Geography', 'Polity'],
      studyStrategy: 'Focus on weak areas with regular practice tests'
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data }: QwenRequest = await req.json();

    let result;

    switch (action) {
      case 'analyze_voice_memo':
        result = await analyzeVoiceMemo(data.transcript, data.questionContext, data.isCorrect);
        break;
      
      case 'generate_debate':
        result = await generateDebateResponse(data.topic, data.stance, data.conversationHistory, data.context);
        break;
      
      case 'mentor_insights':
        result = await generateMentorInsights(data.userPerformance);
        break;
      
      case 'adaptive_questions':
        result = await generateAdaptiveQuestions(data.weakTopics, data.difficultyLevel, data.count);
        break;
      
      case 'analyze_content':
        result = await analyzeContent(data.content, data.contentType);
        break;
      
      case 'study_plan':
        result = await generateStudyPlan(data.userProfile, data.performanceData, data.timeframe);
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});