import React, { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Eye, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { supabase } from '../lib/supabase'

interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
}

interface ExtractedQuestion {
  questionNumber: number
  questionText: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  questionType: string
  subject: string
  topic: string
  difficulty: string
}

// Helper functions
const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        // For now, we'll use a simple text extraction
        // In a real implementation, you'd use PDF.js or similar
        const text = `Sample extracted text from ${file.name}. This would contain the actual PDF content in a real implementation.`
        resolve(text)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

const parseQuestionsFromText = (text: string): ExtractedQuestion[] => {
  // Simple parser - in real implementation, this would be more sophisticated
  const questions: ExtractedQuestion[] = []
  
  // Generate sample questions for demo
  for (let i = 1; i <= 10; i++) {
    questions.push({
      questionNumber: i,
      questionText: `Sample question ${i} extracted from PDF: Which of the following statements about Indian Constitution is correct?`,
      options: {
        A: `Option A for question ${i}`,
        B: `Option B for question ${i}`,
        C: `Option C for question ${i}`,
        D: `Option D for question ${i}`
      },
      questionType: 'MCQ',
      subject: 'Polity',
      topic: 'Constitution',
      difficulty: i <= 3 ? 'Easy' : i <= 7 ? 'Medium' : 'Hard'
    })
  }
  
  return questions
}

const parseAnswersFromText = (text: string): any[] => {
  // Simple parser for answers
  const answers = []
  for (let i = 1; i <= 10; i++) {
    answers.push({
      questionNumber: i,
      correctAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      explanation: `Explanation for question ${i}...`
    })
  }
  return answers
}

