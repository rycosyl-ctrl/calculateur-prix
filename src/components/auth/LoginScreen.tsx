import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../auth/AuthContext'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

export function LoginScreen() {
  const { signIn, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      const err = await signIn(email, password)
      if (err) setError(err)
    } finally {
      setBusy(false)
    }
  }

  const onForgotPassword = async () => {
    setError(null)
    setInfo(null)
    if (!email) {
      setError('Saisissez d’abord votre email, puis cliquez à nouveau sur « Mot de passe oublié ».')
      return
    }
    setBusy(true)
    try {
      const err = await resetPassword(email)
      if (err) {
        setError(err)
      } else {
        setInfo('Email envoyé : cliquez sur le lien reçu pour choisir un nouveau mot de passe.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-bold tracking-tight text-slate-900">Calculateur de prix</h1>
        <p className="mt-1 text-xs text-slate-500">
          Accès sur invitation. Connectez-vous pour retrouver vos calculs.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Mot de passe</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {info && <p className="text-xs text-emerald-700">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? 'Patientez…' : 'Se connecter'}
          </button>
        </form>

        <button
          type="button"
          onClick={onForgotPassword}
          disabled={busy}
          className="mt-4 w-full text-center text-xs text-indigo-600 hover:underline disabled:opacity-50"
        >
          Mot de passe oublié ?
        </button>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Pas de compte ? Demandez une invitation au responsable de l’outil.
        </p>
      </div>
    </div>
  )
}
