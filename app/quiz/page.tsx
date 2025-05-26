'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from "next-auth/react"
type Question = {
  id: number;
  question_text: string;
  options: string[];
  correct_option_index: number;
  question_type: string;
  marks: number;
  time_limit_seconds: number;
  difficulty_level: string;
};

type Round = {
  id: number;
  round_number: number;
  round_type: string;
  title: string;
  description: string;
  duration_minutes: number;
  questions: Question[];
};

type UserResponse = {
  questionId: number;
  questionText: string;
  userAnswer: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  marks: number;
  timeSpent: number;
};

type QuizReport = {
  jobId: number;
  roundId: number;
  candidateResponses: UserResponse[];
  totalScore: number;
  maxPossibleScore: number;
  timestamp: string;
};

export default function QuizPage(): JSX.Element {
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
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [quizComplete, setQuizComplete] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);

  // Set client flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get round data
  useEffect(() => {
    if (!isClient || !jobId || !roundId) return;

    const fetchRoundData = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/interview?job_id=${jobId}&interview_stage_id=${roundId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch quiz data');
        }

        const questions = await response.json();

        if (!questions || questions.length === 0) {
          throw new Error('No questions found for this quiz');
        }

        const roundData: Round = {
          id: parseInt(roundId || '0'),
          round_number: 1,
          round_type: 'Quiz',
          title: questions[0].title,
          description: questions[0].description,
          duration_minutes: Math.ceil(questions.reduce((sum: number, q: any) => sum + q.time_limit_seconds, 0) / 60),
          questions: questions.map((q: any) => ({
            id: q.id,
            question_text: q.question_text,
            options: q.options,
            correct_option_index: q.correct_option_index,
            question_type: q.question_type,
            marks: q.marks,
            time_limit_seconds: q.time_limit_seconds,
            difficulty_level: q.difficulty_level
          }))
        };

        setRound(roundData);

        // Initialize the quiz state
        setCurrentQuestionIndex(0);
        
        // Set the time limit for the first question
        if (roundData.questions?.length > 0) {
          setRemainingTime(roundData.questions[0].time_limit_seconds);
        }
      } catch (err: any) {
        console.error('Error fetching quiz data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoundData();
  }, [jobId, roundId, email, isClient]);

  // Timer effect for question countdown
  useEffect(() => {
    if (!isClient || !round || remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Save response and move to next question automatically when time expires
          saveResponse();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [remainingTime, isClient, round]);

  const saveResponse = (): void => {
    if (!round || !round.questions[currentQuestionIndex] || !isClient) return;

    const currentQuestion = round.questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correct_option_index;
    const earnedMarks = isCorrect ? currentQuestion.marks : 0;

    const newResponse: UserResponse = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.question_text,
      userAnswer: selectedOption !== null ? currentQuestion.options[selectedOption] : 'No answer selected',
      selectedOptionIndex: selectedOption !== null ? selectedOption : -1,
      isCorrect: isCorrect,
      marks: earnedMarks,
      timeSpent: currentQuestion.time_limit_seconds - remainingTime
    };

    setUserResponses(prev => {
      const existingResponseIndex = prev.findIndex(r => r.questionId === currentQuestion.id);
      const updatedResponses = existingResponseIndex >= 0
        ? [...prev.slice(0, existingResponseIndex), newResponse, ...prev.slice(existingResponseIndex + 1)]
        : [...prev, newResponse];

      try {
        const storageKey = `quiz_responses_${jobId}_${roundId}_${email}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedResponses));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }

      return updatedResponses;
    });

    // Move to next question or complete quiz
    moveToNextQuestion();
  };

  const moveToNextQuestion = (): void => {
    if (!round) return;

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < round.questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setSelectedOption(null);
      setRemainingTime(round.questions[nextIndex].time_limit_seconds);
    } else {
      setQuizComplete(true);
    }
  };

  const selectOption = (index: number): void => {
    setSelectedOption(index);
  };

  const calculateTotalScore = (): number => {
    return userResponses.reduce((total, response) => total + response.marks, 0);
  };

  const calculateMaxPossibleScore = (): number => {
    if (!round) return 0;
    return round.questions.reduce((total, question) => total + question.marks, 0);
  };

  const submitQuiz = async (): Promise<void> => {
    if (!round || userResponses.length === 0) return;

    setAnalyzing(true);

    try {
      const quizReport: QuizReport = {
        jobId: parseInt(jobId || '0'),
        roundId: parseInt(roundId || '0'),
        candidateResponses: userResponses,
        totalScore: calculateTotalScore(),
        maxPossibleScore: calculateMaxPossibleScore(),
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: userResponses,
          jobTitle: round.title || 'Quiz',
          roundType: round.round_type || 'MCQ',
          roundTitle: round.title || 'Quiz',
          email: email,
          job_id: jobId,
          interview_stage_id: roundId,
          totalScore: calculateTotalScore(),
          maxPossibleScore: calculateMaxPossibleScore()
        }),
      });

      if (!response.ok) throw new Error('Failed to submit quiz responses');

      if (isClient) {
        localStorage.setItem(`quiz_report_${jobId}_${roundId}`, JSON.stringify(quizReport));
        window.location.href = `/openings?success=true`;
      }
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Failed to submit quiz responses');
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

  if (!round) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Quiz not found
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            The requested quiz could not be found.
          </p>
        </div>
      </div>
    );
  }

  if (quizComplete && analyzing) {
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
            Processing your quiz answers. This may take a moment...
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    // Show quiz completion screen
    const totalScore = calculateTotalScore();
    const maxScore = calculateMaxPossibleScore();
    const percentage = Math.round((totalScore / maxScore) * 100);
    
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
            Quiz Complete!
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
            You've completed the {round.title}.
          </p>
          
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-center mb-2">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalScore}</span>
              <span className="text-gray-600 dark:text-gray-400"> / {maxScore}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
              Score: {percentage}%
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={submitQuiz}
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

  // Main quiz interface
  return (
    <div className="min-h-screen dark:bg-background">
      <div className="max-w-3xl mx-auto p-4 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{round.title}</h1>
              <p className="text-gray-600 dark:text-gray-400">{round.description}</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                Question {currentQuestionIndex + 1} of {round.questions.length}
              </div>
              <div className="text-gray-700 dark:text-gray-300 flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(remainingTime)}
              </div>
            </div>
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Question */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              {round.questions[currentQuestionIndex].question_text}
            </h2>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
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
                {round.questions[currentQuestionIndex].marks} {round.questions[currentQuestionIndex].marks === 1 ? 'point' : 'points'}
              </span>
            </div>
          </div>

          {/* Options */}
          <div className="p-6">
            <div className="space-y-3">
              {round.questions[currentQuestionIndex].options.map((option, index) => (
                <div 
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    selectedOption === index 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400' 
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => selectOption(index)}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${
                      selectedOption === index 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {String.fromCharCode(65 + index)} {/* A, B, C, D, etc. */}
                    </div>
                    <span className={`${
                      selectedOption === index 
                        ? 'text-blue-700 dark:text-blue-300 font-medium' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {option}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Select an option and click Next, or wait for the timer to expire.</p>
            </div>
            <button
              onClick={saveResponse}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {currentQuestionIndex === round.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            </button>
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