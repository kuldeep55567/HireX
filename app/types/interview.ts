// types/interview.ts

export interface Question {
    id: number;
    question_text: string;
    options?: string[] | null;
    question_type: string;
    marks: number;
    time_limit_seconds: number;
    difficulty_level?: string;
    expected_keywords?: string[] | null;
  }
  
  export interface Round {
    id: number;
    job_id: number;
    round_number: number;
    round_type: string;
    title: string;
    description: string;
    duration_minutes: number;
    is_mandatory?: number;
    questions: Question[];
  }
  
  export interface UserResponse {
    questionId: number;
    questionText: string;
    userAnswer: string;
    timeSpent: number;
  }
  
  export interface FeedbackCategory {
    score: number;
    feedback: string;
  }
  
  export interface AnalysisResult {
    technicalKnowledge: FeedbackCategory;
    communicationSkills: FeedbackCategory;
    problemSolving: FeedbackCategory;
    relevantExperience: FeedbackCategory;
    culturalFit: FeedbackCategory;
    criticalThinking: FeedbackCategory;
    clarityOfThought: FeedbackCategory;
    completenessOfAnswers: FeedbackCategory;
    confidence: FeedbackCategory;
    overallImpression: FeedbackCategory;
    totalScore: number;
    overallFeedback: string;
  }
  
  export interface InterviewReport {
    id?: number;
    jobId: number;
    roundId: number;
    candidateId?: number;
    candidateResponses: UserResponse[];
    totalScore: number;
    feedbackByCategory: Record<string, FeedbackCategory>;
    overallFeedback: string;
    timestamp: string;
    status?: 'completed' | 'pending_review' | 'reviewed';
  }
  
  export interface InterviewSession {
    jobId: number;
    roundId: number;
    currentQuestionIndex: number;
    responses: UserResponse[];
    startTime: string;
    isComplete: boolean;
  }