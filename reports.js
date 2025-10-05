import { getMembers, getContributions, getClaims, getFundBalance } from './supabase.js'

export async function renderReports() {
  const container = document.getElementById('contentArea')

  container.innerHTML = `
    <div class="page-header">
      <h1>Reports</h1>
      <p>Generate and export detailed reports</p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
      <div class="chart-card">
        <h3>Member Reports</h3>
        <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 14px;">
          Generate reports on member activity and status
        </p>
        <button class="btn btn-primary" onclick="window.reportsModule.generateMemberReport()">
          <i class="fas fa-file-download"></i>
          Generate Member Report
        </button>
      </div>

      <div class="chart-card">
        <h3>Contribution Reports</h3>
        <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 14px;">
          View payment history and collection summaries
        </p>
        <div class="form-group" style="margin-bottom: 16px;">
          <label for="contribMonth">Month</label>
          <select id="contribMonth">
            ${Array.from({length: 12}, (_, i) => {
              const month = i + 1
              const monthName = new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
              return `<option value="${month}">${monthName}</option>`
            }).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label for="contribYear">Year</label>
          <input type="number" id="contribYear" value="${new Date().getFullYear()}">
        </div>
        <button class="btn btn-primary" onclick="window.reportsModule.generateContributionReport()">
          <i class="fas fa-file-download"></i>
          Generate Contribution Report
        </button>
      </div>

      <div class="chart-card">
        <h3>Claims Reports</h3>
        <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 14px;">
          Track claims processed and payout history
        </p>
        <button class="btn btn-primary" onclick="window.reportsModule.generateClaimsReport()">
          <i class="fas fa-file-download"></i>
          Generate Claims Report
        </button>
      </div>

      <div class="chart-card">
        <h3>Financial Summary</h3>
        <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 14px;">
          Complete financial overview and fund balance
        </p>
        <button class="btn btn-primary" onclick="window.reportsModule.generateFinancialReport()">
          <i class="fas fa-file-download"></i>
          Generate Financial Report
        </button>
      </div>
    </div>

    <div id="reportPreview" style="margin-top: 32px;"></div>
  `

  const currentMonth = new Date().getMonth() + 1
  document.getElementById('contribMonth').value = currentMonth
}

