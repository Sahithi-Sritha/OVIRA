import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import HealthReportPage from '../page'
import { useAuth } from '@/contexts/auth-context'
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore'

// Mock the auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}))

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
}))

// Mock the firebase config
jest.mock('@/lib/firebase/firebase', () => ({
  db: {},
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>
})

// Mock UI components
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, isLoading, disabled, leftIcon }: any) => (
    <button onClick={onClick} disabled={disabled || isLoading}>
      {leftIcon}
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  FileText: () => <span>FileText</span>,
  ArrowLeft: () => <span>ArrowLeft</span>,
  AlertTriangle: () => <span>AlertTriangle</span>,
  AlertCircle: () => <span>AlertCircle</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  Calendar: () => <span>Calendar</span>,
  TrendingUp: () => <span>TrendingUp</span>,
  TrendingDown: () => <span>TrendingDown</span>,
  Minus: () => <span>Minus</span>,
  Loader2: () => <span>Loader2</span>,
  Heart: () => <span>Heart</span>,
  Moon: () => <span>Moon</span>,
  Zap: () => <span>Zap</span>,
  Droplets: () => <span>Droplets</span>,
  Brain: () => <span>Brain</span>,
  Stethoscope: () => <span>Stethoscope</span>,
  ClipboardList: () => <span>ClipboardList</span>,
  Lightbulb: () => <span>Lightbulb</span>,
  MessageSquare: () => <span>MessageSquare</span>,
  Activity: () => <span>Activity</span>,
  User: () => <span>User</span>,
  Clock: () => <span>Clock</span>,
  Printer: () => <span>Printer</span>,
}))

