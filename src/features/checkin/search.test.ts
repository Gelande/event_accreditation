import { describe, it, expect } from 'vitest';
import { normalizeSearchString, filterParticipants } from './search';
import type { Participant } from './checkinTypes';

describe('search', () => {
  describe('normalizeSearchString', () => {
    it('lowercases and trims text', () => {
      expect(normalizeSearchString('  ALICE SMITH  ')).toBe('alice smith');
    });

    it('strips accents and diacritics', () => {
      expect(normalizeSearchString('João Gonçalves')).toBe('joao goncalves');
      expect(normalizeSearchString('Élise Müller')).toBe('elise muller');
      expect(normalizeSearchString('René François')).toBe('rene francois');
    });
  });

  describe('filterParticipants', () => {
    const mockParticipants: Participant[] = [
      {
        id: '1',
        name: 'João Gonçalves Silva',
        email: 'joao.silva@example.com',
        document_id: '12345678',
        created_at: '2026-09-17T00:00:00Z',
      },
      {
        id: '2',
        name: 'Maria Clara dos Santos',
        email: 'maria.santos@event.org',
        document_id: 'NIF-987654',
        created_at: '2026-09-17T00:00:00Z',
      },
      {
        id: '3',
        name: 'Élise Dubois',
        email: null,
        document_id: null,
        created_at: '2026-09-17T00:00:00Z',
      },
      {
        id: '4',
        name: 'Carlos Alberto Perez',
        email: 'carlos@empresa.pt',
        document_id: 'PT888999',
        created_at: '2026-09-17T00:00:00Z',
      },
    ];

    it('returns all participants when search query is empty or spaces', () => {
      expect(filterParticipants(mockParticipants, '')).toHaveLength(4);
      expect(filterParticipants(mockParticipants, '   ')).toHaveLength(4);
    });

    it('matches by name case-insensitively', () => {
      const results = filterParticipants(mockParticipants, 'MARIA');
      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('Maria Clara dos Santos');
    });

    it('matches by name with diacritic tolerance', () => {
      // Search unaccented "joao" matches accented "João"
      const resultsUnaccented = filterParticipants(mockParticipants, 'joao');
      expect(resultsUnaccented).toHaveLength(1);
      expect(resultsUnaccented[0]?.name).toBe('João Gonçalves Silva');

      // Search accented "élise" or "elise" matches "Élise"
      const resultsAccented = filterParticipants(mockParticipants, 'elise');
      expect(resultsAccented).toHaveLength(1);
      expect(resultsAccented[0]?.name).toBe('Élise Dubois');
    });

    it('matches by email', () => {
      const results = filterParticipants(mockParticipants, 'empresa.pt');
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('4');
    });

    it('matches by document ID', () => {
      const results = filterParticipants(mockParticipants, '987654');
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('2');
    });

    it('safely handles participants with null email or document_id', () => {
      const results = filterParticipants(mockParticipants, 'dubois');
      expect(results).toHaveLength(1);
      expect(results[0]?.name).toBe('Élise Dubois');
    });

    it('returns empty array when no participant matches', () => {
      const results = filterParticipants(mockParticipants, 'Nonexistent Person');
      expect(results).toHaveLength(0);
    });
  });
});