export async function generateMemberReport() {
  const { data: members } = await getMembers()

  if (!members) {
    alert('Error loading member data')
    return
  }

  const activeMembers = members.filter(m => m.status === 'active')
  const inactiveMembers = members.filter(m => m.status === 'inactive')

  const reportHtml = `
    <div class="data-table-container">
      <div class="table-header">
        <h3>Member Report - Generated ${new Date().toLocaleString()}</h3>
        <button class="btn btn-secondary btn-sm" onclick="window.reportsModule.exportToCSV('members')">
          <i class="fas fa-file-csv"></i>
          Export CSV
        </button>
      </div>
      <div style="padding: 24px;">
        <div class="stats-grid" style="margin-bottom: 24px;">
          <div class="stat-card">
            <div class="stat-title">Total Members</div>
            <div class="stat-value">${members.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Active Members</div>
            <div class="stat-value">${activeMembers.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Inactive Members</div>
            <div class="stat-value">${inactiveMembers.length}</div>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Member #</th>
              <th>Policy #</th>
              <th>Full Name</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Monthly Contribution</th>
              <th>Join Date</th>
            </tr>
          </thead>
          <tbody>
            ${members.map(m => `
              <tr>
                <td>${m.member_number}</td>
                <td>${m.policy_number}</td>
                <td>${m.full_name}</td>
                <td>${m.phone || '-'}</td>
                <td><span class="status-badge ${m.status}">${m.status}</span></td>
                <td>R ${parseFloat(m.monthly_contribution || 0).toFixed(2)}</td>
                <td>${new Date(m.join_date).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `

  document.getElementById('reportPreview').innerHTML = reportHtml
  window.currentReportData = { type: 'members', data: members }
}

export async function generateContributionReport() {
  const month = parseInt(document.getElementById('contribMonth').value)
  const year = parseInt(document.getElementById('contribYear').value)

  const { data: allContributions } = await getContributions()

  if (!allContributions) {
    alert('Error loading contribution data')
    return
  }

  const contributions = allContributions.filter(c => c.month === month && c.year === year)

  const totalPaid = contributions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)

  const totalUnpaid = contributions
    .filter(c => c.status === 'unpaid')
    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)

  const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })

  const reportHtml = `
    <div class="data-table-container">
      <div class="table-header">
        <h3>Contribution Report - ${monthName} ${year}</h3>
        <button class="btn btn-secondary btn-sm" onclick="window.reportsModule.exportToCSV('contributions')">
          <i class="fas fa-file-csv"></i>
          Export CSV
        </button>
      </div>
      <div style="padding: 24px;">
        <div class="stats-grid" style="margin-bottom: 24px;">
          <div class="stat-card">
            <div class="stat-title">Total Contributions</div>
            <div class="stat-value">${contributions.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Total Paid</div>
            <div class="stat-value">R ${totalPaid.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Total Outstanding</div>
            <div class="stat-value">R ${totalUnpaid.toFixed(2)}</div>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Member #</th>
              <th>Amount</th>
              <th>Payment Date</th>
              <th>Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${contributions.map(c => `
              <tr>
                <td>${c.members?.full_name || '-'}</td>
                <td>${c.members?.member_number || '-'}</td>
                <td>R ${parseFloat(c.amount).toFixed(2)}</td>
                <td>${new Date(c.payment_date).toLocaleDateString()}</td>
                <td>${c.payment_method || '-'}</td>
                <td><span class="status-badge ${c.status}">${c.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `

  document.getElementById('reportPreview').innerHTML = reportHtml
  window.currentReportData = { type: 'contributions', data: contributions }
}

export async function generateClaimsReport() {
  const { data: claims } = await getClaims()

  if (!claims) {
    alert('Error loading claims data')
    return
  }

  const totalClaims = claims.length
  const pendingClaims = claims.filter(c => c.status === 'pending').length
  const approvedClaims = claims.filter(c => c.status === 'approved').length
  const paidClaims = claims.filter(c => c.status === 'paid').length
  const rejectedClaims = claims.filter(c => c.status === 'rejected').length

  const totalPaid = claims
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + parseFloat(c.payout_amount || 0), 0)

  const reportHtml = `
    <div class="data-table-container">
      <div class="table-header">
        <h3>Claims Report - Generated ${new Date().toLocaleString()}</h3>
        <button class="btn btn-secondary btn-sm" onclick="window.reportsModule.exportToCSV('claims')">
          <i class="fas fa-file-csv"></i>
          Export CSV
        </button>
      </div>
      <div style="padding: 24px;">
        <div class="stats-grid" style="margin-bottom: 24px;">
          <div class="stat-card">
            <div class="stat-title">Total Claims</div>
            <div class="stat-value">${totalClaims}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Pending</div>
            <div class="stat-value">${pendingClaims}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Approved</div>
            <div class="stat-value">${approvedClaims}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Paid</div>
            <div class="stat-value">${paidClaims}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Total Paid Out</div>
            <div class="stat-value">R ${totalPaid.toFixed(2)}</div>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Deceased</th>
              <th>Claim Amount</th>
              <th>Payout Amount</th>
              <th>Submission Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${claims.map(c => `
              <tr>
                <td>${c.members?.full_name || '-'}</td>
                <td>${c.deceased_name}</td>
                <td>R ${parseFloat(c.claim_amount).toFixed(2)}</td>
                <td>${c.payout_amount ? `R ${parseFloat(c.payout_amount).toFixed(2)}` : '-'}</td>
                <td>${new Date(c.submission_date).toLocaleDateString()}</td>
                <td><span class="status-badge ${c.status}">${c.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `

  document.getElementById('reportPreview').innerHTML = reportHtml
  window.currentReportData = { type: 'claims', data: claims }
}

export async function generateFinancialReport() {
  const { data: fundBalance } = await getFundBalance()
  const { data: contributions } = await getContributions({ status: 'paid' })
  const { data: claims } = await getClaims({ status: 'paid' })

  if (!fundBalance) {
    alert('Error loading financial data')
    return
  }

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const monthlyContributions = contributions
    ?.filter(c => c.month === currentMonth && c.year === currentYear)
    ?.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0

  const reportHtml = `
    <div class="data-table-container">
      <div class="table-header">
        <h3>Financial Summary - Generated ${new Date().toLocaleString()}</h3>
        <button class="btn btn-secondary btn-sm" onclick="window.print()">
          <i class="fas fa-print"></i>
          Print Report
        </button>
      </div>
      <div style="padding: 24px;">
        <div class="stats-grid" style="margin-bottom: 24px;">
          <div class="stat-card">
            <div class="stat-title">Current Fund Balance</div>
            <div class="stat-value">R ${parseFloat(fundBalance.balance).toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Total Contributions Collected</div>
            <div class="stat-value">R ${parseFloat(fundBalance.total_contributions).toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Total Claims Paid</div>
            <div class="stat-value">R ${parseFloat(fundBalance.total_claims_paid).toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">This Month's Collections</div>
            <div class="stat-value">R ${monthlyContributions.toFixed(2)}</div>
          </div>
        </div>

        <div style="background: var(--bg-secondary); padding: 24px; border-radius: 12px; margin-top: 24px;">
          <h4 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">Financial Health</h4>
          <div style="display: grid; gap: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Total Income (Contributions):</span>
              <strong>R ${parseFloat(fundBalance.total_contributions).toFixed(2)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Total Expenses (Claims):</span>
              <strong>R ${parseFloat(fundBalance.total_claims_paid).toFixed(2)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px solid var(--border-color);">
              <span style="font-weight: 600;">Net Position:</span>
              <strong style="color: ${parseFloat(fundBalance.balance) > 0 ? 'var(--success-color)' : 'var(--danger-color)'};">
                R ${parseFloat(fundBalance.balance).toFixed(2)}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  document.getElementById('reportPreview').innerHTML = reportHtml
}

export function exportToCSV(type) {
  if (!window.currentReportData || window.currentReportData.type !== type) {
    alert('Please generate the report first')
    return
  }

  const data = window.currentReportData.data
  let csv = ''
  let filename = ''

  switch (type) {
    case 'members':
      csv = 'Member Number,Policy Number,Full Name,Phone,Email,Status,Monthly Contribution,Join Date\n'
      data.forEach(m => {
        csv += `"${m.member_number}","${m.policy_number}","${m.full_name}","${m.phone || ''}","${m.email || ''}","${m.status}","${m.monthly_contribution}","${new Date(m.join_date).toLocaleDateString()}"\n`
      })
      filename = 'members_report.csv'
      break

    case 'contributions':
      csv = 'Member,Member Number,Amount,Payment Date,Method,Status\n'
      data.forEach(c => {
        csv += `"${c.members?.full_name || ''}","${c.members?.member_number || ''}","${c.amount}","${new Date(c.payment_date).toLocaleDateString()}","${c.payment_method || ''}","${c.status}"\n`
      })
      filename = 'contributions_report.csv'
      break

    case 'claims':
      csv = 'Member,Deceased,Claim Amount,Payout Amount,Submission Date,Status\n'
      data.forEach(c => {
        csv += `"${c.members?.full_name || ''}","${c.deceased_name}","${c.claim_amount}","${c.payout_amount || ''}","${new Date(c.submission_date).toLocaleDateString()}","${c.status}"\n`
      })
      filename = 'claims_report.csv'
      break
  }

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

window.reportsModule = {
  generateMemberReport,
  generateContributionReport,
  generateClaimsReport,
  generateFinancialReport,
  exportToCSV
}
