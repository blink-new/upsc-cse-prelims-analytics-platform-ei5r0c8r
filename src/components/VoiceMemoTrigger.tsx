import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Mic, 
  MicOff, 
  Square, 
  Brain, 
  AlertCircle, 
  Target,
  X,
  Volume2
} from 'lucide-react';
import { blink } from '@/blink/client';

interface VoiceMemoTriggerProps {
  questionId: string;
  questionAttemptId: string;
  isCorrect: boolean;
  confidenceLevel: number;
  onComplete?: () => void;
}

const TRIGGER_CONDITIONS = {
  wrong_answer: {
    title: "Learn from this mistake",
    prompt: "What was your line of reasoning? Where do you think you went wrong?",
    icon: AlertCircle,
    color: "bg-red-500",
    description: "Recording a voice memo helps you understand your mistakes better"
  },
  low_confidence_correct: {
    title: "Reinforce your success", 
    prompt: "You got it right! What was your thought process?",
    icon: Target,
    color: "bg-green-500",
    description: "Even when correct, understanding your reasoning builds confidence"
  },
  high_confidence_wrong: {
    title: "Analyze overconfidence",
    prompt: "You were confident but got it wrong. What led to this mistake?",
    icon: Brain,
    color: "bg-orange-500",
    description: "Overconfidence errors are valuable learning opportunities"
  }
};

export default function VoiceMemoTrigger({ 
  questionId, 
  questionAttemptId, 
  isCorrect, 
  confidenceLevel, 
  onComplete 
}: VoiceMemoTriggerProps) {
  const [showTrigger, setShowTrigger] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [triggerType, setTriggerType] = useState<keyof typeof TRIGGER_CONDITIONS>('wrong_answer');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    // Determine if we should show the trigger
    let shouldTrigger = false;
    let type: keyof typeof TRIGGER_CONDITIONS = 'wrong_answer';

    if (!isCorrect) {
      // Wrong answer - always trigger
      shouldTrigger = true;
      type = confidenceLevel >= 4 ? 'high_confidence_wrong' : 'wrong_answer';
    } else if (isCorrect && confidenceLevel <= 2) {
      // Correct but low confidence - trigger to reinforce
      shouldTrigger = true;
      type = 'low_confidence_correct';
    }

    if (shouldTrigger) {
      setTriggerType(type);
      setShowTrigger(true);
    }
  }, [isCorrect, confidenceLevel]);

  const getPromptType = (type: keyof typeof TRIGGER_CONDITIONS): 'reasoning' | 'mistake_analysis' | 'next_time_strategy' => {
    switch (type) {
      case 'low_confidence_correct':
        return 'reasoning';
      case 'wrong_answer':
      case 'high_confidence_wrong':
        return 'mistake_analysis';
      default:
        return 'mistake_analysis';
    }
  };

  const processWithAI = async (memoId: string, transcription: string) => {
    try {
      // Get AI analysis of the voice memo
      const { text: aiAnalysis } = await blink.ai.generateText({
        prompt: `Analyze this UPSC student's voice memo about their answer:

Question was ${isCorrect ? 'CORRECT' : 'WRONG'} with confidence level ${confidenceLevel}/5.

Student's memo: "${transcription}"

Provide immediate feedback:
1. Summary of their thinking
2. Key concepts they missed or misunderstood
3. Logical errors in reasoning
4. Specific clarifications for UPSC context
5. Strategic hints for similar questions
6. Counterpoints to deepen understanding

Format as JSON with keys: summary, missingConcepts, logicErrors, clarifications, hints, counterpoints`,
        model: 'gpt-4o-mini'
      });

      let analysis;
      try {
        analysis = JSON.parse(aiAnalysis);
      } catch {
        analysis = {
          summary: aiAnalysis.substring(0, 500),
          missingConcepts: [],
          logicErrors: [],
          clarifications: aiAnalysis,
          hints: "Review the topic thoroughly",
          counterpoints: "Consider alternative perspectives"
        };
      }

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
        hints: analysis.hints,
        counterpoints: analysis.counterpoints,
        confidenceScore: 0.85
      });

      // Create flashcard for spaced repetition
      const flashcardId = `flashcard_${Date.now()}`;
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + 1);

      await blink.db.memo_flashcards.create({
        id: flashcardId,
        userId: (await blink.auth.me()).id,
        voiceMemoId: memoId,
        questionId,
        mistakeSummary: analysis.summary,
        userMemoSummary: transcription.substring(0, 200),
        aiCorrection: analysis.clarifications,
        nextReviewDate: nextReviewDate.toISOString(),
        reviewCount: 0,
        masteryLevel: 0
      });

    } catch (error) {
      console.error('Error processing with AI:', error);
    }
  };

  const processVoiceMemo = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
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
      await blink.db.voice_memos.create({
        id: memoId,
        userId: user.id,
        questionId,
        questionAttemptId,
        audioUrl: publicUrl,
        transcription,
        promptType: getPromptType(triggerType),
        durationSeconds: recordingTime
      });

      // Process with AI for immediate feedback
      await processWithAI(memoId, transcription);
      
      // Close trigger and notify completion
      setShowTrigger(false);
      onComplete?.();

    } catch (error) {
      console.error('Error processing voice memo:', error);
    } finally {
      setIsProcessing(false);
    }
  };

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
        await processVoiceMemo(audioBlob);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const skipMemo = () => {
    setShowTrigger(false);
    onComplete?.();
  };

  if (!showTrigger) return null;

  const trigger = TRIGGER_CONDITIONS[triggerType];

  return (
    <Dialog open={showTrigger} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${trigger.color}`}>
              <trigger.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>{trigger.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {trigger.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 font-medium text-sm">
              {trigger.prompt}
            </p>
          </div>

          {!isRecording && !isProcessing ? (
            <div className="flex flex-col gap-3">
              <Button 
                onClick={startRecording}
                className="bg-red-600 hover:bg-red-700 w-full"
              >
                <Mic className="h-4 w-4 mr-2" />
                Start Recording (30-60 seconds)
              </Button>
              
              <Button 
                variant="outline" 
                onClick={skipMemo}
                className="w-full"
              >
                Skip for now
              </Button>
            </div>
          ) : isRecording ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-600 font-medium">
                  Recording: {formatTime(recordingTime)}
                </span>
              </div>
              
              <Button onClick={stopRecording} variant="outline" className="w-full">
                <Square className="h-4 w-4 mr-2" />
                Stop Recording
              </Button>

              <div className="text-xs text-gray-500">
                Speak clearly about your thought process
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-600 font-medium">
                  Processing with AI...
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Transcribing and analyzing your memo
              </p>
            </div>
          )}

          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              Question {isCorrect ? 'Correct' : 'Incorrect'} • Confidence: {confidenceLevel}/5
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}