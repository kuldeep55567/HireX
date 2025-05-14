'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSession } from "next-auth/react"
// 1. First approach - The most reliable way
const Webcam = dynamic(
  () => import('react-webcam').then((mod) => {
    // Create a wrapper component that properly types the Webcam
    const WrappedWebcam: React.FC<{
      audio?: boolean;
      ref?: React.RefObject<any>;
      screenshotFormat?: 'image/webp' | 'image/png' | 'image/jpeg';
      videoConstraints?: {
        width: number;
        height: number;
        facingMode: string;
      };
      className?: string;
    }> = (props) => {
      const WebcamComponent = mod.default;
      return <WebcamComponent {...props} />;
    };
    return WrappedWebcam;
  }),
  {
    ssr: false,
    loading: () => <div className="text-white text-center p-4">Loading camera...</div>
  }
);

const useSpeechToText = (typeof window !== 'undefined') ?
  require('react-hook-speech-to-text').useSpeechToText :
  () => ({
    error: null,
    interimResult: '',
    isRecording: false,
    results: [],
    startSpeechToText: () => { },
    stopSpeechToText: () => { },
  });


type Round = {
  id: number;
  round_number: number;
  round_type: string;
  title: string;
  description: string;
  duration_minutes: number;
  questions: Question[];
};

type Question = {
  id: number;
  question_text: string;
  options?: string[];
  question_type: string;
  marks: number;
  time_limit_seconds: number;
  difficulty_level: string;
  expected_keywords?: string[];
};

type UserResponse = {
  questionId: number;
  questionText: string;
  userAnswer: string;
  timeSpent: number;
};

type InterviewReport = {
  jobId: number;
  roundId: number;
  candidateResponses: UserResponse[];
  totalScore: number;
  feedbackByCategory: any;
  overallFeedback: string;
  timestamp: string;
};

