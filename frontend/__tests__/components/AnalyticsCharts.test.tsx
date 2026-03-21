/**
 * Component tests: AnalyticsCharts — SparkLine, DonutChart, BarChart
 *
 * These tests protect the bug fix for:
 * BUG-007: SparkLine crashed when data was empty (areaD accessed points[-1])
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import AnalyticsCharts from '@/components/analytics/AnalyticsCharts'

const DEFAULT_PROPS = {
  studentsByStatus: {},
  decisionCounts: { accepted: 0, rejected: 0, waitlisted: 0, pending: 0 },
  jobsByDay: {},
  complianceRate: null,
  completedOnTime: 0,
  totalPastDeadlines: 0,
}

describe('AnalyticsCharts', () => {
  describe('SparkLine — BUG-007 regression', () => {
    it('renders without crashing when jobsByDay is empty (was crashing before fix)', () => {
      // This would throw "Cannot read properties of undefined (reading 'x')"
      // before the fix (areaD accessed points[points.length - 1] when points=[])
      expect(() =>
        render(<AnalyticsCharts {...DEFAULT_PROPS} />)
      ).not.toThrow()
    })

    it('shows "No data" text when jobsByDay is empty', () => {
      render(<AnalyticsCharts {...DEFAULT_PROPS} />)
      expect(screen.getAllByText('No data').length).toBeGreaterThan(0)
    })

    it('renders line chart when jobsByDay has data', () => {
      const props = {
        ...DEFAULT_PROPS,
        jobsByDay: {
          '2024-01-01': 3,
          '2024-01-02': 7,
          '2024-01-03': 2,
        },
      }
      const { container } = render(<AnalyticsCharts {...props} />)
      // Should render SVG path elements for line and area
      const paths = container.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })

    it('handles single data point without crashing', () => {
      // Edge case: exactly one point — division by (length-1) would be /0
      const props = { ...DEFAULT_PROPS, jobsByDay: { '2024-01-01': 5 } }
      expect(() => render(<AnalyticsCharts {...props} />)).not.toThrow()
    })
  })

  describe('DonutChart', () => {
    it('shows "No data" when all statuses are zero', () => {
      render(<AnalyticsCharts {...DEFAULT_PROPS} />)
      // Multiple "No data" texts expected (donut + sparkline)
      const noDataElements = screen.getAllByText('No data')
      expect(noDataElements.length).toBeGreaterThanOrEqual(1)
    })

    it('renders donut slices when studentsByStatus has data', () => {
      const props = {
        ...DEFAULT_PROPS,
        studentsByStatus: { active: 10, submitted: 5, accepted: 2 },
      }
      const { container } = render(<AnalyticsCharts {...props} />)
      const paths = container.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })

    it('shows correct total count in center', () => {
      const props = {
        ...DEFAULT_PROPS,
        studentsByStatus: { active: 7, intake: 3 },
      }
      render(<AnalyticsCharts {...props} />)
      expect(screen.getAllByText('10').length).toBeGreaterThan(0)
    })
  })

  describe('Deadline Compliance', () => {
    it('shows "No past deadlines" message when totalPastDeadlines is 0', () => {
      render(<AnalyticsCharts {...DEFAULT_PROPS} />)
      expect(screen.getByText('No past deadlines to evaluate')).toBeInTheDocument()
    })

    it('shows compliance rate gauge when there are past deadlines', () => {
      const props = {
        ...DEFAULT_PROPS,
        complianceRate: 75,
        completedOnTime: 6,
        totalPastDeadlines: 8,
      }
      render(<AnalyticsCharts {...props} />)
      expect(screen.getByText('75%')).toBeInTheDocument()
      expect(screen.getByText('6')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // 8 - 6 missed
    })

    it('shows correct missed count', () => {
      const props = {
        ...DEFAULT_PROPS,
        complianceRate: 50,
        completedOnTime: 3,
        totalPastDeadlines: 6,
      }
      render(<AnalyticsCharts {...props} />)
      expect(screen.getAllByText('3').length).toBeGreaterThan(0) // missed = 6 - 3
    })
  })

  describe('Decision bar chart', () => {
    it('renders with all zero decisions', () => {
      expect(() => render(<AnalyticsCharts {...DEFAULT_PROPS} />)).not.toThrow()
    })

    it('renders with real decision data', () => {
      const props = {
        ...DEFAULT_PROPS,
        decisionCounts: { accepted: 10, rejected: 3, waitlisted: 2, pending: 5 },
      }
      const { container } = render(<AnalyticsCharts {...props} />)
      const rects = container.querySelectorAll('rect')
      expect(rects.length).toBeGreaterThan(0)
    })
  })
})
