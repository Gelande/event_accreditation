export type TicketType = 'Star' | 'Constellation';

export interface Participant {
  id: string;
  name: string;
  email: string | null;
  document_id: string | null;
  ticket_type: TicketType;
  created_at: string;
}

export interface CheckIn {
  id: string;
  participant_id: string;
  checked_in_at: string;
  checked_in_by: string;
  undone_at: string | null;
  undone_by: string | null;
  created_at: string;
}

export type ActiveCheckInMap = Record<string, CheckIn>;
