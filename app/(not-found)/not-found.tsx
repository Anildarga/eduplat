import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-blue-600 dark:text-blue-400 mb-4">404</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Page not found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved or deleted.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
