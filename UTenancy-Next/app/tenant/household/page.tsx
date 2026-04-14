'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Household, HouseholdExpense, ExpenseCategory, Profile } from '@/lib/types'

/* ─── Constants ──────────────────────────────────────── */
const CATEGORY_META: Record<ExpenseCategory, { icon: string; label: string; color: string }> = {
  rent:        { icon: 'home',              label: 'Rent',              color: 'clay-grad'   },
  electricity: { icon: 'bolt',              label: 'Electricity',       color: 'bg-amber-500' },
  internet:    { icon: 'wifi',              label: 'Internet',          color: 'bg-blue-500' },
  groceries:   { icon: 'shopping_cart',     label: 'Groceries',         color: 'bg-green-600' },
  supplies:    { icon: 'shopping_bag',      label: 'Household Supplies', color: 'bg-purple-500' },
  other:       { icon: 'receipt_long',      label: 'Other',             color: 'bg-stone-400' },
}

/* ─── Helpers ────────────────────────────────────────── */
function perPerson(amount: number, splitCount: number): string {
  return `$${(amount / Math.max(splitCount, 1)).toFixed(0)}`
}

function fmt(amount: number): string {
  return `$${amount.toFixed(0)}`
}

/* ─── ExpenseRow ─────────────────────────────────────── */
function ExpenseRow({
  expense,
  onSettle,
  onUnsettle,
  onDelete,
  isOwner,
}: {
  expense: HouseholdExpense
  onSettle: (id: string) => void
  onUnsettle: (id: string) => void
  onDelete: (id: string) => void
  isOwner: boolean
}) {
  const meta = CATEGORY_META[expense.category] ?? CATEGORY_META.other
  const settled = expense.status === 'settled'

  return (
    <div className={`flex items-center gap-4 py-4 px-5 border-b border-out-var last:border-0 transition-opacity ${settled ? 'opacity-60' : ''}`}>
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
        <span className="material-symbols-outlined fill text-white text-lg">{meta.icon}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-head font-semibold text-espresso text-sm truncate">{expense.title}</p>
          {settled && (
            <span className="text-[10px] font-head font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full shrink-0">
              ✓ Settled
            </span>
          )}
          {!settled && (
            <span className="text-[10px] font-head font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
              Pending
            </span>
          )}
        </div>
        <p className="text-xs font-body text-muted mt-0.5">
          {perPerson(expense.amount, expense.split_count)} each · {expense.split_count} people
          {expense.due_date && ` · Due ${new Date(expense.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className="font-head font-bold text-espresso">${expense.amount.toFixed(0)}</p>
        <p className="text-xs font-body text-muted">total</p>
      </div>

      {/* Actions */}
      {isOwner && (
        <div className="flex items-center gap-1 shrink-0">
          {!settled ? (
            <button onClick={() => onSettle(expense.id)}
              title="Mark settled"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-50 text-muted hover:text-green-600 transition-colors">
              <span className="material-symbols-outlined text-lg">check_circle</span>
            </button>
          ) : (
            <button onClick={() => onUnsettle(expense.id)}
              title="Undo — mark as pending"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-50 text-green-600 hover:text-amber-600 transition-colors">
              <span className="material-symbols-outlined text-lg">undo</span>
            </button>
          )}
          <button onClick={() => onDelete(expense.id)}
            title="Delete"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted hover:text-red-600 transition-colors">
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── AddExpenseForm ─────────────────────────────────── */
function AddExpenseForm({
  householdId,
  memberCount,
  onAdd,
  onClose,
}: {
  householdId: string
  memberCount: number
  onAdd: (e: HouseholdExpense) => void
  onClose: () => void
}) {
  const supabase = createClient()
  const [title, setTitle]       = useState('')
  const [amount, setAmount]     = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [splitCount, setSplit]  = useState(memberCount)
  const [dueDate, setDueDate]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState<string | null>(null)

  async function submit() {
    if (!title.trim() || !amount || Number(amount) <= 0) {
      setErr('Please fill in a title and a valid amount.'); return
    }
    setSaving(true); setErr(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setErr('Not signed in'); setSaving(false); return }

    const { data, error } = await supabase
      .from('household_expenses')
      .insert({
        household_id: householdId,
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        paid_by: user.id,
        split_count: splitCount,
        due_date: dueDate || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) { setErr(error.message); setSaving(false); return }
    onAdd(data as HouseholdExpense)
    setSaving(false)
    onClose()
  }

  return (
    <div className="bg-linen border border-out-var rounded-2xl p-5 space-y-4">
      <h4 className="font-head font-bold text-espresso">Add Expense</h4>

      <div>
        <label className="block text-xs font-head font-semibold text-espresso mb-1">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g. October rent, Electric bill"
          className="w-full px-3 py-2.5 text-sm border border-out-var rounded-xl focus:outline-none focus:ring-2 focus:ring-clay/30 bg-white font-body" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-head font-semibold text-espresso mb-1">Total Amount ($)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.01"
            placeholder="0.00"
            className="w-full px-3 py-2.5 text-sm border border-out-var rounded-xl focus:outline-none focus:ring-2 focus:ring-clay/30 bg-white font-body" />
        </div>
        <div>
          <label className="block text-xs font-head font-semibold text-espresso mb-1">Split between</label>
          <input type="number" value={splitCount} onChange={e => setSplit(Number(e.target.value))} min="1"
            className="w-full px-3 py-2.5 text-sm border border-out-var rounded-xl focus:outline-none focus:ring-2 focus:ring-clay/30 bg-white font-body" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-head font-semibold text-espresso mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}
            className="w-full px-3 py-2.5 text-sm border border-out-var rounded-xl focus:outline-none focus:ring-2 focus:ring-clay/30 bg-white font-body">
            {(Object.keys(CATEGORY_META) as ExpenseCategory[]).map(c => (
              <option key={c} value={c}>{CATEGORY_META[c].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-head font-semibold text-espresso mb-1">Due date (optional)</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-out-var rounded-xl focus:outline-none focus:ring-2 focus:ring-clay/30 bg-white font-body" />
        </div>
      </div>

      {amount && Number(amount) > 0 && splitCount > 0 && (
        <p className="text-sm font-head text-clay-dark">
          = <strong>{perPerson(Number(amount), splitCount)}</strong> per person
        </p>
      )}

      {err && <p className="text-xs text-red-600">{err}</p>}

      <div className="flex gap-2 pt-1">
        <button onClick={submit} disabled={saving}
          className="clay-grad text-white text-sm font-head font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
          {saving ? 'Saving…' : 'Add Expense'}
        </button>
        <button onClick={onClose}
          className="px-4 py-2.5 text-sm font-head text-muted hover:text-espresso rounded-xl hover:bg-white transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

/* ─── Create Household Form ──────────────────────────── */
function CreateHouseholdForm({ userId, onCreated }: { userId: string; onCreated: (h: Household) => void }) {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  async function create() {
    if (!name.trim()) { setErr('Enter a household name'); return }
    setSaving(true); setErr(null)

    const { data: hh, error: hhErr } = await supabase
      .from('households')
      .insert({ name: name.trim(), created_by: userId })
      .select()
      .single()

    if (hhErr) { setErr(hhErr.message); setSaving(false); return }

    // Add creator as admin member
    await supabase.from('household_members').insert({
      household_id: hh.id,
      user_id: userId,
      role: 'admin',
    })

    onCreated(hh as Household)
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-out-var p-8 shadow-sm max-w-md mx-auto text-center">
      <div className="w-16 h-16 clay-grad rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
        <span className="material-symbols-outlined fill text-white text-3xl">house</span>
      </div>
      <h2 className="font-display text-2xl font-light text-clay-dark italic mb-1">Set up your household</h2>
      <p className="text-sm font-body text-muted mb-6">
        Create a shared space to track rent, utilities, and expenses with your roommates.
      </p>
      <input value={name} onChange={e => setName(e.target.value)}
        placeholder="e.g. The Scholar House"
        className="w-full px-4 py-3 text-sm border border-out-var rounded-xl focus:outline-none focus:ring-2 focus:ring-clay/30 font-body mb-3"
        onKeyDown={e => e.key === 'Enter' && create()}
      />
      {err && <p className="text-xs text-red-600 mb-3">{err}</p>}
      <button onClick={create} disabled={saving}
        className="w-full clay-grad text-white font-head font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
        {saving ? 'Creating…' : 'Create Household'}
      </button>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────── */
export default function HouseholdPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId]               = useState<string | null>(null)
  const [households, setHouseholds]       = useState<Household[]>([])
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(null)
  const [expenses, setExpenses]           = useState<HouseholdExpense[]>([])
  const [members, setMembers]             = useState<{ user_id: string; role: string; profile?: Profile }[]>([])
  const [loading, setLoading]             = useState(true)
  const [showAddForm, setShowAddForm]     = useState(false)
  const [activeTab, setActiveTab]         = useState<'expenses' | 'members' | 'reminders'>('expenses')
  const [inviteCopied, setInviteCopied]   = useState(false)
  const [connectingBank, setConnectingBank] = useState(false)
  const [paymentMsg, setPaymentMsg]       = useState<string | null>(null)
  const [deletingId, setDeletingId]       = useState<string | null>(null)

  // Load all households this user belongs to
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth'); return }
      setUserId(user.id)

      // Fetch every household_id where user is a member
      const { data: memberships } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)

      const hhIds = (memberships ?? []).map((m: any) => m.household_id as string)

      if (hhIds.length > 0) {
        const { data: hhData } = await supabase
          .from('households')
          .select('*')
          .in('id', hhIds)
          .order('created_at', { ascending: false })

        const hhs = (hhData ?? []) as Household[]
        setHouseholds(hhs)
        if (hhs.length > 0) setActiveHouseholdId(hhs[0].id)
      }

      setLoading(false)
    }
    load()

    // Handle return from Stripe Checkout (bank account setup)
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'saved') {
      setPaymentMsg('✓ Payment method saved! Your bank account is connected.')
      window.history.replaceState({}, '', '/tenant/household')
    } else if (params.get('payment') === 'cancelled') {
      setPaymentMsg('Setup cancelled — you can connect your bank account any time.')
      window.history.replaceState({}, '', '/tenant/household')
    }
  }, [router])

  // Reload expenses + members whenever the active household changes
  useEffect(() => {
    if (!activeHouseholdId) { setExpenses([]); setMembers([]); return }
    const loadData = async () => {
      const { data: expData } = await supabase
        .from('household_expenses')
        .select('*')
        .eq('household_id', activeHouseholdId)
        .order('created_at', { ascending: false })
      setExpenses((expData ?? []) as HouseholdExpense[])

      const { data: membData } = await supabase
        .from('household_members')
        .select('user_id, role, profile:profiles(first_name, last_name, avatar_url)')
        .eq('household_id', activeHouseholdId)
      const normalised = (membData ?? []).map((m: any) => ({
        ...m,
        profile: Array.isArray(m.profile) ? m.profile[0] ?? undefined : m.profile ?? undefined,
      }))
      setMembers(normalised as { user_id: string; role: string; profile?: Profile }[])
    }
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHouseholdId])

  async function handleDeleteHousehold(householdId: string) {
    if (!confirm('Delete this household? This will remove all members and expenses and cannot be undone.')) return
    setDeletingId(householdId)
    await supabase.from('household_expenses').delete().eq('household_id', householdId)
    await supabase.from('household_members').delete().eq('household_id', householdId)
    await supabase.from('households').delete().eq('id', householdId)
    const remaining = households.filter(h => h.id !== householdId)
    setHouseholds(remaining)
    if (activeHouseholdId === householdId) {
      setActiveHouseholdId(remaining.length > 0 ? remaining[0].id : null)
      setExpenses([])
      setMembers([])
    }
    setDeletingId(null)
  }

  async function handleConnectBank() {
    setConnectingBank(true)
    try {
      const res  = await fetch('/api/stripe/student/setup-payment', { method: 'POST' })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        setPaymentMsg(json.error ?? 'Something went wrong. Please try again.')
        setConnectingBank(false)
      }
    } catch {
      setPaymentMsg('Network error — please try again.')
      setConnectingBank(false)
    }
  }

  async function handleSettle(id: string) {
    const { data } = await supabase
      .from('household_expenses')
      .update({ status: 'settled' })
      .eq('id', id)
      .select()
      .single()
    if (data) setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'settled' } : e))
  }

  async function handleUnsettle(id: string) {
    const { data } = await supabase
      .from('household_expenses')
      .update({ status: 'pending' })
      .eq('id', id)
      .select()
      .single()
    if (data) setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'pending' } : e))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return
    await supabase.from('household_expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  function handleAdd(e: HouseholdExpense) {
    setExpenses(prev => [e, ...prev])
  }

  function copyInviteCode() {
    if (!household?.invite_code) return
    const link = `${window.location.origin}/tenant/household/join?code=${household.invite_code}`
    navigator.clipboard.writeText(link).then(() => {
      setInviteCopied(true)
      setTimeout(() => setInviteCopied(false), 2000)
    })
  }

  // ── Derived household (active selection) ──
  const household = households.find(h => h.id === activeHouseholdId) ?? null
  const isAdmin = !!household && (household.created_by === userId || members.some(m => m.user_id === userId && m.role === 'admin'))

  // ── Computed totals ──
  const totalThisMonth = expenses.reduce((s, e) => s + e.amount, 0)
  const memberCount    = members.length || 1
  // Per-person total uses each expense's own split_count, not the member count
  const perPersonTotal = expenses.reduce((s, e) => s + e.amount / Math.max(e.split_count, 1), 0)
  const allSettled     = expenses.length > 0 && expenses.every(e => e.status === 'settled')
  const pendingCount   = expenses.filter(e => e.status === 'pending').length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surf-lo">
        <div className="w-8 h-8 border-2 border-clay rounded-full border-t-transparent animate-spin" />
      </div>
    )
  }

  // No household yet — show setup screen
  if (households.length === 0) {
    return (
      <div className="min-h-screen bg-surf-lo flex flex-col">
        <div className="bg-white border-b border-out-var px-6 py-5">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-linen transition-colors">
              <span className="material-symbols-outlined text-espresso">arrow_back</span>
            </Link>
            <h1 className="font-head font-bold text-espresso text-lg">Household</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          {userId && (
            <CreateHouseholdForm
              userId={userId}
              onCreated={hh => { setHouseholds([hh]); setActiveHouseholdId(hh.id); setMembers([]) }}
            />
          )}
        </div>
      </div>
    )
  }

  // Active household not found (shouldn't happen but guard)
  if (!household) return null

  return (
    <div className="min-h-screen bg-surf-lo pb-20">
      {/* Header */}
      <div className="bg-white border-b border-out-var px-6 py-5 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-linen transition-colors">
              <span className="material-symbols-outlined text-espresso">arrow_back</span>
            </Link>
            <div>
              <h1 className="font-head font-bold text-espresso text-lg">{household.name}</h1>
              <p className="text-xs font-body text-muted">{memberCount} roommate{memberCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyInviteCode}
              className="flex items-center gap-1.5 text-xs font-head font-semibold text-clay-dark bg-linen hover:bg-clay/10 border border-out-var px-3 py-2 rounded-xl transition-colors">
              <span className="material-symbols-outlined text-sm">{inviteCopied ? 'check' : 'link'}</span>
              {inviteCopied ? 'Copied!' : 'Invite link'}
            </button>
            {isAdmin && (
              <button
                onClick={() => handleDeleteHousehold(household.id)}
                disabled={deletingId === household.id}
                title="Delete household"
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50 text-muted hover:text-red-600 border border-out-var transition-colors disabled:opacity-50">
                <span className="material-symbols-outlined text-base">{deletingId === household.id ? 'hourglass_empty' : 'delete'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Household switcher — shown when user belongs to multiple */}
        {households.length > 1 && (
          <div className="max-w-3xl mx-auto mt-3 flex gap-2 overflow-x-auto pb-0.5">
            {households.map(hh => (
              <button
                key={hh.id}
                onClick={() => { setActiveHouseholdId(hh.id); setShowAddForm(false); setActiveTab('expenses') }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-head font-semibold border transition-all
                  ${activeHouseholdId === hh.id
                    ? 'clay-grad text-white border-transparent shadow-sm'
                    : 'bg-linen text-muted border-out-var hover:border-clay/50 hover:text-clay-dark'}`}
              >
                <span className="material-symbols-outlined text-sm">house</span>
                {hh.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Payment message banner */}
      {paymentMsg && (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-sm font-body
            ${paymentMsg.startsWith('✓')
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
            <span>{paymentMsg}</span>
            <button onClick={() => setPaymentMsg(null)} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Monthly summary card */}
        <div className="bg-espresso rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-sm font-head font-semibold text-white/70">
                {new Date().toLocaleString('default', { month: 'long' })} Expenses
              </p>
              <p className="text-xs font-body text-white/50 mt-0.5">{household.name} · {memberCount} roommates</p>
            </div>
            {allSettled && (
              <span className="bg-white/20 text-white text-xs font-head font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined fill text-sm">check_circle</span>
                ALL PAID
              </span>
            )}
            {!allSettled && pendingCount > 0 && (
              <span className="bg-amber-400/20 text-amber-300 text-xs font-head font-bold px-3 py-1 rounded-full">
                {pendingCount} pending
              </span>
            )}
          </div>

          {/* Expense list inside card */}
          <div className="space-y-3 mb-5">
            {expenses.slice(0, 4).map(e => {
              const meta = CATEGORY_META[e.category] ?? CATEGORY_META.other
              return (
                <div key={e.id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.color} opacity-90`}>
                    <span className="material-symbols-outlined fill text-white text-base">{meta.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-head font-semibold text-white truncate">{e.title}</p>
                    <p className={`text-xs ${e.status === 'settled' ? 'text-green-400' : 'text-amber-300'}`}>
                      {e.status === 'settled' ? '✓ Settled' : '⏳ Pending'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-head font-bold text-white">{perPerson(e.amount, e.split_count)} each</p>
                  </div>
                </div>
              )
            })}
            {expenses.length === 0 && (
              <p className="text-sm font-body text-white/50 text-center py-3">No expenses yet — add your first one below.</p>
            )}
          </div>

          {/* Total */}
          <div className="border-t border-white/20 pt-4 flex items-center justify-between">
            <p className="text-sm font-head text-white/70">Total this month</p>
            <p className="font-display text-3xl font-light text-white italic">
              ${perPersonTotal.toFixed(0)}<span className="text-lg text-white/60"> /person</span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-out-var rounded-xl p-1 shadow-sm">
          {(['expenses', 'members', 'reminders'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-head font-semibold rounded-lg capitalize transition-all
                ${activeTab === tab ? 'clay-grad text-white shadow-sm' : 'text-muted hover:text-espresso'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── EXPENSES TAB ── */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {/* Add expense */}
            {!showAddForm ? (
              <button onClick={() => setShowAddForm(true)}
                className="w-full clay-grad text-white font-head font-semibold py-3 rounded-xl shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">add</span>
                Add Expense
              </button>
            ) : (
              <AddExpenseForm
                householdId={household.id}
                memberCount={memberCount}
                onAdd={handleAdd}
                onClose={() => setShowAddForm(false)}
              />
            )}

            {/* Expense list */}
            <div className="bg-white rounded-2xl border border-out-var shadow-sm overflow-hidden">
              {expenses.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-muted">receipt_long</span>
                  <p className="font-head font-semibold text-espresso mt-2">No expenses yet</p>
                  <p className="text-sm font-body text-muted">Add rent, utilities, or shared costs above.</p>
                </div>
              ) : (
                expenses.map(e => (
                  <ExpenseRow
                    key={e.id}
                    expense={e}
                    onSettle={handleSettle}
                    onUnsettle={handleUnsettle}
                    onDelete={handleDelete}
                    isOwner={e.paid_by === userId}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ── MEMBERS TAB ── */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-out-var shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-out-var flex items-center justify-between">
                <h3 className="font-head font-bold text-espresso">Roommates ({memberCount})</h3>
                <button onClick={copyInviteCode}
                  className="clay-grad text-white text-xs font-head font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">{inviteCopied ? 'check' : 'person_add'}</span>
                  {inviteCopied ? 'Link copied!' : 'Invite'}
                </button>
              </div>
              {members.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-body text-muted">Share the invite link to add roommates.</p>
                </div>
              ) : (
                <div className="divide-y divide-out-var">
                  {members.map(m => {
                    const p = m.profile
                    const name = p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Member' : 'Member'
                    return (
                      <div key={m.user_id} className="flex items-center gap-4 px-5 py-4">
                        <div className="w-10 h-10 clay-grad rounded-full flex items-center justify-center shrink-0 shadow-sm">
                          {p?.avatar_url ? (
                            <img src={p.avatar_url} alt={name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-white font-head font-bold text-sm">{name[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-head font-semibold text-espresso text-sm">{name}</p>
                          <p className="text-xs font-body text-muted capitalize">{m.role}</p>
                        </div>
                        {m.user_id === userId && (
                          <span className="text-xs font-head font-bold text-clay-dark bg-linen px-2.5 py-1 rounded-full">You</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── REMINDERS TAB ── */}
        {activeTab === 'reminders' && (
          <div className="space-y-4">
            {/* Upcoming due dates */}
            <div className="bg-white rounded-2xl border border-out-var shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-out-var">
                <h3 className="font-head font-bold text-espresso">Upcoming Due Dates</h3>
                <p className="text-xs font-body text-muted mt-0.5">Expenses with due dates approaching</p>
              </div>
              <div className="divide-y divide-out-var">
                {expenses
                  .filter(e => e.due_date && e.status === 'pending')
                  .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
                  .slice(0, 5)
                  .map(e => {
                    const daysUntil = e.due_date
                      ? Math.ceil((new Date(e.due_date).getTime() - Date.now()) / 86400000)
                      : null
                    const urgent = daysUntil !== null && daysUntil <= 3
                    return (
                      <div key={e.id} className="px-5 py-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${urgent ? 'bg-red-100' : 'bg-linen'}`}>
                          <span className={`material-symbols-outlined fill text-lg ${urgent ? 'text-red-500' : 'text-clay'}`}>
                            schedule
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-head font-semibold text-espresso text-sm">{e.title}</p>
                          <p className={`text-xs font-body mt-0.5 ${urgent ? 'text-red-600 font-semibold' : 'text-muted'}`}>
                            Due {new Date(e.due_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {daysUntil !== null && ` · ${daysUntil < 0 ? 'Overdue' : daysUntil === 0 ? 'Today' : `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-head font-bold text-espresso">{perPerson(e.amount, e.split_count)}</p>
                          <p className="text-xs font-body text-muted">per person</p>
                        </div>
                      </div>
                    )
                  })}
                {expenses.filter(e => e.due_date && e.status === 'pending').length === 0 && (
                  <div className="py-10 text-center">
                    <span className="material-symbols-outlined text-4xl text-muted">check_circle</span>
                    <p className="font-head font-semibold text-espresso mt-2">All clear</p>
                    <p className="text-sm font-body text-muted">No upcoming due dates. Add expenses with due dates to track them here.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ACH payment info */}
            <div className="bg-white rounded-2xl border border-out-var p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 clay-grad rounded-xl flex items-center justify-center shadow-md shrink-0">
                  <span className="material-symbols-outlined fill text-white text-lg">account_balance</span>
                </div>
                <div>
                  <h4 className="font-head font-bold text-espresso text-sm">Stripe ACH Payments</h4>
                  <p className="text-xs font-body text-muted">Bank-to-bank, no fees for students</p>
                </div>
              </div>
              <p className="text-sm font-body text-muted leading-relaxed">
                Connect your bank account to pay your share directly through UTenancy.
                Landlords receive direct deposits automatically — no Venmo math, no awkward reminders.
              </p>
              <button
                onClick={handleConnectBank}
                disabled={connectingBank}
                className="mt-4 w-full clay-grad text-white font-head font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                <span className="material-symbols-outlined text-base">account_balance</span>
                {connectingBank ? 'Redirecting to Stripe…' : 'Connect Bank Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
