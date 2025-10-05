import { supabase } from './supabase.js'

async function seedDatabase() {
  console.log('Starting database seeding...')

  const sampleMembers = [
    {
      member_number: 'MEM001',
      policy_number: 'POL001',
      full_name: 'John Doe',
      phone: '+27 82 123 4567',
      email: 'john.doe@example.com',
      address: '123 Main Street, Johannesburg, 2000',
      status: 'active',
      monthly_contribution: 250.00,
      join_date: '2023-01-15'
    },
    {
      member_number: 'MEM002',
      policy_number: 'POL002',
      full_name: 'Jane Smith',
      phone: '+27 83 234 5678',
      email: 'jane.smith@example.com',
      address: '456 Oak Avenue, Pretoria, 0001',
      status: 'active',
      monthly_contribution: 300.00,
      join_date: '2023-02-20'
    },
    {
      member_number: 'MEM003',
      policy_number: 'POL003',
      full_name: 'Peter Johnson',
      phone: '+27 84 345 6789',
      email: 'peter.j@example.com',
      address: '789 Pine Road, Cape Town, 8001',
      status: 'active',
      monthly_contribution: 250.00,
      join_date: '2023-03-10'
    },
    {
      member_number: 'MEM004',
      policy_number: 'POL004',
      full_name: 'Mary Williams',
      phone: '+27 85 456 7890',
      email: 'mary.w@example.com',
      address: '321 Elm Street, Durban, 4001',
      status: 'inactive',
      monthly_contribution: 200.00,
      join_date: '2022-11-05'
    }
  ]

  console.log('Inserting sample members...')
  const { data: members, error: membersError } = await supabase
    .from('members')
    .insert(sampleMembers)
    .select()

  if (membersError) {
    console.error('Error inserting members:', membersError)
    return
  }

  console.log(`Inserted ${members.length} members`)

  const sampleDependents = [
    {
      member_id: members[0].id,
      full_name: 'Sarah Doe',
      relationship: 'spouse',
      date_of_birth: '1985-06-15',
      id_number: '8506155678901'
    },
    {
      member_id: members[0].id,
      full_name: 'Tommy Doe',
      relationship: 'child',
      date_of_birth: '2010-03-20',
      id_number: '1003205678902'
    },
    {
      member_id: members[1].id,
      full_name: 'Robert Smith',
      relationship: 'spouse',
      date_of_birth: '1982-09-10',
      id_number: '8209105678903'
    }
  ]

  console.log('Inserting sample dependents...')
  const { data: dependents, error: dependentsError } = await supabase
    .from('dependents')
    .insert(sampleDependents)
    .select()

  if (dependentsError) {
    console.error('Error inserting dependents:', dependentsError)
    return
  }

  console.log(`Inserted ${dependents.length} dependents`)

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const sampleContributions = [
    {
      member_id: members[0].id,
      amount: 250.00,
      payment_date: '2024-01-05',
      status: 'paid',
      payment_method: 'bank_transfer',
      reference_number: 'REF001',
      month: currentMonth,
      year: currentYear
    },
    {
      member_id: members[1].id,
      amount: 300.00,
      payment_date: '2024-01-08',
      status: 'paid',
      payment_method: 'cash',
      month: currentMonth,
      year: currentYear
    },
    {
      member_id: members[2].id,
      amount: 250.00,
      payment_date: '2024-01-10',
      status: 'paid',
      payment_method: 'mobile_money',
      reference_number: 'REF002',
      month: currentMonth,
      year: currentYear
    },
    {
      member_id: members[3].id,
      amount: 200.00,
      payment_date: currentYear + '-' + String(currentMonth).padStart(2, '0') + '-01',
      status: 'unpaid',
      month: currentMonth,
      year: currentYear
    }
  ]

  console.log('Inserting sample contributions...')
  const { data: contributions, error: contributionsError } = await supabase
    .from('contributions')
    .insert(sampleContributions)
    .select()

  if (contributionsError) {
    console.error('Error inserting contributions:', contributionsError)
    return
  }

  console.log(`Inserted ${contributions.length} contributions`)

  const paidContributionsTotal = sampleContributions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0)

  console.log('Updating fund balance...')
  const { error: fundError } = await supabase
    .from('fund_balance')
    .update({
      balance: paidContributionsTotal,
      total_contributions: paidContributionsTotal,
      total_claims_paid: 0
    })
    .eq('id', (await supabase.from('fund_balance').select('id').maybeSingle()).data.id)

  if (fundError) {
    console.error('Error updating fund balance:', fundError)
    return
  }

  console.log('Database seeding completed successfully!')
  console.log('Summary:')
  console.log(`- Members: ${members.length}`)
  console.log(`- Dependents: ${dependents.length}`)
  console.log(`- Contributions: ${contributions.length}`)
  console.log(`- Fund Balance: R ${paidContributionsTotal.toFixed(2)}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
}

export { seedDatabase }
