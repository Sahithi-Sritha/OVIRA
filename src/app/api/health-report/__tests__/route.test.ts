/**
 * @jest-environment node
 */
import { POST } from '../route'
import { NextRequest } from 'next/server'

global.fetch = jest.fn()

describe('/api/health-report', () => {
  const mockUserProfile = {
    displayName: 'Test User',
    ageRange: '25-30',
    conditions: ['PCOS'],
    averageCycleLength: 28,
    lastPeriodStart: '2024-01-01T00:00:00.000Z',
  }

  const mockSymptomLog = {
    id: '1',
    date: '2024-01-15T00:00:00.000Z',
    flowLevel: 'medium' as const,
    painLevel: 5,
    mood: 'neutral' as const,
    energyLevel: 'medium' as const,
    sleepHours: 7,
    symptoms: ['cramps', 'fatigue'],
    notes: 'Feeling okay',
  }

  const mockValidReport = {
    executiveSummary: 'Patient shows regular menstrual patterns with moderate symptoms.',
    cycleInsights: {
      overallPattern: 'Regular 28-day cycle',
      averagePainLevel: 5.0,
      flowPatternDescription: 'Moderate flow',
      cycleRegularity: 'regular',
    },
    symptomAnalysis: {
      mostFrequentSymptoms: [{ symptom: 'cramps', count: 5, percentage: 50 }],
      painTrend: 'stable',
      moodPattern: 'Generally neutral',
      sleepQuality: 'Good',
      energyPattern: 'Moderate',
      notableCorrelations: [],
    },
    riskAssessment: [],
    recommendations: ['Maintain regular cycle tracking'],
    questionsForDoctor: ['Discuss pain management options'],
    lifestyleTips: ['Stay hydrated'],
    urgentFlags: [],
    generatedAt: new Date().toISOString(),
    periodStart: '2024-01-01',
    periodEnd: '2024-01-31',
    totalLogsAnalyzed: 10,
    patientInfo: {
      name: 'Test User',
      ageRange: '25-30',
      conditions: ['PCOS'],
      averageCycleLength: 28,
    },
    statistics: {
      totalLogs: 10,
      avgPain: 5.0,
      avgSleep: 7.0,
      heavyFlowDays: 2,
      lowEnergyDays: 3,
      poorMoodDays: 2,
      topSymptoms: ['cramps', 'fatigue'],
      moodCounts: { neutral: 10 },
      flowCounts: { medium: 10 },
      energyCounts: { medium: 10 },
      highPainDays: 3,
      flowDays: 5,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GEMINI_API_KEY = 'test-api-key'
  })

  describe('Request Validation', () => {
    it('should return 400 when logs are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({ userProfile: mockUserProfile }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('logs')
    })

    it('should return 400 when logs array is empty', async () => {
      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({ logs: [], userProfile: mockUserProfile }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('logs')
    })

    it('should return 400 when userProfile is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({ logs: [mockSymptomLog] }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('userProfile')
    })

    it('should accept valid request with minimal data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: JSON.stringify(mockValidReport) }] },
          }],
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({
          logs: [mockSymptomLog],
          userProfile: { displayName: 'User' },
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Fallback Response (No API Key)', () => {
    beforeEach(() => {
      delete process.env.GEMINI_API_KEY
    })

    it('should return fallback report when API key is missing', async () => {
      const logs = Array(5).fill(null).map((_, i) => ({
        ...mockSymptomLog,
        id: `log-${i}`,
        date: new Date(2024, 0, i + 1).toISOString(),
      }))

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({ logs, userProfile: mockUserProfile }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.executiveSummary).toBeDefined()
      expect(data.cycleInsights).toBeDefined()
      expect(data.symptomAnalysis).toBeDefined()
      expect(data.statistics).toBeDefined()
      expect(data.totalLogsAnalyzed).toBe(5)
    })

    it('should calculate statistics correctly in fallback', async () => {
      const logs = [
        { ...mockSymptomLog, id: '1', painLevel: 3, sleepHours: 8 },
        { ...mockSymptomLog, id: '2', painLevel: 7, sleepHours: 6 },
        { ...mockSymptomLog, id: '3', painLevel: 5, sleepHours: 7 },
      ]

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({ logs, userProfile: mockUserProfile }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.statistics.avgPain).toBe(5.0)
      expect(data.statistics.avgSleep).toBe(7.0)
      expect(data.statistics.totalLogs).toBe(3)
    })

    it('should identify high pain days in fallback', async () => {
      const logs = [
        { ...mockSymptomLog, id: '1', painLevel: 8 },
        { ...mockSymptomLog, id: '2', painLevel: 9 },
        { ...mockSymptomLog, id: '3', painLevel: 3 },
      ]

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({ logs, userProfile: mockUserProfile }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.statistics.highPainDays).toBe(2)
    })

    it('should count flow days correctly in fallback', async () => {
      const logs = [
        { ...mockSymptomLog, id: '1', flowLevel: 'heavy' as const },
        { ...mockSymptomLog, id: '2', flowLevel: 'medium' as const },
        { ...mockSymptomLog, id: '3', flowLevel: 'none' as const },
      ]

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({ logs, userProfile: mockUserProfile }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.statistics.flowDays).toBe(2)
      expect(data.statistics.heavyFlowDays).toBe(1)
    })

    it('should aggregate symptoms in fallback', async () => {
      const logs = [
        { ...mockSymptomLog, id: '1', symptoms: ['cramps', 'fatigue'] },
        { ...mockSymptomLog, id: '2', symptoms: ['cramps', 'headache'] },
        { ...mockSymptomLog, id: '3', symptoms: ['bloating'] },
      ]

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({ logs, userProfile: mockUserProfile }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.statistics.topSymptoms).toContain('cramps')
    })
  })

  describe('AI Integration (With API Key)', () => {
    it('should successfully generate report with AI', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: JSON.stringify(mockValidReport) }] },
          }],
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({
          logs: [mockSymptomLog],
          userProfile: mockUserProfile,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockValidReport)
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should include all user context in AI prompt', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: JSON.stringify(mockValidReport) }] },
          }],
        }),
      })

      const fullUserProfile = {
        displayName: 'Jane Doe',
        ageRange: '30-35',
        conditions: ['Endometriosis', 'PCOS'],
        averageCycleLength: 32,
        lastPeriodStart: '2024-01-01T00:00:00.000Z',
      }

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({
          logs: [mockSymptomLog],
          userProfile: fullUserProfile,
        }),
      })

      await POST(request)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)
      const promptText = requestBody.contents[0].parts[0].text

      expect(promptText).toContain('Jane Doe')
      expect(promptText).toContain('30-35')
      expect(promptText).toContain('Endometriosis')
      expect(promptText).toContain('PCOS')
    })

    it('should retry with second model on first failure', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Model error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{
              content: { parts: [{ text: JSON.stringify(mockValidReport) }] },
            }],
          }),
        })

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({
          logs: [mockSymptomLog],
          userProfile: mockUserProfile,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockValidReport)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should fall back to basic report when all AI models fail', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'All models failed' }),
      })

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({
          logs: [mockSymptomLog],
          userProfile: mockUserProfile,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.executiveSummary).toBeDefined()
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('should handle malformed JSON from AI', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: 'Not valid JSON' }] },
          }],
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({
          logs: [mockSymptomLog],
          userProfile: mockUserProfile,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      // Should fall back to generating report locally
    })
  })

  describe('Data Processing', () => {
    it('should handle logs with missing optional fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: JSON.stringify(mockValidReport) }] },
          }],
        }),
      })

      const minimalLog = {
        id: '1',
        date: '2024-01-15T00:00:00.000Z',
        flowLevel: 'medium' as const,
        painLevel: 5,
        mood: 'neutral' as const,
        energyLevel: 'medium' as const,
        sleepHours: 7,
      }

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({
          logs: [minimalLog],
          userProfile: mockUserProfile,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should handle large number of logs', async () => {
      const manyLogs = Array(100).fill(null).map((_, i) => ({
        ...mockSymptomLog,
        id: `log-${i}`,
        date: new Date(2024, 0, (i % 30) + 1).toISOString(),
      }))

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: JSON.stringify(mockValidReport) }] },
          }],
        }),
      })

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({
          logs: manyLogs,
          userProfile: mockUserProfile,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should handle all flow level types', async () => {
      delete process.env.GEMINI_API_KEY

      const logs = [
        { ...mockSymptomLog, id: '1', flowLevel: 'none' as const },
        { ...mockSymptomLog, id: '2', flowLevel: 'light' as const },
        { ...mockSymptomLog, id: '3', flowLevel: 'medium' as const },
        { ...mockSymptomLog, id: '4', flowLevel: 'heavy' as const },
      ]

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({ logs, userProfile: mockUserProfile }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.statistics.flowCounts).toEqual({
        none: 1,
        light: 1,
        medium: 1,
        heavy: 1,
      })
    })

    it('should handle all mood types', async () => {
      delete process.env.GEMINI_API_KEY

      const logs = [
        { ...mockSymptomLog, id: '1', mood: 'great' as const },
        { ...mockSymptomLog, id: '2', mood: 'good' as const },
        { ...mockSymptomLog, id: '3', mood: 'neutral' as const },
        { ...mockSymptomLog, id: '4', mood: 'bad' as const },
        { ...mockSymptomLog, id: '5', mood: 'terrible' as const },
      ]

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({ logs, userProfile: mockUserProfile }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.statistics.moodCounts).toEqual({
        great: 1,
        good: 1,
        neutral: 1,
        bad: 1,
        terrible: 1,
      })
    })

    it('should handle all energy level types', async () => {
      delete process.env.GEMINI_API_KEY

      const logs = [
        { ...mockSymptomLog, id: '1', energyLevel: 'high' as const },
        { ...mockSymptomLog, id: '2', energyLevel: 'medium' as const },
        { ...mockSymptomLog, id: '3', energyLevel: 'low' as const },
      ]

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({ logs, userProfile: mockUserProfile }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.statistics.energyCounts).toEqual({
        high: 1,
        medium: 1,
        low: 1,
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({
          logs: [mockSymptomLog],
          userProfile: mockUserProfile,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      // Should return fallback report
    })

    it('should handle invalid date formats gracefully', async () => {
      delete process.env.GEMINI_API_KEY

      const logsWithInvalidDate = [{
        ...mockSymptomLog,
        date: 'invalid-date',
      }]

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({
          logs: logsWithInvalidDate,
          userProfile: mockUserProfile,
        }),
      })

      const response = await POST(request)

      // Should handle gracefully and return report
      expect(response.status).toBe(200)
    })

    it('should handle extreme pain levels', async () => {
      delete process.env.GEMINI_API_KEY

      const logs = [
        { ...mockSymptomLog, id: '1', painLevel: 0 },
        { ...mockSymptomLog, id: '2', painLevel: 10 },
      ]

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({ logs, userProfile: mockUserProfile }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.statistics.avgPain).toBe(5.0)
    })

    it('should handle empty symptoms arrays', async () => {
      delete process.env.GEMINI_API_KEY

      const logs = [
        { ...mockSymptomLog, symptoms: [] },
        { ...mockSymptomLog, symptoms: undefined },
      ]

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({ logs, userProfile: mockUserProfile }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should handle missing user profile fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: JSON.stringify(mockValidReport) }] },
          }],
        }),
      })

      const minimalProfile = {
        displayName: 'User',
      }

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({
          logs: [mockSymptomLog],
          userProfile: minimalProfile,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Report Structure Validation', () => {
    it('should return all required report fields', async () => {
      delete process.env.GEMINI_API_KEY

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({
          logs: [mockSymptomLog],
          userProfile: mockUserProfile,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('executiveSummary')
      expect(data).toHaveProperty('cycleInsights')
      expect(data).toHaveProperty('symptomAnalysis')
      expect(data).toHaveProperty('riskAssessment')
      expect(data).toHaveProperty('recommendations')
      expect(data).toHaveProperty('questionsForDoctor')
      expect(data).toHaveProperty('lifestyleTips')
      expect(data).toHaveProperty('urgentFlags')
      expect(data).toHaveProperty('statistics')
      expect(data).toHaveProperty('patientInfo')
    })

    it('should have correct nested structure in cycleInsights', async () => {
      delete process.env.GEMINI_API_KEY

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({
          logs: [mockSymptomLog],
          userProfile: mockUserProfile,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.cycleInsights).toHaveProperty('overallPattern')
      expect(data.cycleInsights).toHaveProperty('averagePainLevel')
      expect(data.cycleInsights).toHaveProperty('flowPatternDescription')
      expect(data.cycleInsights).toHaveProperty('cycleRegularity')
    })

    it('should have correct nested structure in symptomAnalysis', async () => {
      delete process.env.GEMINI_API_KEY

      const request = new NextRequest('http://localhost:3000/api/health-report', {
        method: 'POST',
        body: JSON.stringify({
          logs: [mockSymptomLog],
          userProfile: mockUserProfile,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.symptomAnalysis).toHaveProperty('mostFrequentSymptoms')
      expect(data.symptomAnalysis).toHaveProperty('painTrend')
      expect(data.symptomAnalysis).toHaveProperty('moodPattern')
      expect(data.symptomAnalysis).toHaveProperty('sleepQuality')
      expect(data.symptomAnalysis).toHaveProperty('energyPattern')
    })
  })
})