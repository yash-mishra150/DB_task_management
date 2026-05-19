'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

interface RecentTask {
  id: number
  title: string
  status: string
  priority: string
  due_date: string | null
  projectName: string
}

interface UserTaskRow {
  name: string
  total: number
  done: number
  inProgress: number
  todo: number
}

interface Stats {
  totalProjects: number
  totalTasks: number
  todoCount: number
  inProgressCount: number
  doneCount: number
  overdueCount: number
  tasksPerUser: UserTaskRow[]
  recentTasks: RecentTask[]
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    todo: 'bg-gray-100 text-gray-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
  }
  const label: Record<string, string> = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.todo}`}>
      {label[status] || status}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-green-100 text-green-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[priority] || map.medium}`}>
      {priority}
    </span>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'red' | 'gray' }) {
  const colors = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700', red: 'bg-red-50 text-red-700', gray: 'bg-gray-100 text-gray-700' }
  return (
    <div className={`rounded-xl p-5 ${colors[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm mt-1 opacity-75">{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setStats)
  }, [])

  return (
    <div>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {!stats ? (
          <div className="text-gray-400 text-sm">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatCard label="Projects" value={stats.totalProjects} color="blue" />
              <StatCard label="All Tasks" value={stats.totalTasks} color="gray" />
              <StatCard label="To Do" value={stats.todoCount} color="gray" />
              <StatCard label="In Progress" value={stats.inProgressCount} color="blue" />
              <StatCard label="Done" value={stats.doneCount} color="green" />
              <StatCard label="Overdue" value={stats.overdueCount} color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">Tasks per User</h2>
                </div>
                {stats.tasksPerUser.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-400 text-sm">No assigned tasks yet</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3 text-center">Total</th>
                        <th className="px-6 py-3 text-center">To Do</th>
                        <th className="px-6 py-3 text-center">In Progress</th>
                        <th className="px-6 py-3 text-center">Done</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.tasksPerUser.map(row => (
                        <tr key={row.name} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm font-medium text-gray-900">{row.name}</td>
                          <td className="px-6 py-3 text-sm text-gray-700 text-center">{row.total}</td>
                          <td className="px-6 py-3 text-sm text-gray-500 text-center">{row.todo}</td>
                          <td className="px-6 py-3 text-sm text-blue-600 text-center">{row.inProgress}</td>
                          <td className="px-6 py-3 text-sm text-green-600 text-center">{row.done}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">Recent Tasks</h2>
                </div>
                {stats.recentTasks.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-400 text-sm">No tasks yet</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                        <th className="px-6 py-3">Task</th>
                        <th className="px-6 py-3">Priority</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.recentTasks.map(task => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm text-gray-900">
                            <div className="font-medium truncate max-w-[160px]">{task.title}</div>
                            <div className="text-xs text-gray-400">{task.projectName}</div>
                          </td>
                          <td className="px-6 py-3"><PriorityBadge priority={task.priority} /></td>
                          <td className="px-6 py-3"><StatusBadge status={task.status} /></td>
                          <td className="px-6 py-3 text-xs text-gray-500">
                            {task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
