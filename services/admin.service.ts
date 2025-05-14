// services/admin-api.ts

export interface Question {
    id: number;
    question_text: string;
    options: string[] | null;
    correct_option_index: number;
    difficulty_level: string;
    marks: number;
    time_limit_seconds: number;
    question_type: string;
    expected_keywords: string[] | null;
  }
  
  export interface Round {
    id: number;
    round_number: number;
    round_type: string;
    title: string;
    description: string;
    duration_minutes: number;
    questions: Question[];
  }
  
  export interface Job {
    id: number;
    job_title: string;
    department: string;
    experience_min: number;
    experience_max: number;
    notice_period_days: number;
    available_positions: number;
    round_number: number;
    total_applied: number;
    is_open: number;
    location: string;
    job_type: string;
    description: string;
    created_at: string;
    updated_at: string;
    rounds: Round[];
  }
  
  export interface ApiResponse {
    success: boolean;
    data: Job[];
    count: number;
  }
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_HOST;
  
  /**
   * Fetch all jobs with their rounds and questions
   */
  export async function fetchJobs(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/admin/jobs`);
    
    if (!response.ok) {
      throw new Error(`Error fetching jobs: ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * Fetch a single job by ID
   */
  export async function fetchJobById(jobId: number): Promise<Job> {
    const response = await fetch(`${API_BASE_URL}/api/admin/jobs/${jobId}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching job: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  }
  
  /**
   * Create a new job
   */
  export async function createJob(jobData: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'rounds'>) {
    const response = await fetch(`${API_BASE_URL}/api/openings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });
    
    if (!response.ok) {
      throw new Error(`Error creating job: ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * Update an existing job
   */
  export async function updateJob(jobId: number, jobData: Partial<Job>) {
    const response = await fetch(`${API_BASE_URL}/api/admin/jobs/${jobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });
    
    if (!response.ok) {
      throw new Error(`Error updating job: ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * Create a new interview round
   */
  export async function createRound(roundData: Omit<Round, 'id' | 'questions'>) {
    const response = await fetch(`${API_BASE_URL}/api/createRounds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roundData),
    });
    
    if (!response.ok) {
      throw new Error(`Error creating round: ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * Update an existing interview round
   */
  export async function updateRound(roundId: number, roundData: Partial<Round>) {
    const response = await fetch(`${API_BASE_URL}/api/admin/rounds/${roundId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roundData),
    });
    
    if (!response.ok) {
      throw new Error(`Error updating round: ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * Fetch questions for a specific interview round
   */
  export async function fetchQuestions(stageId: number) {
    const response = await fetch(`${API_BASE_URL}/api/questions?stage_id=${stageId}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching questions: ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * Create a new question
   */
  export async function createQuestion(questionData: Omit<Question, 'id'>) {
    const response = await fetch(`${API_BASE_URL}/api/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionData),
    });
    
    if (!response.ok) {
      throw new Error(`Error creating question: ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * Update an existing question
   */
  export async function updateQuestion(questionId: number, questionData: Partial<Question>) {
    const response = await fetch(`${API_BASE_URL}/api/admin/questions/${questionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionData),
    });
    
    if (!response.ok) {
      throw new Error(`Error updating question: ${response.status}`);
    }
    
    return await response.json();
  }