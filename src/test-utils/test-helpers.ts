/**
 * Test Utilities and Helpers
 * Shared utilities for testing across the application
 */

import { SymptomLog } from '@/types'

/**
 * Creates a mock symptom log with default or custom values
 */
export function createMockSymptomLog(overrides?: Partial<SymptomLog>): SymptomLog {
  return {
    id: 'mock-log-id',
    date: { toDate: () => new Date('2024-01-15T00:00:00.000Z') } as any,
    flowLevel: 'medium',
    painLevel: 5,
    mood: 'neutral',
    energyLevel: 'medium',
    sleepHours: 7,
    symptoms: ['cramps', 'fatigue'],
    notes: 'Test note',
    ...overrides,
  }
}

/**
 * Creates an array of mock symptom logs
 */
export function createMockSymptomLogs(count: number): SymptomLog[] {
  return Array.from({ length: count }, (_, i) => 
    createMockSymptomLog({
      id: `log-${i}`,
      date: { toDate: () => new Date(2024, 0, i + 1) } as any,
    })
  )
}

/**
 * Creates a mock user profile
 */
export function createMockUserProfile(overrides?: any) {
  return {
    displayName: 'Test User',
    ageRange: '25-30',
    conditions: ['PCOS'],
    averageCycleLength: 28,
    lastPeriodStart: { toDate: () => new Date('2024-01-01') },
    ...overrides,
  }
}

/**
 * Creates a mock health report response
 */
export function createMockHealthReport(overrides?: any) {
  return {
    executiveSummary: 'Test summary',
    cycleInsights: {
      overallPattern: 'Regular pattern',
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
    recommendations: ['Track symptoms regularly'],
    questionsForDoctor: ['Should I be concerned about pain?'],
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
    ...overrides,
  }
}

/**
 * Mocks a successful Gemini API response
 */
export function mockGeminiSuccess(text: string) {
  return {
    ok: true,
    json: async () => ({
      candidates: [{
        content: {
          parts: [{ text }],
        },
      }],
    }),
  }
}

/**
 * Mocks a failed Gemini API response
 */
export function mockGeminiFailure(error: string) {
  return {
    ok: false,
    json: async () => ({
      error: { message: error },
    }),
  }
}

/**
 * Mocks a Firestore query snapshot
 */
export function mockFirestoreSnapshot(logs: any[]) {
  return {
    forEach: jest.fn((callback) => {
      logs.forEach((log, index) => {
        callback({
          id: log.id || `log-${index}`,
          data: () => log,
        })
      })
    }),
  }
}

/**
 * Waits for async operations to complete
 */
export function flushPromises() {
  return new Promise(resolve => setImmediate(resolve))
}

/**
 * Creates a mock NextRequest object
 */
export function createMockRequest(url: string, body: any) {
  return new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }) as any
}