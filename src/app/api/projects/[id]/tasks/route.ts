export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUser } from '@/lib/auth'

interface Member { role: string }

const VALID_STATUSES = ['todo', 'in-progress', 'done']
const VALID_PRIORITIES = ['low', 'medium', 'high']

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(params.id, user.id) as Member | undefined
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const tasks = member.role === 'admin'
    ? db.prepare(`
        SELECT t.*, u.name as assigneeName
        FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to
        WHERE t.project_id = ? ORDER BY t.created_at DESC
      `).all(params.id)
    : db.prepare(`
        SELECT t.*, u.name as assigneeName
        FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to
        WHERE t.project_id = ? AND t.assigned_to = ? ORDER BY t.created_at DESC
      `).all(params.id, user.id)

  return NextResponse.json(tasks)
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(params.id, user.id) as Member | undefined
  if (!member || member.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, description, assigned_to, status = 'todo', priority = 'medium', due_date } = await request.json()
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  if (!VALID_PRIORITIES.includes(priority)) return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })

  const result = db.prepare(
    'INSERT INTO tasks (project_id, title, description, assigned_to, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(params.id, title, description || null, assigned_to || null, status, priority, due_date || null)

  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 })
}
