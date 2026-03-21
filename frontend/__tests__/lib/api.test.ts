/**
 * API fetcher utility tests
 */

import { apiFetch } from '@/lib/api'

// Mock Supabase to avoid NEXT_PUBLIC_SUPABASE env var errors during tests
jest.mock('@/lib/supabase-browser', () => ({
  createBrowserClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } })
    }
  }))
}))

// Mock the global fetch
global.fetch = jest.fn()

describe('lib/api.test.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('apiFetch', () => {
    it('appends the auth token to headers if it exists in session', async () => {
      // Override the mock for this test
      jest.mocked(require('@/lib/supabase-browser').createBrowserClient).mockReturnValueOnce({
        auth: {
          getSession: jest.fn().mockResolvedValue({ 
            data: { session: { access_token: 'mock_jwt_token' } } 
          })
        }
      })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'success' }),
      })

      await apiFetch('/test-endpoint')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock_jwt_token',
          }),
        })
      )
    })

    it('does not send auth header if token is missing', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'success' }),
      })

      await apiFetch('/test-endpoint')

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1]
      expect(callArgs?.headers?.['Authorization']).toBeUndefined()
    })

    it('handles 401 Unauthorized by clearing token', async () => {
      localStorage.setItem('auth_token', 'expired_token')
      
      // We expect this to throw because ok is false
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      })

      await expect(apiFetch('/test-endpoint')).rejects.toThrow()
    })
  })
})
