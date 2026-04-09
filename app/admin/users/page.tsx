'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/types'

interface AdminUser {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !isAdmin)) {
      router.push('/')
      return
    }

    if (isAdmin) {
      fetchUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAdmin])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const res = await fetch(`${baseUrl}/api/users`)
      if (!res.ok) {
        if (res.status === 403) {
          router.push('/')
          return
        }
        throw new Error('Failed to fetch users')
      }
      const result = await res.json()
      setUsers(result.data)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentIsActive: boolean) => {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const res = await fetch(`${baseUrl}/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentIsActive }),
      })
      if (!res.ok) throw new Error('Failed to update user')
      setUsers(users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user'
      alert('Failed to update user: ' + message)
    }
  }

  const handleChangeRole = async (id: string, newRole: UserRole) => {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const res = await fetch(`${baseUrl}/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error('Failed to change role')
      const result = await res.json()
      setUsers(users.map(u => u.id === id ? { ...u, role: result.data.role } : u))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change role'
      alert('Failed to change role: ' + message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const res = await fetch(`${baseUrl}/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete user')
      setUsers(users.filter(u => u.id !== id))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user'
      alert('Failed to delete user: ' + message)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center text-gray-900 dark:text-white">Loading...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">User Management</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded mb-6">
          {error}
          <button onClick={fetchUsers} className="ml-2 underline">Retry</button>
        </div>
      )}

      {users.length === 0 && !loading && (
        <p className="text-gray-600 dark:text-gray-300">No users found.</p>
      )}

      {users.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.id.slice(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                      disabled={user.id === session?.user?.id}
                      className="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="INSTRUCTOR">Instructor</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(user.id, user.isActive)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={user.id === session?.user?.id}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
