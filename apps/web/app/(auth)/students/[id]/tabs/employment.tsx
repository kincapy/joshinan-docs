'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import type { Student } from '../page'

/** 勤務先タブ — 読み取り専用テーブル（編集機能は後回し） */
export function EmploymentTab({ student }: { student: Student }) {
  /** 週合計勤務時間を計算 */
  const totalHours = student.employments.reduce(
    (sum, emp) => sum + (emp.weeklyHours ?? 0), 0,
  )
  /** 28時間超過で警告表示 */
  const isOverLimit = totalHours > 28

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            勤務先一覧
            {student.employments.length > 0 && (
              <span className={`text-sm font-normal ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                週合計: {totalHours}時間{isOverLimit && '（28時間超過）'}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {student.employments.length === 0 ? (
            <p className="text-sm text-muted-foreground">勤務先が登録されていません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>勤務先名</TableHead>
                  <TableHead>電話番号</TableHead>
                  <TableHead>週勤務時間</TableHead>
                  <TableHead>時給</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.employments.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.employerName}</TableCell>
                    <TableCell>{emp.phone ?? '-'}</TableCell>
                    <TableCell>{emp.weeklyHours != null ? `${emp.weeklyHours}時間` : '-'}</TableCell>
                    <TableCell>{emp.hourlyWage != null ? `¥${emp.hourlyWage.toLocaleString()}` : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
