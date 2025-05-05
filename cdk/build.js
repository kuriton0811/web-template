const esbuild = require("esbuild");

// ビルド設定
esbuild.build({
  entryPoints: ["bin/cdk.ts"], // エントリーポイントの指定
  bundle: true, // バンドルを有効化
  platform: "node",
  outfile: "dist/cdk.js", // 出力ファイル
  minify: true, // コードを最小化
  sourcemap: true, // ソースマップを生成
  target: ["es2022"], // 対応ブラウザ/環境を指定
});
