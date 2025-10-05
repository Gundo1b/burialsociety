import { getMembers, createMember, updateMember, deleteMember, getMemberById, getDependents, createDependent } from './supabase.js'

let currentMembers = []
let currentFilter = 'all'
let searchTerm = ''

export async function renderMembers() {
  const container = document.getElementById('contentArea')

  container.innerHTML = `
    <div class="page-header">
      <h1>Member Management</h1>
      <p>Manage society members and their families</p>
    </div>

    <div class="data-table-container">
      <div class="table-header">
        <h3>All Members</h3>
        <div class="table-controls">
          <div class="search-box">
            <input type="text" id="memberSearch" placeholder="Search by name, ID, or policy...">
            <i class="fas fa-search"></i>
          </div>
          <div class="filter-group">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="active">Active</button>
            <button class="filter-btn" data-filter="inactive">Inactive</button>
          </div>
          <button class="btn btn-primary btn-sm" onclick="window.membersModule.showAddMemberModal()">
            <i class="fas fa-plus"></i>
            Add Member
          </button>
        </div>
      </div>
      <div id="membersTableContent">
        <div class="loading">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  `

  document.getElementById('memberSearch').addEventListener('input', (e) => {
    searchTerm = e.target.value
    loadMembers()
  })

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
      e.target.classList.add('active')
      currentFilter = e.target.dataset.filter
      loadMembers()
    })
  })

  await loadMembers()
}

