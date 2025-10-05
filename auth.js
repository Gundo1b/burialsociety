import { supabase, signIn, signUp, signOut, getSession } from './supabase.js'

let currentUser = null

export function initAuth() {
  supabase.auth.onAuthStateChange((event, session) => {
    (async () => {
      if (event === 'SIGNED_IN' && session) {
        currentUser = session.user
        showMainApp()
      } else if (event === 'SIGNED_OUT') {
        currentUser = null
        showAuthScreen()
      }
    })()
  })

  checkAuthStatus()
}

async function checkAuthStatus() {
  const session = await getSession()
  if (session) {
    currentUser = session.user
    showMainApp()
  } else {
    showAuthScreen()
  }
}

function showAuthScreen() {
  const authContainer = document.getElementById('auth-container')
  const mainApp = document.getElementById('main-app')

  authContainer.style.display = 'flex'
  mainApp.style.display = 'none'

  authContainer.innerHTML = `
    <div class="auth-box">
      <i class="fas fa-hands-helping auth-icon"></i>
      <h1>Burial Society Management</h1>
      <form class="auth-form" id="authForm">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" placeholder="Enter your email" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" placeholder="Enter your password" required>
        </div>
        <div id="authError" class="alert error" style="display: none;">
          <i class="fas fa-exclamation-circle"></i>
          <span id="authErrorMessage"></span>
        </div>
        <button type="submit" class="btn btn-primary">
          <i class="fas fa-sign-in-alt"></i>
          Sign In
        </button>
      </form>
    </div>
  `

  document.getElementById('authForm').addEventListener('submit', handleAuth)
}

async function handleAuth(e) {
  e.preventDefault()

  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const errorDiv = document.getElementById('authError')
  const errorMessage = document.getElementById('authErrorMessage')

  errorDiv.style.display = 'none'

  const { data, error } = await signIn(email, password)

  if (error) {
    errorMessage.textContent = error.message
    errorDiv.style.display = 'flex'
  }
}

function showMainApp() {
  const authContainer = document.getElementById('auth-container')
  const mainApp = document.getElementById('main-app')

  authContainer.style.display = 'none'
  mainApp.style.display = 'flex'

  const userName = document.getElementById('userName')
  if (currentUser && currentUser.user_metadata?.full_name) {
    userName.textContent = currentUser.user_metadata.full_name
  } else if (currentUser) {
    userName.textContent = currentUser.email.split('@')[0]
  }

  if (window.app) {
    window.app.init()
  }
}

export async function handleLogout() {
  await signOut()
}

export function getCurrentUser() {
  return currentUser
}
