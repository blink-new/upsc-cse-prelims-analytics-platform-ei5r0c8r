import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Brain, 
  MessageSquare, 
  Clock, 
  TrendingUp,
  BookOpen,
  Target,
  Lightbulb,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Volume2,
  FileText,
  Zap
} from 'lucide-react';
import { blink } from '@/blink/client';
import { aiService } from '@/lib/ai';

interface VoiceMemo {
  id: string;
  questionId: string;
  questionAttemptId: string;
  audioUrl: string;
  transcription: string;
  promptType: 'reasoning' | 'mistake_analysis' | 'next_time_strategy';
  durationSeconds: number;
  createdAt: string;
  aiFeedback?: AIFeedback;
  flashcard?: MemoFlashcard;
}

interface AIFeedback {
  id: string;
  aiSummary: string;
  missingConcepts: string[];
  logicErrors: string[];
  clarifications: string;
  hints: string;
  counterpoints: string;
  confidenceScore: number;
}

interface MemoFlashcard {
  id: string;
  mistakeSummary: string;
  userMemoSummary: string;
  aiCorrection: string;
  nextReviewDate: string;
  reviewCount: number;
  masteryLevel: number;
}

interface Question {
  id: string;
  text: string;
  topic: string;
  difficulty: string;
  correctAnswer: string;
}

const PROMPT_TYPES = {
  reasoning: {
    title: "Reasoning Process",
    prompt: "What was your line of reasoning for this question?",
    icon: Brain,
    color: "bg-blue-500"
  },
  mistake_analysis: {
    title: "Mistake Analysis", 
    prompt: "Where do you think you went wrong?",
    icon: AlertCircle,
    color: "bg-red-500"
  },
  next_time_strategy: {
    title: "Next Time Strategy",
    prompt: "What will you do differently next time?",
    icon: Target,
    color: "bg-green-500"
  }
};

