export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projects = db.prepare(`
    SELECT p.*, pm.role,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as taskCount,
      (SELECT COUNT(*) FROM project_members m WHERE m.project_id = p.id) as memberCount
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    ORDER BY p.created_at DESC
  `).all(user.id)

  return NextResponse.json(projects)
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description } = await request.json()
  if (!name) return NextResponse.json({ error: 'Project name is required' }, { status: 400 })

  const result = db.prepare('INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)').run(name, description || null, user.id)
  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(result.lastInsertRowid, user.id, 'admin')

  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 })
}
