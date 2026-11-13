import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Users, Pill, Package, ClockArrowUp,
  Stethoscope, LogOut, Shield, UserPlus, Trash2, Loader2, X, Eye, EyeOff
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-warm-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-warm-800">{value}</p>
      </div>
    </div>
  )
}

interface AddUserFormData {
  display_name: string
  relation: string
  password: string
  confirm_password: string
  role: 'user' | 'admin'
}

function nameToEmail(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '') + '@medicine-tracker.app'
}

function AddUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<AddUserFormData>({
    display_name: '', relation: '', password: '', confirm_password: '', role: 'user'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!form.display_name.trim()) throw new Error('Name is required.')
      if (form.password.length < 6) throw new Error('Password must be at least 6 characters.')
      if (form.password !== form.confirm_password) throw new Error('Passwords do not match.')

      const email = nameToEmail(form.display_name)
      const { error } = await supabase.rpc('create_family_member', {
        p_email: email,
        p_password: form.password,
        p_display_name: form.display_name.trim(),
        p_role: form.role,
        p_patient_name: 'Dr Nikkie',
        p_caregiver_name: form.display_name.trim(),
        p_relation: form.relation.trim() || null,
      } as any)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => { onSuccess(); onClose() },
    onError: (e: any) => setError(e.message ?? 'Failed to create user.'),
  })

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl space-y-4 p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-warm-400 hover:text-warm-600">
          <X size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
            <UserPlus size={18} className="text-brand-700" />
          </div>
          <div>
            <h2 className="font-bold text-warm-800">Add Family Member</h2>
            <p className="text-xs text-warm-400">Create a new account</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-warm-600 mb-1 block">Full Name *</label>
            <input className="input-field w-full" placeholder="e.g. Ravi Sharma" value={form.display_name}
              onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-600 mb-1 block">Relation to patient</label>
            <input className="input-field w-full" placeholder="e.g. Son, Daughter, Husband…" value={form.relation}
              onChange={e => setForm(f => ({ ...f, relation: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-600 mb-1 block">Password *</label>
            <div className="relative">
              <input className="input-field w-full pr-10" type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-warm-600 mb-1 block">Confirm Password *</label>
            <input className="input-field w-full" type={showPassword ? 'text' : 'password'}
              placeholder="Repeat password" value={form.confirm_password}
              onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-warm-600 mb-1 block">Role</label>
            <select className="input-field w-full" value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as 'user' | 'admin' }))}>
              <option value="user">User — can log doses, view data</option>
              <option value="admin">Admin — full access + manage users</option>
            </select>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}

        <button
          onClick={() => addMutation.mutate()}
          disabled={addMutation.isPending}
          className="btn-primary w-full justify-center gap-2"
        >
          {addMutation.isPending
            ? <><Loader2 size={16} className="animate-spin" /> Creating…</>
            : <><UserPlus size={16} /> Create Account</>
          }
        </button>
      </div>
    </div>
  )
}

export function AdminPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false })
      return (data ?? []) as any[]
    },
  })

  const { data: medicines } = useQuery({
    queryKey: ['admin-medicines'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('medicines')
        .select('id, name, current_stock, active')
      return (data ?? []) as Array<{ id: string; name: string; current_stock: number; active: boolean }>
    },
  })

  const { data: doseTodayCount } = useQuery({
    queryKey: ['admin-dose-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { count } = await supabase
        .from('dose_records')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59')
        .eq('status', 'given')
      return count ?? 0
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      setDeletingId(userId)
      const { error } = await supabase.rpc('delete_family_member', { p_user_id: userId } as any)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setConfirmDeleteId(null)
      setDeletingId(null)
    },
    onError: () => setDeletingId(null),
  })

  const activeMeds = medicines?.filter(m => m.active).length ?? 0
  const lowStockMeds = medicines?.filter(m => m.active && m.current_stock < 10).length ?? 0

  function getInitials(name: string | null) {
    if (!name) return '?'
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['admin-users'] })}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center">
          <ShieldCheck size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-warm-800">Admin Panel</h1>
          <p className="text-xs text-warm-400">Manage the medicine tracker</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Pill} label="Active Medicines" value={activeMeds} color="bg-brand-500" />
        <StatCard icon={Package} label="Doses Today" value={doseTodayCount ?? 0} color="bg-violet-500" />
        <StatCard icon={Users} label="Family Members" value={users.length} color="bg-amber-500" />
        <StatCard icon={Package} label="Low Stock (<10)" value={lowStockMeds} color={lowStockMeds > 0 ? "bg-red-500" : "bg-green-500"} />
      </div>

      {/* Family Members */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-warm-700 flex items-center gap-2">
            <Users size={15} className="text-warm-400" />
            Family Members
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
          >
            <UserPlus size={13} /> Add User
          </button>
        </div>

        <div className="space-y-2">
          {users.map((u: any) => {
            const isMe = u.user_id === profile?.user_id
            const isConfirming = confirmDeleteId === u.user_id
            const isDeleting = deletingId === u.user_id

            return (
              <div key={u.user_id} className="card py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                    u.role === 'admin' ? 'bg-brand-500 text-white' : 'bg-warm-100 text-warm-600'
                  }`}>
                    {u.role === 'admin' ? <Shield size={15} className="text-white" /> : getInitials(u.display_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-warm-800 truncate">
                      {u.display_name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-warm-400 truncate">
                      {u.relation ? `${u.relation} · ` : ''}{u.role}
                    </p>
                  </div>
                  {u.role === 'admin' && (
                    <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Admin</span>
                  )}
                  {!isMe && (
                    <button
                      onClick={() => setConfirmDeleteId(isConfirming ? null : u.user_id)}
                      className="p-1.5 rounded-lg text-warm-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
                      title="Remove user"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {isConfirming && (
                  <div className="mt-3 pt-3 border-t border-warm-100 flex items-center justify-between gap-2">
                    <p className="text-xs text-red-700 font-medium">
                      Remove {u.display_name ?? 'this user'}? This cannot be undone.
                    </p>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 rounded-lg text-xs bg-warm-100 text-warm-600 font-medium"
                      >Cancel</button>
                      <button
                        onClick={() => deleteMutation.mutate(u.user_id)}
                        disabled={isDeleting}
                        className="px-2.5 py-1 rounded-lg text-xs bg-red-500 text-white font-medium flex items-center gap-1"
                      >
                        {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-warm-700 mb-3">Admin Actions</h2>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => navigate('/retroactive')}
            className="card flex items-center gap-3 py-3 text-left hover:border-brand-200 hover:bg-brand-50/50 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center">
              <ClockArrowUp size={16} className="text-brand-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-warm-800">Edit Past Doses</p>
              <p className="text-xs text-warm-400">Add or modify dose records retroactively</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/medicines')}
            className="card flex items-center gap-3 py-3 text-left hover:border-brand-200 hover:bg-brand-50/50 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
              <Pill size={16} className="text-teal-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-warm-800">Manage Medicines</p>
              <p className="text-xs text-warm-400">Add, edit or archive medicines and stock</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/doctor-visits')}
            className="card flex items-center gap-3 py-3 text-left hover:border-brand-200 hover:bg-brand-50/50 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Stethoscope size={16} className="text-blue-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-warm-800">Doctor Visits</p>
              <p className="text-xs text-warm-400">Log consultations and prescriptions</p>
            </div>
          </button>

          <button
            onClick={signOut}
            className="card flex items-center gap-3 py-3 text-left hover:border-red-200 hover:bg-red-50 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <LogOut size={16} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-600">Sign Out</p>
              <p className="text-xs text-warm-400">Switch to a different family member</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
