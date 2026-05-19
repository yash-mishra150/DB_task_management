export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getUser } from '@/lib/auth'

interface TaskStats { total: number; todo: number; inProgress: number; done: number; overdue: number }

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  const { count: totalProjects } = db.prepare(
    'SELECT COUNT(*) as count FROM project_members WHERE user_id = ?'
  ).get(user.id) as { count: number }

  const taskStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) as inProgress,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN t.due_date < ? AND t.status != 'done' THEN 1 ELSE 0 END) as overdue
    FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
  `).get(today, user.id) as TaskStats

  const tasksPerUser = db.prepare(`
    SELECT
      u.name,
      COUNT(*) as total,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) as inProgress,
      SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo
    FROM tasks t
    JOIN users u ON u.id = t.assigned_to
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    WHERE t.assigned_to IS NOT NULL
    GROUP BY u.id, u.name
    ORDER BY total DESC
  `).all(user.id)

  const recentTasks = db.prepare(`
    SELECT t.id, t.title, t.status, t.priority, t.due_date, p.name as projectName
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    ORDER BY t.created_at DESC
    LIMIT 10
  `).all(user.id)

  return NextResponse.json({
    totalProjects,
    totalTasks: taskStats.total,
    todoCount: taskStats.todo,
    inProgressCount: taskStats.inProgress,
    doneCount: taskStats.done,
    overdueCount: taskStats.overdue,
    tasksPerUser,
    recentTasks,
  })
}
