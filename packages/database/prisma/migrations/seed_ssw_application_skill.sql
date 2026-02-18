-- シードデータ: 特定技能申請スキル（在留資格変更許可申請）
-- 実行先: Supabase SQL Editor
-- 日時: 2026-02-18
--
-- このSQLは以下を一括投入する:
--   1. Skill（スキル定義）
--   2. SkillTaskTemplate（36件のタスクテンプレート）
--   3. SkillConditionRule（13件の条件分岐ルール）

-- =============================================
-- 1. Skill（スキル定義）
-- =============================================

INSERT INTO "skills" (
  "id", "name", "description", "purpose", "goal",
  "workflowDefinition", "version", "isActive",
  "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  '特定技能申請',
  '特定技能1号の在留資格変更許可申請に必要な書類を管理するスキル。申請書類の作成と証憑書類の収集を、条件分岐ルール付きで管理する。',
  '特定技能1号の在留資格変更許可申請',
  '入管への申請書類一式を提出する',
  '{
    "phases": [
      {
        "name": "書類作成",
        "description": "当社が作成する申請書類（DOC系）を準備する",
        "taskCodePrefix": "DOC"
      },
      {
        "name": "証憑収集（申請人）",
        "description": "申請人から収集する証憑書類（COL-001〜011, COL-019）",
        "taskCodePrefix": "COL"
      },
      {
        "name": "証憑収集（企業）",
        "description": "企業から収集する証憑書類（COL-012〜018）",
        "taskCodePrefix": "COL"
      },
      {
        "name": "最終確認・提出",
        "description": "全書類の最終確認を行い、入管に提出する",
        "taskCodePrefix": "REV"
      }
    ]
  }'::jsonb,
  1,
  true,
  NOW(),
  NOW()
);

-- =============================================
-- 2. SkillTaskTemplate（タスクテンプレート）
-- =============================================

-- skill_id を変数として取得
DO $$
DECLARE
  v_skill_id UUID;
