'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'

export default function EmailVerificationBanner() {
  const { data: session, status } = useSession()
  const [dismissed, setDismissed] = useState(false)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('')

  if (status !== 'authenticated' || !session?.user || session.user.emailVerified || dismissed) {
    return null
  }

  const handleResendVerification = async () => {
    setResending(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Verification email sent! Please check your email.')
      } else {
        setMessage(data.error || 'Failed to send verification email')
      }
    } catch (err) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Please verify your email address
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Check your email for a verification link. You won't be able to access all features until your email is verified.
                </p>
                {message && (
                  <p className={`text-sm mt-1 ${message.includes('sent') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend email'}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}