'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, CreditCard } from 'lucide-react'

/** 入金方法の選択肢 */
const PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH', label: '現金' },
  { value: 'BANK_TRANSFER', label: '銀行振込' },
]

type StudentOption = {
  id: string
  studentNumber: string
  nameKanji: string | null
  nameEn: string
}

export default function NewPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedStudentId = searchParams.get('studentId')

  // 学生検索
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StudentOption[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(
    null,
  )
  const dropdownRef = useRef<HTMLDivElement>(null)

  // フォーム
  const [paidAt, setPaidAt] = useState(() => {
    // デフォルト: 今日
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [note, setNote] = useState('')

  // 送信状態
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  /** URL に studentId がある場合、学生情報を取得して自動選択する */
  useEffect(() => {
    if (preselectedStudentId) {
      fetchStudentById(preselectedStudentId)
    }
  }, [preselectedStudentId])

  /** ドロップダウン外クリックで閉じる */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /** 学生IDから学生情報を取得する（URLクエリ用） */
  async function fetchStudentById(studentId: string) {
    try {
      const res = await fetch(`/api/students?search=${studentId}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      // 検索結果から該当する学生を探す
      const found = (json.data as StudentOption[]).find(
        (s) => s.id === studentId,
      )
      if (found) {
        setSelectedStudent(found)
        setSearchQuery(
          `${found.studentNumber} - ${found.nameKanji || found.nameEn}`,
        )
      }
    } catch {
      // 自動選択の失敗は無視（手動で選び直せる）
    }
  }

  /** 学生をテキスト検索する */
  const searchStudents = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    try {
      const res = await fetch(
        `/api/students?search=${encodeURIComponent(query)}`,
      )
      const json = await res.json()
      if (json.error) return
      setSearchResults(json.data)
      setShowDropdown(true)
    } catch {
      // 検索エラーは無視
    }
  }, [])

  /** 検索入力の変更 */
  function handleSearchChange(value: string) {
    setSearchQuery(value)
    setSelectedStudent(null)
    searchStudents(value)
  }

  /** 検索結果から学生を選択する */
  function handleSelectStudent(student: StudentOption) {
    setSelectedStudent(student)
    setSearchQuery(
      `${student.studentNumber} - ${student.nameKanji || student.nameEn}`,
    )
    setShowDropdown(false)
  }

  /** 入金を登録する */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedStudent) {
      setError('学生を選択してください')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          paymentDate: paidAt,
          amount: Number(amount),
          method,
          notes: note || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '入金登録に失敗しました')

      // 成功: 学生の残高詳細に遷移
      router.push(`/tuition/balances/${selectedStudent.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '入金登録に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Link href="/tuition">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">入金登録</h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>入金情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 学生検索 */}
            <div className="relative space-y-1" ref={dropdownRef}>
              <Label>
                学生 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="学籍番号・氏名で検索..."
                required
              />
              {/* 検索ドロップダウン */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-background shadow-md">
                  {searchResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50"
                      onClick={() => handleSelectStudent(s)}
                    >
                      {s.studentNumber} - {s.nameKanji || s.nameEn}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 入金日 */}
            <div className="space-y-1">
              <Label>
                入金日 <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                required
                className="w-48"
              />
            </div>

            {/* 金額 */}
            <div className="space-y-1">
              <Label>
                金額（円） <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min={1}
                required
                className="w-48"
              />
            </div>

            {/* 入金方法 */}
            <div className="space-y-1">
              <Label>
                入金方法 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* 備考 */}
            <div className="space-y-1">
              <Label>備考</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="特記事項があれば入力..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* 送信ボタン */}
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={submitting || !selectedStudent}>
            <CreditCard className="h-4 w-4" />
            {submitting ? '登録中...' : '入金を登録'}
          </Button>
        </div>
      </form>
    </div>
  )
}
