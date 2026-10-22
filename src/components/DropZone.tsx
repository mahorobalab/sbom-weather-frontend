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

  const processFileContent = async (content: string, fileName: string) => {
    try {
      setParseError(null);
      setCurrentFileName(fileName);
      const json = JSON.parse(content);

      const parsedDeps: Dependency[] = [];
      let ecosystem = 'composer';

      // Composer.lock の場合
      if (json.packages || json['packages-dev']) {
        ecosystem = 'composer';
        const allPkgs = [...(json.packages || []), ...(json['packages-dev'] || [])];
        allPkgs.forEach((pkg: any) => {
          parsedDeps.push({
            name: pkg.name,
            version: pkg.version || 'unknown',
            ecosystem: 'composer',
            vulnerabilities: []
          });
        });
      }
      // package-lock.json の場合
      else if (json.packages || json.dependencies) {
        ecosystem = 'npm';
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

      // バックエンドAPI (/api/v1/sync) への突合リクエスト
      try {
        const response = await fetch('/api/v1/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packages: parsedDeps.map(d => ({ name: d.name, version: d.version, ecosystem: d.ecosystem })),
            ecosystem
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.alerts && result.alerts.length > 0) {
            // アラートを対応するパッケージにマッピング
            result.alerts.forEach((alert: any) => {
              const matchedDep = parsedDeps.find(d => d.name.toLowerCase() === alert.packageName.toLowerCase());
              if (matchedDep) {
                matchedDep.vulnerabilities.push({
                  id: alert.cve_id,
                  title: alert.title,
                  severity: alert.severity,
                  cvss: alert.cvss,
                  packageName: alert.packageName,
                  affectedVersion: `< ${alert.fixedVersion}`,
                  fixedVersion: alert.fixedVersion,
                  detectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  description: alert.description
                });
              }
            });
            onFileParsed(fileName, parsedDeps, true);
            return;
          }
        }
      } catch (apiErr) {
        console.warn('Backend sync API failed or offline, falling back to local simulation:', apiErr);
      }

      // フォールバック: php 8.2系の簡易判定
      let foundVuln = false;
      parsedDeps.forEach(dep => {
        if ((dep.name === 'php' || dep.name.includes('php')) && dep.version.startsWith('8.2')) {
          foundVuln = true;
          dep.vulnerabilities.push({
            id: 'CVE-2026-109618',
            title: 'php2shell: 未認証リモートコード実行 (RCE)',
            severity: 'CRITICAL',
            cvss: 9.2,
            packageName: dep.name,
            affectedVersion: '< 8.2.25',
            fixedVersion: '8.2.25 / 8.3.13',
            detectedAt: '2026-10-21 23:05',
            description: '入力パラメータ検証不備によるリモートコード実行の脆弱性。'
          });
        }
      });

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
    <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-600" />
            <span>即座にロックファイルをドラッグ＆ドロップ解析</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ソースコードは一切預かりません。パッケージ名とバージョンのみを安全にエッジ解析します。
          </p>
        </div>

        {/* Demo buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">お試しテスト:</span>
          <button
            onClick={() => loadSample('php_vulnerable')}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 transition-all font-medium cursor-pointer shadow-2xs"
          >
            ⚡ PHP脆弱性サンプル (雷雨)
          </button>
          <button
            onClick={() => loadSample('clean_npm')}
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300/80 transition-all font-medium cursor-pointer shadow-2xs"
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
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-indigo-400 bg-slate-50/40 hover:bg-slate-50/80'
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
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 mb-3 shadow-xs group-hover:scale-105 transition-transform">
            <FileCode className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            ここに <span className="text-indigo-600 font-semibold font-mono">composer.lock</span> または{' '}
            <span className="text-indigo-600 font-semibold font-mono">package-lock.json</span> をドロップ
          </p>
          <p className="text-xs text-slate-500 mt-1">または クリックしてファイルを選択</p>
        </label>
      </div>

      {parseError && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{parseError}</span>
        </div>
      )}

      {currentFileName && !parseError && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>解析完了: {currentFileName}</span>
        </div>
      )}
    </div>
  );
};

