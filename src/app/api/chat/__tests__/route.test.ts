/**
 * @jest-environment node
 */
import { POST } from '../route'
import { NextRequest } from 'next/server'

// Mock fetch globally for this test file
global.fetch = jest.fn()

describe('/api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variable
    process.env.GEMINI_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Request Validation', () => {
    it('should return 400 when message is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Message is required')
    })

    it('should return 400 when message is empty string', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: '' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Message is required')
    })

    it('should return 400 when message is null', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: null }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Message is required')
    })
  })

  describe('Fallback Responses (No API Key)', () => {
    beforeEach(() => {
      delete process.env.GEMINI_API_KEY
    })

    it('should return fallback response when API key is not configured', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Hello' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBeDefined()
      expect(typeof data.message).toBe('string')
      expect(data.message.length).toBeGreaterThan(0)
    })

    it('should return pain-related fallback for pain queries', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'I have severe cramps' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('pain')
      expect(data.message.toLowerCase()).toMatch(/pain|cramp|heat|relief/)
    })

    it('should return mood-related fallback for mood queries', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'I feel anxious before my period' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message.toLowerCase()).toMatch(/mood|pmdd|hormonal|self-care/)
    })

    it('should return cycle-related fallback for cycle queries', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Is my cycle normal?' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message.toLowerCase()).toMatch(/cycle|period|days|regular/)
    })

    it('should return default fallback for general queries', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Tell me about nutrition' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBeDefined()
      expect(data.message.toLowerCase()).toMatch(/health|track|symptom|provider/)
    })
  })

  describe('AI Integration (With API Key)', () => {
    const mockSuccessResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'This is a helpful response about women\'s health.',
              },
            ],
          },
        },
      ],
    }

    it('should successfully call Gemini API and return response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'What is a normal cycle length?' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('This is a helpful response about women\'s health.')
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should include conversation history in API call', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      })

      const history = [
        { role: 'user', content: 'Previous question' },
        { role: 'assistant', content: 'Previous answer' },
      ]

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Follow-up question',
          history,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(global.fetch).toHaveBeenCalled()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)
      expect(requestBody.contents).toHaveLength(5) // system + confirmation + history + current
    })

    it('should include user context in the prompt', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      })

      const userContext = {
        ageRange: '25-30',
        conditions: ['PCOS', 'Endometriosis'],
      }

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'What should I know?',
          userContext,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(global.fetch).toHaveBeenCalled()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)
      const systemMessage = requestBody.contents[0].parts[0].text

      expect(systemMessage).toContain('25-30')
      expect(systemMessage).toContain('PCOS')
      expect(systemMessage).toContain('Endometriosis')
    })

    it('should try multiple model names on failure', async () => {
      // First model fails
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Model not found' } }),
      })
      // Second model succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Test message' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('This is a helpful response about women\'s health.')
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should return fallback when all models fail', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'All models failed' } }),
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Test message' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBeDefined()
      expect(global.fetch).toHaveBeenCalledTimes(3) // Tries 3 different models
    })

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Test message' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBeDefined()
    })

    it('should handle malformed API responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [] }), // Empty candidates
      })
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Test message' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('API Key Handling', () => {
    it('should trim and clean API key', async () => {
      process.env.GEMINI_API_KEY = '  "test-key-with-quotes"  '

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: 'Response' }] },
          }],
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Test' }),
      })

      await POST(request)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const url = fetchCall[0]

      // Should not contain quotes or spaces
      expect(url).toContain('key=test-key-with-quotes')
      expect(url).not.toContain('"')
      expect(url).not.toContain(' ')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long messages', async () => {
      const longMessage = 'a'.repeat(10000)

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: 'Response to long message' }] },
          }],
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: longMessage }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should handle special characters in message', async () => {
      const specialMessage = 'Test with émojis 🩸💊 and spëcial chars!@#$%'

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: 'Response' }] },
          }],
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: specialMessage }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should handle empty history array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: 'Response' }] },
          }],
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test',
          history: [],
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: 'invalid json{',
      })

      // Should throw or return error
      await expect(POST(request)).rejects.toThrow()
    })
  })

  describe('Generation Config', () => {
    it('should use correct temperature and token settings', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: 'Response' }] },
          }],
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: 'Test' }),
      })

      await POST(request)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)

      expect(requestBody.generationConfig).toBeDefined()
      expect(requestBody.generationConfig.temperature).toBe(0.7)
      expect(requestBody.generationConfig.maxOutputTokens).toBe(1024)
    })
  })
})