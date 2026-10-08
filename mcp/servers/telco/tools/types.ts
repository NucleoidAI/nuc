// Define base types for our tool system
export interface Tool<T> {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required: readonly string[];
  };
  handler: (args: T) => Promise<InternalToolResponse>;
}

// Our internal tool response format
export interface InternalToolResponse {
  content: {
    type: string;
    text: string;
  }[];
  isError: boolean;
}

// Input types for each tool
export interface AddressToolInput {
  bbk_no: string;
}

export interface InventoryToolInput {
  bbk_no: string;
}

export interface ProductManagementSystemInput {
  speed_limit: string;
}

export interface AddressToBBKInput {
  address: string;
}

export interface PortAllocationInput {
  device_serial_number: string; // Device serial number
  bbk_no: string; // BBK number
  port_no: string; // Port number
  speed_limit: string; // Speed limit
}

export interface PortConnectionInput {
  assignment_id: string; // Port assignment ID
}

export interface ConfigurationInput {
  speed_profile: string; // Speed profile
  port_no: string; // Port number
  device_serial_number: string; // Device serial number
  hgw_serial_no: string; // HGW serial number
  device_card_no: string; // Device card number
  device_tid: string; // Device TID
  speed_limit: string; // Speed limit
}

export interface PortConnectionWithTechnicalSupportInput {
  assignment_id: string; // Port assignment ID
}

export interface SpeakerTranscript {
  id: string;
  transcript: string;
}

export interface MeetingHighlight {
  topic: string;
  highlights: string[];
}

export interface MeetingParticipant {
  id: string;
  name?: string;
}

export interface MeetingJudgement {
  variant?: string | null;
  meeting_summary?: number;
  next_steps?: number | null;
  topics?: number;
  highlights?: number;
  overall?: number;
  accuracy?: number;
  reasoning?: string;
}

export interface PcmToWavInput {
  directoryPath: string;
}

export interface TranscribeMeetingInput {
  directoryPath: string;
  includeSpeakerTranscripts?: boolean;
}

export interface SummarizeMeetingInput {
  summary_prompt?: string;
  transcript?: string;
}

export interface SummarizeMeetingBySpeakerInput {
  full_meeting_transcript?: string;
  speaker_transcripts?: SpeakerTranscript[];
}

export interface JudgeSummaryInput {
  transcript?: string;
  summary?: unknown;
  highlights?: MeetingHighlight[];
  next_steps?: string[];
  speaker_transcripts?: SpeakerTranscript[];
  variant?: string;
}

export interface PrepareMeetingAttachmentsInput {
  directoryPath: string;
  full_meeting_transcript?: string;
  speaker_transcripts?: SpeakerTranscript[];
  participants?: MeetingParticipant[];
  judgement?: MeetingJudgement;
  includeAudio?: boolean;
  maxTotalBytes?: number;
}

export interface ResolveParticipantsInput {
  content: unknown;
  participants: { id: string; name: string }[];
}

export interface TranslateInput {
  content: string;
  target_lang: string;
  source_lang?: string;
}

export interface PrepareEmailInput {
  template: string;
  meetingName?: string | null;
  meetingDate?: string | null;
  attendees?: string[] | null;
  summary?: string | null;
  highlights?: MeetingHighlight[] | null;
  next_steps?: string[] | null;
}
