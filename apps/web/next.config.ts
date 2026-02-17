import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // worktree 環境でルートを正しく解決するための設定
    root: path.resolve(__dirname, "../.."),
  },
  // Prisma のネイティブモジュールをサーバーサイド外部パッケージとして扱う
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
