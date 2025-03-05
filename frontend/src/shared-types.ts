export interface FieldInfo {
  name: string;
  type: string;
  required: boolean;
}

export interface MessageTypeDescription {
  name: string;
  fields?: FieldInfo[];
}

export interface Message {
  type: string;
  message: object;
  recipient: string | null;
  sender: string | null;
  drop?: boolean;
  timestamp: number;
  id: number; // python object id
}

export interface MessageHistoryState {
  current_session: number;
  message_history: MessageHistoryMap;
}

export interface MessageHistoryMap {
  [sessionId: number]: MessageHistory;
}

export interface ScoreResult {
  passed: boolean;
  first_timestamp: number | undefined;
  expected?: string;
  actual?: string;
}

export interface MessageHistory {
  messages: Message[];
  current_session_reset_from?: number;
  next_session_starts_at?: number;
  current_session_score?: ScoreResult;
}

export interface LogMessage {
  message: string;
  level: string;
  name: string;
  time: number;
}

export type AgentName = string;

export type GenericMessage = {
  [key: string]: unknown;
};

export interface AnnotationState {
  name: string;
  description: string;
  tags?: string[];
}

export interface MessageAnnotation {
  annotations?: AnnotationState[];
  timestamp: number;
}

export interface ErrorSpan {
  error: string;
  start_index: number;
  end_index: number;
  quote: string;
  explanation: string;
}

export interface ErrorSummary {
  summary: string;
  tags: ErrorSpan[];
}

export interface AgentConfig {
  [key: string]: string;
}

export interface TaskInfo {
  prompt: string;
  expected_answer: string;
  annotator_steps: string;
}

export interface CurrentStudyTasks {
  current_task: string;
  all_tasks: { [key: string]: TaskInfo };
}

export type colorOption = "none" | "type" | "sender" | "recipient";

export type ResetMap = { [key: number]: number };
