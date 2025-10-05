import { getContributions, createContribution, updateContribution, getMembers } from './supabase.js'

let currentContributions = []
let currentFilter = 'all'

export async function renderContributions() {
  const container = document.getElementById('contentArea')

  container.innerHTML = `
    <div class="page-header">
      <h1>Contribution Tracking</h1>
      <p>Monitor and manage member payments</p>
    </div>

    <div class="data-table-container">
      <div class="table-header">
        <h3>Payment Records</h3>
        <div class="table-controls">
          <div class="filter-group">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="paid">Paid</button>
            <button class="filter-btn" data-filter="unpaid">Unpaid</button>
            <button class="filter-btn" data-filter="overdue">Overdue</button>
          </div>
          <button class="btn btn-primary btn-sm" onclick="window.contributionsModule.showAddContributionModal()">
            <i class="fas fa-plus"></i>
            Record Payment
          </button>
        </div>
      </div>
      <div id="contributionsTableContent">
        <div class="loading">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  `

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
      e.target.classList.add('active')
      currentFilter = e.target.dataset.filter
      loadContributions()
    })
  })

  await loadContributions()
}

async function loadContributions() {
  const filters = currentFilter !== 'all' ? { status: currentFilter } : {}

  const { data, error } = await getContributions(filters)

  if (error) {
    document.getElementById('contributionsTableContent').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error loading contributions</h3>
        <p>${error.message}</p>
      </div>
    `
    return
  }

  currentContributions = data || []
  renderContributionsTable()
}

function renderContributionsTable() {
  const content = document.getElementById('contributionsTableContent')

  if (currentContributions.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-money-bill-wave"></i>
        <h3>No contributions found</h3>
        <p>Start recording member payments</p>
        <button class="btn btn-primary" onclick="window.contributionsModule.showAddContributionModal()">
          <i class="fas fa-plus"></i>
          Record Payment
        </button>
      </div>
    `
    return
  }

  content.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Member</th>
          <th>Member #</th>
          <th>Amount (R)</th>
          <th>Month/Year</th>
          <th>Payment Date</th>
          <th>Method</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${currentContributions.map(contrib => `
          <tr>
            <td>${contrib.members?.full_name || '-'}</td>
            <td>${contrib.members?.member_number || '-'}</td>
            <td>R ${parseFloat(contrib.amount).toFixed(2)}</td>
            <td>${contrib.month}/${contrib.year}</td>
            <td>${new Date(contrib.payment_date).toLocaleDateString()}</td>
            <td>${contrib.payment_method || '-'}</td>
            <td><span class="status-badge ${contrib.status}">${contrib.status}</span></td>
            <td>
              <div class="table-actions">
                ${contrib.status === 'unpaid' ? `
                  <button class="action-icon-btn edit" onclick="window.contributionsModule.markAsPaid('${contrib.id}')" title="Mark as Paid">
                    <i class="fas fa-check"></i>
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

export async function showAddContributionModal() {
  const { data: members } = await getMembers()

  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>Record Payment</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <form id="addContributionForm" class="form-grid">
          <div class="form-group form-group-full">
            <label for="memberId">Member *</label>
            <select id="memberId" required>
              <option value="">Select Member...</option>
              ${members?.map(m => `
                <option value="${m.id}">${m.full_name} (${m.member_number})</option>
              `).join('') || ''}
            </select>
          </div>
          <div class="form-group">
            <label for="amount">Amount (R) *</label>
            <input type="number" id="amount" step="0.01" required>
          </div>
          <div class="form-group">
            <label for="paymentDate">Payment Date *</label>
            <input type="date" id="paymentDate" value="${new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="form-group">
            <label for="month">Month *</label>
            <select id="month" required>
              ${Array.from({length: 12}, (_, i) => {
                const month = i + 1
                const monthName = new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
                return `<option value="${month}">${monthName}</option>`
              }).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="year">Year *</label>
            <input type="number" id="year" value="${new Date().getFullYear()}" required>
          </div>
          <div class="form-group">
            <label for="paymentMethod">Payment Method</label>
            <select id="paymentMethod">
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
            </select>
          </div>
          <div class="form-group">
            <label for="referenceNumber">Reference Number</label>
            <input type="text" id="referenceNumber">
          </div>
          <div class="form-group">
            <label for="contribStatus">Status *</label>
            <select id="contribStatus" required>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="window.contributionsModule.saveContribution()">
          <i class="fas fa-save"></i>
          Save Payment
        </button>
      </div>
    </div>
  `
  document.body.appendChild(modal)

  const currentMonth = new Date().getMonth() + 1
  document.getElementById('month').value = currentMonth
}

export async function saveContribution() {
  const contributionData = {
    member_id: document.getElementById('memberId').value,
    amount: parseFloat(document.getElementById('amount').value),
    payment_date: document.getElementById('paymentDate').value,
    month: parseInt(document.getElementById('month').value),
    year: parseInt(document.getElementById('year').value),
    payment_method: document.getElementById('paymentMethod').value,
    reference_number: document.getElementById('referenceNumber').value || null,
    status: document.getElementById('contribStatus').value
  }

  const { error } = await createContribution(contributionData)

  if (error) {
    alert('Error recording payment: ' + error.message)
    return
  }

  document.querySelector('.modal-overlay').remove()
  await loadContributions()
}

export async function markAsPaid(contributionId) {
  const contribution = currentContributions.find(c => c.id === contributionId)
  if (!contribution) return

  const { error } = await updateContribution(contributionId, {
    status: 'paid',
    payment_date: new Date().toISOString().split('T')[0]
  })

  if (error) {
    alert('Error updating payment: ' + error.message)
    return
  }

  await loadContributions()
}

window.contributionsModule = {
  showAddContributionModal,
  saveContribution,
  markAsPaid
}
