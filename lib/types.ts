export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}
