// TrackForm.test.jsx
//
// Assumes: vitest, @testing-library/react, @testing-library/jest-dom, jsdom
//   npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom
//
// Place this file next to TrackForm.jsx (e.g. src/components/TrackForm.test.jsx)
// so the relative mock paths ('../utils/...') line up. Adjust the import below
// if your file structure differs.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TrackForm from '../components/TrackForm';
import { supabase } from '../utils/supabaseClient';
import { validateForm } from '../utils/validation';

// ---- Mocks ----

vi.mock('../utils/supabaseClient', () => ({
  supabase: { auth: { getSession: vi.fn() } },
}));

vi.mock('../utils/validation', () => ({
  validateForm: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ---- Helpers ----

function renderForm() {
  return render(
    <MemoryRouter>
      <TrackForm />
    </MemoryRouter>
  );
}

function jsonResponse(body, ok = true, status = ok ? 200 : 500) {
  return { ok, status, json: async () => body };
}

/**
 * Builds a fetch mock from a lookup table keyed by "METHOD url-substring".
 * Records every call in `calls` for later assertions.
 */
function buildFetchMock(handlers, calls) {
  return vi.fn((url, options = {}) => {
    const method = options.method || 'GET';
    calls.push({ url, method, body: options.body });
    for (const { match, method: m, respond } of handlers) {
      if (url.includes(match) && (!m || m === method)) {
        return respond();
      }
    }
    return Promise.reject(new Error(`Unhandled fetch: ${method} ${url}`));
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  validateForm.mockReturnValue({}); // no validation errors by default
  supabase.auth.getSession.mockResolvedValue({
    data: { session: { access_token: 'fake-token' } },
    error: null,
  });
});

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));
}

// ---- Tests ----

describe('happy path', () => {
  it('calls all four endpoints as POST and triggers no rollback', async () => {
    const calls = [];
    global.fetch = buildFetchMock(
      [
        { match: '/api/submit', method: 'POST', respond: () => Promise.resolve(jsonResponse({ id: 1 })) },
        { match: '/api/cookies', method: 'POST', respond: () => Promise.resolve(jsonResponse({ cookie: 'abc' })) },
        { match: '/api/scrapper', method: 'POST', respond: () => Promise.resolve(jsonResponse({ seats: 5 })) },
        { match: '/api/track', method: 'POST', respond: () => Promise.resolve(jsonResponse({ tracked: true })) },
      ],
      calls
    );

    renderForm();
    submit();

    await waitFor(() => {
      expect(calls.filter((c) => c.method === 'POST')).toHaveLength(4);
    });
    expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
  });
});

describe('rollback behavior', () => {
  it('stops after /api/submit fails and needs no rollback (nothing succeeded yet)', async () => {
    const calls = [];
    global.fetch = buildFetchMock(
      [{ match: '/api/submit', respond: () => Promise.resolve(jsonResponse({ error: 'bad request' }, false, 400)) }],
      calls
    );

    renderForm();
    submit();

    await waitFor(() => expect(calls.length).toBeGreaterThan(0));
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ url: expect.stringContaining('/api/submit'), method: 'POST' });
  });

  it('rolls back /api/submit when /api/cookies fails', async () => {
    const calls = [];
    global.fetch = buildFetchMock(
      [
        { match: '/api/submit', method: 'POST', respond: () => Promise.resolve(jsonResponse({ id: 1 })) },
        { match: '/api/cookies', method: 'POST', respond: () => Promise.resolve(jsonResponse({ error: 'fail' }, false, 500)) },
        { match: '/api/submit', method: 'DELETE', respond: () => Promise.resolve(jsonResponse({ deleted: true })) },
      ],
      calls
    );

    renderForm();
    submit();

    await waitFor(() => {
      expect(calls).toContainEqual(expect.objectContaining({ url: expect.stringContaining('/api/submit'), method: 'DELETE' }));
    });
  });

  it('rolls back cookies then submit, in reverse order, when /api/scrapper throws a network error', async () => {
    const calls = [];
    global.fetch = buildFetchMock(
      [
        { match: '/api/submit', method: 'POST', respond: () => Promise.resolve(jsonResponse({ id: 1 })) },
        { match: '/api/cookies', method: 'POST', respond: () => Promise.resolve(jsonResponse({ cookie: 'abc' })) },
        { match: '/api/scrapper', method: 'POST', respond: () => Promise.reject(new Error('network down')) },
        { match: '/api/cookies', method: 'DELETE', respond: () => Promise.resolve(jsonResponse({ deleted: true })) },
        { match: '/api/submit', method: 'DELETE', respond: () => Promise.resolve(jsonResponse({ deleted: true })) },
      ],
      calls
    );

    renderForm();
    submit();

    await waitFor(() => {
      const deletes = calls.filter((c) => c.method === 'DELETE').map((c) => c.url);
      expect(deletes[0]).toContain('/api/cookies');
      expect(deletes[1]).toContain('/api/submit');
    });
  });
});

describe('known bugs (these fail against the current TrackForm.jsx)', () => {
  it('BUG: /api/scrapper returning an error status should trigger rollback, but the code never checks res3.ok', async () => {
    const calls = [];
    global.fetch = buildFetchMock(
      [
        { match: '/api/submit', method: 'POST', respond: () => Promise.resolve(jsonResponse({ id: 1 })) },
        { match: '/api/cookies', method: 'POST', respond: () => Promise.resolve(jsonResponse({ cookie: 'abc' })) },
        // Server returns a 500 with an error body, but current code treats it as success
        { match: '/api/scrapper', method: 'POST', respond: () => Promise.resolve(jsonResponse({ error: 'scrape failed' }, false, 500)) },
        { match: '/api/track', method: 'POST', respond: () => Promise.resolve(jsonResponse({ tracked: true })) },
      ],
      calls
    );

    renderForm();
    submit();

    await waitFor(() => expect(calls.length).toBeGreaterThanOrEqual(4));

    // Intended behavior: rollback should have fired (submit + cookies DELETE).
    // Current code: no .ok check on res3, so this fails.
    expect(calls.some((c) => c.method === 'DELETE')).toBe(true);
  });
});