export default function VoiceMemos() {
  const [memos, setMemos] = useState<VoiceMemo[]>([]);
  const [flashcards, setFlashcards] = useState<MemoFlashcard[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedPromptType, setSelectedPromptType] = useState<keyof typeof PROMPT_TYPES>('reasoning');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [playingMemoId, setPlayingMemoId] = useState<string | null>(null);
  const [processingAI, setProcessingAI] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [selectedMemoForRevision, setSelectedMemoForRevision] = useState<VoiceMemo | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const processWithAI = async (memoId: string, transcription: string) => {
    try {
      setProcessingAI(memoId);

      // Get question context for better analysis
      const questionContext = questions.find(q => q.id === selectedQuestionId);

      // Use Qwen API through secure edge function for AI analysis
      const analysis = await aiService.analyzeVoiceMemo(
        transcription, 
        questionContext, 
        false // We don't know if it's correct without more context
      );

      // Save AI feedback
      const feedbackId = `feedback_${Date.now()}`;
      await blink.db.ai_memo_feedback.create({
        id: feedbackId,
        voiceMemoId: memoId,
        userId: (await blink.auth.me()).id,
        aiSummary: analysis.summary,
        missingConcepts: JSON.stringify(analysis.missingConcepts || []),
        logicErrors: JSON.stringify(analysis.logicErrors || []),
        clarifications: analysis.clarifications,
        hints: analysis.recommendations?.join('; ') || 'Continue practicing',
        counterpoints: analysis.counterpoints,
        confidenceScore: analysis.confidenceScore || 0.85
      });

      // Create flashcard for spaced repetition
      const flashcardId = `flashcard_${Date.now()}`;
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + 1); // Review tomorrow

      await blink.db.memo_flashcards.create({
        id: flashcardId,
        userId: (await blink.auth.me()).id,
        voiceMemoId: memoId,
        questionId: selectedQuestionId,
        mistakeSummary: analysis.summary,
        userMemoSummary: transcription.substring(0, 200),
        aiCorrection: analysis.clarifications,
        nextReviewDate: nextReviewDate.toISOString(),
        reviewCount: 0,
        masteryLevel: 0
      });

    } catch (error) {
      console.error('Error processing with AI:', error);
    } finally {
      setProcessingAI(null);
    }
  };

  const uploadAndProcessMemo = async (audioBlob: File | Blob) => {
    try {
      const user = await blink.auth.me();
      
      // Upload audio file
      const { publicUrl } = await blink.storage.upload(
        audioBlob as File,
        `voice-memos/${user.id}/${Date.now()}.wav`,
        { upsert: true }
      );

      // Transcribe audio using AI
      const audioBuffer = await audioBlob.arrayBuffer();
      const { text: transcription } = await blink.ai.transcribeAudio({
        audio: new Uint8Array(audioBuffer),
        language: 'en'
      });

      // Create voice memo record
      const memoId = `memo_${Date.now()}`;
      const memo = await blink.db.voice_memos.create({
        id: memoId,
        userId: user.id,
        questionId: selectedQuestionId,
        questionAttemptId: `attempt_${Date.now()}`, // This should come from actual test session
        audioUrl: publicUrl,
        transcription,
        promptType: selectedPromptType,
        durationSeconds: recordingTime
      });

      // Process with AI for feedback
      await processWithAI(memoId, transcription);

    } catch (error) {
      console.error('Error uploading and processing memo:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await blink.auth.me();
      
      // Load voice memos with AI feedback
      const memosData = await blink.db.voice_memos.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });

      // Load AI feedback for each memo
      const memosWithFeedback = await Promise.all(
        memosData.map(async (memo) => {
          const feedback = await blink.db.ai_memo_feedback.list({
            where: { voiceMemoId: memo.id },
            limit: 1
          });

          const flashcard = await blink.db.memo_flashcards.list({
            where: { voiceMemoId: memo.id },
            limit: 1
          });

          return {
            ...memo,
            aiFeedback: feedback[0] || null,
            flashcard: flashcard[0] || null
          };
        })
      );

      setMemos(memosWithFeedback);

      // Load flashcards due for review
      const flashcardsData = await blink.db.memo_flashcards.list({
        where: { 
          userId: user.id,
          nextReviewDate: { lte: new Date().toISOString() }
        },
        orderBy: { nextReviewDate: 'asc' }
      });

      setFlashcards(flashcardsData);

      // Load questions for context
      const questionsData = await blink.db.questions.list({
        limit: 100,
        orderBy: { createdAt: 'desc' }
      });

      setQuestions(questionsData);

    } catch (error) {
      console.error('Error loading voice memo data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await uploadAndProcessMemo(audioBlob);
        await loadData(); // Reload data after processing
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const playMemo = (memo: VoiceMemo) => {
    if (playingMemoId === memo.id) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingMemoId(null);
    } else {
      // Start playing
      if (audioRef.current) {
        audioRef.current.src = memo.audioUrl;
        audioRef.current.play();
        setPlayingMemoId(memo.id);
        
        audioRef.current.onended = () => {
          setPlayingMemoId(null);
        };
      }
    }
  };

  const openRevisionDialog = (memo: VoiceMemo) => {
    setSelectedMemoForRevision(memo);
    setRevisionNotes('');
    setShowRevisionDialog(true);
  };

  const submitRevision = async () => {
    if (!selectedMemoForRevision) return;

    try {
      const user = await blink.auth.me();
      
      await blink.db.memo_revisions.create({
        id: `revision_${Date.now()}`,
        originalMemoId: selectedMemoForRevision.id,
        userId: user.id,
        updatedTranscription: revisionNotes,
        userAgreementStatus: 'updated',
        revisionNotes
      });

      setShowRevisionDialog(false);
      await loadData();
    } catch (error) {
      console.error('Error submitting revision:', error);
    }
  };

  const reviewFlashcard = async (flashcard: MemoFlashcard, masteryLevel: number) => {
    try {
      // Calculate next review date based on spaced repetition
      const nextReviewDate = new Date();
      const intervals = [1, 3, 7, 14, 30]; // days
      const intervalIndex = Math.min(flashcard.reviewCount, intervals.length - 1);
      nextReviewDate.setDate(nextReviewDate.getDate() + intervals[intervalIndex]);

      await blink.db.memo_flashcards.update(flashcard.id, {
        reviewCount: flashcard.reviewCount + 1,
        masteryLevel,
        nextReviewDate: nextReviewDate.toISOString()
      });

      await loadData();
    } catch (error) {
      console.error('Error reviewing flashcard:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading voice memos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Voice Memo Reinforcement</h1>
          <p className="text-gray-600 mt-2">Capture your thought process and get AI-powered learning insights</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {memos.length} Memos • {flashcards.length} Due for Review
        </Badge>
      </div>

      <Tabs defaultValue="record" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="record">Record New</TabsTrigger>
          <TabsTrigger value="memos">My Memos</TabsTrigger>
          <TabsTrigger value="flashcards">Review Cards</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Record Voice Memo
              </CardTitle>
              <CardDescription>
                Record your thought process after answering a question to get personalized AI feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Question</label>
                  <Select value={selectedQuestionId} onValueChange={setSelectedQuestionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a question" />
                    </SelectTrigger>
                    <SelectContent>
                      {questions.map((question) => (
                        <SelectItem key={question.id} value={question.id}>
                          {question.text.substring(0, 60)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Prompt Type</label>
                  <Select value={selectedPromptType} onValueChange={(value: keyof typeof PROMPT_TYPES) => setSelectedPromptType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROMPT_TYPES).map(([key, type]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedPromptType && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    {PROMPT_TYPES[selectedPromptType].prompt}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center space-x-4">
                {!isRecording ? (
                  <Button 
                    onClick={startRecording} 
                    disabled={!selectedQuestionId}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-600 font-medium">
                        Recording: {formatTime(recordingTime)}
                      </span>
                    </div>
                    <Button onClick={stopRecording} variant="outline">
                      <Square className="h-4 w-4 mr-2" />
                      Stop Recording
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-center text-sm text-gray-500">
                Recommended: 30-60 seconds for best AI analysis
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memos" className="space-y-4">
          {memos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No voice memos yet. Record your first memo to get started!</p>
              </CardContent>
            </Card>
          ) : (
            memos.map((memo) => (
              <Card key={memo.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${PROMPT_TYPES[memo.promptType].color}`}>
                        {React.createElement(PROMPT_TYPES[memo.promptType].icon, { className: "h-4 w-4 text-white" })}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {PROMPT_TYPES[memo.promptType].title}
                        </CardTitle>
                        <CardDescription>
                          {formatTime(memo.durationSeconds)} • {new Date(memo.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => playMemo(memo)}
                      >
                        {playingMemoId === memo.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRevisionDialog(memo)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Your Transcription:</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {memo.transcription}
                    </p>
                  </div>

                  {memo.aiFeedback && (
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-4 w-4 text-blue-600" />
                        <h4 className="font-medium">AI Analysis</h4>
                        <Badge variant="secondary">
                          {Math.round(memo.aiFeedback.confidenceScore * 100)}% confidence
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h5 className="text-sm font-medium text-gray-600">Summary:</h5>
                          <p className="text-sm text-gray-700">{memo.aiFeedback.aiSummary}</p>
                        </div>

                        {memo.aiFeedback.missingConcepts.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-600">Missing Concepts:</h5>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {memo.aiFeedback.missingConcepts.map((concept, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {concept}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <h5 className="text-sm font-medium text-gray-600">AI Clarifications:</h5>
                          <p className="text-sm text-gray-700">{memo.aiFeedback.clarifications}</p>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-600">Hints for Next Time:</h5>
                          <p className="text-sm text-gray-700">{memo.aiFeedback.hints}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {processingAI === memo.id && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Processing with AI...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="flashcards" className="space-y-4">
          {flashcards.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No flashcards due for review. Great job staying on top of your learning!</p>
              </CardContent>
            </Card>
          ) : (
            flashcards.map((flashcard) => (
              <Card key={flashcard.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Review Flashcard</CardTitle>
                    <Badge variant="outline">
                      Review #{flashcard.reviewCount + 1}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Your Original Thinking:</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {flashcard.userMemoSummary}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">What You Missed:</h4>
                    <p className="text-gray-700 bg-red-50 p-3 rounded-lg border-l-4 border-red-400">
                      {flashcard.mistakeSummary}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">AI Correction:</h4>
                    <p className="text-gray-700 bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                      {flashcard.aiCorrection}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-gray-600">How well do you understand this now?</span>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <Button
                          key={level}
                          variant={level <= 2 ? "destructive" : level <= 3 ? "outline" : "default"}
                          size="sm"
                          onClick={() => reviewFlashcard(flashcard, level)}
                        >
                          {level}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Memos Recorded</span>
                    <span className="font-medium">{memos.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">AI Feedback Received</span>
                    <span className="font-medium">{memos.filter(m => m.aiFeedback).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Flashcards Created</span>
                    <span className="font-medium">{memos.filter(m => m.flashcard).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Time Investment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Recording Time</span>
                    <span className="font-medium">
                      {formatTime(memos.reduce((sum, memo) => sum + memo.durationSeconds, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg. Memo Length</span>
                    <span className="font-medium">
                      {memos.length > 0 ? formatTime(Math.round(memos.reduce((sum, memo) => sum + memo.durationSeconds, 0) / memos.length)) : '0:00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Mastery Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">High Mastery Cards</span>
                    <span className="font-medium text-green-600">
                      {memos.filter(m => m.flashcard && m.flashcard.masteryLevel >= 4).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Need Review</span>
                    <span className="font-medium text-red-600">
                      {flashcards.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revise Your Memo</DialogTitle>
            <DialogDescription>
              Do you still agree with your original thinking? Update your memo if your understanding has changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMemoForRevision && (
              <div>
                <h4 className="font-medium mb-2">Original Memo:</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
                  {selectedMemoForRevision.transcription}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Updated Thoughts:</label>
              <Textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="What would you say differently now?"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={submitRevision}>
                Save Revision
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}