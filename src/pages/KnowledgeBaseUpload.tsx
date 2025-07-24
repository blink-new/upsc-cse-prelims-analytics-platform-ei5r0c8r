import React, { useState } from 'react'
import { Upload, FileText, Book, Newspaper, StickyNote, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { blink } from '../blink/client'

interface UploadedFile {
  id: string
  name: string
  type: 'book' | 'article' | 'note' | 'pdf'
  size: number
  uploadedAt: string
  status: 'processing' | 'completed' | 'error'
  extractedChunks?: number
}

export default function KnowledgeBaseUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<'book' | 'article' | 'note' | 'pdf'>('book')

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true)
    
    for (const file of Array.from(files)) {
      const fileId = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Add file to state with processing status
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        type: selectedCategory,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        status: 'processing'
      }
      
      setUploadedFiles(prev => [...prev, newFile])
      
      try {
        // Upload to storage
        const { publicUrl } = await blink.storage.upload(
          file, 
          `knowledge-base/${selectedCategory}/${Date.now()}_${file.name}`
        )
        
        // Extract content with chunking
        const extractedContent = await blink.data.extractFromUrl(publicUrl, {
          chunking: true,
          chunkSize: 1500
        })
        
        const chunks = Array.isArray(extractedContent) ? extractedContent : [extractedContent]
        
        // Process each chunk with AI for better indexing
        const processedChunks = []
        for (const chunk of chunks) {
          const { object: processedChunk } = await blink.ai.generateObject({
            prompt: `Analyze this content chunk and extract key information for a UPSC knowledge base:
            - Main topics/subjects covered
            - Key concepts and definitions
            - Important facts and figures
            - Relevant for which UPSC subjects
            - Difficulty level
            - Summary of the content
            
            Content: ${chunk}`,
            schema: {
              type: 'object',
              properties: {
                topics: { type: 'array', items: { type: 'string' } },
                concepts: { type: 'array', items: { type: 'string' } },
                facts: { type: 'array', items: { type: 'string' } },
                upscSubjects: { type: 'array', items: { type: 'string' } },
                difficulty: { type: 'string', enum: ['Basic', 'Intermediate', 'Advanced'] },
                summary: { type: 'string' },
                originalContent: { type: 'string' }
              }
            }
          })
          
          processedChunks.push({
            ...processedChunk,
            originalContent: chunk
          })
        }
        
        const user = await blink.auth.me()
        
        // Save to knowledge base
        await blink.db.knowledgeBase.create({
          id: fileId,
          userId: user.id,
          fileName: file.name,
          fileType: selectedCategory,
          fileUrl: publicUrl,
          fileSize: file.size,
          totalChunks: processedChunks.length,
          extractedAt: new Date().toISOString(),
          status: 'completed'
        })
        
        // Save processed chunks
        for (let i = 0; i < processedChunks.length; i++) {
          const chunk = processedChunks[i]
          await blink.db.knowledgeChunks.create({
            id: `${fileId}_chunk_${i}`,
            knowledgeBaseId: fileId,
            userId: user.id,
            chunkIndex: i,
            content: chunk.originalContent,
            topics: JSON.stringify(chunk.topics || []),
            concepts: JSON.stringify(chunk.concepts || []),
            facts: JSON.stringify(chunk.facts || []),
            upscSubjects: JSON.stringify(chunk.upscSubjects || []),
            difficulty: chunk.difficulty || 'Basic',
            summary: chunk.summary || '',
            createdAt: new Date().toISOString()
          })
        }
        
        // Update file status
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'completed', extractedChunks: processedChunks.length }
            : f
        ))
        
      } catch (error) {
        console.error('Error processing file:', error)
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'error' } : f
        ))
      }
    }
    
    setIsUploading(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'book': return <Book className="w-5 h-5" />
      case 'article': return <Newspaper className="w-5 h-5" />
      case 'note': return <StickyNote className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'book': return 'bg-blue-100 text-blue-800'
      case 'article': return 'bg-green-100 text-green-800'
      case 'note': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Base Upload</h1>
        <p className="text-gray-600">Upload books, articles, notes, and PDFs to build your personalized AI knowledge base</p>
      </div>

      {/* Category Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Content Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { type: 'book', label: 'Books', icon: Book, description: 'Textbooks, reference books' },
            { type: 'article', label: 'Articles', icon: Newspaper, description: 'News articles, journals' },
            { type: 'note', label: 'Notes', icon: StickyNote, description: 'Personal notes, summaries' },
            { type: 'pdf', label: 'PDFs', icon: FileText, description: 'Any PDF documents' }
          ].map(({ type, label, icon: Icon, description }) => (
            <button
              key={type}
              onClick={() => setSelectedCategory(type as any)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedCategory === type
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className={`w-8 h-8 mx-auto mb-2 ${
                selectedCategory === type ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <h3 className="font-medium text-gray-900">{label}</h3>
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
            id="knowledge-base-upload"
            disabled={isUploading}
          />
          <label htmlFor="knowledge-base-upload" className="cursor-pointer">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Upload {selectedCategory === 'book' ? 'Books' : selectedCategory === 'article' ? 'Articles' : selectedCategory === 'note' ? 'Notes' : 'PDFs'}
            </h3>
            <p className="text-gray-500 mb-4">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-sm text-gray-400">
              Supports PDF, DOC, DOCX, TXT files up to 50MB each
            </p>
          </label>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${getCategoryColor(file.type)}`}>
                    {getCategoryIcon(file.type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{file.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span className="capitalize">{file.type}</span>
                      {file.extractedChunks && (
                        <>
                          <span>•</span>
                          <span>{file.extractedChunks} chunks extracted</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {file.status === 'processing' && (
                    <>
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      <span className="text-sm text-blue-600">Processing...</span>
                    </>
                  )}
                  {file.status === 'completed' && (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-green-600">Completed</span>
                    </>
                  )}
                  {file.status === 'error' && (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-sm text-red-600">Error</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-1">Total Files</h3>
          <p className="text-2xl font-bold text-blue-600">{uploadedFiles.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-1">Processed</h3>
          <p className="text-2xl font-bold text-green-600">
            {uploadedFiles.filter(f => f.status === 'completed').length}
          </p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <h3 className="font-medium text-amber-900 mb-1">Total Chunks</h3>
          <p className="text-2xl font-bold text-amber-600">
            {uploadedFiles.reduce((sum, f) => sum + (f.extractedChunks || 0), 0)}
          </p>
        </div>
      </div>
    </div>
  )
}