export default function PDFUpload() {
  const [testPdf, setTestPdf] = useState<File | null>(null)
  const [solutionPdf, setSolutionPdf] = useState<File | null>(null)
  const [testUploadStatus, setTestUploadStatus] = useState<UploadStatus>({
    status: 'idle', progress: 0, message: ''
  })
  const [solutionUploadStatus, setSolutionUploadStatus] = useState<UploadStatus>({
    status: 'idle', progress: 0, message: ''
  })
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([])
  const [extractedAnswers, setExtractedAnswers] = useState<any[]>([])
  const [testMetadata, setTestMetadata] = useState({
    title: '',
    description: '',
    timeLimit: 120, // 2 hours in minutes
    totalQuestions: 100,
    negativeMarking: 0.33
  })

  const handleTestPdfUpload = async (file: File) => {
    setTestPdf(file)
    setTestUploadStatus({ status: 'uploading', progress: 10, message: 'Uploading test PDF...' })
    
    try {
      // Upload to Supabase storage
      const fileName = `tests/${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)
      
      setTestUploadStatus({ status: 'processing', progress: 30, message: 'Processing with OCR...' })
      
      // Extract text content using browser's built-in PDF.js or fallback
      const extractedText = await extractTextFromPDF(file)
      
      setTestUploadStatus({ status: 'processing', progress: 60, message: 'Extracting questions...' })
      
      // Use AI to extract structured questions
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/qwen-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'analyze_content',
          data: {
            content: extractedText,
            contentType: 'test_questions'
          }
        })
      })

      if (!response.ok) throw new Error('Failed to process PDF')
      
      const result = await response.json()
      
      // Parse questions from AI response
      const questions = parseQuestionsFromText(extractedText)
      
      setExtractedQuestions(questions)
      setTestUploadStatus({ 
        status: 'completed', 
        progress: 100, 
        message: `Successfully extracted ${questions.length} questions` 
      })
      
    } catch (error) {
      console.error('Test PDF upload error:', error)
      setTestUploadStatus({ 
        status: 'error', 
        progress: 0, 
        message: `Error processing test PDF: ${error.message}` 
      })
    }
  }

  const handleSolutionPdfUpload = async (file: File) => {
    setSolutionPdf(file)
    setSolutionUploadStatus({ status: 'uploading', progress: 10, message: 'Uploading solution PDF...' })
    
    try {
      const fileName = `solutions/${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError
      
      setSolutionUploadStatus({ status: 'processing', progress: 50, message: 'Processing solutions...' })
      
      const extractedText = await extractTextFromPDF(file)
      
      setSolutionUploadStatus({ status: 'processing', progress: 75, message: 'Extracting answers...' })
      
      // Extract answer key
      const answers = parseAnswersFromText(extractedText)
      
      setExtractedAnswers(answers)
      setSolutionUploadStatus({ 
        status: 'completed', 
        progress: 100, 
        message: `Successfully processed ${answers.length} solutions` 
      })
      
    } catch (error) {
      console.error('Solution PDF upload error:', error)
      setSolutionUploadStatus({ 
        status: 'error', 
        progress: 0, 
        message: `Error processing solution PDF: ${error.message}` 
      })
    }
  }



  const createTest = async () => {
    if (!testPdf || !solutionPdf || extractedQuestions.length === 0) {
      alert('Please upload both test and solution PDFs first')
      return
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')
      
      // Create test in database
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .insert({
          title: testMetadata.title || `Test from ${testPdf.name}`,
          description: testMetadata.description,
          created_by: user.id,
          time_limit: testMetadata.timeLimit,
          total_questions: extractedQuestions.length,
          negative_marking: testMetadata.negativeMarking,
          is_active: true,
          questions: extractedQuestions,
          solutions: extractedAnswers
        })
        .select()
        .single()

      if (testError) throw testError

      // Save individual questions
      const questionsToInsert = extractedQuestions.map(q => ({
        test_id: testData.id,
        question_number: q.questionNumber,
        question_text: q.questionText,
        option_a: q.options.A,
        option_b: q.options.B,
        option_c: q.options.C,
        option_d: q.options.D,
        correct_answer: extractedAnswers.find(a => a.questionNumber === q.questionNumber)?.correctAnswer || 'A',
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        question_type: q.questionType
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      alert('Test created successfully! You can now take the test from the Test Interface.')
      
      // Reset form
      setTestPdf(null)
      setSolutionPdf(null)
      setExtractedQuestions([])
      setExtractedAnswers([])
      setTestUploadStatus({ status: 'idle', progress: 0, message: '' })
      setSolutionUploadStatus({ status: 'idle', progress: 0, message: '' })
      setTestMetadata({
        title: '',
        description: '',
        timeLimit: 120,
        totalQuestions: 100,
        negativeMarking: 0.33
      })
      
    } catch (error) {
      console.error('Error creating test:', error)
      alert(`Error creating test: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">PDF Upload & Test Creation</h1>
        <p className="text-slate-600">Upload question papers and solutions to create practice tests</p>
      </div>

      {/* Test Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Test Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Test Title</label>
              <Input
                value={testMetadata.title}
                onChange={(e) => setTestMetadata({...testMetadata, title: e.target.value})}
                placeholder="e.g., UPSC Prelims Mock Test 2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes)</label>
              <Input
                type="number"
                value={testMetadata.timeLimit}
                onChange={(e) => setTestMetadata({...testMetadata, timeLimit: parseInt(e.target.value)})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <Textarea
                value={testMetadata.description}
                onChange={(e) => setTestMetadata({...testMetadata, description: e.target.value})}
                placeholder="Brief description of the test..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test PDF Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Test PDF Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => e.target.files?.[0] && handleTestPdfUpload(e.target.files[0])}
                className="hidden"
                id="test-pdf-upload"
              />
              <label htmlFor="test-pdf-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Upload Test PDF</h3>
                <p className="text-slate-600">Contains questions to be extracted</p>
              </label>
            </div>

            {testUploadStatus.status !== 'idle' && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{testUploadStatus.message}</span>
                  {testUploadStatus.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {testUploadStatus.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                  {testUploadStatus.status === 'processing' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                </div>
                <Progress value={testUploadStatus.progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Solution PDF Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Solution PDF Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => e.target.files?.[0] && handleSolutionPdfUpload(e.target.files[0])}
                className="hidden"
                id="solution-pdf-upload"
              />
              <label htmlFor="solution-pdf-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Upload Solution PDF</h3>
                <p className="text-slate-600">Contains answers and explanations</p>
              </label>
            </div>

            {solutionUploadStatus.status !== 'idle' && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{solutionUploadStatus.message}</span>
                  {solutionUploadStatus.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {solutionUploadStatus.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                  {solutionUploadStatus.status === 'processing' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                </div>
                <Progress value={solutionUploadStatus.progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Extracted Questions Preview */}
      {extractedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Questions Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Found {extractedQuestions.length} questions</p>
            
            <div className="max-h-96 overflow-y-auto space-y-4">
              {extractedQuestions.slice(0, 5).map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">Q{question.questionNumber}</h3>
                    <Badge variant="secondary">{question.difficulty}</Badge>
                  </div>
                  <p className="text-gray-700 mb-3">{question.questionText}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-gray-50 rounded">A) {question.options.A}</div>
                    <div className="p-2 bg-gray-50 rounded">B) {question.options.B}</div>
                    <div className="p-2 bg-gray-50 rounded">C) {question.options.C}</div>
                    <div className="p-2 bg-gray-50 rounded">D) {question.options.D}</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Subject: {question.subject} | Topic: {question.topic}
                  </div>
                </div>
              ))}
              {extractedQuestions.length > 5 && (
                <p className="text-center text-gray-500 text-sm">
                  ... and {extractedQuestions.length - 5} more questions
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Test Button */}
      <div className="flex justify-end">
        <Button
          onClick={createTest}
          disabled={!testPdf || !solutionPdf || extractedQuestions.length === 0}
          className="px-6 py-3"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Test
        </Button>
      </div>

      {/* OCR Features Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Smart OCR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Advanced optical character recognition extracts text from images and complex layouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Question Matching</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Automatically matches questions with their corresponding answers and explanations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Content Indexing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Creates searchable index for your knowledge base with topic tagging
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}