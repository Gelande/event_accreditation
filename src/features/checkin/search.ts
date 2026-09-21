import type { Participant } from './checkinTypes';

/**
 * Normalizes text for search matching:
 * - Decomposes unicode characters into base letters + diacritical marks
 * - Strips combining diacritical marks (e.g., 'ã' -> 'a', 'é' -> 'e', 'ç' -> 'c')
 * - Converts to lower case
 * - Trims leading and trailing whitespace
 */
export function normalizeSearchString(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Filters participants in memory by matching the normalized query against:
 * - name (diacritic-tolerant, case-insensitive, partial match)
 * - email (case-insensitive, partial match)
 * - document_id (case-insensitive, partial match)
 * - ticket_type (case-insensitive, partial match)
 *
 * Does not make network requests.
 */
export function filterParticipants(
  participants: Participant[],
  query: string,
): Participant[] {
  const normalizedQuery = normalizeSearchString(query);

  if (!normalizedQuery) {
    return participants;
  }

  return participants.filter((participant) => {
    const nameMatch = normalizeSearchString(participant.name).includes(normalizedQuery);
    const emailMatch = participant.email
      ? normalizeSearchString(participant.email).includes(normalizedQuery)
      : false;
    const documentMatch = participant.document_id
      ? normalizeSearchString(participant.document_id).includes(normalizedQuery)
      : false;
    const ticketMatch = participant.ticket_type
      ? normalizeSearchString(participant.ticket_type).includes(normalizedQuery)
      : false;

    return nameMatch || emailMatch || documentMatch || ticketMatch;
  });
}
