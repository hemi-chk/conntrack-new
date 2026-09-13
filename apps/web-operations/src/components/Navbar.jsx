import {
  Bell,
  Check,
  CheckCheck,
  LogOut,
  Menu,
  Moon,
  Sun,
  Trash2,
} from 'lucide-react'

import { useEffect, useRef, useState } from 'react'

function getOperationsApiBase() {
  const configured =
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:5000'

  const base = configured.replace(/\/+$/, '')

  if (base.endsWith('/api/operations')) {
    return base
  }

  if (base.endsWith('/api')) {
    return `${base}/operations`
  }

  return `${base}/api/operations`
}

const OPERATIONS_API_BASE = getOperationsApiBase()

function getNotificationId(notification) {
  return notification?.id ?? notification?.notification_id
}

function formatNotificationTime(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.floor(diffHours / 24)

  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  return date.toLocaleDateString()
}

function LogoutModal({
  onConfirm,
  onCancel,
  darkMode,
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className={`mx-4 w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl transition-colors duration-300 ${
          darkMode ? 'bg-[#052659]' : 'bg-white'
        }`}
      >
        <div className="p-6">
          <div
            className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
              darkMode ? 'bg-[#021024]' : 'bg-[#EBF4FF]'
            }`}
          >
            <LogOut
              size={22}
              className={
                darkMode ? 'text-[#7DA0CA]' : 'text-[#052659]'
              }
            />
          </div>

          <h2
            className={`mb-1 text-lg font-medium ${
              darkMode ? 'text-white' : 'text-[#021024]'
            }`}
          >
            Sign out?
          </h2>

          <p
            className={`text-sm ${
              darkMode ? 'text-[#7DA0CA]' : 'text-slate-500'
            }`}
          >
            Are you sure you want to log out of your operations account?
          </p>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              darkMode
                ? 'border-[#5483B3]/40 text-[#C1E8FF] hover:bg-[#021024]'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[#052659] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5483B3]"
          >
            Yes, Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

function Navbar({
  isOpen,
  onMenuClick,
  onLogout,
  darkMode,
  onToggleDark,
}) {
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationError, setNotificationError] = useState('')
  const [busyNotificationIds, setBusyNotificationIds] = useState(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  const notificationRef = useRef(null)

  // Display name and designation for the Operations interface.
  // This affects only the navbar text/avatar; authentication still uses
  // the logged-in token from localStorage.
  const userName = 'Ramaza Anver'
  const userRole = 'Operations Handler'
  const initials = 'RA'

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')

    return {
      'Content-Type': 'application/json',
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    }
  }

  const requestNotifications = async (
    path = '',
    options = {}
  ) => {
    const response = await fetch(
      `${OPERATIONS_API_BASE}/notifications${path}`,
      {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...(options.headers || {}),
        },
      }
    )

    const text = await response.text()
    let payload = {}

    if (text) {
      try {
        payload = JSON.parse(text)
      } catch {
        payload = { message: text }
      }
    }

    if (!response.ok) {
      throw new Error(
        payload.message ||
        `Notification request failed with status ${response.status}`
      )
    }

    return payload
  }

  const fetchNotifications = async ({
    silent = false,
  } = {}) => {
    try {
      if (!silent) {
        setNotificationLoading(true)
      }

      setNotificationError('')

      const payload = await requestNotifications()

      const rows = Array.isArray(payload)
        ? payload
        : payload.notifications || []

      setNotifications(rows)

      const count =
        typeof payload.unread_count === 'number'
          ? payload.unread_count
          : rows.filter((item) => !item.is_read).length

      setUnreadCount(count)
    } catch (error) {
      console.error(
        'Failed to load operations notifications:',
        error
      )

      if (!silent) {
        setNotificationError(
          error.message || 'Unable to load notifications.'
        )
      }
    } finally {
      if (!silent) {
        setNotificationLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchNotifications()

    const intervalId = window.setInterval(() => {
      fetchNotifications({ silent: true })
    }, 10000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      )
    }
  }, [])

  const setNotificationBusy = (
    notificationId,
    busy
  ) => {
    setBusyNotificationIds((current) => {
      const next = new Set(current)

      if (busy) {
        next.add(String(notificationId))
      } else {
        next.delete(String(notificationId))
      }

      return next
    })
  }

  const markNotificationRead = async (
    notification
  ) => {
    if (notification.is_read) return

    const notificationId =
      getNotificationId(notification)

    if (notificationId == null) return

    try {
      setNotificationBusy(notificationId, true)

      await requestNotifications(
        `/${notificationId}/read`,
        {
          method: 'PATCH',
        }
      )

      setNotifications((current) =>
        current.map((item) =>
          String(getNotificationId(item)) ===
          String(notificationId)
            ? {
                ...item,
                is_read: true,
                read_at: new Date().toISOString(),
              }
            : item
        )
      )

      setUnreadCount((current) =>
        Math.max(0, current - 1)
      )
    } catch (error) {
      console.error(
        'Failed to mark notification as read:',
        error
      )

      setNotificationError(
        error.message ||
        'Unable to mark notification as read.'
      )
    } finally {
      setNotificationBusy(notificationId, false)
    }
  }

  const deleteNotification = async (
    notification
  ) => {
    const notificationId =
      getNotificationId(notification)

    if (notificationId == null) return

    try {
      setNotificationBusy(notificationId, true)

      await requestNotifications(
        `/${notificationId}`,
        {
          method: 'DELETE',
        }
      )

      setNotifications((current) =>
        current.filter(
          (item) =>
            String(getNotificationId(item)) !==
            String(notificationId)
        )
      )

      if (!notification.is_read) {
        setUnreadCount((current) =>
          Math.max(0, current - 1)
        )
      }
    } catch (error) {
      console.error(
        'Failed to delete notification:',
        error
      )

      setNotificationError(
        error.message ||
        'Unable to remove notification.'
      )
    } finally {
      setNotificationBusy(notificationId, false)
    }
  }

  const markAllRead = async () => {
    if (unreadCount === 0 || bulkBusy) return

    try {
      setBulkBusy(true)
      setNotificationError('')

      await requestNotifications('/read-all', {
        method: 'PATCH',
      })

      const readAt = new Date().toISOString()

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || readAt,
        }))
      )

      setUnreadCount(0)
    } catch (error) {
      console.error(
        'Failed to mark all notifications as read:',
        error
      )

      setNotificationError(
        error.message ||
        'Unable to mark all notifications as read.'
      )
    } finally {
      setBulkBusy(false)
    }
  }

  const clearReadNotifications = async () => {
    const readCount = notifications.filter(
      (item) => item.is_read
    ).length

    if (readCount === 0 || bulkBusy) return

    try {
      setBulkBusy(true)
      setNotificationError('')

      await requestNotifications('/read', {
        method: 'DELETE',
      })

      setNotifications((current) =>
        current.filter((item) => !item.is_read)
      )
    } catch (error) {
      console.error(
        'Failed to clear read notifications:',
        error
      )

      setNotificationError(
        error.message ||
        'Unable to clear read notifications.'
      )
    } finally {
      setBulkBusy(false)
    }
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)

    if (onLogout) {
      onLogout()
      return
    }

    localStorage.clear()

    const adminUrl =
      import.meta.env.VITE_ADMIN_URL ||
      'http://127.0.0.1:5173'

    window.location.href =
      `${adminUrl}?logout=true`
  }

  const hoverBackground = darkMode
    ? '#052659'
    : '#EBF4FF'

  const readCount = notifications.filter(
    (item) => item.is_read
  ).length

  return (
    <>
      {showLogoutModal && (
        <LogoutModal
          onConfirm={confirmLogout}
          onCancel={() =>
            setShowLogoutModal(false)
          }
          darkMode={darkMode}
        />
      )}

      <nav
        className={`fixed top-0 right-0 z-50 flex h-16 items-center justify-between px-5 transition-all duration-300 ${
          isOpen
            ? 'left-64'
            : 'left-0'
        }`}
        style={{
          background: darkMode
            ? '#021024'
            : '#ffffff',
          borderBottom: darkMode
            ? '1px solid #052659'
            : '1px solid #C1E8FF',
          boxShadow:
            '0 1px 6px rgba(2,16,36,0.08)',
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Toggle menu"
            className="rounded-xl p-2 transition-all duration-200"
            style={{
              color: darkMode
                ? '#7DA0CA'
                : '#052659',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background =
                hoverBackground
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background =
                'transparent'
            }}
          >
            <Menu size={20} />
          </button>

          {!isOpen && (
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{
                  background:
                    'linear-gradient(135deg, #052659, #5483B3)',
                }}
              >
                <span className="text-xs font-semibold text-white">
                  C
                </span>
              </div>

              <span
                className="text-base font-medium tracking-tight"
                style={{
                  color: darkMode
                    ? '#ffffff'
                    : '#021024',
                }}
              >
                Con
                <span style={{ color: '#5483B3' }}>
                  Track
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleDark}
            aria-label={
              darkMode
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
            title={
              darkMode
                ? 'Light mode'
                : 'Dark mode'
            }
            className="rounded-xl p-2 transition-all duration-200"
            style={{
              color: darkMode
                ? '#7DA0CA'
                : '#5483B3',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background =
                hoverBackground
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background =
                'transparent'
            }}
          >
            {darkMode
              ? <Sun size={19} />
              : <Moon size={19} />
            }
          </button>

          {/* Notifications */}
          <div
            ref={notificationRef}
            className="relative"
          >
            <button
              type="button"
              aria-label="Notifications"
              title="Notifications"
              onClick={() => {
                setNotificationOpen((current) => !current)

                if (!notificationOpen) {
                  fetchNotifications()
                }
              }}
              className="relative rounded-xl p-2 transition-all duration-200"
              style={{
                color: darkMode
                  ? '#7DA0CA'
                  : '#5483B3',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background =
                  hoverBackground
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background =
                  'transparent'
              }}
            >
              <Bell size={19} />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
                  {unreadCount > 99
                    ? '99+'
                    : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div
                className={`absolute right-0 top-12 z-[200] w-[360px] max-w-[calc(100vw-20px)] overflow-hidden rounded-2xl border shadow-[0_18px_50px_rgba(2,16,36,0.18)] ${
                  darkMode
                    ? 'border-[#5483B3]/20 bg-[#021024]'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {/* Header */}
                <div
                  className={`flex items-center justify-between border-b px-4 py-3 ${
                    darkMode
                      ? 'border-[#5483B3]/15'
                      : 'border-slate-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-[15px] font-semibold ${
                          darkMode
                            ? 'text-white'
                            : 'text-[#021024]'
                        }`}
                      >
                        Notifications
                      </h3>

                      {unreadCount > 0 && (
                        <span className="rounded-full bg-[#052659] px-2 py-0.5 text-[10px] font-semibold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    <p
                      className={`mt-0.5 text-[11px] ${
                        darkMode
                          ? 'text-[#7DA0CA]'
                          : 'text-slate-400'
                      }`}
                    >
                      Recent operations updates
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={
                        unreadCount === 0 ||
                        bulkBusy
                      }
                      onClick={markAllRead}
                      title="Mark all as checked"
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-30 ${
                        darkMode
                          ? 'text-[#C1E8FF] hover:bg-[#052659]'
                          : 'text-[#052659] hover:bg-slate-100'
                      }`}
                    >
                      <CheckCheck size={16} />
                    </button>

                    <button
                      type="button"
                      disabled={
                        readCount === 0 ||
                        bulkBusy
                      }
                      onClick={clearReadNotifications}
                      title="Clear checked notifications"
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-30 ${
                        darkMode
                          ? 'text-red-300 hover:bg-red-500/10'
                          : 'text-slate-400 hover:bg-red-50 hover:text-red-500'
                      }`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {notificationError && (
                  <div
                    className={`border-b px-4 py-2 text-[11px] ${
                      darkMode
                        ? 'border-[#5483B3]/15 bg-red-500/10 text-red-300'
                        : 'border-red-100 bg-red-50 text-red-600'
                    }`}
                  >
                    {notificationError}
                  </div>
                )}

                {/* List */}
                <div className="max-h-[390px] overflow-y-auto">
                  {notificationLoading &&
                  notifications.length === 0 ? (
                    <div
                      className={`px-4 py-10 text-center text-sm ${
                        darkMode
                          ? 'text-[#7DA0CA]'
                          : 'text-slate-400'
                      }`}
                    >
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <div
                        className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full ${
                          darkMode
                            ? 'bg-[#052659]'
                            : 'bg-slate-100'
                        }`}
                      >
                        <Bell
                          size={18}
                          className={
                            darkMode
                              ? 'text-[#7DA0CA]'
                              : 'text-slate-400'
                          }
                        />
                      </div>

                      <p
                        className={`text-sm font-medium ${
                          darkMode
                            ? 'text-white'
                            : 'text-slate-700'
                        }`}
                      >
                        You're all caught up
                      </p>

                      <p
                        className={`mt-1 text-xs ${
                          darkMode
                            ? 'text-[#7DA0CA]'
                            : 'text-slate-400'
                        }`}
                      >
                        New operations updates will appear here.
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const notificationId =
                        getNotificationId(notification)

                      const busy =
                        busyNotificationIds.has(
                          String(notificationId)
                        )

                      return (
                        <div
                          key={
                            notificationId ??
                            `${notification.created_at}-${notification.title}`
                          }
                          className={`group relative border-b px-3.5 py-3 transition last:border-b-0 ${
                            darkMode
                              ? 'border-[#5483B3]/10'
                              : 'border-slate-100'
                          } ${
                            notification.is_read
                              ? darkMode
                                ? 'bg-[#021024]'
                                : 'bg-white'
                              : darkMode
                                ? 'bg-[#052659]/35'
                                : 'bg-[#F6FAFF]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Manual check button */}
                            <button
                              type="button"
                              disabled={
                                notification.is_read ||
                                busy
                              }
                              onClick={() =>
                                markNotificationRead(
                                  notification
                                )
                              }
                              title={
                                notification.is_read
                                  ? 'Checked'
                                  : 'Mark as checked'
                              }
                              aria-label={
                                notification.is_read
                                  ? 'Checked'
                                  : 'Mark notification as checked'
                              }
                              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                                notification.is_read
                                  ? 'bg-emerald-500 text-white'
                                  : darkMode
                                    ? 'border border-[#5483B3]/60 text-[#7DA0CA] hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
                                    : 'border border-slate-200 bg-white text-slate-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600'
                              }`}
                            >
                              {notification.is_read ? (
                                <Check
                                  size={14}
                                  strokeWidth={3}
                                />
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-[#5483B3]" />
                              )}
                            </button>

                            <div className="min-w-0 flex-1 pr-7">
                              <div className="flex items-center gap-2">
                                <p
                                  className={`truncate text-[13px] ${
                                    notification.is_read
                                      ? 'font-semibold'
                                      : 'font-semibold'
                                  } ${
                                    darkMode
                                      ? 'text-white'
                                      : 'text-[#021024]'
                                  }`}
                                >
                                  {notification.title ||
                                    'Notification'}
                                </p>

                                {!notification.is_read && (
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                )}
                              </div>

                              {notification.message && (
                                <p
                                  className={`mt-0.5 line-clamp-2 text-[11px] leading-4 ${
                                    darkMode
                                      ? 'text-[#C1E8FF]/80'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  {notification.message}
                                </p>
                              )}

                              <div
                                className={`mt-1.5 flex items-center gap-2 text-[10px] ${
                                  darkMode
                                    ? 'text-[#7DA0CA]'
                                    : 'text-slate-400'
                                }`}
                              >
                                {notification.order_reference && (
                                  <span className="font-medium text-[#5483B3]">
                                    {notification.order_reference}
                                  </span>
                                )}

                                {notification.order_reference && (
                                  <span>•</span>
                                )}

                                <span>
                                  {formatNotificationTime(
                                    notification.created_at
                                  )}
                                </span>

                                {notification.is_read && (
                                  <>
                                    <span>•</span>
                                    <span className="font-semibold text-emerald-500">
                                      Checked
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Manual delete */}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                deleteNotification(
                                  notification
                                )
                              }
                              title="Remove notification"
                              aria-label="Remove notification"
                              className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg opacity-40 transition hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-20 ${
                                darkMode
                                  ? 'text-[#7DA0CA] hover:bg-red-500/10 hover:text-red-300'
                                  : 'text-slate-400 hover:bg-red-50 hover:text-red-500'
                              }`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div
                    className={`flex items-center justify-between border-t px-4 py-2.5 ${
                      darkMode
                        ? 'border-[#5483B3]/15 bg-[#021024]'
                        : 'border-slate-100 bg-slate-50/70'
                    }`}
                  >

                    {readCount > 0 && (
                      <button
                        type="button"
                        disabled={bulkBusy}
                        onClick={clearReadNotifications}
                        className={`text-[10px] font-medium transition ${
                          darkMode
                            ? 'text-red-300 hover:text-red-200'
                            : 'text-red-500 hover:text-red-600'
                        }`}
                      >
                        Clear checked
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className="mx-2 h-7 w-px"
            style={{
              background: darkMode
                ? '#052659'
                : '#C1E8FF',
            }}
          />

          <div className="flex items-center gap-2.5">
            <div className="hidden text-right sm:block">
              <p
                className="text-sm font-semibold leading-tight"
                style={{
                  color: darkMode
                    ? '#ffffff'
                    : '#021024',
                }}
              >
                {userName}
              </p>

              <p
                className="text-[11px] leading-tight"
                style={{
                  color: darkMode
                    ? '#7DA0CA'
                    : '#5483B3',
                }}
              >
                {userRole}
              </p>
            </div>

            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md"
              style={{
                background:
                  'linear-gradient(135deg, #052659 0%, #5483B3 100%)',
              }}
            >
              <span className="text-sm font-medium text-white">
                {initials || 'R'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowLogoutModal(true)
            }
            title="Sign out"
            aria-label="Sign out"
            className="ml-1 rounded-xl p-2 text-red-400 transition-all duration-200 hover:text-red-600"
            onMouseEnter={(event) => {
              event.currentTarget.style.background =
                darkMode
                  ? 'rgba(239,68,68,0.10)'
                  : '#FFF0F0'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background =
                'transparent'
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>
    </>
  )
}

export default Navbar
