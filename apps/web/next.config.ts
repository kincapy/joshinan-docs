import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // worktree 環境でルートを正しく解決するための設定
    root: path.resolve(__dirname, "../.."),
  },
  // サーバーサイドでのみ使うネイティブモジュールを外部パッケージとして扱う
  serverExternalPackages: ["@prisma/client", "exceljs"],
  // Vercel デプロイ時にテンプレートファイルをバンドルに含める
  // （申請書類の Excel テンプレートをサーバーサイドで読み込むため必要）
  outputFileTracingIncludes: {
    "/api/projects/\\[id\\]/generate-documents": [
      "./templates/ssw-application/**/*",
    ],
    "/api/templates/\\[docCode\\]": [
      "./templates/ssw-application/**/*",
    ],
  },
};

export default nextConfig;