describe('HealthReportPage', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
  }

  const mockUserProfile = {
    displayName: 'Test User',
    ageRange: '25-30',
    conditions: ['PCOS'],
    averageCycleLength: 28,
    lastPeriodStart: { toDate: () => new Date('2024-01-01') },
  }

  const mockLog = {
    id: 'log-1',
    date: { toDate: () => new Date('2024-01-15') },
    flowLevel: 'medium',
    painLevel: 5,
    mood: 'neutral',
    energyLevel: 'medium',
    sleepHours: 7,
    symptoms: ['cramps', 'fatigue'],
    notes: 'Test note',
  }

  const mockReport = {
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
      notableCorrelations: ['High pain correlates with heavy flow'],
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
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      userProfile: mockUserProfile,
    })
  })

  describe('Initial Loading', () => {
    it('should show loading spinner initially', () => {
      ;(getDocs as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<HealthReportPage />)

      expect(screen.getByText('Loader2')).toBeInTheDocument()
    })

    it('should fetch logs on mount', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({ id: 'log-1', data: () => mockLog })
        }),
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockSnapshot)

      render(<HealthReportPage />)

      await waitFor(() => {
        expect(collection).toHaveBeenCalled()
        expect(query).toHaveBeenCalled()
        expect(getDocs).toHaveBeenCalled()
      })
    })
  })

  describe('No Logs State', () => {
    it('should show "No Symptom Logs Yet" message when no logs', async () => {
      const mockSnapshot = {
        forEach: jest.fn(),
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockSnapshot)

      render(<HealthReportPage />)

      await waitFor(() => {
        expect(screen.getByText('No Symptom Logs Yet')).toBeInTheDocument()
      })
    })

    it('should show link to log first entry when no logs', async () => {
      const mockSnapshot = {
        forEach: jest.fn(),
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockSnapshot)

      render(<HealthReportPage />)

      await waitFor(() => {
        expect(screen.getByText('Log Your First Entry')).toBeInTheDocument()
      })
    })

    it('should not show generate button when no logs', async () => {
      const mockSnapshot = {
        forEach: jest.fn(),
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockSnapshot)

      render(<HealthReportPage />)

      await waitFor(() => {
        const generateButtons = screen.queryAllByText(/Generate/i)
        const headerButton = generateButtons.find(btn => 
          btn.closest('button')?.disabled
        )
        expect(headerButton?.closest('button')).toBeDisabled()
      })
    })
  })

  describe('With Logs State', () => {
    beforeEach(() => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({ id: 'log-1', data: () => mockLog })
          callback({ id: 'log-2', data: () => mockLog })
        }),
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockSnapshot)
    })

    it('should show "Ready to Generate" message with logs', async () => {
      render(<HealthReportPage />)

      await waitFor(() => {
        expect(screen.getByText('Ready to Generate Your Report')).toBeInTheDocument()
      })
    })

    it('should display log count', async () => {
      render(<HealthReportPage />)

      await waitFor(() => {
        expect(screen.getByText(/2/)).toBeInTheDocument()
        expect(screen.getByText(/symptom logs/i)).toBeInTheDocument()
      })
    })

    it('should enable generate button with logs', async () => {
      render(<HealthReportPage />)

      await waitFor(() => {
        const generateButton = screen.getByText('Generate AI Health Report').closest('button')
        expect(generateButton).not.toBeDisabled()
      })
    })
  })

  describe('Report Generation', () => {
    beforeEach(() => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({ id: 'log-1', data: () => mockLog })
        }),
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockSnapshot)
    })

    it('should call API when generate button clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockReport,
      })

      render(<HealthReportPage />)

      await waitFor(() => {
        expect(screen.getByText('Generate AI Health Report')).toBeInTheDocument()
      })

      const generateButton = screen.getByText('Generate AI Health Report')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/health-report',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })
    })

    it('should show loading state during generation', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

      render(<HealthReportPage />)

      await waitFor(() => {
        expect(screen.getByText('Generate AI Health Report')).toBeInTheDocument()
      })

      const generateButton = screen.getByText('Generate AI Health Report')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(generateButton.closest('button')).toBeDisabled()
      })
    })

    it('should display report after successful generation', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockReport,
      })

      render(<HealthReportPage />)

      await waitFor(() => {
        expect(screen.getByText('Generate AI Health Report')).toBeInTheDocument()
      })

      const generateButton = screen.getByText('Generate AI Health Report')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Ovira Health Report')).toBeInTheDocument()
        expect(screen.getByText('Test summary')).toBeInTheDocument()
      })
    })

    it('should display error message on generation failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'API Error' }),
      })

      render(<HealthReportPage />)

      await waitFor(() => {
        expect(screen.getByText('Generate AI Health Report')).toBeInTheDocument()
      })

      const generateButton = screen.getByText('Generate AI Health Report')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/API Error/i)).toBeInTheDocument()
      })
    })

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<HealthReportPage />)

      await waitFor(() => {
        expect(screen.getByText('Generate AI Health Report')).toBeInTheDocument()
      })

      const generateButton = screen.getByText('Generate AI Health Report')
      fireEvent.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/Failed to generate report/i)).toBeInTheDocument()
      })
    })
  })

  describe('Report Display', () => {
    beforeEach(async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({ id: 'log-1', data: () => mockLog })
        }),
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockSnapshot)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockReport,
      })
    })

    it('should display executive summary', async () => {
      render(<HealthReportPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Generate AI Health Report'))
      })

      await waitFor(() => {
        expect(screen.getByText('Executive Summary')).toBeInTheDocument()
        expect(screen.getByText('Test summary')).toBeInTheDocument()
      })
    })

    it('should display statistics grid', async () => {
      render(<HealthReportPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Generate AI Health Report'))
      })

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument() // Flow days
        expect(screen.getByText('5.0')).toBeInTheDocument() // Avg pain
      })
    })

    it('should display cycle overview', async () => {
      render(<HealthReportPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Generate AI Health Report'))
      })

      await waitFor(() => {
        expect(screen.getByText('Cycle Overview')).toBeInTheDocument()
        expect(screen.getByText('Regular pattern')).toBeInTheDocument()
      })
    })

    it('should display symptom analysis', async () => {
      render(<HealthReportPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Generate AI Health Report'))
      })

      await waitFor(() => {
        expect(screen.getByText('Symptom Analysis')).toBeInTheDocument()
        expect(screen.getByText('cramps')).toBeInTheDocument()
      })
    })

    it('should display recommendations', async () => {
      render(<HealthReportPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Generate AI Health Report'))
      })

      await waitFor(() => {
        expect(screen.getByText('Recommendations')).toBeInTheDocument()
        expect(screen.getByText('Track symptoms regularly')).toBeInTheDocument()
      })
    })

    it('should display questions for doctor', async () => {
      render(<HealthReportPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Generate AI Health Report'))
      })

      await waitFor(() => {
        expect(screen.getByText('Questions for Your Doctor')).toBeInTheDocument()
        expect(screen.getByText('Should I be concerned about pain?')).toBeInTheDocument()
      })
    })

    it('should display lifestyle tips', async () => {
      render(<HealthReportPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Generate AI Health Report'))
      })

      await waitFor(() => {
        expect(screen.getByText('Personalized Lifestyle Tips')).toBeInTheDocument()
        expect(screen.getByText('Stay hydrated')).toBeInTheDocument()
      })
    })

    it('should show print button when report is displayed', async () => {
      render(<HealthReportPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Generate AI Health Report'))
      })

      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument()
      })
    })
  })

  describe('Risk Assessment Display', () => {
    it('should display no risk message when assessment is empty', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({ id: 'log-1', data: () => mockLog })
        }),
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockSnapshot)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockReport,
      })

      render(<HealthReportPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Generate AI Health Report'))
      })

      await waitFor(() => {
        expect(screen.getByText('No Significant Risk Factors Detected')).toBeInTheDocument()
      })
    })

    it('should display risk assessments when present', async () => {
      const reportWithRisk = {
        ...mockReport,
        riskAssessment: [
          {
            condition: 'PCOS',
            riskLevel: 'medium' as const,
            confidence: 'medium',
            indicators: ['Irregular cycles', 'High pain'],
            recommendation: 'Consult a doctor',
          },
        ],
      }

      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({ id: 'log-1', data: () => mockLog })
        }),
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockSnapshot)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => reportWithRisk,
      })

      render(<HealthReportPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Generate AI Health Report'))
      })

      await waitFor(() => {
        expect(screen.getByText('PCOS')).toBeInTheDocument()
        expect(screen.getByText('MEDIUM RISK')).toBeInTheDocument()
        expect(screen.getByText('Consult a doctor')).toBeInTheDocument()
      })
    })
  })

  describe('Urgent Flags', () => {
    it('should display urgent flags when present', async () => {
      const reportWithFlags = {
        ...mockReport,
        urgentFlags: ['Severe pain persisting for 7+ days'],
      }

      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({ id: 'log-1', data: () => mockLog })
        }),
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockSnapshot)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => reportWithFlags,
      })

      render(<HealthReportPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Generate AI Health Report'))
      })

      await waitFor(() => {
        expect(screen.getByText('Urgent Attention Required')).toBeInTheDocument()
        expect(screen.getByText('Severe pain persisting for 7+ days')).toBeInTheDocument()
      })
    })

    it('should not display urgent flags section when empty', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({ id: 'log-1', data: () => mockLog })
        }),
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockSnapshot)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockReport,
      })

      render(<HealthReportPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Generate AI Health Report'))
      })

      await waitFor(() => {
        expect(screen.queryByText('Urgent Attention Required')).not.toBeInTheDocument()
      })
    })
  })

  describe('Print Functionality', () => {
    it('should call window.print when print button clicked', async () => {
      const mockPrint = jest.fn()
      window.print = mockPrint

      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({ id: 'log-1', data: () => mockLog })
        }),
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockSnapshot)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockReport,
      })

      render(<HealthReportPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Generate AI Health Report'))
      })

      await waitFor(() => {
        const printButton = screen.getByText('Print')
        fireEvent.click(printButton)
      })

      expect(mockPrint).toHaveBeenCalled()
    })
  })

  describe('Regenerate Report', () => {
    it('should show "Regenerate Report" button after report is generated', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({ id: 'log-1', data: () => mockLog })
        }),
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockSnapshot)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockReport,
      })

      render(<HealthReportPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Generate AI Health Report'))
      })

      await waitFor(() => {
        expect(screen.getByText('Regenerate Report')).toBeInTheDocument()
      })
    })

    it('should regenerate report when regenerate button clicked', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({ id: 'log-1', data: () => mockLog })
        }),
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockSnapshot)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockReport,
      })

      render(<HealthReportPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Generate AI Health Report'))
      })

      await waitFor(() => {
        fireEvent.click(screen.getByText('Regenerate Report'))
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Authentication', () => {
    it('should not fetch logs when user is not authenticated', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: null,
        userProfile: null,
      })

      render(<HealthReportPage />)

      await waitFor(() => {
        expect(getDocs).not.toHaveBeenCalled()
      })
    })

    it('should handle missing userProfile gracefully', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        userProfile: null,
      })

      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({ id: 'log-1', data: () => mockLog })
        }),
      }
      ;(getDocs as jest.Mock).mockResolvedValue(mockSnapshot)
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockReport,
      })

      render(<HealthReportPage />)

      await waitFor(() => {
        fireEvent.click(screen.getByText('Generate AI Health Report'))
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })
})