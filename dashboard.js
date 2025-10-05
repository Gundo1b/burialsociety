import { getDashboardStats } from './supabase.js'

export async function renderDashboard() {
  const container = document.getElementById('contentArea')

  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
    </div>
  `

  const stats = await getDashboardStats()

  container.innerHTML = `
    <div class="page-header">
      <h1>Dashboard Overview</h1>
      <p>Monitor your burial society's performance and key metrics</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Total Members</span>
          <div class="stat-icon blue">
            <i class="fas fa-users"></i>
          </div>
        </div>
        <div class="stat-value">${stats.totalMembers}</div>
        <div class="stat-change">${stats.activeMembers} active, ${stats.inactiveMembers} inactive</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Total Dependents</span>
          <div class="stat-icon green">
            <i class="fas fa-user-friends"></i>
          </div>
        </div>
        <div class="stat-value">${stats.totalDependents}</div>
        <div class="stat-change">Family members covered</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Monthly Contributions</span>
          <div class="stat-icon green">
            <i class="fas fa-money-bill-wave"></i>
          </div>
        </div>
        <div class="stat-value">R ${stats.monthlyContributions.toFixed(2)}</div>
        <div class="stat-change">This month's collections</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Pending Claims</span>
          <div class="stat-icon orange">
            <i class="fas fa-file-invoice"></i>
          </div>
        </div>
        <div class="stat-value">${stats.pendingClaims}</div>
        <div class="stat-change">${stats.approvedClaims} approved, ${stats.paidClaims} paid</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Available Fund Balance</span>
          <div class="stat-icon blue">
            <i class="fas fa-wallet"></i>
          </div>
        </div>
        <div class="stat-value">R ${stats.fundBalance.toFixed(2)}</div>
        <div class="stat-change">Total collected: R ${stats.totalContributions.toFixed(2)}</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <h3>Member Status Distribution</h3>
        <div class="chart-container">
          <canvas id="memberStatusChart"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <h3>Financial Overview</h3>
        <div class="chart-container">
          <canvas id="financialChart"></canvas>
        </div>
      </div>
    </div>

    <h3 style="margin-bottom: 16px; font-size: 20px; font-weight: 600;">Quick Actions</h3>
    <div class="quick-actions">
      <div class="action-btn" onclick="window.app.navigateTo('members')">
        <i class="fas fa-user-plus"></i>
        <span>Add Member</span>
      </div>
      <div class="action-btn" onclick="window.app.navigateTo('claims')">
        <i class="fas fa-check-circle"></i>
        <span>Approve Claims</span>
      </div>
      <div class="action-btn" onclick="window.app.navigateTo('contributions')">
        <i class="fas fa-money-check"></i>
        <span>Record Payment</span>
      </div>
      <div class="action-btn" onclick="window.app.navigateTo('notifications')">
        <i class="fas fa-paper-plane"></i>
        <span>Send Notification</span>
      </div>
    </div>
  `

  renderCharts(stats)
}

function renderCharts(stats) {
  renderPieChart(stats)
  renderBarChart(stats)
}

function renderPieChart(stats) {
  const canvas = document.getElementById('memberStatusChart')
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const width = canvas.parentElement.clientWidth
  const height = canvas.parentElement.clientHeight
  canvas.width = width
  canvas.height = height

  const data = [
    { label: 'Active', value: stats.activeMembers, color: '#22c55e' },
    { label: 'Inactive', value: stats.inactiveMembers, color: '#6b7280' }
  ]

  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) {
    ctx.fillStyle = '#6b7280'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('No data available', width / 2, height / 2)
    return
  }

  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 3

  let currentAngle = -Math.PI / 2

  data.forEach(item => {
    const sliceAngle = (item.value / total) * 2 * Math.PI

    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
    ctx.closePath()
    ctx.fillStyle = item.color
    ctx.fill()

    const middleAngle = currentAngle + sliceAngle / 2
    const textX = centerX + Math.cos(middleAngle) * (radius / 1.5)
    const textY = centerY + Math.sin(middleAngle) * (radius / 1.5)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(item.value, textX, textY)

    currentAngle += sliceAngle
  })

  const legendY = height - 40
  let legendX = centerX - 80

  data.forEach(item => {
    ctx.fillStyle = item.color
    ctx.fillRect(legendX, legendY, 15, 15)

    ctx.fillStyle = '#374151'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`${item.label}: ${item.value}`, legendX + 20, legendY + 12)

    legendX += 100
  })
}

function renderBarChart(stats) {
  const canvas = document.getElementById('financialChart')
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const width = canvas.parentElement.clientWidth
  const height = canvas.parentElement.clientHeight
  canvas.width = width
  canvas.height = height

  const data = [
    { label: 'Fund Balance', value: stats.fundBalance, color: '#2563eb' },
    { label: 'Monthly Contributions', value: stats.monthlyContributions, color: '#22c55e' },
    { label: 'Claims Paid', value: stats.totalClaimsPaid, color: '#ef4444' }
  ]

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const barWidth = (width - 100) / data.length
  const chartHeight = height - 80
  const padding = 50

  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * chartHeight
    const x = padding + index * barWidth + (barWidth - 60) / 2
    const y = height - padding - barHeight

    ctx.fillStyle = item.color
    ctx.fillRect(x, y, 60, barHeight)

    ctx.fillStyle = '#374151'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(item.label, x + 30, height - 25)

    ctx.fillStyle = '#111827'
    ctx.font = 'bold 11px sans-serif'
    ctx.fillText(`R ${item.value.toFixed(0)}`, x + 30, y - 5)
  })

  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding, height - padding)
  ctx.lineTo(width - 20, height - padding)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(padding, padding)
  ctx.lineTo(padding, height - padding)
  ctx.stroke()
}
