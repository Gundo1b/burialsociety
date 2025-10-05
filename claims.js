import { getClaims, createClaim, updateClaim, getMembers, getDependents } from './supabase.js'

let currentClaims = []
let currentFilter = 'all'

export async function renderClaims() {
  const container = document.getElementById('contentArea')

  container.innerHTML = `
    <div class="page-header">
      <h1>Claims Management</h1>
      <p>Process and track death benefit claims</p>
    </div>

    <div class="data-table-container">
      <div class="table-header">
        <h3>Claims Dashboard</h3>
        <div class="table-controls">
          <div class="filter-group">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="pending">Pending</button>
            <button class="filter-btn" data-filter="approved">Approved</button>
            <button class="filter-btn" data-filter="paid">Paid</button>
            <button class="filter-btn" data-filter="rejected">Rejected</button>
          </div>
          <button class="btn btn-primary btn-sm" onclick="window.claimsModule.showAddClaimModal()">
            <i class="fas fa-plus"></i>
            Submit Claim
          </button>
        </div>
      </div>
      <div id="claimsTableContent">
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
      loadClaims()
    })
  })

  await loadClaims()
}

async function loadClaims() {
  const filters = currentFilter !== 'all' ? { status: currentFilter } : {}

  const { data, error } = await getClaims(filters)

  if (error) {
    document.getElementById('claimsTableContent').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error loading claims</h3>
        <p>${error.message}</p>
      </div>
    `
    return
  }

  currentClaims = data || []
  renderClaimsTable()
}

