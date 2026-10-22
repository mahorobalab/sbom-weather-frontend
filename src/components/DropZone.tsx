import React, { useState } from 'react';
import { UploadCloud, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Dependency } from '../types';

interface DropZoneProps {
  onFileParsed: (fileName: string, dependencies: Dependency[], isVulnerable: boolean) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFileContent = (content: string, fileName: string) => {
    try {
      setParseError(null);
      setCurrentFileName(fileName);
      const json = JSON.parse(content);

      const parsedDeps: Dependency[] = [];
      let foundVuln = false;

      // Composer.lock の場合
      if (json.packages || json['packages-dev']) {
        const allPkgs = [...(json.packages || []), ...(json['packages-dev'] || [])];
        allPkgs.forEach((pkg: any) => {
          const isPhpTarget = pkg.name === 'php' || pkg.name?.includes('php');
          // 簡易シミュレーション: php 8.2系などの脆弱性判定
          const hasVuln = isPhpTarget && pkg.version?.startsWith('8.2');

          if (hasVuln) foundVuln = true;

          parsedDeps.push({
            name: pkg.name,
            version: pkg.version || 'unknown',
            ecosystem: 'composer',
            vulnerabilities: hasVuln
              ? [
                  {
                    id: 'CVE-2026-109618',
                    title: 'php2shell: 未認証リモートコード実行 (RCE)',
                    severity: 'CRITICAL',
                    cvss: 9.2,
                    packageName: pkg.name,
                    affectedVersion: '< 8.2.25',
                    fixedVersion: '8.2.25 / 8.3.13',
                    detectedAt: '2026-10-21 23:05',
                    description: '入力パラメータ検証不備によるリモートコード実行の脆弱性。'
                  }
                ]
              : []
          });
        });
      }
      // package-lock.json の場合
      else if (json.packages || json.dependencies) {
        const pkgs = json.packages || {};
        Object.entries(pkgs).forEach(([key, val]: [string, any]) => {
          if (!key || key === '') return;
          const cleanName = key.replace(/^node_modules\//, '');
          parsedDeps.push({
            name: cleanName,
            version: val.version || '1.0.0',
            ecosystem: 'npm',
            vulnerabilities: []
          });
        });
      } else {
        throw new Error('未対応のファイル形式です。composer.lock または package-lock.json を指定してください。');
      }

      onFileParsed(fileName, parsedDeps, foundVuln);
    } catch (err: any) {
      setParseError(err.message || 'JSONの解析に失敗しました。');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processFileContent(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processFileContent(content, file.name);
    };
    reader.readAsText(file);
  };

  // サンプルデモデータ即座ロード
  const loadSample = (type: 'php_vulnerable' | 'clean_npm') => {
    if (type === 'php_vulnerable') {
      const sampleComposer = JSON.stringify({
        packages: [
          { name: 'php', version: '8.2.14' },
          { name: 'laravel/framework', version: '10.35.0' },
          { name: 'monolog/monolog', version: '3.5.0' },
          { name: 'guzzlehttp/guzzle', version: '7.8.1' }
        ]
      });
      processFileContent(sampleComposer, 'composer.lock (PHP 8.2脆弱性再現サンプル)');
    } else {
      const sampleNpm = JSON.stringify({
        packages: {
          '': {},
          'node_modules/vite': { version: '5.4.10' },
          'node_modules/react': { version: '18.3.1' },
          'node_modules/tailwindcss': { version: '3.4.14' }
        }
      });
      processFileContent(sampleNpm, 'package-lock.json (安全なクリーンサンプル)');
    }
  };

  return (
    <div className="rounded-2xl glass-panel p-6 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            <span>即座にロックファイルをドラッグ＆ドロップ解析</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            ソースコードは一切預かりません。パッケージ名とバージョンのみを安全にエッジ解析します。
          </p>
        </div>

        {/* Demo buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">お試しテスト:</span>
          <button
            onClick={() => loadSample('php_vulnerable')}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all font-mono"
          >
            ⚡ PHP脆弱性サンプル (雷雨)
          </button>
          <button
            onClick={() => loadSample('clean_npm')}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all font-mono"
          >
            ☀️ 安全なNodeサンプル (快晴)
          </button>
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging
            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/40'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".json,.lock"
          onChange={handleFileInput}
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 mb-3 group-hover:scale-110 transition-transform">
            <FileCode className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-200">
            ここに <span className="text-indigo-300 font-mono">composer.lock</span> または{' '}
            <span className="text-indigo-300 font-mono">package-lock.json</span> をドロップ
          </p>
          <p className="text-xs text-slate-500 mt-1">または クリックしてファイルを選択</p>
        </label>
      </div>

      {parseError && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {currentFileName && !parseError && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>解析完了: {currentFileName}</span>
        </div>
      )}
    </div>
  );
};