export default function InterviewPage(): JSX.Element {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('job_id');
  const roundId = searchParams.get('round_id');
  const { data: session } = useSession()
  const email = session?.user?.email;

  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [interviewComplete, setInterviewComplete] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [microphonePermission, setMicrophonePermission] = useState<boolean | null>(null);
  const [pauseState, setPauseState] = useState<'thinking' | 'recording' | 'between' | null>(null);
  const [pauseTimer, setPauseTimer] = useState<number>(0);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);

  // Refs
  const webcamRef = useRef(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const [currentQuestionResults, setCurrentQuestionResults] = useState<any[]>([]);

  // Initialize speech recognition only on client side
  const speechConfig = isClient ? {
    continuous: true,
    useLegacyResults: false,
    speechRecognitionProperties: {
      lang: 'en-US',
      interimResults: true,
    }
  } : null;

  const {
    error: speechError,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText?.(speechConfig) || {};

  // Set client flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update current question results when results change
  useEffect(() => {
    if (results && results.length > 0) {
      setCurrentQuestionResults(results);
    }
  }, [results]);

  // Sync results with transcript state
  useEffect(() => {
    if (!isClient) return;

    if (currentQuestionResults.length > 0) {
      const transcript = currentQuestionResults.map(result =>
        typeof result === 'string' ? result : result.transcript
      ).join(' ');
      setCurrentTranscript(transcript);
    } else if (interimResult) {
      setCurrentTranscript(
        currentQuestionResults.length > 0 ?
          currentQuestionResults.map(result => typeof result === 'string' ? result : result.transcript).join(' ') + ' ' + interimResult :
          interimResult
      );
    }
  }, [currentQuestionResults, interimResult, isClient]);

  // Get round data
  useEffect(() => {
    if (!isClient || !jobId || !roundId) return;

    const fetchRoundData = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/interview?job_id=${jobId}&interview_stage_id=${roundId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch interview data');
        }

        const questions = await response.json();

        if (!questions || questions.length === 0) {
          throw new Error('No questions found for this interview round');
        }

        const roundData: Round = {
          id: parseInt(roundId || '0'),
          round_number: 1,
          round_type: 'interview',
          title: 'Interview Round',
          description: 'Please answer the following questions',
          duration_minutes: 30,
          questions: questions.map((q: any) => ({
            id: q.id,
            question_text: q.question_text,
            options: q.options,
            question_type: q.question_type,
            marks: q.marks,
            time_limit_seconds: q.time_limit_seconds,
            difficulty_level: q.difficulty_level,
            expected_keywords: q.expected_keywords
          }))
        };

        setRound(roundData);

        // Initialize the interview state
        setCurrentQuestionIndex(0);
        setPauseState('thinking');
        setPauseTimer(10); // 10 seconds reading time

        // Set the time limit for the first question
        if (roundData.questions?.length > 0) {
          setRemainingTime(roundData.questions[0].time_limit_seconds);
        }
      } catch (err: any) {
        console.error('Error fetching interview data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoundData();
  }, [jobId, roundId, email, isClient]);

  // Check permissions
  useEffect(() => {
    if (!isClient) return;

    const checkPermissions = async (): Promise<void> => {
      try {
        // Check camera permission
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraPermission(true);
        cameraStream.getTracks().forEach(track => track.stop());

        // Check microphone permission
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicrophonePermission(true);
        audioStream.getTracks().forEach(track => track.stop());

        if (speechError) {
          setError('Your browser does not support speech recognition. Please use Chrome, Edge, Safari, or Firefox.');
        }
      } catch (err) {
        const error = err as Error;
        if (error.name === 'NotAllowedError') {
          if (!cameraPermission) setCameraPermission(false);
          if (!microphonePermission) setMicrophonePermission(false);
        } else {
          setError(`Error accessing media devices: ${error.message}`);
        }
      }
    };

    checkPermissions();
  }, [speechError, cameraPermission, microphonePermission, isClient]);

  // Timer effects
  useEffect(() => {
    if (!isClient) return;

    let timer: NodeJS.Timeout;

    if (pauseState === 'thinking' && pauseTimer > 0) {
      timer = setInterval(() => {
        setPauseTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setPauseState('recording');
            startRecording();
            // Start the question timer when reading time is over
            if (round && round.questions && round.questions[currentQuestionIndex]) {
              setRemainingTime(round.questions[currentQuestionIndex].time_limit_seconds);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (pauseState === 'between' && pauseTimer > 0) {
      timer = setInterval(() => {
        setPauseTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setPauseState('thinking');
            setPauseTimer(10);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pauseState, pauseTimer, isClient, round, currentQuestionIndex]);

  useEffect(() => {
    if (!isClient) return;

    let timer: NodeJS.Timeout;

    if (pauseState === 'recording' && remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            stopRecording();
            saveResponse();

            // Check if there are more questions
            if (round && currentQuestionIndex < round.questions.length - 1) {
              setPauseState('between');
              setPauseTimer(3); // 3 seconds between questions
            } else {
              setInterviewComplete(true);
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pauseState, remainingTime, currentQuestionIndex, round, isClient]);

  // Fix the between-questions timer
  useEffect(() => {
    if (!isClient) return;

    let timer: NodeJS.Timeout;

    if (pauseState === 'between' && pauseTimer > 0) {
      timer = setInterval(() => {
        setPauseTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            moveToNextQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pauseState, pauseTimer, isClient]);

  const startCamera = (): void => {
    setCameraActive(true);
    setPauseState('thinking');
    setPauseTimer(10);
  };

  const startRecording = (): void => {
    if (startSpeechToText) {
      questionStartTimeRef.current = Date.now();
      setCurrentQuestionResults([]);
      setCurrentTranscript('');
      startSpeechToText();
    }
  };

  const stopRecording = (): void => {
    if (stopSpeechToText) {
      stopSpeechToText();
    }
  };

  const saveResponse = (): void => {
    if (!round || !round.questions[currentQuestionIndex] || !isClient) return;

    const currentQuestionId = round.questions[currentQuestionIndex].id;

    const newResponse: UserResponse = {
      questionId: currentQuestionId,
      questionText: round.questions[currentQuestionIndex].question_text,
      userAnswer: currentTranscript || 'No response recorded',
      timeSpent: round.questions[currentQuestionIndex].time_limit_seconds - remainingTime
    };

    setUserResponses(prev => {
      const existingResponseIndex = prev.findIndex(r => r.questionId === currentQuestionId);
      const updatedResponses = existingResponseIndex >= 0
        ? [...prev.slice(0, existingResponseIndex), newResponse, ...prev.slice(existingResponseIndex + 1)]
        : [...prev, newResponse];

      try {
        const storageKey = `interview_responses_${jobId}_${roundId}_${email}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedResponses));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }

      return updatedResponses;
    });

    setCurrentTranscript('');
  };

  const moveToNextQuestion = (): void => {
    if (!round) return;

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < round.questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setCurrentTranscript('');
      setCurrentQuestionResults([]);
      questionStartTimeRef.current = Date.now();
      setPauseState('thinking');
      setPauseTimer(10); // 10 seconds to read next question
      setRemainingTime(round.questions[nextIndex].time_limit_seconds);
    } else {
      setInterviewComplete(true);
    }
  };
  const analyzewithClaude = async (): Promise<void> => {
    if (!round || userResponses.length === 0) return;

    setAnalyzing(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: userResponses,
          jobTitle: round.title || 'Interview',
          roundType: round.round_type || 'Technical',
          roundTitle: round.title || 'Interview',
          email: email,
          job_id: jobId,
          interview_stage_id: roundId
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze responses');

      const result = await response.json();
      const interviewReport: InterviewReport = {
        jobId: parseInt(jobId || '0'),
        roundId: parseInt(roundId || '0'),
        candidateResponses: userResponses,
        totalScore: result.totalScore,
        feedbackByCategory: result,
        overallFeedback: result.overallFeedback,
        timestamp: new Date().toISOString()
      };

      if (isClient) {
        localStorage.setItem(`interview_report_${jobId}_${roundId}`, JSON.stringify(interviewReport));
        window.location.href = `/openings?success=true`;
      }
    } catch (err) {
      console.error('Error analyzing responses:', err);
      setError('Failed to analyze responses');
    } finally {
      setAnalyzing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Render loading/error states
  if (!isClient || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
          <p className="text-gray-700 dark:text-gray-300">{error}</p>
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (cameraPermission === false || microphonePermission === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Permission Required</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            This interview requires access to your camera and microphone. Please enable permissions and refresh the page.
          </p>
          <ul className="list-disc pl-5 mb-6 text-gray-700 dark:text-gray-300">
            {cameraPermission === false && <li>Camera access is blocked</li>}
            {microphonePermission === false && <li>Microphone access is blocked</li>}
          </ul>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Interview not found
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            The requested interview round could not be found.
          </p>
        </div>
      </div>
    );
  }

  if (interviewComplete && analyzing) {
    // Show analyzing state
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mb-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Submitting Your Responses
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Submitting your interview answers. This may take a minute...
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (interviewComplete) {
    // Show interview completion screen
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">
            Interview Complete!
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Thank you for completing the {round.title}. Your responses have been recorded.
          </p>
          <div className="space-y-3">
            <button
              onClick={analyzewithClaude}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              disabled={analyzing}
            >
              Submit My Responses
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main interview interface
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 lg:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{round.title}</h1>
            <p className="text-gray-600 dark:text-gray-400">{round.description}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center">
            <div className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
              Question {currentQuestionIndex + 1} of {round.questions.length}
            </div>
            {pauseState === 'thinking' && (
              <div className="ml-4 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
                Reading Time: {pauseTimer}s
              </div>
            )}
            {pauseState === 'between' && (
              <div className="ml-4 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-medium">
                Next Question: {pauseTimer}s
              </div>
            )}
            {isRecording && (
              <div className="ml-4 text-gray-700 dark:text-gray-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Answering Time: {formatTime(remainingTime)}
              </div>
            )}
          </div>
        </div>

        {/* Main content - webcam and questions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - webcam */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <h2 className="font-medium text-gray-800 dark:text-white">Camera Preview</h2>
            </div>
            <div className="p-4">
              <div className="bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                {cameraActive ? (
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      width: 1280,
                      height: 720,
                      facingMode: "user"
                    }}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="text-white text-center p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400">Click "Start Interview" to begin.</p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {isRecording ? 'Recording in progress...' :
                      pauseState === 'thinking' ? 'Reading question...' :
                        pauseState === 'between' ? 'Preparing next question...' :
                          'Ready to start'}
                  </span>
                  <span className="flex items-center">
                    {isRecording && (
                      <span className="flex items-center mr-2">
                        <span className="h-3 w-3 bg-red-600 rounded-full animate-pulse mr-1"></span>
                        <span className="text-sm text-red-600 dark:text-red-400">REC</span>
                      </span>
                    )}
                  </span>
                </div>
                {/* And update the buttons section to remove the Next Question button: */}
                <div className="mt-2 flex space-x-2">
                  {!cameraActive && (
                    <button
                      onClick={startCamera}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Start Interview
                    </button>
                  )}
                  {isRecording && (
                    <p className="text-center w-full text-gray-500 dark:text-gray-400">
                      Your answer is being recorded. The interview will automatically proceed when the timer ends.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right column - question and response */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <h2 className="font-medium text-gray-800 dark:text-white">Current Question</h2>
            </div>
            <div className="p-4 flex-grow">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {round && round.questions && round.questions[currentQuestionIndex] ?
                    round.questions[currentQuestionIndex].question_text : 'Loading question...'}
                </h3>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {round && round.questions && round.questions[currentQuestionIndex] ?
                      round.questions[currentQuestionIndex].time_limit_seconds : 0} seconds
                  </span>
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {round && round.questions && round.questions[currentQuestionIndex] ?
                      round.questions[currentQuestionIndex].marks : 0} points
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex-grow">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Response (Speech-to-Text)
                </h3>
                {isRecording ? (
                  <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 min-h-[150px] max-h-[300px] overflow-y-auto">
                    {currentTranscript ? (
                      <>
                        <p>{currentTranscript}</p>
                        <span className="inline-block w-1 h-5 ml-1 bg-blue-500 animate-pulse"></span>
                      </>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 italic">Start speaking to see your answer here...</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 min-h-[150px] max-h-[300px] overflow-y-auto">
                    {currentTranscript ? (
                      <p>{currentTranscript}</p>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 italic">
                        {pauseState === 'thinking' ? 'Read the question carefully. Recording will start automatically...' :
                          pauseState === 'between' ? 'Preparing next question...' :
                            'Click "Start Interview" to begin.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="mb-2">
                    <strong>Instructions:</strong> You'll have 10 seconds to read each question before recording starts automatically.
                  </p>
                  <p>
                    Speak clearly into your microphone. Your voice will be converted to text in real-time.
                  </p>
                </div>
                {!interviewComplete && pauseState && (
                  <button
                    onClick={moveToNextQuestion}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    disabled={currentQuestionIndex === (round?.questions?.length || 0) - 1}
                  >
                    Next Question
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{currentQuestionIndex + 1} of {round && round.questions ? round.questions.length : '...'}</span>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${round && round.questions ? ((currentQuestionIndex + 1) / round.questions.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}