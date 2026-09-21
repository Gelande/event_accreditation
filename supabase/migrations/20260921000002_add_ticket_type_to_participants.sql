-- Migration: 20260921000002_add_ticket_type_to_participants.sql
-- Description: Add ticket_type ('Star' | 'Constellation') to participants table

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS ticket_type text NOT NULL DEFAULT 'Star'
  CHECK (ticket_type IN ('Star', 'Constellation'));

CREATE INDEX IF NOT EXISTS participants_ticket_type_idx
  ON public.participants (ticket_type);