BEGIN
  SELECT "id" INTO v_skill_id FROM "skills" WHERE "name" = '特定技能申請' LIMIT 1;

  -- -------------------------------------------
  -- DOC系: 当社が作成する書類（13件）
  -- -------------------------------------------

  INSERT INTO "skill_task_templates" (
    "id", "skillId", "taskCode", "taskName", "description",
    "category", "actionType", "defaultRequired", "sortOrder",
    "createdAt", "updatedAt"
  ) VALUES
    -- DOC-001: 在留資格変更許可申請書（申請人用）
    (gen_random_uuid(), v_skill_id, 'DOC-001',
     '在留資格変更許可申請書（申請人用）',
     '別記第30号様式。学生DBから91%自動入力可能。',
     'DOCUMENT_CREATION', 'AUTO_GENERATE', true, 1,
     NOW(), NOW()),

    -- DOC-002: 在留資格変更許可申請書（所属機関用）
    (gen_random_uuid(), v_skill_id, 'DOC-002',
     '在留資格変更許可申請書（所属機関用）',
     '別記第30号様式。企業情報の手作業入力が多い（自動入力率25%）。',
     'DOCUMENT_CREATION', 'FORM_INPUT', true, 2,
     NOW(), NOW()),

    -- DOC-003: 特定技能雇用契約書
    (gen_random_uuid(), v_skill_id, 'DOC-003',
     '特定技能雇用契約書',
     '参考様式1-6号。雇用条件を明記する。',
     'DOCUMENT_CREATION', 'AUTO_GENERATE', true, 3,
     NOW(), NOW()),

    -- DOC-004: 雇用条件書
    (gen_random_uuid(), v_skill_id, 'DOC-004',
     '雇用条件書',
     '参考様式1-6号別紙。給与・勤務地・業務内容等。',
     'DOCUMENT_CREATION', 'AUTO_GENERATE', true, 4,
     NOW(), NOW()),

    -- DOC-005: 1号特定技能外国人支援計画書
    (gen_random_uuid(), v_skill_id, 'DOC-005',
     '1号特定技能外国人支援計画書',
     '参考様式1-17号。義務的支援10項目の計画。',
     'DOCUMENT_CREATION', 'FORM_INPUT', true, 5,
     NOW(), NOW()),

    -- DOC-006: 特定技能所属機関概要書
    (gen_random_uuid(), v_skill_id, 'DOC-006',
     '特定技能所属機関概要書',
     '参考様式1-11-1号。企業の基本情報。',
     'DOCUMENT_CREATION', 'FORM_INPUT', true, 6,
     NOW(), NOW()),

    -- DOC-007: 報酬説明書
    (gen_random_uuid(), v_skill_id, 'DOC-007',
     '報酬説明書',
     '参考様式1-4号。報酬体系が複雑な場合に必要。',
     'DOCUMENT_CREATION', 'FORM_INPUT', false, 7,
     NOW(), NOW()),

    -- DOC-008: 雇用経緯説明書
    (gen_random_uuid(), v_skill_id, 'DOC-008',
     '雇用経緯説明書',
     '参考様式1-16号。マッチングの背景を説明。自動入力率80%。',
     'DOCUMENT_CREATION', 'AUTO_GENERATE', false, 8,
     NOW(), NOW()),

    -- DOC-009: 登録支援機関との委託契約説明書
    (gen_random_uuid(), v_skill_id, 'DOC-009',
     '登録支援機関との委託契約説明書',
     '参考様式1-25号。常南交通は全部委託のため全案件で必須。',
     'DOCUMENT_CREATION', 'AUTO_GENERATE', true, 9,
     NOW(), NOW()),

    -- DOC-010: 分野別一覧表
    (gen_random_uuid(), v_skill_id, 'DOC-010',
     '分野別一覧表',
     '特定技能分野ごとの固有書類。介護・宿泊など分野別。',
     'DOCUMENT_CREATION', 'FORM_INPUT', true, 10,
     NOW(), NOW()),

    -- DOC-011: 所属機関誓約書（分野別）
    (gen_random_uuid(), v_skill_id, 'DOC-011',
     '所属機関誓約書（分野別）',
     '分野参考様式。企業が法令遵守を誓約。自動入力率91%。',
     'DOCUMENT_CREATION', 'AUTO_GENERATE', true, 11,
     NOW(), NOW()),

    -- DOC-012: 登録支援機関誓約書（分野別）
    (gen_random_uuid(), v_skill_id, 'DOC-012',
     '登録支援機関誓約書（分野別）',
     '分野参考様式。当社が法令遵守を誓約。自動入力率91%。',
     'DOCUMENT_CREATION', 'AUTO_GENERATE', true, 12,
     NOW(), NOW()),

    -- DOC-013: 協力確認書
    (gen_random_uuid(), v_skill_id, 'DOC-013',
     '協力確認書',
     '2025年4月新設。市区町村との協力確認。',
     'DOCUMENT_CREATION', 'FORM_INPUT', true, 13,
     NOW(), NOW()),

  -- -------------------------------------------
  -- COL系: 申請人から収集する書類（12件）
  -- -------------------------------------------

    -- COL-001: 健康診断個人票
    (gen_random_uuid(), v_skill_id, 'COL-001',
     '健康診断個人票',
     '医療機関発行。参考様式1-3号の全項目。予約～結果まで2〜4週間。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', true, 14,
     NOW(), NOW()),

    -- COL-002: 受診者の申告書
    (gen_random_uuid(), v_skill_id, 'COL-002',
     '受診者の申告書',
     '申請人本人が作成。健康診断後に作成。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', true, 15,
     NOW(), NOW()),

    -- COL-003: 技能試験合格証明書
    (gen_random_uuid(), v_skill_id, 'COL-003',
     '技能試験合格証明書',
     '試験実施機関発行。技能実習2号修了者は免除。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', true, 16,
     NOW(), NOW()),

    -- COL-004: 日本語能力試験合格証明書
    (gen_random_uuid(), v_skill_id, 'COL-004',
     '日本語能力試験合格証明書',
     '試験実施機関発行。N4以上。技能実習2号修了者は免除。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', true, 17,
     NOW(), NOW()),

    -- COL-005: 個人住民税 納税証明書
    (gen_random_uuid(), v_skill_id, 'COL-005',
     '個人住民税 納税証明書',
     '市区町村発行。直近1年度分。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', true, 18,
     NOW(), NOW()),

    -- COL-006: 個人住民税 課税証明書
    (gen_random_uuid(), v_skill_id, 'COL-006',
     '個人住民税 課税証明書',
     '市区町村発行。条件により必要。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', false, 19,
     NOW(), NOW()),

    -- COL-007: 源泉徴収票
    (gen_random_uuid(), v_skill_id, 'COL-007',
     '源泉徴収票',
     '前雇用主発行。条件により必要。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', false, 20,
     NOW(), NOW()),

    -- COL-008: 医療保険の資格情報
    (gen_random_uuid(), v_skill_id, 'COL-008',
     '医療保険の資格情報',
     '保険者発行。国民健康保険加入者の場合のみ必須。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', false, 21,
     NOW(), NOW()),

    -- COL-009: 国民健康保険料納付証明書
    (gen_random_uuid(), v_skill_id, 'COL-009',
     '国民健康保険料納付証明書',
     '市区町村発行。国民健康保険加入者の場合のみ必須。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', false, 22,
     NOW(), NOW()),

    -- COL-010: 被保険者記録照会回答票
    (gen_random_uuid(), v_skill_id, 'COL-010',
     '被保険者記録照会回答票',
     '年金事務所発行。国民年金加入者の場合のみ必須。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', false, 23,
     NOW(), NOW()),

    -- COL-011: 国民年金保険料納付証明
    (gen_random_uuid(), v_skill_id, 'COL-011',
     '国民年金保険料納付証明',
     '市区町村発行。国民年金加入者の場合のみ必須。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', false, 24,
     NOW(), NOW()),

    -- COL-019: 二国間取決に係る書類
    (gen_random_uuid(), v_skill_id, 'COL-019',
     '二国間取決に係る書類',
     '送出機関発行。カンボジア・タイ・ベトナム国籍のみ必須。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', false, 25,
     NOW(), NOW()),

  -- -------------------------------------------
  -- COL系: 企業から収集する書類（7件）
  -- -------------------------------------------

    -- COL-012: 登記事項証明書
    (gen_random_uuid(), v_skill_id, 'COL-012',
     '登記事項証明書',
     '法務局発行。企業の登記内容を証明。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', true, 26,
     NOW(), NOW()),

    -- COL-013: 役員の住民票
    (gen_random_uuid(), v_skill_id, 'COL-013',
     '役員の住民票',
     '市区町村発行。代表者のもの。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', true, 27,
     NOW(), NOW()),

    -- COL-014: 労働保険料等納付証明書
    (gen_random_uuid(), v_skill_id, 'COL-014',
     '労働保険料等納付証明書',
     '労働局発行。雇用保険・労災保険の納付状況。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', true, 28,
     NOW(), NOW()),

    -- COL-015: 社会保険料納入状況回答票
    (gen_random_uuid(), v_skill_id, 'COL-015',
     '社会保険料納入状況回答票',
     '年金事務所発行。健康保険・厚生年金の納付状況。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', true, 29,
     NOW(), NOW()),

    -- COL-016: 納税証明書（その3）
    (gen_random_uuid(), v_skill_id, 'COL-016',
     '納税証明書（その3）',
     '税務署発行。法人税の納付状況。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', true, 30,
     NOW(), NOW()),

    -- COL-017: 法人住民税 納税証明書
    (gen_random_uuid(), v_skill_id, 'COL-017',
     '法人住民税 納税証明書',
     '市区町村発行。法人住民税の納付状況。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', true, 31,
     NOW(), NOW()),

    -- COL-018: 協議会加入証明書
    (gen_random_uuid(), v_skill_id, 'COL-018',
     '協議会加入証明書',
     '各分野の協議会発行。介護・宿泊など協議会加入を証明。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', true, 32,
     NOW(), NOW()),

  -- -------------------------------------------
  -- COL系: 分野別追加書類（4件）
  -- -------------------------------------------

    -- COL-020: 介護日本語評価試験合格証
    (gen_random_uuid(), v_skill_id, 'COL-020',
     '介護日本語評価試験合格証',
     '試験実施機関発行。介護分野のみ必須。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', false, 33,
     NOW(), NOW()),

    -- COL-021: 旅館業許可証の写し
    (gen_random_uuid(), v_skill_id, 'COL-021',
     '旅館業許可証の写し',
     '企業保有。宿泊分野のみ必須。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', false, 34,
     NOW(), NOW()),

    -- COL-022: 運転免許証の写し
    (gen_random_uuid(), v_skill_id, 'COL-022',
     '運転免許証の写し',
     '申請人保有。自動車運送業分野のみ必須。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', false, 35,
     NOW(), NOW()),

    -- COL-023: 自動車運送業協議会構成員資格証明書
    (gen_random_uuid(), v_skill_id, 'COL-023',
     '自動車運送業協議会構成員資格証明書',
     '協議会発行。自動車運送業分野のみ必須。',
     'DOCUMENT_COLLECTION', 'FILE_UPLOAD', false, 36,
     NOW(), NOW()),

  -- -------------------------------------------
  -- REV系: 最終確認タスク（1件）
  -- -------------------------------------------

    -- REV-001: 最終確認・提出
    (gen_random_uuid(), v_skill_id, 'REV-001',
     '全書類の最終確認・入管提出',
     '全ての必須書類が完了していることを確認し、入管に申請書類一式を提出する。',
     'REVIEW', 'MANUAL_CHECK', true, 37,
     NOW(), NOW());

  -- =============================================
  -- 3. SkillConditionRule（条件分岐ルール）
  -- =============================================

  INSERT INTO "skill_condition_rules" (
    "id", "skillId", "taskCode", "conditionField",
    "operator", "conditionValue", "resultRequired",
    "createdAt", "updatedAt"
  ) VALUES
    -- ルール1: 技能実習2号修了者 → 技能試験免除
    (gen_random_uuid(), v_skill_id, 'COL-003',
     'hasCompletedTitp2', 'IS_TRUE', 'true', false,
     NOW(), NOW()),

    -- ルール2: 技能実習2号修了者 → 日本語試験免除
    (gen_random_uuid(), v_skill_id, 'COL-004',
     'hasCompletedTitp2', 'IS_TRUE', 'true', false,
     NOW(), NOW()),

    -- ルール3: 介護分野 → 介護日本語評価試験合格証が必須
    (gen_random_uuid(), v_skill_id, 'COL-020',
     'sswField', 'EQUALS', 'NURSING_CARE', true,
     NOW(), NOW()),

    -- ルール4: 宿泊分野 → 旅館業許可証が必須
    (gen_random_uuid(), v_skill_id, 'COL-021',
     'sswField', 'EQUALS', 'ACCOMMODATION', true,
     NOW(), NOW()),

    -- ルール5: 自動車運送業 → 運転免許証が必須
    (gen_random_uuid(), v_skill_id, 'COL-022',
     'sswField', 'EQUALS', 'AUTO_TRANSPORT', true,
     NOW(), NOW()),

    -- ルール6: 自動車運送業 → 協議会構成員資格証明書が必須
    (gen_random_uuid(), v_skill_id, 'COL-023',
     'sswField', 'EQUALS', 'AUTO_TRANSPORT', true,
     NOW(), NOW()),

    -- ルール7: カンボジア・タイ・ベトナム国籍 → 二国間取決書類が必須
    (gen_random_uuid(), v_skill_id, 'COL-019',
     'nationality', 'IN', 'KHM,THA,VNM', true,
     NOW(), NOW()),

    -- ルール8: 国民健康保険加入者 → 医療保険資格情報が必須
    (gen_random_uuid(), v_skill_id, 'COL-008',
     'insuranceType', 'EQUALS', 'NATIONAL_HEALTH', true,
     NOW(), NOW()),

    -- ルール9: 国民健康保険加入者 → 保険料納付証明が必須
    (gen_random_uuid(), v_skill_id, 'COL-009',
     'insuranceType', 'EQUALS', 'NATIONAL_HEALTH', true,
     NOW(), NOW()),

    -- ルール10: 国民年金加入者 → 被保険者記録照会回答票が必須
    (gen_random_uuid(), v_skill_id, 'COL-010',
     'pensionType', 'EQUALS', 'NATIONAL_PENSION', true,
     NOW(), NOW()),

    -- ルール11: 国民年金加入者 → 年金保険料納付証明が必須
    (gen_random_uuid(), v_skill_id, 'COL-011',
     'pensionType', 'EQUALS', 'NATIONAL_PENSION', true,
     NOW(), NOW());

  RAISE NOTICE '特定技能申請スキルのシードデータを投入しました（skill_id: %）', v_skill_id;
END $$;
