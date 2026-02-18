-- マイグレーション: ProjectTaskStatusLog テーブルの追加
-- 実行先: Supabase SQL Editor
-- 日時: 2026-02-18
--
-- タスクのステータス変更履歴を記録するテーブル。
-- 誰が・いつ・何に変更したかを追跡する。

-- =============================================
-- テーブル作成
-- =============================================

CREATE TABLE "project_task_status_logs" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "taskId"      UUID NOT NULL,
  "fromStatus"  "ProjectTaskStatus" NOT NULL,
  "toStatus"    "ProjectTaskStatus" NOT NULL,
  "changedById" UUID NOT NULL,
  "changedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "project_task_status_logs_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- 外部キー制約
-- =============================================

ALTER TABLE "project_task_status_logs"
  ADD CONSTRAINT "project_task_status_logs_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================
-- インデックス
-- =============================================

CREATE INDEX "project_task_status_logs_taskId_idx"
  ON "project_task_status_logs"("taskId");

CREATE INDEX "project_task_status_logs_changedById_idx"
  ON "project_task_status_logs"("changedById");
