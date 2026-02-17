-- マイグレーション: チャットボット機能 + プロジェクト機能
-- 実行先: Supabase SQL Editor
-- 日時: 2026-02-17

-- =============================================
-- Enum 定義（チャットボット関連）
-- =============================================

CREATE TYPE "UserRole" AS ENUM ('GENERAL', 'ADMIN', 'APPROVER');
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'KNOWLEDGE_UPDATE');
CREATE TYPE "ApprovalType" AS ENUM ('DATA_CHANGE', 'KNOWLEDGE_UPDATE');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- =============================================
-- Enum 定義（プロジェクト関連）
-- =============================================

CREATE TYPE "TaskCategory" AS ENUM ('DOCUMENT_CREATION', 'DOCUMENT_COLLECTION', 'DATA_ENTRY', 'REVIEW', 'OUTPUT');
CREATE TYPE "TaskActionType" AS ENUM ('FILE_UPLOAD', 'FORM_INPUT', 'AUTO_GENERATE', 'MANUAL_CHECK');
CREATE TYPE "ConditionOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'IN', 'IS_TRUE', 'IS_FALSE');
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'SUSPENDED', 'CANCELLED');
CREATE TYPE "ProjectTaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NOT_REQUIRED', 'RETURNED');
CREATE TYPE "ProjectRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- =============================================
-- Staff テーブルに userRole カラム追加
-- =============================================

ALTER TABLE "staffs" ADD COLUMN "userRole" "UserRole" NOT NULL DEFAULT 'GENERAL';

-- =============================================
-- チャットボット: テーブル作成
-- =============================================

-- チャットセッション
CREATE TABLE "chat_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "chat_sessions_userId_idx" ON "chat_sessions"("userId");

-- チャットメッセージ
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "toolCalls" JSONB,
    "toolResults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages"("sessionId");
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 監査ログ
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "messageId" UUID,
    "action" "AuditAction" NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT,
    "fieldName" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_messageId_idx" ON "audit_logs"("messageId");
CREATE INDEX "audit_logs_tableName_recordId_idx" ON "audit_logs"("tableName", "recordId");
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 決裁申請
CREATE TABLE "approval_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requesterId" UUID NOT NULL,
    "approverId" UUID,
    "messageId" UUID NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "changeDetail" JSONB NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "approval_requests_requesterId_idx" ON "approval_requests"("requesterId");
CREATE INDEX "approval_requests_approverId_idx" ON "approval_requests"("approverId");
CREATE INDEX "approval_requests_messageId_idx" ON "approval_requests"("messageId");
CREATE INDEX "approval_requests_status_idx" ON "approval_requests"("status");
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =============================================
-- プロジェクト: テーブル作成
-- =============================================

-- スキル定義
CREATE TABLE "skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purpose" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "workflowDefinition" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "skills_createdById_idx" ON "skills"("createdById");
CREATE INDEX "skills_updatedById_idx" ON "skills"("updatedById");
ALTER TABLE "skills" ADD CONSTRAINT "skills_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "skills" ADD CONSTRAINT "skills_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- タスクテンプレート
CREATE TABLE "skill_task_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "skillId" UUID NOT NULL,
    "taskCode" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "description" TEXT,
    "category" "TaskCategory" NOT NULL,
    "actionType" "TaskActionType" NOT NULL,
    "defaultRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "skill_task_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "skill_task_templates_skillId_taskCode_key" ON "skill_task_templates"("skillId", "taskCode");
CREATE INDEX "skill_task_templates_skillId_idx" ON "skill_task_templates"("skillId");
CREATE INDEX "skill_task_templates_createdById_idx" ON "skill_task_templates"("createdById");
CREATE INDEX "skill_task_templates_updatedById_idx" ON "skill_task_templates"("updatedById");
ALTER TABLE "skill_task_templates" ADD CONSTRAINT "skill_task_templates_skillId_fkey"
    FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "skill_task_templates" ADD CONSTRAINT "skill_task_templates_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "skill_task_templates" ADD CONSTRAINT "skill_task_templates_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 条件分岐ルール
CREATE TABLE "skill_condition_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "skillId" UUID NOT NULL,
    "taskCode" TEXT NOT NULL,
    "conditionField" TEXT NOT NULL,
    "operator" "ConditionOperator" NOT NULL,
    "conditionValue" TEXT NOT NULL,
    "resultRequired" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "skill_condition_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "skill_condition_rules_skillId_idx" ON "skill_condition_rules"("skillId");
CREATE INDEX "skill_condition_rules_taskCode_idx" ON "skill_condition_rules"("taskCode");
ALTER TABLE "skill_condition_rules" ADD CONSTRAINT "skill_condition_rules_skillId_fkey"
    FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- プロジェクト
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "skillId" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "contextData" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "projects_skillId_idx" ON "projects"("skillId");
CREATE INDEX "projects_ownerId_idx" ON "projects"("ownerId");
CREATE INDEX "projects_status_idx" ON "projects"("status");
CREATE INDEX "projects_createdById_idx" ON "projects"("createdById");
CREATE INDEX "projects_updatedById_idx" ON "projects"("updatedById");
ALTER TABLE "projects" ADD CONSTRAINT "projects_skillId_fkey"
    FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- プロジェクトタスク
CREATE TABLE "project_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "taskCode" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "status" "ProjectTaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "skipReason" TEXT,
    "filePath" TEXT,
    "notes" TEXT,
    "assigneeId" UUID,
    "completedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_tasks_projectId_idx" ON "project_tasks"("projectId");
CREATE INDEX "project_tasks_templateId_idx" ON "project_tasks"("templateId");
CREATE INDEX "project_tasks_assigneeId_idx" ON "project_tasks"("assigneeId");
CREATE INDEX "project_tasks_createdById_idx" ON "project_tasks"("createdById");
CREATE INDEX "project_tasks_updatedById_idx" ON "project_tasks"("updatedById");
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "skill_task_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- プロジェクトメンバー
CREATE TABLE "project_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "ProjectRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "project_members_projectId_userId_key" ON "project_members"("projectId", "userId");
CREATE INDEX "project_members_projectId_idx" ON "project_members"("projectId");
CREATE INDEX "project_members_userId_idx" ON "project_members"("userId");
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
