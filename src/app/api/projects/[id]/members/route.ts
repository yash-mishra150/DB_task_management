export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUser } from '@/lib/auth'

interface Member { role: string }
interface TargetUser { id: number }
interface Project { owner_id: number }

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(params.id, user.id) as Member | undefined
  if (!member || member.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, role = 'member' } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const target = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as TargetUser | undefined
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  try {
    db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(params.id, target.id, role)
  } catch {
    return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(params.id, user.id) as Member | undefined
  if (!member || member.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId } = await request.json()
  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(params.id) as Project
  if (project.owner_id === userId) return NextResponse.json({ error: 'Cannot remove the project owner' }, { status: 400 })

  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(params.id, userId)
  return NextResponse.json({ success: true })
}
