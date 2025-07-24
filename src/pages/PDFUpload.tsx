import { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'

export default function PDFUpload() {
  const [uploadedFiles, setUploadedFiles] = useState([
    { id: '1', name: 'UPSC_Prelims_2023.pdf', status: 'completed', questions: 45, type: 'questions' },
    { id: '2', name: 'Economy_Notes.pdf', status: 'processing', questions: 0, type: 'notes' },
    { id: '3', name: 'Current_Affairs_Jan.pdf', status: 'pending', questions: 0, type: 'articles' },
  ])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      // Handle file upload logic here
      console.log('Files selected:', files)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">PDF Upload & Processing</h1>
        <p className="text-slate-600">Upload question papers, solutions, notes, and study materials</p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Drag and drop your PDFs here</h3>
            <p className="text-slate-600 mb-4">or click to browse files</p>
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
            </label>
            <p className="text-xs text-slate-500 mt-2">Supports: PDF files up to 50MB each</p>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium">{file.name}</h4>
                    <p className="text-sm text-slate-600">
                      {file.status === 'completed' && `${file.questions} questions extracted`}
                      {file.status === 'processing' && 'Processing with OCR...'}
                      {file.status === 'pending' && 'Waiting in queue...'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant={file.type === 'questions' ? 'default' : 'secondary'}>
                    {file.type}
                  </Badge>
                  {file.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {file.status === 'processing' && (
                    <div className="w-5 h-5">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {file.status === 'pending' && (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* OCR Features */}
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