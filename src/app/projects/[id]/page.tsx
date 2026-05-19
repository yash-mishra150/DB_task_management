'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

interface Member { id: number; name: string; email: string; role: string }
interface Task { id: number; title: string; description: string | null; status: string; priority: string; assigned_to: number | null; assigneeName: string | null; due_date: string | null }
interface Project { id: number; name: string; description: string | null; role: string; members: Member[] }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { todo: 'bg-gray-100 text-gray-700', 'in-progress': 'bg-blue-100 text-blue-700', done: 'bg-green-100 text-green-700' }
  const label: Record<string, string> = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.todo}`}>{label[status] || status}</span>
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[priority] || map.medium}`}>{priority}</span>
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState('all')
  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('member')
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', status: 'todo', priority: 'medium', due_date: '' })
  const [error, setError] = useState('')

  useEffect(() => { loadProject(); loadTasks() }, [id])

  function loadProject() {
    fetch(`/api/projects/${id}`).then(r => r.json()).then(data => {
      if (data.error) router.push('/projects')
      else setProject(data)
    })
  }

  function loadTasks() {
    fetch(`/api/projects/${id}/tasks`).then(r => r.json()).then(setTasks)
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch(`/api/projects/${id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: memberEmail, role: memberRole }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setMemberEmail('')
    setShowAddMember(false)
    loadProject()
  }

  async function removeMember(userId: number) {
    await fetch(`/api/projects/${id}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    loadProject()
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch(`/api/projects/${id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...taskForm, assigned_to: taskForm.assigned_to ? Number(taskForm.assigned_to) : null }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setTaskForm({ title: '', description: '', assigned_to: '', status: 'todo', priority: 'medium', due_date: '' })
    setShowAddTask(false)
    loadTasks()
  }

  async function updateStatus(taskId: number, status: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    loadTasks()
  }

  async function deleteTask(taskId: number) {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    loadTasks()
  }

  async function deleteProject() {
    if (!confirm('Delete this project? This cannot be undone.')) return
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/projects')
  }

  if (!project) {
    return <div><Navbar /><div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading...</div></div>
  }

  const isAdmin = project.role === 'admin'
  const today = new Date().toISOString().split('T')[0]
  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  return (
    <div>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Link href="/projects" className="hover:text-gray-700">Projects</Link>
              <span>/</span>
              <span className="text-gray-700 font-medium">{project.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && <p className="text-gray-500 text-sm mt-1">{project.description}</p>}
          </div>
          {isAdmin && (
            <button onClick={deleteProject} className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
              Delete Project
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900 text-sm">Members ({project.members.length})</h2>
                {isAdmin && (
                  <button onClick={() => setShowAddMember(!showAddMember)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    + Add
                  </button>
                )}
              </div>

              {showAddMember && (
                <form onSubmit={addMember} className="p-4 border-b border-gray-100 bg-gray-50 space-y-3">
                  <input
                    required
                    type="email"
                    value={memberEmail}
                    onChange={e => setMemberEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={memberRole}
                    onChange={e => setMemberRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Add</button>
                    <button type="button" onClick={() => setShowAddMember(false)} className="px-3 py-1.5 text-gray-600 border border-gray-300 rounded-lg text-xs">Cancel</button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-gray-100">
                {project.members.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{m.name}</div>
                      <div className="text-xs text-gray-400">{m.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {m.role}
                      </span>
                      {isAdmin && (
                        <button onClick={() => removeMember(m.id)} className="text-gray-400 hover:text-red-500 text-base leading-none">×</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-gray-900 text-sm">Tasks</h2>
                  <div className="flex gap-1">
                    {['all', 'todo', 'in-progress', 'done'].map(s => (
                      <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                        {s === 'all' ? 'All' : s === 'in-progress' ? 'In Progress' : s === 'todo' ? 'To Do' : 'Done'}
                      </button>
                    ))}
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => setShowAddTask(!showAddTask)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    + Add Task
                  </button>
                )}
              </div>

              {showAddTask && (
                <form onSubmit={createTask} className="p-4 border-b border-gray-100 bg-gray-50 space-y-3">
                  <input
                    required
                    value={taskForm.title}
                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="Task title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    value={taskForm.description}
                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <select
                      value={taskForm.assigned_to}
                      onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {project.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <select
                      value={taskForm.priority}
                      onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <select
                      value={taskForm.status}
                      onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                    <input
                      type="date"
                      value={taskForm.due_date}
                      onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Create</button>
                    <button type="button" onClick={() => setShowAddTask(false)} className="px-3 py-1.5 text-gray-600 border border-gray-300 rounded-lg text-xs">Cancel</button>
                  </div>
                </form>
              )}

              {filteredTasks.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-400 text-sm">No tasks</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredTasks.map(task => {
                    const overdue = task.due_date && task.due_date < today && task.status !== 'done'
                    return (
                      <div key={task.id} className="px-4 py-3 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${overdue ? 'text-red-700' : 'text-gray-900'}`}>{task.title}</span>
                            <PriorityBadge priority={task.priority} />
                            {overdue && <span className="text-xs text-red-500 font-medium">Overdue</span>}
                          </div>
                          {task.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>}
                          <div className="flex items-center gap-3 mt-1">
                            {task.assigneeName && <span className="text-xs text-gray-500">{task.assigneeName}</span>}
                            {task.due_date && (
                              <span className={`text-xs ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                                {new Date(task.due_date + 'T00:00:00').toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={task.status}
                            onChange={e => updateStatus(task.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                          {isAdmin && (
                            <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500 text-base leading-none">×</button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
