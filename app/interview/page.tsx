'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Webcam from 'react-webcam';
import { InterviewReport, Round, UserResponse } from '../types/interview';
import useSpeechToText from 'react-hook-speech-to-text';

export default function Page(): JSX.Element {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('job_id');
  const roundId = searchParams.get('round_id');
  const email = searchParams.get('email') || 'candidate';

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

  // Add a ref to track when the current question started
  const questionStartTimeRef = useRef<number>(Date.now());
  
  // Track results for the current question only
  const [currentQuestionResults, setCurrentQuestionResults] = useState<any[]>([]);
  
  // Use speech-to-text hook
  const {
    error: speechError,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
    speechRecognitionProperties: {
      lang: 'en-US',
      interimResults: true,
    }
  });

  // Update current question results when results change
  useEffect(() => {
    // If we have new results, update our current question results
    if (results.length > 0) {
      setCurrentQuestionResults(results);
    }
  }, [results]);
  
  // Sync results from speech-to-text hook with our transcript state
  useEffect(() => {
    if (currentQuestionResults.length > 0) {
      // Create a fresh transcript from current question results only
      const transcript = currentQuestionResults.map(result =>
        typeof result === 'string' ? result : result.transcript
      ).join(' ');
      setCurrentTranscript(transcript);
    } else if (interimResult) {
      // Use interim result directly
      setCurrentTranscript(
        currentQuestionResults.length > 0 ?
          currentQuestionResults.map(result => typeof result === 'string' ? result : result.transcript).join(' ') + ' ' + interimResult :
          interimResult
      );
    }
  }, [currentQuestionResults, interimResult]);

  // Webcam reference
  const webcamRef = useRef(null);

  // Get round data
  useEffect(() => {
    const fetchRoundData = async (): Promise<void> => {
      if (!jobId || !roundId) {
        setError('Missing job ID or round ID');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/interview?job_id=${jobId}&interview_stage_id=${roundId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch round data');
        }

        const questions = await response.json();

        // Transform the API response to match the Round interface
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

        if (roundData.questions && roundData.questions.length > 0) {
          setRemainingTime(roundData.questions[0].time_limit_seconds);
        }

        // Check for saved responses in localStorage
        if (typeof window !== 'undefined') {
          const storageKey = `interview_responses_${jobId}_${roundId}_${email}`;
          const savedResponses = localStorage.getItem(storageKey);

          // if (savedResponses) {
          //   try {
          //     const parsedResponses = JSON.parse(savedResponses) as UserResponse[];
          //     if (Array.isArray(parsedResponses) && parsedResponses.length > 0) {
          //       setUserResponses(parsedResponses);

          //       // If there are saved responses, set the current question index to the next unanswered question
          //       if (parsedResponses.length < roundData.questions.length) {
          //         setCurrentQuestionIndex(parsedResponses.length);
          //         setRemainingTime(roundData.questions[parsedResponses.length].time_limit_seconds);
          //       } else {
          //         // All questions were answered
          //         setCurrentQuestionIndex(roundData.questions.length - 1);
          //         setInterviewComplete(true);
          //       }

          //       console.log('Restored saved responses:', parsedResponses.length);
          //     }
          //   } catch (err) {
          //     console.error('Failed to parse saved responses:', err);
          //   }
          // }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoundData();
  }, [jobId, roundId, email]);

  // Check permissions
  useEffect(() => {
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

        // Check speech recognition support
        if (speechError) {
          setError('Your browser does not support speech recognition. Please use Chrome, Edge, Safari, or Firefox.');
        }
      } catch (err) {
        const error = err as Error;
        if (error.name === 'NotAllowedError') {
          if (!cameraPermission) {
            setCameraPermission(false);
          }
          if (!microphonePermission) {
            setMicrophonePermission(false);
          }
        } else {
          setError(`Error accessing media devices: ${error.message}`);
        }
      }
    };

    checkPermissions();
  }, [speechError, cameraPermission, microphonePermission]);

  // Pause timer for thinking time
  useEffect(() => {
    // Skip on server-side rendering
    if (typeof window === 'undefined') return;

    let timer: NodeJS.Timeout;

    if (pauseState === 'thinking' && pauseTimer > 0) {
      timer = setInterval(() => {
        setPauseTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setPauseState('recording');
            startRecording(); // Use our updated function
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
            setPauseTimer(10); // 10 seconds to read the question
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pauseState, pauseTimer]);

  useEffect(() => {
    // Skip on server-side rendering
    if (typeof window === 'undefined') return;

    let timer: NodeJS.Timeout;

    if (isRecording && remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            stopRecording();

            // IMPORTANT: We've removed the saveResponse() call here to prevent duplication

            // Automatically move to next question after a short delay
            setTimeout(() => {
              // Use the existing moveToNextQuestion function which will save the response
              moveToNextQuestion();
            }, 1000); // Small delay before advancing

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording, remainingTime, currentQuestionIndex, round]);

  const startCamera = (): void => {
    setCameraActive(true);
    setPauseState('thinking');
    setPauseTimer(10); // 10 seconds to read the question
  };

  const startRecording = (): void => {
    // Reset for new question
    questionStartTimeRef.current = Date.now();
    setCurrentQuestionResults([]);
    setCurrentTranscript('');
    startSpeechToText();
  };

  const stopRecording = (): void => {
    stopSpeechToText();
  };

  const saveResponse = (): void => {
    if (round && round.questions[currentQuestionIndex]) {
      const currentQuestionId = round.questions[currentQuestionIndex].id;
      
      // Create new response with current data
      const newResponse: UserResponse = {
        questionId: currentQuestionId,
        questionText: round.questions[currentQuestionIndex].question_text,
        userAnswer: currentTranscript || 'No response recorded',
        timeSpent: round.questions[currentQuestionIndex].time_limit_seconds - remainingTime
      };

      // Add to userResponses state, replacing any existing response for the same question
      setUserResponses(prev => {
        // Check if we already have a response for this question
        const existingResponseIndex = prev.findIndex(r => r.questionId === currentQuestionId);
        
        let updatedResponses;
        if (existingResponseIndex >= 0) {
          // Replace the existing response
          updatedResponses = [...prev];
          updatedResponses[existingResponseIndex] = newResponse;
        } else {
          // Add a new response
          updatedResponses = [...prev, newResponse];
        }

        // Also save to localStorage as a backup
        try {
          if (typeof window !== 'undefined') {
            const storageKey = `interview_responses_${jobId}_${roundId}_${email}`;
            localStorage.setItem(storageKey, JSON.stringify(updatedResponses));
          }
        } catch (err) {
          console.error('Failed to save to localStorage:', err);
        }

        return updatedResponses;
      });

      // Reset current transcript
      setCurrentTranscript('');
    }
  };

  const moveToNextQuestion = (): void => {
    stopRecording();
    saveResponse(); // This will save the response once

    if (!round) return;

    if (currentQuestionIndex < round.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setRemainingTime(round.questions[nextIndex].time_limit_seconds);
      
      // Clear transcript and speech recognition results for the new question
      setCurrentTranscript('');
      setCurrentQuestionResults([]);
      questionStartTimeRef.current = Date.now();

      // Set pause timer between questions
      setPauseState('between');
      setPauseTimer(3); // 3 seconds between questions
    } else {
      // Last question completed
      setInterviewComplete(true);
    }
  };
  
  const analyzewithClaude = async (): Promise<void> => {
    if (!round || userResponses.length === 0) return;

    setAnalyzing(true);

    try {
      // Call the backend API to analyze responses
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

      if (!response.ok) {
        throw new Error('Failed to analyze responses');
      }

      const result = await response.json();

      // Create interview report
      const interviewReport: InterviewReport = {
        jobId: parseInt(jobId || '0'),
        roundId: parseInt(roundId || '0'),
        candidateResponses: userResponses,
        totalScore: result.totalScore,
        feedbackByCategory: result,
        overallFeedback: result.overallFeedback,
        timestamp: new Date().toISOString()
      };

      // Save to local storage just for client-side convenience
      localStorage.setItem(`interview_report_${jobId}_${roundId}`, JSON.stringify(interviewReport));

      // Redirect to a thank you page
      setAnalyzing(false);

      // Show a thank you message and don't display the full report
      if (typeof window !== 'undefined') {
        window.location.href = `/openings?success=true`;
      }

    } catch (err) {
      console.error('Error analyzing responses:', err);
      setError('Failed to analyze responses');
      setAnalyzing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (loading) {
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
                {formatTime(remainingTime)}
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
                  {round.questions[currentQuestionIndex].question_text}
                </h3>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {round.questions[currentQuestionIndex].time_limit_seconds} seconds
                  </span>
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {round.questions[currentQuestionIndex].marks} points
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
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">
                  <strong>Instructions:</strong> You'll have 10 seconds to read each question before recording starts automatically.
                </p>
                <p>
                  Speak clearly into your microphone. Your voice will be converted to text in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{currentQuestionIndex + 1} of {round.questions.length}</span>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${((currentQuestionIndex + 1) / round.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}