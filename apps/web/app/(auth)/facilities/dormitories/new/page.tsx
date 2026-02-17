'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

/** 物件登録画面 */
export default function NewDormitoryPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const form = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/facilities/dormitories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          address: form.get('address'),
          rent: Number(form.get('rent')),
          gasProvider: form.get('gasProvider') || null,
          gasContractNumber: form.get('gasContractNumber') || null,
          waterProvider: form.get('waterProvider') || null,
          waterContractNumber: form.get('waterContractNumber') || null,
          electricityProvider: form.get('electricityProvider') || null,
          electricityContractNumber: form.get('electricityContractNumber') || null,
          notes: form.get('notes') || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || '登録に失敗しました')

      router.push('/facilities/dormitories')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
        <h1 className="text-2xl font-bold">物件登録</h1>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">物件名 *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rent">家賃（円/月） *</Label>
                <Input id="rent" name="rent" type="number" min="0" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">住所 *</Label>
              <Input id="address" name="address" required />
            </div>
          </CardContent>
        </Card>

        {/* ライフライン契約情報 */}
        <Card>
          <CardHeader>
            <CardTitle>ライフライン契約情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="electricityProvider">電気契約先</Label>
                <Input id="electricityProvider" name="electricityProvider" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="electricityContractNumber">電気契約番号</Label>
                <Input id="electricityContractNumber" name="electricityContractNumber" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gasProvider">ガス契約先</Label>
                <Input id="gasProvider" name="gasProvider" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gasContractNumber">ガス契約番号</Label>
                <Input id="gasContractNumber" name="gasContractNumber" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="waterProvider">水道契約先</Label>
                <Input id="waterProvider" name="waterProvider" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waterContractNumber">水道契約番号</Label>
                <Input id="waterContractNumber" name="waterContractNumber" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 備考 */}
        <Card>
          <CardHeader>
            <CardTitle>備考</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea id="notes" name="notes" rows={3} />
          </CardContent>
        </Card>

        {/* 送信ボタン */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? '登録中...' : '登録する'}
          </Button>
        </div>
      </form>
    </div>
  )
}
