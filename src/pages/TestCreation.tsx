import React, { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { blink } from '../blink/client'

interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
}

export default function TestCreation() {
  const [testPdf, setTestPdf] = useState<File | null>(null)
  const [solutionPdf, setSolutionPdf] = useState<File | null>(null)
  const [testUploadStatus, setTestUploadStatus] = useState<UploadStatus>({
    status: 'idle', progress: 0, message: ''
  })
  const [solutionUploadStatus, setSolutionUploadStatus] = useState<UploadStatus>({
    status: 'idle', progress: 0, message: ''
  })
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([])
  const [testMetadata, setTestMetadata] = useState({
    title: '',
    description: '',
    timeLimit: 120, // 2 hours in minutes
    totalQuestions: 100,
    negativeMarking: 0.33
  })

  const handleTestPdfUpload = async (file: File) => {
    setTestPdf(file)
    setTestUploadStatus({ status: 'uploading', progress: 0, message: 'Uploading test PDF...' })
    
    try {
      // Upload to storage
      const { publicUrl } = await blink.storage.upload(file, `tests/${Date.now()}_${file.name}`)
      
      setTestUploadStatus({ status: 'processing', progress: 50, message: 'Processing with OCR...' })
      
      // Extract text content using Blink's data extraction
      const extractedText = await blink.data.extractFromUrl(publicUrl, {
        chunking: true,
        chunkSize: 2000
      })
      
      setTestUploadStatus({ status: 'processing', progress: 75, message: 'Extracting questions...' })
      
      // Use AI to extract structured questions
      const { object: questionData } = await blink.ai.generateObject({
        prompt: `Extract all questions from this UPSC CSE Prelims test content. Each question should include:
        - Question number
        - Question text (including any data/context)
        - All 4 options (A, B, C, D)
        - Question type (factual, analytical, current affairs, etc.)
        - Subject/topic classification
        - Estimated difficulty (Easy/Medium/Hard)
        
        Content: ${Array.isArray(extractedText) ? extractedText.join('\n') : extractedText}`,
        schema: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionNumber: { type: 'number' },
                  questionText: { type: 'string' },
                  options: {
                    type: 'object',
                    properties: {
                      A: { type: 'string' },
                      B: { type: 'string' },
                      C: { type: 'string' },
                      D: { type: 'string' }
                    }
                  },
                  questionType: { type: 'string' },
                  subject: { type: 'string' },
                  topic: { type: 'string' },
                  difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] }
                }
              }
            },
            metadata: {
              type: 'object',
              properties: {
                totalQuestions: { type: 'number' },
                subjects: { type: 'array', items: { type: 'string' } },
                estimatedTime: { type: 'number' }
              }
            }
          }
        }
      })
      
      setExtractedQuestions(questionData.questions || [])
      setTestUploadStatus({ 
        status: 'completed', 
        progress: 100, 
        message: `Successfully extracted ${questionData.questions?.length || 0} questions` 
      })
      
    } catch (error) {
      setTestUploadStatus({ 
        status: 'error', 
        progress: 0, 
        message: `Error processing test PDF: ${error.message}` 
      })
    }
  }

  const handleSolutionPdfUpload = async (file: File) => {
    setSolutionPdf(file)
    setSolutionUploadStatus({ status: 'uploading', progress: 0, message: 'Uploading solution PDF...' })
    
    try {
      const { publicUrl } = await blink.storage.upload(file, `solutions/${Date.now()}_${file.name}`)
      
      setSolutionUploadStatus({ status: 'processing', progress: 50, message: 'Processing solutions...' })
      
      const extractedText = await blink.data.extractFromUrl(publicUrl, {
        chunking: true,
        chunkSize: 2000
      })
      
      setSolutionUploadStatus({ status: 'processing', progress: 75, message: 'Extracting answers...' })
      
      // Extract answer key
      const { object: solutionData } = await blink.ai.generateObject({
        prompt: `Extract the answer key from this UPSC solution PDF. For each question number, provide:
        - Question number
        - Correct answer (A, B, C, or D)
        - Explanation/reasoning
        - Key concepts involved
        
        Content: ${Array.isArray(extractedText) ? extractedText.join('\n') : extractedText}`,
        schema: {
          type: 'object',
          properties: {
            answers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionNumber: { type: 'number' },
                  correctAnswer: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
                  explanation: { type: 'string' },
                  keyConcepts: { type: 'array', items: { type: 'string' } },
                  difficulty: { type: 'string' }
                }
              }
            }
          }
        }
      })
      
      setSolutionUploadStatus({ 
        status: 'completed', 
        progress: 100, 
        message: `Successfully processed ${solutionData.answers?.length || 0} solutions` 
      })
      
    } catch (error) {
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
      const user = await blink.auth.me()
      
      // Create test in database
      const testId = `test_${Date.now()}`
      await blink.db.tests.create({
        id: testId,
        userId: user.id,
        title: testMetadata.title,
        description: testMetadata.description,
        timeLimit: testMetadata.timeLimit,
        totalQuestions: extractedQuestions.length,
        negativeMarking: testMetadata.negativeMarking,
        status: 'active',
        createdAt: new Date().toISOString()
      })

      // Save questions
      for (const question of extractedQuestions) {
        await blink.db.questions.create({
          id: `q_${testId}_${question.questionNumber}`,
          testId,
          questionNumber: question.questionNumber,
          questionText: question.questionText,
          optionA: question.options.A,
          optionB: question.options.B,
          optionC: question.options.C,
          optionD: question.options.D,
          correctAnswer: '', // Will be filled from solution PDF
          subject: question.subject,
          topic: question.topic,
          difficulty: question.difficulty,
          questionType: question.questionType,
          createdAt: new Date().toISOString()
        })
      }

      alert('Test created successfully!')
      
    } catch (error) {
      alert(`Error creating test: ${error.message}`)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Test</h1>
        <p className="text-gray-600">Upload test and solution PDFs to create a new practice test</p>
      </div>

      {/* Test Metadata */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Title</label>
            <input
              type="text"
              value={testMetadata.title}
              onChange={(e) => setTestMetadata({...testMetadata, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., UPSC Prelims Mock Test 2024"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes)</label>
            <input
              type="number"
              value={testMetadata.timeLimit}
              onChange={(e) => setTestMetadata({...testMetadata, timeLimit: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={testMetadata.description}
              onChange={(e) => setTestMetadata({...testMetadata, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Brief description of the test..."
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Test PDF Upload */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Test PDF Upload
          </h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files?.[0] && handleTestPdfUpload(e.target.files[0])}
              className="hidden"
              id="test-pdf-upload"
            />
            <label htmlFor="test-pdf-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Upload Test PDF</p>
              <p className="text-sm text-gray-500">Contains questions to be extracted</p>
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
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${testUploadStatus.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Solution PDF Upload */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Solution PDF Upload
          </h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files?.[0] && handleSolutionPdfUpload(e.target.files[0])}
              className="hidden"
              id="solution-pdf-upload"
            />
            <label htmlFor="solution-pdf-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Upload Solution PDF</p>
              <p className="text-sm text-gray-500">Contains answers and explanations</p>
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
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${solutionUploadStatus.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Extracted Questions Preview */}
      {extractedQuestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Extracted Questions Preview</h2>
          <p className="text-gray-600 mb-4">Found {extractedQuestions.length} questions</p>
          
          <div className="max-h-96 overflow-y-auto">
            {extractedQuestions.slice(0, 5).map((question, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Q{question.questionNumber}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {question.difficulty}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{question.questionText}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>A) {question.options.A}</div>
                  <div>B) {question.options.B}</div>
                  <div>C) {question.options.C}</div>
                  <div>D) {question.options.D}</div>
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
        </div>
      )}

      {/* Create Test Button */}
      <div className="flex justify-end">
        <button
          onClick={createTest}
          disabled={!testPdf || !solutionPdf || extractedQuestions.length === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Create Test
        </button>
      </div>
    </div>
  )
}