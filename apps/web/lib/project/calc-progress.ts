/**
 * プロジェクトの進捗率を計算する
 *
 * 進捗率 = 完了タスク数 / 必須タスク数 * 100
 * 必須タスクが0件の場合は 100% とする
 */
export function calcProgress(
  tasks: { status: string; required: boolean }[],
): number {
  const requiredTasks = tasks.filter((t) => t.required)
  if (requiredTasks.length === 0) return 100
  const completedCount = requiredTasks.filter(
    (t) => t.status === 'COMPLETED',
  ).length
  return Math.round((completedCount / requiredTasks.length) * 100)
}