async function loadMembers() {
  const filters = {}

  if (currentFilter !== 'all') {
    filters.status = currentFilter
  }

  if (searchTerm) {
    filters.search = searchTerm
  }

  const { data, error } = await getMembers(filters)

  if (error) {
    document.getElementById('membersTableContent').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error loading members</h3>
        <p>${error.message}</p>
      </div>
    `
    return
  }

  currentMembers = data || []
  renderMembersTable()
}

function renderMembersTable() {
  const content = document.getElementById('membersTableContent')

  if (currentMembers.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <h3>No members found</h3>
        <p>Start by adding your first member to the system</p>
        <button class="btn btn-primary" onclick="window.membersModule.showAddMemberModal()">
          <i class="fas fa-plus"></i>
          Add Member
        </button>
      </div>
    `
    return
  }

  content.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Member #</th>
          <th>Policy #</th>
          <th>Full Name</th>
          <th>Phone</th>
          <th>Email</th>
          <th>Status</th>
          <th>Monthly Contribution</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${currentMembers.map(member => `
          <tr>
            <td>${member.member_number}</td>
            <td>${member.policy_number}</td>
            <td>${member.full_name}</td>
            <td>${member.phone || '-'}</td>
            <td>${member.email || '-'}</td>
            <td><span class="status-badge ${member.status}">${member.status}</span></td>
            <td>R ${parseFloat(member.monthly_contribution || 0).toFixed(2)}</td>
            <td>
              <div class="table-actions">
                <button class="action-icon-btn" onclick="window.membersModule.viewMember('${member.id}')" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="action-icon-btn edit" onclick="window.membersModule.editMember('${member.id}')" title="Edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-icon-btn delete" onclick="window.membersModule.deleteMemberConfirm('${member.id}')" title="Delete">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

export function showAddMemberModal() {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>Add New Member</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <form id="addMemberForm" class="form-grid">
          <div class="form-group">
            <label for="memberNumber">Member Number *</label>
            <input type="text" id="memberNumber" required>
          </div>
          <div class="form-group">
            <label for="policyNumber">Policy Number *</label>
            <input type="text" id="policyNumber" required>
          </div>
          <div class="form-group form-group-full">
            <label for="fullName">Full Name *</label>
            <input type="text" id="fullName" required>
          </div>
          <div class="form-group">
            <label for="phone">Phone</label>
            <input type="tel" id="phone">
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email">
          </div>
          <div class="form-group form-group-full">
            <label for="address">Address</label>
            <textarea id="address"></textarea>
          </div>
          <div class="form-group">
            <label for="monthlyContribution">Monthly Contribution (R) *</label>
            <input type="number" id="monthlyContribution" step="0.01" required>
          </div>
          <div class="form-group">
            <label for="status">Status *</label>
            <select id="status" required>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div class="form-group">
            <label for="joinDate">Join Date *</label>
            <input type="date" id="joinDate" value="${new Date().toISOString().split('T')[0]}" required>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="window.membersModule.saveMember()">
          <i class="fas fa-save"></i>
          Save Member
        </button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

export async function saveMember() {
  const memberData = {
    member_number: document.getElementById('memberNumber').value,
    policy_number: document.getElementById('policyNumber').value,
    full_name: document.getElementById('fullName').value,
    phone: document.getElementById('phone').value,
    email: document.getElementById('email').value,
    address: document.getElementById('address').value,
    monthly_contribution: parseFloat(document.getElementById('monthlyContribution').value),
    status: document.getElementById('status').value,
    join_date: document.getElementById('joinDate').value
  }

  const { data, error } = await createMember(memberData)

  if (error) {
    alert('Error creating member: ' + error.message)
    return
  }

  document.querySelector('.modal-overlay').remove()
  await loadMembers()
}

export async function viewMember(memberId) {
  const { data: member, error } = await getMemberById(memberId)

  if (error || !member) {
    alert('Error loading member details')
    return
  }

  const { data: dependents } = await getDependents(memberId)

  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal" style="max-width: 800px;">
      <div class="modal-header">
        <h2>Member Details</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
          <div>
            <strong>Member Number:</strong> ${member.member_number}
          </div>
          <div>
            <strong>Policy Number:</strong> ${member.policy_number}
          </div>
          <div>
            <strong>Full Name:</strong> ${member.full_name}
          </div>
          <div>
            <strong>Status:</strong> <span class="status-badge ${member.status}">${member.status}</span>
          </div>
          <div>
            <strong>Phone:</strong> ${member.phone || '-'}
          </div>
          <div>
            <strong>Email:</strong> ${member.email || '-'}
          </div>
          <div style="grid-column: 1 / -1;">
            <strong>Address:</strong> ${member.address || '-'}
          </div>
          <div>
            <strong>Monthly Contribution:</strong> R ${parseFloat(member.monthly_contribution || 0).toFixed(2)}
          </div>
          <div>
            <strong>Join Date:</strong> ${new Date(member.join_date).toLocaleDateString()}
          </div>
        </div>

        <div class="family-tree">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3>Family Members & Dependents</h3>
            <button class="btn btn-primary btn-sm" onclick="window.membersModule.showAddDependentModal('${memberId}')">
              <i class="fas fa-plus"></i>
              Add Dependent
            </button>
          </div>
          ${(dependents && dependents.length > 0) ? `
            ${dependents.map(dep => `
              <div class="tree-node">
                <div class="tree-node-header">
                  <div class="tree-node-info">
                    <div>
                      <div class="tree-node-name">${dep.full_name}</div>
                      <div class="tree-node-relationship">${dep.relationship}</div>
                    </div>
                  </div>
                  <div>
                    ${dep.date_of_birth ? new Date(dep.date_of_birth).toLocaleDateString() : '-'}
                  </div>
                </div>
              </div>
            `).join('')}
          ` : '<p style="color: var(--text-secondary); text-align: center; padding: 24px;">No dependents added yet</p>'}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

export function showAddDependentModal(memberId) {
  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>Add Dependent</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <form id="addDependentForm" class="form-grid">
          <div class="form-group form-group-full">
            <label for="depFullName">Full Name *</label>
            <input type="text" id="depFullName" required>
          </div>
          <div class="form-group">
            <label for="relationship">Relationship *</label>
            <select id="relationship" required>
              <option value="">Select...</option>
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label for="dateOfBirth">Date of Birth</label>
            <input type="date" id="dateOfBirth">
          </div>
          <div class="form-group form-group-full">
            <label for="idNumber">ID Number</label>
            <input type="text" id="idNumber">
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="window.membersModule.saveDependent('${memberId}')">
          <i class="fas fa-save"></i>
          Save Dependent
        </button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

export async function saveDependent(memberId) {
  const dependentData = {
    member_id: memberId,
    full_name: document.getElementById('depFullName').value,
    relationship: document.getElementById('relationship').value,
    date_of_birth: document.getElementById('dateOfBirth').value || null,
    id_number: document.getElementById('idNumber').value || null
  }

  const { error } = await createDependent(dependentData)

  if (error) {
    alert('Error adding dependent: ' + error.message)
    return
  }

  const modals = document.querySelectorAll('.modal-overlay')
  modals.forEach(m => m.remove())

  await viewMember(memberId)
}

export async function editMember(memberId) {
  const member = currentMembers.find(m => m.id === memberId)
  if (!member) return

  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>Edit Member</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <form id="editMemberForm" class="form-grid">
          <div class="form-group">
            <label for="editMemberNumber">Member Number *</label>
            <input type="text" id="editMemberNumber" value="${member.member_number}" required>
          </div>
          <div class="form-group">
            <label for="editPolicyNumber">Policy Number *</label>
            <input type="text" id="editPolicyNumber" value="${member.policy_number}" required>
          </div>
          <div class="form-group form-group-full">
            <label for="editFullName">Full Name *</label>
            <input type="text" id="editFullName" value="${member.full_name}" required>
          </div>
          <div class="form-group">
            <label for="editPhone">Phone</label>
            <input type="tel" id="editPhone" value="${member.phone || ''}">
          </div>
          <div class="form-group">
            <label for="editEmail">Email</label>
            <input type="email" id="editEmail" value="${member.email || ''}">
          </div>
          <div class="form-group form-group-full">
            <label for="editAddress">Address</label>
            <textarea id="editAddress">${member.address || ''}</textarea>
          </div>
          <div class="form-group">
            <label for="editMonthlyContribution">Monthly Contribution (R) *</label>
            <input type="number" id="editMonthlyContribution" step="0.01" value="${member.monthly_contribution}" required>
          </div>
          <div class="form-group">
            <label for="editStatus">Status *</label>
            <select id="editStatus" required>
              <option value="active" ${member.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="inactive" ${member.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="window.membersModule.updateMemberData('${memberId}')">
          <i class="fas fa-save"></i>
          Update Member
        </button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

export async function updateMemberData(memberId) {
  const memberData = {
    member_number: document.getElementById('editMemberNumber').value,
    policy_number: document.getElementById('editPolicyNumber').value,
    full_name: document.getElementById('editFullName').value,
    phone: document.getElementById('editPhone').value,
    email: document.getElementById('editEmail').value,
    address: document.getElementById('editAddress').value,
    monthly_contribution: parseFloat(document.getElementById('editMonthlyContribution').value),
    status: document.getElementById('editStatus').value
  }

  const { error } = await updateMember(memberId, memberData)

  if (error) {
    alert('Error updating member: ' + error.message)
    return
  }

  document.querySelector('.modal-overlay').remove()
  await loadMembers()
}

export async function deleteMemberConfirm(memberId) {
  const member = currentMembers.find(m => m.id === memberId)
  if (!member) return

  if (!confirm(`Are you sure you want to delete ${member.full_name}? This action cannot be undone.`)) {
    return
  }

  const { error } = await deleteMember(memberId)

  if (error) {
    alert('Error deleting member: ' + error.message)
    return
  }

  await loadMembers()
}

window.membersModule = {
  showAddMemberModal,
  saveMember,
  viewMember,
  showAddDependentModal,
  saveDependent,
  editMember,
  updateMemberData,
  deleteMemberConfirm
}
