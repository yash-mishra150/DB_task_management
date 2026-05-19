export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUser } from '@/lib/auth'

interface Task { id: number; project_id: number; title: string; description: string; assigned_to: number | null; status: string; priority: string; due_date: string | null }
interface Member { role: string }

const VALID_STATUSES = ['todo', 'in-progress', 'done']
const VALID_PRIORITIES = ['low', 'medium', 'high']

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(params.id) as Task | undefined
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, user.id) as Member | undefined
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (member.role !== 'admin' && task.assigned_to !== user.id) {
    return NextResponse.json({ error: 'You can only update tasks assigned to you' }, { status: 403 })
  }

  const body = await request.json()
  const newStatus = body.status ?? task.status
  if (!VALID_STATUSES.includes(newStatus)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  if (member.role === 'admin') {
    const newPriority = body.priority ?? task.priority
    if (!VALID_PRIORITIES.includes(newPriority)) return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
    db.prepare('UPDATE tasks SET title = ?, description = ?, assigned_to = ?, status = ?, priority = ?, due_date = ? WHERE id = ?').run(
      body.title ?? task.title,
      body.description ?? task.description,
      body.assigned_to !== undefined ? body.assigned_to : task.assigned_to,
      newStatus,
      newPriority,
      body.due_date !== undefined ? body.due_date : task.due_date,
      params.id
    )
  } else {
    db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(newStatus, params.id)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(params.id) as Task | undefined
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, user.id) as Member | undefined
  if (!member || member.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  db.prepare('DELETE FROM tasks WHERE id = ?').run(params.id)
  return NextResponse.json({ success: true })
}
