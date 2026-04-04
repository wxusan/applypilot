'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  section?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary — catches unhandled render errors in any child component tree.
 *
 * Usage:
 *   <ErrorBoundary section="Dashboard">
 *     <DashboardContent />
 *   </ErrorBoundary>
 *
 * Without this, a single component crash takes down the entire page with a
 * white screen and no useful feedback.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.section ? ` — ${this.props.section}` : ''}]`, error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 inline-block mb-4">
            <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
          </div>
          <h3 className="text-base font-semibold text-on-surface mb-1">
            Something went wrong{this.props.section ? ` in ${this.props.section}` : ''}
          </h3>
          <p className="text-sm text-on-surface-variant mb-4 max-w-sm">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:opacity-90 transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
