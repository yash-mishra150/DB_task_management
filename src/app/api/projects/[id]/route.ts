export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUser } from '@/lib/auth'

interface Member { role: string }
interface Project { id: number; name: string; description: string | null; owner_id: number; created_at: string }

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(params.id, user.id) as Member | undefined
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(params.id) as Project
  const members = db.prepare(`
    SELECT u.id, u.name, u.email, pm.role
    FROM project_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ?
  `).all(params.id)

  return NextResponse.json({ ...project, role: member.role, members })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(params.id, user.id) as Member | undefined
  if (!member || member.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, description } = await request.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  db.prepare('UPDATE projects SET name = ?, description = ? WHERE id = ?').run(name, description || null, params.id)
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(params.id) as Pick<Project, 'owner_id'> | undefined
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (project.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  db.prepare('DELETE FROM projects WHERE id = ?').run(params.id)
  return NextResponse.json({ success: true })
}
