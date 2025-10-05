import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getMembers(filters = {}) {
  let query = supabase.from('members').select('*').order('created_at', { ascending: false })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,member_number.ilike.%${filters.search}%,policy_number.ilike.%${filters.search}%`)
  }

  const { data, error } = await query
  return { data, error }
}

export async function getMemberById(id) {
  const { data, error } = await supabase
    .from('members')
    .select('*, dependents(*)')
    .eq('id', id)
    .maybeSingle()

  return { data, error }
}

export async function createMember(memberData) {
  const { data, error } = await supabase
    .from('members')
    .insert([memberData])
    .select()

  return { data, error }
}

export async function updateMember(id, memberData) {
  const { data, error } = await supabase
    .from('members')
    .update({ ...memberData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()

  return { data, error }
}

export async function deleteMember(id) {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id)

  return { error }
}

export async function getDependents(memberId) {
  const { data, error } = await supabase
    .from('dependents')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: true })

  return { data, error }
}

export async function createDependent(dependentData) {
  const { data, error } = await supabase
    .from('dependents')
    .insert([dependentData])
    .select()

  return { data, error }
}

export async function getContributions(filters = {}) {
  let query = supabase
    .from('contributions')
    .select('*, members(full_name, member_number)')
    .order('payment_date', { ascending: false })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.memberId) {
    query = query.eq('member_id', filters.memberId)
  }

  const { data, error } = await query
  return { data, error }
}

export async function createContribution(contributionData) {
  const { data, error } = await supabase
    .from('contributions')
    .insert([contributionData])
    .select()

  if (!error && contributionData.status === 'paid') {
    await updateFundBalance(contributionData.amount, 'add')
  }

  return { data, error }
}

export async function updateContribution(id, contributionData) {
  const { data: oldContribution } = await supabase
    .from('contributions')
    .select('status, amount')
    .eq('id', id)
    .maybeSingle()

  const { data, error } = await supabase
    .from('contributions')
    .update(contributionData)
    .eq('id', id)
    .select()

  if (!error && oldContribution?.status !== 'paid' && contributionData.status === 'paid') {
    await updateFundBalance(contributionData.amount || oldContribution.amount, 'add')
  }

  return { data, error }
}

export async function getClaims(filters = {}) {
  let query = supabase
    .from('claims')
    .select('*, members(full_name, member_number)')
    .order('submission_date', { ascending: false })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  return { data, error }
}

export async function createClaim(claimData) {
  const { data, error } = await supabase
    .from('claims')
    .insert([claimData])
    .select()

  return { data, error }
}

export async function updateClaim(id, claimData) {
  const { data: oldClaim } = await supabase
    .from('claims')
    .select('status, payout_amount')
    .eq('id', id)
    .maybeSingle()

  const { data, error } = await supabase
    .from('claims')
    .update(claimData)
    .eq('id', id)
    .select()

  if (!error && oldClaim?.status !== 'paid' && claimData.status === 'paid' && claimData.payout_amount) {
    await updateFundBalance(claimData.payout_amount, 'subtract')
  }

  return { data, error }
}

export async function getNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return { data, error }
}

export async function createNotification(notificationData) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([notificationData])
    .select()

  return { data, error }
}

export async function getFundBalance() {
  const { data, error } = await supabase
    .from('fund_balance')
    .select('*')
    .maybeSingle()

  return { data, error }
}

export async function updateFundBalance(amount, operation = 'add') {
  const { data: currentBalance } = await getFundBalance()

  if (!currentBalance) return { error: 'Fund balance not found' }

  const newBalance = operation === 'add'
    ? parseFloat(currentBalance.balance) + parseFloat(amount)
    : parseFloat(currentBalance.balance) - parseFloat(amount)

  const newTotalContributions = operation === 'add'
    ? parseFloat(currentBalance.total_contributions) + parseFloat(amount)
    : currentBalance.total_contributions

  const newTotalClaims = operation === 'subtract'
    ? parseFloat(currentBalance.total_claims_paid) + parseFloat(amount)
    : currentBalance.total_claims_paid

  const { data, error } = await supabase
    .from('fund_balance')
    .update({
      balance: newBalance,
      total_contributions: newTotalContributions,
      total_claims_paid: newTotalClaims,
      updated_at: new Date().toISOString()
    })
    .eq('id', currentBalance.id)
    .select()

  return { data, error }
}

export async function getDashboardStats() {
  const [
    { data: members },
    { data: dependents },
    { data: contributions },
    { data: claims },
    { data: fundBalance }
  ] = await Promise.all([
    supabase.from('members').select('id, status'),
    supabase.from('dependents').select('id'),
    supabase.from('contributions').select('id, status, amount, month, year'),
    supabase.from('claims').select('id, status'),
    getFundBalance()
  ])

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const monthlyContributions = contributions
    ?.filter(c => c.month === currentMonth && c.year === currentYear && c.status === 'paid')
    ?.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0

  return {
    totalMembers: members?.length || 0,
    activeMembers: members?.filter(m => m.status === 'active').length || 0,
    inactiveMembers: members?.filter(m => m.status === 'inactive').length || 0,
    totalDependents: dependents?.length || 0,
    monthlyContributions,
    pendingClaims: claims?.filter(c => c.status === 'pending').length || 0,
    approvedClaims: claims?.filter(c => c.status === 'approved').length || 0,
    paidClaims: claims?.filter(c => c.status === 'paid').length || 0,
    fundBalance: parseFloat(fundBalance?.balance || 0),
    totalContributions: parseFloat(fundBalance?.total_contributions || 0),
    totalClaimsPaid: parseFloat(fundBalance?.total_claims_paid || 0)
  }
}
