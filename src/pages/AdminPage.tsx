import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Users, Pill, Package, ClockArrowUp, Stethoscope, LogOut, User, Shield } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

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

export function AdminPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false })
      return data ?? []
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

  const activeMeds = medicines?.filter(m => m.active).length ?? 0
  const lowStockMeds = medicines?.filter(m => m.active && m.current_stock < 10).length ?? 0

  return (
    <div className="space-y-6">
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
        <StatCard icon={Users} label="Family Members" value={users?.length ?? 0} color="bg-amber-500" />
        <StatCard icon={Package} label="Low Stock (<10)" value={lowStockMeds} color={lowStockMeds > 0 ? "bg-red-500" : "bg-green-500"} />
      </div>

      {/* Family Members */}
      <div>
        <h2 className="text-sm font-semibold text-warm-700 mb-3 flex items-center gap-2">
          <Users size={15} className="text-warm-400" />
          Family Members
        </h2>
        <div className="space-y-2">
          {users?.map((u: any) => (
            <div key={u.id} className="card flex items-center gap-3 py-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold ${u.role === 'admin' ? 'bg-brand-500' : 'bg-warm-200'}`}>
                {u.role === 'admin' ? <Shield size={15} /> : <User size={15} className="text-warm-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-warm-800">{u.display_name ?? u.caregiver_name ?? 'Unknown'}</p>
                <p className="text-xs text-warm-400">{u.patient_name} · {u.role}</p>
              </div>
              {u.role === 'admin' && (
                <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
              )}
            </div>
          ))}
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
