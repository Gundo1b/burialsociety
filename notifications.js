import { getNotifications, createNotification, getMembers } from './supabase.js'

export async function renderNotifications() {
  const container = document.getElementById('contentArea')

  container.innerHTML = `
    <div class="page-header">
      <h1>Notifications</h1>
      <p>Send reminders and alerts to members</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
      <div class="action-btn" style="padding: 32px;" onclick="window.notificationsModule.showSendNotificationModal('payment_reminder')">
        <i class="fas fa-bell" style="color: #f59e0b;"></i>
        <span>Send Payment Reminder</span>
      </div>
      <div class="action-btn" style="padding: 32px;" onclick="window.notificationsModule.showSendNotificationModal('general')">
        <i class="fas fa-paper-plane"></i>
        <span>Send General Notification</span>
      </div>
    </div>

    <div class="data-table-container">
      <div class="table-header">
        <h3>Notification History</h3>
      </div>
      <div id="notificationsContent">
        <div class="loading">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  `

  await loadNotifications()
}

async function loadNotifications() {
  const { data, error } = await getNotifications()

  if (error) {
    document.getElementById('notificationsContent').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error loading notifications</h3>
        <p>${error.message}</p>
      </div>
    `
    return
  }

  renderNotificationsTable(data || [])
}

function renderNotificationsTable(notifications) {
  const content = document.getElementById('notificationsContent')

  if (notifications.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-bell"></i>
        <h3>No notifications sent yet</h3>
        <p>Start by sending a notification to members</p>
      </div>
    `
    return
  }

  content.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Type</th>
          <th>Title</th>
          <th>Message</th>
          <th>Status</th>
          <th>Sent At</th>
        </tr>
      </thead>
      <tbody>
        ${notifications.map(notif => `
          <tr>
            <td><span class="status-badge ${notif.type === 'payment_reminder' ? 'warning' : 'active'}">${notif.type.replace('_', ' ')}</span></td>
            <td>${notif.title}</td>
            <td>${notif.message.substring(0, 60)}${notif.message.length > 60 ? '...' : ''}</td>
            <td><span class="status-badge ${notif.status === 'sent' ? 'paid' : 'pending'}">${notif.status}</span></td>
            <td>${notif.sent_at ? new Date(notif.sent_at).toLocaleString() : '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

export async function showSendNotificationModal(type) {
  const { data: members } = await getMembers({ status: 'active' })

  const modal = document.createElement('div')
  modal.className = 'modal-overlay'
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${type === 'payment_reminder' ? 'Send Payment Reminder' : 'Send Notification'}</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <form id="sendNotificationForm" class="form-grid">
          <div class="form-group form-group-full">
            <label for="notifMemberId">Member *</label>
            <select id="notifMemberId" required>
              <option value="all">All Active Members</option>
              ${members?.map(m => `
                <option value="${m.id}">${m.full_name} (${m.member_number})</option>
              `).join('') || ''}
            </select>
          </div>
          <div class="form-group form-group-full">
            <label for="notifTitle">Title *</label>
            <input type="text" id="notifTitle" required
              value="${type === 'payment_reminder' ? 'Payment Reminder' : ''}"
              placeholder="Notification title">
          </div>
          <div class="form-group form-group-full">
            <label for="notifMessage">Message *</label>
            <textarea id="notifMessage" required rows="6"
              placeholder="Type your message here...">${type === 'payment_reminder' ? 'This is a friendly reminder that your monthly contribution is due. Please make your payment at your earliest convenience.' : ''}</textarea>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="window.notificationsModule.sendNotification('${type}')">
          <i class="fas fa-paper-plane"></i>
          Send Notification
        </button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

export async function sendNotification(type) {
  const memberId = document.getElementById('notifMemberId').value
  const title = document.getElementById('notifTitle').value
  const message = document.getElementById('notifMessage').value

  if (memberId === 'all') {
    const { data: members } = await getMembers({ status: 'active' })

    if (members && members.length > 0) {
      for (const member of members) {
        await createNotification({
          member_id: member.id,
          type,
          title,
          message,
          status: 'sent',
          sent_at: new Date().toISOString()
        })
      }
    }
  } else {
    await createNotification({
      member_id: memberId,
      type,
      title,
      message,
      status: 'sent',
      sent_at: new Date().toISOString()
    })
  }

  document.querySelector('.modal-overlay').remove()
  await loadNotifications()

  const successAlert = document.createElement('div')
  successAlert.className = 'alert success'
  successAlert.style.position = 'fixed'
  successAlert.style.top = '20px'
  successAlert.style.right = '20px'
  successAlert.style.zIndex = '3000'
  successAlert.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <span>Notification${memberId === 'all' ? 's' : ''} sent successfully!</span>
  `
  document.body.appendChild(successAlert)

  setTimeout(() => {
    successAlert.remove()
  }, 3000)
}

window.notificationsModule = {
  showSendNotificationModal,
  sendNotification
}
