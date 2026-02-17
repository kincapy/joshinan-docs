'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

/** API レスポンスのWiFiデバイス型 */
type WifiDeviceRow = {
  id: string
  imei: string
  location: string
  contractNumber: string | null
  isActive: boolean
  notes: string | null
}

/** WiFiデバイス一覧画面 */
export default function WifiDevicesPage() {
  const [devices, setDevices] = useState<WifiDeviceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('')

  // 新規登録フォーム
  const [showNew, setShowNew] = useState(false)
  const [newImei, setNewImei] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newContract, setNewContract] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchDevices = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (activeFilter === 'all') params.set('includeInactive', 'true')

      const res = await fetch(`/api/facilities/wifi?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '取得に失敗しました')

      setDevices(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [activeFilter])

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  /** 新規登録 */
  async function handleCreate() {
    if (!newImei || !newLocation) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/facilities/wifi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei: newImei,
          location: newLocation,
          contractNumber: newContract || null,
          notes: newNotes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '登録に失敗しました')

      setShowNew(false)
      setNewImei('')
      setNewLocation('')
      setNewContract('')
      setNewNotes('')
      fetchDevices()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  /** 有効/無効切り替え */
  async function toggleActive(device: WifiDeviceRow) {
    try {
      const res = await fetch(`/api/facilities/wifi/${device.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !device.isActive }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '更新に失敗しました')

      fetchDevices()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facilities/dormitories">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              物件一覧に戻る
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">WiFiデバイス一覧</h1>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" />
          新規登録
        </Button>
      </div>

      {/* フィルタ */}
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">ステータス</label>
          <Select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="">有効のみ</option>
            <option value="all">すべて</option>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* 新規登録フォーム */}
      {showNew && (
        <Card>
          <CardHeader>
            <CardTitle>WiFiデバイス登録</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>IMEI *</Label>
                <Input value={newImei} onChange={(e) => setNewImei(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>配置場所 *</Label>
                <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>契約番号</Label>
                <Input value={newContract} onChange={(e) => setNewContract(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>備考</Label>
                <Input value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? '登録中...' : '登録'}
              </Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>キャンセル</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* テーブル */}
      {loading ? (
        <div className="text-muted-foreground">読み込み中...</div>
      ) : devices.length === 0 ? (
        <div className="text-muted-foreground">WiFiデバイスがありません</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IMEI</TableHead>
              <TableHead>配置場所</TableHead>
              <TableHead>契約番号</TableHead>
              <TableHead>備考</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-sm">{d.imei}</TableCell>
                <TableCell>{d.location}</TableCell>
                <TableCell>{d.contractNumber || '-'}</TableCell>
                <TableCell className="max-w-48 truncate">{d.notes || '-'}</TableCell>
                <TableCell>
                  <Badge variant={d.isActive ? 'default' : 'outline'}>
                    {d.isActive ? '有効' : '無効'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(d)}
                  >
                    {d.isActive ? '無効化' : '有効化'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
