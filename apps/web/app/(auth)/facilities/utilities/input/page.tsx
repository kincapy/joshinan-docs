'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { ArrowLeft } from 'lucide-react'

/** 物件の型（入力グリッド用） */
type DormitoryForInput = {
  id: string
  name: string
}

/** 入力行の型 */
type UtilityEntry = {
  dormitoryId: string
  dormitoryName: string
  electricity: string
  gas: string
  water: string
}

/** 水光熱費入力画面 */
export default function UtilityInputPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 対象年月（デフォルト: 当月）
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // 入力グリッドデータ
  const [entries, setEntries] = useState<UtilityEntry[]>([])

  /** 有効な物件一覧を取得して入力グリッドを初期化 */
  const fetchDormitories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/facilities/dormitories')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '物件一覧の取得に失敗しました')

      const dormitories: DormitoryForInput[] = json.data

      // 既存データがあれば読み込む
      const utilRes = await fetch(`/api/facilities/utilities?month=${month}`)
      const utilJson = await utilRes.json()
      const existingMap = new Map<string, { electricity: number; gas: number; water: number }>()
      if (utilRes.ok && utilJson.data) {
        for (const u of utilJson.data) {
          existingMap.set(u.dormitoryId, {
            electricity: u.electricity,
            gas: u.gas,
            water: u.water,
          })
        }
      }

      // 入力グリッドを物件分初期化（既存データがあれば反映）
      setEntries(
        dormitories.map((d) => {
          const existing = existingMap.get(d.id)
          return {
            dormitoryId: d.id,
            dormitoryName: d.name,
            electricity: existing ? String(existing.electricity) : '0',
            gas: existing ? String(existing.gas) : '0',
            water: existing ? String(existing.water) : '0',
          }
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : '物件一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    fetchDormitories()
  }, [fetchDormitories])

  /** 入力値を更新 */
  function updateEntry(index: number, field: 'electricity' | 'gas' | 'water', value: string) {
    setEntries((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  /** 一括送信 */
  async function handleSubmit() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const body = {
        month,
        entries: entries.map((e) => ({
          dormitoryId: e.dormitoryId,
          electricity: Number(e.electricity) || 0,
          gas: Number(e.gas) || 0,
          water: Number(e.water) || 0,
        })),
      }

      const res = await fetch('/api/facilities/utilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '保存に失敗しました')

      setSuccess(`${month} の水光熱費を保存しました（${json.data.length}件）`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/facilities/dormitories')}>
          <ArrowLeft className="h-4 w-4" />
          物件一覧に戻る
        </Button>
        <h1 className="text-2xl font-bold">水光熱費入力</h1>
      </div>

      {/* 対象年月 */}
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <Label>対象年月</Label>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-700">{success}</div>
      )}

      {/* 入力グリッド */}
      {loading ? (
        <div className="text-muted-foreground">読み込み中...</div>
      ) : entries.length === 0 ? (
        <div className="text-muted-foreground">有効な物件がありません</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{month} の水光熱費</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">物件名</TableHead>
                  <TableHead className="text-right">電気代（円）</TableHead>
                  <TableHead className="text-right">ガス代（円）</TableHead>
                  <TableHead className="text-right">水道代（円）</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, i) => (
                  <TableRow key={entry.dormitoryId}>
                    <TableCell className="font-medium">{entry.dormitoryName}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        className="text-right w-32 ml-auto"
                        value={entry.electricity}
                        onChange={(e) => updateEntry(i, 'electricity', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        className="text-right w-32 ml-auto"
                        value={entry.gas}
                        onChange={(e) => updateEntry(i, 'gas', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        className="text-right w-32 ml-auto"
                        value={entry.water}
                        onChange={(e) => updateEntry(i, 'water', e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 flex justify-end">
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? '保存中...' : '一括保存'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
