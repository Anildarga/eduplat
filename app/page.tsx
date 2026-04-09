import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const features = [
    {
      title: 'Interactive Learning',
      description: 'Engage with video lessons, quizzes, and hands‑on projects that reinforce your understanding.',
      icon: '🎯',
    },
    {
      title: 'Expert Instructors',
      description: 'Learn from industry professionals who bring real‑world experience into every lesson.',
      icon: '👨‍🏫',
    },
    {
      title: 'Progress Tracking',
      description: 'Monitor your advancement with detailed dashboards, certificates, and completion metrics.',
      icon: '📊',
    },
    {
      title: 'Flexible Pace',
      description: 'Study at your own speed—access course materials anytime, anywhere, on any device.',
      icon: '⏱️',
    },
  ];

  const stats = [
    { label: 'Active Students', value: '10,000+' },
    { label: 'Courses Available', value: '200+' },
    { label: 'Expert Instructors', value: '50+' },
    { label: 'Completion Rate', value: '92%' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Learn, Grow, and
              <span className="text-blue-600 dark:text-blue-400"> Succeed</span>
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-10">
              Join thousands of learners mastering new skills with interactive courses, expert instructors, and hands‑on projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Courses
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-blue-600 bg-white dark:bg-gray-800 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
              >
                Start Learning Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Eduplat?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              We combine cutting‑edge technology with proven pedagogical methods to deliver an unparalleled learning experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
            Join our community of learners and start building the skills that matter in today's market.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-blue-600 bg-white rounded-lg hover:bg-gray-100 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white border-2 border-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Explore Courses
            </Link>
          </div>
          <p className="mt-8 text-blue-200">
            No credit card required • 14‑day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Students Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Hear from learners who have transformed their careers with Eduplat.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Alex Johnson',
                role: 'Software Developer',
                quote: 'The React course completely changed how I approach front‑end development. The projects were incredibly practical.',
                avatar: 'AJ',
              },
              {
                name: 'Maria Garcia',
                role: 'Data Scientist',
                quote: 'The Python for Data Science track gave me the confidence to apply for senior roles. The instructors were outstanding.',
                avatar: 'MG',
              },
              {
                name: 'David Chen',
                role: 'Product Manager',
                quote: 'The project‑based learning approach helped me build a portfolio that landed me three job offers.',
                avatar: 'DC',
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl"
              >
                <div className="text-4xl text-gray-300 dark:text-gray-600 mb-6">"</div>
                <p className="text-gray-700 dark:text-gray-300 text-lg italic mb-6">
                  {testimonial.quote}
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
