import './style.css'
import { initAuth, handleLogout } from './auth.js'
import { renderDashboard } from './dashboard.js'
import { renderMembers } from './members.js'
import { renderContributions } from './contributions.js'
import { renderClaims } from './claims.js'
import { renderNotifications } from './notifications.js'
import { renderReports } from './reports.js'

class App {
  constructor() {
    this.currentPage = 'dashboard'
    this.theme = localStorage.getItem('theme') || 'light'
  }

  init() {
    this.applyTheme()
    this.setupEventListeners()
    this.navigateTo('dashboard')
  }

  setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const page = e.currentTarget.dataset.page
        this.navigateTo(page)
      })
    })

    document.getElementById('themeToggle').addEventListener('click', () => {
      this.toggleTheme()
    })

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await handleLogout()
    })

    document.getElementById('menuToggle')?.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar')
      sidebar.classList.toggle('active')
    })

    document.addEventListener('click', (e) => {
      const sidebar = document.getElementById('sidebar')
      const menuToggle = document.getElementById('menuToggle')

      if (sidebar.classList.contains('active') &&
          !sidebar.contains(e.target) &&
          !menuToggle.contains(e.target)) {
        sidebar.classList.remove('active')
      }
    })
  }

  async navigateTo(page) {
    this.currentPage = page

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active')
    })

    const activeItem = document.querySelector(`[data-page="${page}"]`)
    if (activeItem) {
      activeItem.classList.add('active')
    }

    const sidebar = document.getElementById('sidebar')
    if (sidebar.classList.contains('active')) {
      sidebar.classList.remove('active')
    }

    switch (page) {
      case 'dashboard':
        await renderDashboard()
        break
      case 'members':
        await renderMembers()
        break
      case 'contributions':
        await renderContributions()
        break
      case 'claims':
        await renderClaims()
        break
      case 'notifications':
        await renderNotifications()
        break
      case 'reports':
        await renderReports()
        break
      default:
        await renderDashboard()
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', this.theme)
    this.applyTheme()
  }

  applyTheme() {
    const root = document.documentElement
    const themeIcon = document.querySelector('#themeToggle i')

    if (this.theme === 'dark') {
      root.setAttribute('data-theme', 'dark')
      if (themeIcon) {
        themeIcon.className = 'fas fa-sun'
      }
    } else {
      root.removeAttribute('data-theme')
      if (themeIcon) {
        themeIcon.className = 'fas fa-moon'
      }
    }
  }
}

const app = new App()
window.app = app

initAuth()