function renderClaimsTable() {
  const content = document.getElementById('claimsTableContent')

  if (currentClaims.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-file-invoice-dollar"></i>
        <h3>No claims found</h3>
        <p>Submit a claim when a member or dependent passes away</p>
        <button class="btn btn-primary" onclick="window.claimsModule.showAddClaimModal()">
          <i class="fas fa-plus"></i>
          Submit Claim
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
          <th>Deceased</th>
          <th>Claim Amount (R)</th>
          <th>Payout Amount (R)</th>
          <th>Submission Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${currentClaims.map(claim => `
          <tr>
            <td>${claim.members?.full_name || '-'}</td>
            <td>${claim.deceased_name}</td>
            <td>R ${parseFloat(claim.claim_amount).toFixed(2)}</td>
            <td>${claim.payout_amount ? `R ${parseFloat(claim.payout_amount).toFixed(2)}` : '-'}</td>
            <td>${new Date(claim.submission_date).toLocaleDateString()}</td>
            <td><span class="status-badge ${claim.status}">${claim.status}</span></td>
            <td>
              <div class="table-actions">
                <button class="action-icon-btn" onclick="window.claimsModule.viewClaim('${claim.id}')" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                ${claim.status === 'pending' ? `
                  <button class="action-icon-btn edit" onclick="window.claimsModule.approveClaim('${claim.id}')" title="Approve">
                    <i class="fas fa-check"></i>
                  </button>
                  <button class="action-icon-btn delete" onclick="window.claimsModule.rejectClaim('${claim.id}')" title="Reject">
                    <i class="fas fa-times"></i>
                  </button>
                ` : ''}
                ${claim.status === 'approved' ? `
                  <button class="action-icon-btn edit" onclick="window.claimsModule.markAsPaid('${claim.id}')" title="Mark as Paid">
                    <i class="fas fa-money-check"></i>
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

export async function showAddClaimModal() {
  const { data: members } = await getMembers({ status: 'active' })

  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>Submit Claim</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <form id="addClaimForm" class="form-grid">
          <div class="form-group form-group-full">
            <label for="claimMemberId">Member Filing Claim *</label>
            <select id="claimMemberId" required onchange="window.claimsModule.loadDependents(this.value)">
              <option value="">Select Member...</option>
              ${members?.map(m => `
                <option value="${m.id}">${m.full_name} (${m.member_number})</option>
              `).join('') || ''}
            </select>
          </div>
          <div class="form-group form-group-full">
            <label for="dependentId">Dependent (Optional)</label>
            <select id="dependentId">
              <option value="">Select if deceased is a dependent...</option>
            </select>
          </div>
          <div class="form-group form-group-full">
            <label for="deceasedName">Deceased Name *</label>
            <input type="text" id="deceasedName" required>
          </div>
          <div class="form-group">
            <label for="claimAmount">Claim Amount (R) *</label>
            <input type="number" id="claimAmount" step="0.01" required>
          </div>
          <div class="form-group">
            <label for="submissionDate">Submission Date *</label>
            <input type="date" id="submissionDate" value="${new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="form-group form-group-full">
            <label for="claimNotes">Notes</label>
            <textarea id="claimNotes" placeholder="Additional information about the claim..."></textarea>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="window.claimsModule.saveClaim()">
          <i class="fas fa-save"></i>
          Submit Claim
        </button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

export async function loadDependents(memberId) {
  const dependentSelect = document.getElementById('dependentId')
  const deceasedNameInput = document.getElementById('deceasedName')

  if (!memberId) {
    dependentSelect.innerHTML = '<option value="">Select if deceased is a dependent...</option>'
    return
  }

  const { data: dependents } = await getDependents(memberId)

  dependentSelect.innerHTML = `
    <option value="">Select if deceased is a dependent...</option>
    ${dependents?.map(d => `
      <option value="${d.id}">${d.full_name} (${d.relationship})</option>
    `).join('') || ''}
  `

  dependentSelect.addEventListener('change', (e) => {
    if (e.target.value) {
      const dependent = dependents.find(d => d.id === e.target.value)
      if (dependent) {
        deceasedNameInput.value = dependent.full_name
      }
    }
  })
}

export async function saveClaim() {
  const claimData = {
    member_id: document.getElementById('claimMemberId').value,
    dependent_id: document.getElementById('dependentId').value || null,
    deceased_name: document.getElementById('deceasedName').value,
    claim_amount: parseFloat(document.getElementById('claimAmount').value),
    submission_date: document.getElementById('submissionDate').value,
    notes: document.getElementById('claimNotes').value || null,
    status: 'pending'
  }

  const { error } = await createClaim(claimData)

  if (error) {
    alert('Error submitting claim: ' + error.message)
    return
  }

  document.querySelector('.modal-overlay').remove()
  await loadClaims()
}

export async function viewClaim(claimId) {
  const claim = currentClaims.find(c => c.id === claimId)
  if (!claim) return

  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>Claim Details</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div>
            <strong>Member Filing:</strong> ${claim.members?.full_name || '-'}
          </div>
          <div>
            <strong>Member Number:</strong> ${claim.members?.member_number || '-'}
          </div>
          <div>
            <strong>Deceased:</strong> ${claim.deceased_name}
          </div>
          <div>
            <strong>Status:</strong> <span class="status-badge ${claim.status}">${claim.status}</span>
          </div>
          <div>
            <strong>Claim Amount:</strong> R ${parseFloat(claim.claim_amount).toFixed(2)}
          </div>
          <div>
            <strong>Payout Amount:</strong> ${claim.payout_amount ? `R ${parseFloat(claim.payout_amount).toFixed(2)}` : '-'}
          </div>
          <div>
            <strong>Submission Date:</strong> ${new Date(claim.submission_date).toLocaleDateString()}
          </div>
          <div>
            <strong>Approval Date:</strong> ${claim.approval_date ? new Date(claim.approval_date).toLocaleDateString() : '-'}
          </div>
          <div>
            <strong>Payout Date:</strong> ${claim.payout_date ? new Date(claim.payout_date).toLocaleDateString() : '-'}
          </div>
          <div style="grid-column: 1 / -1;">
            <strong>Notes:</strong>
            <p style="margin-top: 8px; color: var(--text-secondary);">${claim.notes || 'No notes provided'}</p>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        ${claim.status === 'pending' ? `
          <button class="btn btn-danger" onclick="window.claimsModule.rejectClaim('${claim.id}')">
            <i class="fas fa-times"></i>
            Reject
          </button>
          <button class="btn btn-success" onclick="window.claimsModule.approveClaim('${claim.id}')">
            <i class="fas fa-check"></i>
            Approve
          </button>
        ` : ''}
        ${claim.status === 'approved' ? `
          <button class="btn btn-primary" onclick="window.claimsModule.markAsPaid('${claim.id}')">
            <i class="fas fa-money-check"></i>
            Mark as Paid
          </button>
        ` : ''}
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

export async function approveClaim(claimId) {
  const claim = currentClaims.find(c => c.id === claimId)
  if (!claim) return

  const { error } = await updateClaim(claimId, {
    status: 'approved',
    approval_date: new Date().toISOString().split('T')[0],
    payout_amount: claim.claim_amount
  })

  if (error) {
    alert('Error approving claim: ' + error.message)
    return
  }

  const modals = document.querySelectorAll('.modal-overlay')
  modals.forEach(m => m.remove())

  await loadClaims()
}

export async function rejectClaim(claimId) {
  if (!confirm('Are you sure you want to reject this claim?')) return

  const { error } = await updateClaim(claimId, {
    status: 'rejected'
  })

  if (error) {
    alert('Error rejecting claim: ' + error.message)
    return
  }

  const modals = document.querySelectorAll('.modal-overlay')
  modals.forEach(m => m.remove())

  await loadClaims()
}

export async function markAsPaid(claimId) {
  const claim = currentClaims.find(c => c.id === claimId)
  if (!claim) return

  const payoutAmount = prompt('Enter payout amount:', claim.payout_amount || claim.claim_amount)
  if (!payoutAmount) return

  const { error } = await updateClaim(claimId, {
    status: 'paid',
    payout_amount: parseFloat(payoutAmount),
    payout_date: new Date().toISOString().split('T')[0]
  })

  if (error) {
    alert('Error marking claim as paid: ' + error.message)
    return
  }

  const modals = document.querySelectorAll('.modal-overlay')
  modals.forEach(m => m.remove())

  await loadClaims()
}

window.claimsModule = {
  showAddClaimModal,
  loadDependents,
  saveClaim,
  viewClaim,
  approveClaim,
  rejectClaim,
  markAsPaid
}
