'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus, Send, Loader2, Trash2, Pencil, Check, X, MessageSquare,
} from 'lucide-react'

// =============================================
// 型定義
// =============================================

/** セッション一覧の1件 */
type SessionItem = {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
  _count: { messages: number }
}

/** メッセージの1件 */
type Message = {
  id: string
  sessionId: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  content: string
  createdAt: string
}

/** セッション詳細（メッセージ含む） */
type SessionDetail = {
  id: string
  title: string | null
  messages: Message[]
}

// =============================================
// ユーティリティ
// =============================================

/** 日付を「MM/DD HH:mm」形式にフォーマット */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${month}/${day} ${hour}:${min}`
}

/** セッションの表示名を取得（タイトル未設定なら日時を使う） */
function sessionDisplayName(session: SessionItem): string {
  return session.title ?? `チャット (${formatDate(session.createdAt)})`
}

// =============================================
// メインコンポーネント
// =============================================

/** チャットメイン画面 */
export default function ChatPage() {
  // セッション一覧の状態
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  // 選択中のセッション
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [activeSession, setActiveSession] = useState<SessionDetail | null>(null)
  const [messagesLoading, setMessagesLoading] = useState(false)

  // メッセージ入力
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)

  // タイトル編集
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  // メッセージ領域のスクロール用 ref
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // -----------------------------------------
  // セッション一覧の取得
  // -----------------------------------------
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/sessions')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'セッション取得に失敗しました')
      setSessions(json.data)
    } catch (err) {
      console.error('セッション一覧の取得に失敗:', err)
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // -----------------------------------------
  // セッション詳細（メッセージ）の取得
  // -----------------------------------------
  const fetchSessionDetail = useCallback(async (sessionId: string) => {
    setMessagesLoading(true)
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'メッセージ取得に失敗しました')
      setActiveSession(json.data)
    } catch (err) {
      console.error('セッション詳細の取得に失敗:', err)
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  /** セッションを選択する */
  function handleSelectSession(sessionId: string) {
    setActiveSessionId(sessionId)
    fetchSessionDetail(sessionId)
  }

  // -----------------------------------------
  // メッセージ送信後に最下部へスクロール
  // -----------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages])

  // -----------------------------------------
  // 新規セッション作成
  // -----------------------------------------
  async function handleCreateSession() {
    try {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'セッション作成に失敗しました')

      // 一覧を再取得して新しいセッションを選択
      await fetchSessions()
      handleSelectSession(json.data.id)
    } catch (err) {
      console.error('セッション作成に失敗:', err)
      alert('セッションの作成に失敗しました')
    }
  }

  // -----------------------------------------
  // メッセージ送信
  // -----------------------------------------
  async function handleSendMessage() {
    if (!activeSessionId || !inputText.trim() || sending) return

    const content = inputText.trim()
    setInputText('')
    setSending(true)

    try {
      const res = await fetch(`/api/chat/sessions/${activeSessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'USER', content }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'メッセージ送信に失敗しました')

      // 送信成功後にメッセージ一覧を再取得して最新状態を反映
      await fetchSessionDetail(activeSessionId)
      // サイドバーの updatedAt を更新するために一覧も再取得
      await fetchSessions()
    } catch (err) {
      console.error('メッセージ送信に失敗:', err)
      alert('メッセージの送信に失敗しました')
      // 送信失敗時は入力内容を復元する
      setInputText(content)
    } finally {
      setSending(false)
    }
  }

  /** Enter で送信、Shift+Enter で改行 */
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // -----------------------------------------
  // セッションタイトル編集
  // -----------------------------------------
  function startEditTitle(session: SessionItem) {
    setEditingSessionId(session.id)
    setEditTitle(session.title ?? '')
  }

  function cancelEditTitle() {
    setEditingSessionId(null)
    setEditTitle('')
  }

  async function saveEditTitle() {
    if (!editingSessionId || !editTitle.trim()) return

    try {
      const res = await fetch(`/api/chat/sessions/${editingSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'タイトル更新に失敗しました')

      // 一覧を再取得してタイトルを反映
      await fetchSessions()
      // 選択中のセッションなら詳細も更新
      if (activeSessionId === editingSessionId) {
        setActiveSession((prev) =>
          prev ? { ...prev, title: json.data.title } : prev,
        )
      }
      cancelEditTitle()
    } catch (err) {
      console.error('タイトル更新に失敗:', err)
      alert('タイトルの更新に失敗しました')
    }
  }

  // -----------------------------------------
  // セッション削除
  // -----------------------------------------
  async function handleDeleteSession(sessionId: string) {
    if (!confirm('このチャットを削除しますか？メッセージもすべて削除されます。')) return

    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message || 'セッション削除に失敗しました')
      }

      // 削除したセッションが選択中なら選択解除
      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
        setActiveSession(null)
      }
      await fetchSessions()
    } catch (err) {
      console.error('セッション削除に失敗:', err)
      alert('セッションの削除に失敗しました')
    }
  }

  // -----------------------------------------
  // レンダリング
  // -----------------------------------------
  return (
    <div className="flex h-[calc(100vh-theme(spacing.14)-theme(spacing.12))] gap-0 -m-6">
      {/* ===== 左サイドバー: セッション一覧 ===== */}
      <aside className="w-72 flex-shrink-0 border-r bg-muted/30 flex flex-col">
        {/* 新規チャットボタン */}
        <div className="p-3 border-b">
          <Button
            onClick={handleCreateSession}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            新規チャット
          </Button>
        </div>

        {/* セッション一覧 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessionsLoading ? (
            <div className="text-sm text-muted-foreground p-3">
              読み込み中...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-sm text-muted-foreground p-3">
              チャットがありません
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group rounded-md px-3 py-2 text-sm cursor-pointer transition-colors ${
                  activeSessionId === session.id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => handleSelectSession(session.id)}
              >
                {/* タイトル編集中 */}
                {editingSessionId === session.id ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-7 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditTitle()
                        if (e.key === 'Escape') cancelEditTitle()
                      }}
                      autoFocus
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveEditTitle}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelEditTitle}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">
                        {sessionDisplayName(session)}
                      </span>
                      {/* 操作ボタン（ホバー時に表示） */}
                      <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => startEditTitle(session)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(session.updatedAt)} ・ {session._count.messages}件
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ===== 右エリア: チャット表示 ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeSessionId ? (
          <>
            {/* チャットヘッダー */}
            <div className="border-b px-6 py-3 flex items-center justify-between">
              <h2 className="font-semibold truncate">
                {activeSession?.title ?? 'チャット'}
              </h2>
            </div>

            {/* メッセージ表示エリア */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  読み込み中...
                </div>
              ) : activeSession?.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  メッセージを入力して会話を始めましょう
                </div>
              ) : (
                <>
                  {activeSession?.messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  {/* 送信中のローディング表示 */}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          応答を待っています...
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* 入力欄（下部固定） */}
            <div className="border-t px-6 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="メッセージを入力... (Shift+Enter で改行)"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || sending}
                  size="icon"
                  className="h-[44px] w-[44px] flex-shrink-0"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* セッション未選択時の案内表示 */
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <MessageSquare className="h-12 w-12" />
            <div className="text-center">
              <p className="text-lg font-medium">新しいチャットを始めましょう</p>
              <p className="text-sm mt-1">
                左の「新規チャット」ボタンから会話を開始できます
              </p>
            </div>
            <Button variant="outline" onClick={handleCreateSession}>
              <Plus className="h-4 w-4" />
              新規チャット
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================
// サブコンポーネント
// =============================================

/** メッセージバブル（role に応じたスタイルで表示） */
function MessageBubble({ message }: { message: Message }) {
  const { role, content, createdAt } = message

  // SYSTEM メッセージ: 中央寄せ
  if (role === 'SYSTEM') {
    return (
      <div className="flex justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm max-w-lg text-center">
          <p className="whitespace-pre-wrap">{content}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatDate(createdAt)}</p>
        </div>
      </div>
    )
  }

  // USER メッセージ: 右寄せ
  if (role === 'USER') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%]">
          <div className="bg-primary text-primary-foreground rounded-lg p-3">
            <p className="whitespace-pre-wrap text-sm">{content}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {formatDate(createdAt)}
          </p>
        </div>
      </div>
    )
  }

  // ASSISTANT メッセージ: 左寄せ
  return (
    <div className="flex justify-start">
      <div className="max-w-[70%]">
        <div className="bg-muted rounded-lg p-3">
          <p className="whitespace-pre-wrap text-sm">{content}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDate(createdAt)}
        </p>
      </div>
    </div>
  )
}
