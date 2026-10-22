import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Check,
  Copy,
  Terminal,
  FileCode2,
  Globe2,
  Send,
  Download,
  KeyRound,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import type { ProjectSite } from '../types';

interface IntegrationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: ProjectSite | null;
}

type TabType = 'wordpress' | 'node' | 'php' | 'python' | 'request';

export const IntegrationGuideModal: React.FC<IntegrationGuideModalProps> = ({
  isOpen,
  onClose,
  site
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('wordpress');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !site) return null;

  const siteUrl = site.url || 'https://example.com';
  const siteToken = site.verificationToken || 'sbom-token-demo';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Node.js (Vite / Next.js) GitHub Actions snippet
  const nodeWorkflow = `name: SBOM Weather Sync

on:
  push:
    branches: [main]
    paths:
      - 'package.json'
      - 'pnpm-lock.yaml'
      - 'package-lock.json'
  workflow_dispatch:

jobs:
  sbom-sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Send Package Manifest to SBOM Weather
        run: |
          curl -sS -X POST "https://api.sbom-weather.com/api/v1/sync" \\
            -H "Content-Type: application/json" \\
            -H "Authorization: Bearer \${{ secrets.SBOM_WEATHER_API_KEY }}" \\
            -d @package.json
`;

  // PHP (Composer / Laravel) GitHub Actions snippet
  const phpWorkflow = `name: SBOM Weather Sync (Composer)

on:
  push:
    branches: [main]
    paths:
      - 'composer.json'
      - 'composer.lock'
  workflow_dispatch:

jobs:
  sbom-sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Send Composer Packages to SBOM Weather
        run: |
          # Extract packages from composer.lock and submit to SBOM Weather
          PACKAGES_JSON=$(jq '{ecosystem: "Packagist", packages: [.packages[] | {name: .name, version: .version}]}' composer.lock)
          curl -sS -X POST "https://api.sbom-weather.com/api/v1/sync" \\
            -H "Content-Type: application/json" \\
            -H "Authorization: Bearer \${{ secrets.SBOM_WEATHER_API_KEY }}" \\
            -d "\$PACKAGES_JSON"
`;

  // Python (FastAPI / Django / Poetry) snippet
  const pythonWorkflow = `name: SBOM Weather Sync (Python)

on:
  push:
    branches: [main]
    paths:
      - 'requirements.txt'
      - 'poetry.lock'
      - 'Pipfile.lock'
  workflow_dispatch:

jobs:
  sbom-sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Send Python Dependencies to SBOM Weather
        run: |
          # Parse requirements.txt and submit to SBOM Weather
          python -c '
import json, sys
pkgs = []
with open("requirements.txt") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "==" in line:
            name, ver = line.split("==")[:2]
            pkgs.append({"name": name.strip(), "version": ver.strip()})
print(json.dumps({"ecosystem": "PyPI", "packages": pkgs}))
' | curl -sS -X POST "https://api.sbom-weather.com/api/v1/sync" \\
            -H "Content-Type: application/json" \\
            -H "Authorization: Bearer \${{ secrets.SBOM_WEATHER_API_KEY }}" \\
            -d @-
`;

  // WordPress functions.php snippet
  const wpSnippet = `/**
 * SBOM Weather - Automatic Plugin Sync
 * Add this snippet to your theme's functions.php or a custom must-use plugin.
 */
add_action('upgrader_process_complete', 'sbom_weather_sync_plugins', 10, 2);

function sbom_weather_sync_plugins($upgrader_object, $options) {
    if ($options['type'] === 'plugin') {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        $all_plugins = get_plugins();
        $packages = [];
        foreach ($all_plugins as $file => $data) {
            $packages[] = [
                'name' => dirname($file) !== '.' ? dirname($file) : $file,
                'version' => $data['Version'],
                'ecosystem' => 'WordPress'
            ];
        }
        
        wp_remote_post('https://api.sbom-weather.com/api/v1/sync', [
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ${siteToken}'
            ],
            'body' => json.dumps(['packages' => $packages, 'ecosystem' => 'WordPress']),
            'timeout' => 15
        ]);
    }
}
`;

  // Request template for IT vendor / staff
  const requestMessage = t('integration.requestTemplate', {
    siteUrl,
    token: siteToken
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">{t('integration.title')}</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('integration.subtitle', { siteName: site.name })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Success Callout */}
        <div className="px-6 py-3 bg-emerald-50/80 border-b border-emerald-100/80 flex items-center gap-2.5 text-xs text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{t('integration.verifiedNotice')}</span>
        </div>

        {/* API Token Bar */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200/60 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-600">
            <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold text-slate-700">{t('integration.apiKeyLabel')}</span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-bold select-all">
              {siteToken}
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(siteToken, 'token')}
            className="flex items-center gap-1 text-[11px] font-sans text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
          >
            {copiedKey === 'token' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedKey === 'token' ? t('integration.copied') : t('integration.copyCode')}</span>
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 px-6 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('wordpress')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'wordpress'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>{t('integration.tabWordpress')}</span>
          </button>

          <button
            onClick={() => setActiveTab('node')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'node'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{t('integration.tabNode')}</span>
          </button>

          <button
            onClick={() => setActiveTab('php')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'php'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>{t('integration.tabPhp')}</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'python'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{t('integration.tabPython')}</span>
          </button>

          <button
            onClick={() => setActiveTab('request')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'request'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t('integration.tabRequest')}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* 1. WordPress Tab */}
          {activeTab === 'wordpress' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-600" />
                  {t('integration.wpPluginMethod')}
                </h4>
                <div className="space-y-1.5 text-slate-600 text-xs">
                  <p>{t('integration.wpPluginStep1')}</p>
                  <p>{t('integration.wpPluginStep2')}</p>
                  <p>{t('integration.wpPluginStep3')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Demo: Plugin download sbom-weather-wp.zip')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('integration.wpDownloadBtn')}</span>
                </button>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-1">
                  {t('integration.wpSnippetMethod')}
                </h4>
                <p className="text-slate-500 text-[11px] mb-2">{t('integration.wpSnippetDesc')}</p>
                <div className="relative rounded-xl bg-slate-900 text-slate-200 p-4 font-mono text-[11px] overflow-x-auto border border-slate-800">
                  <button
                    onClick={() => copyToClipboard(wpSnippet, 'wp-snippet')}
                    className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-sans font-medium border border-slate-700 cursor-pointer"
                  >
                    {copiedKey === 'wp-snippet' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'wp-snippet' ? t('integration.copied') : t('integration.copyCode')}</span>
                  </button>
                  <pre>{wpSnippet}</pre>
                </div>
              </div>
            </div>
          )}

          {/* 2. Node.js Tab */}
          {activeTab === 'node' && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-900 text-xs">{t('integration.actionsTitle')}</h4>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {t('integration.actionsFilePath')}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mb-2">{t('integration.actionsDesc')}</p>
              </div>

              <div className="relative rounded-xl bg-slate-900 text-slate-200 p-4 font-mono text-[11px] overflow-x-auto border border-slate-800">
                <button
                  onClick={() => copyToClipboard(nodeWorkflow, 'node-wf')}
                  className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-sans font-medium border border-slate-700 cursor-pointer"
                >
                  {copiedKey === 'node-wf' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'node-wf' ? t('integration.copied') : t('integration.copyCode')}</span>
                </button>
                <pre>{nodeWorkflow}</pre>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px]">
                {t('integration.actionsSecretNotice')}
              </div>
            </div>
          )}

          {/* 3. PHP (Composer) Tab */}
          {activeTab === 'php' && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-900 text-xs">{t('integration.actionsTitle')}</h4>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {t('integration.actionsFilePath')}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mb-2">{t('integration.actionsDesc')}</p>
              </div>

              <div className="relative rounded-xl bg-slate-900 text-slate-200 p-4 font-mono text-[11px] overflow-x-auto border border-slate-800">
                <button
                  onClick={() => copyToClipboard(phpWorkflow, 'php-wf')}
                  className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-sans font-medium border border-slate-700 cursor-pointer"
                >
                  {copiedKey === 'php-wf' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'php-wf' ? t('integration.copied') : t('integration.copyCode')}</span>
                </button>
                <pre>{phpWorkflow}</pre>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px]">
                {t('integration.actionsSecretNotice')}
              </div>
            </div>
          )}

          {/* 4. Python Tab */}
          {activeTab === 'python' && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-900 text-xs">{t('integration.actionsTitle')}</h4>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {t('integration.actionsFilePath')}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mb-2">{t('integration.actionsDesc')}</p>
              </div>

              <div className="relative rounded-xl bg-slate-900 text-slate-200 p-4 font-mono text-[11px] overflow-x-auto border border-slate-800">
                <button
                  onClick={() => copyToClipboard(pythonWorkflow, 'python-wf')}
                  className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-sans font-medium border border-slate-700 cursor-pointer"
                >
                  {copiedKey === 'python-wf' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'python-wf' ? t('integration.copied') : t('integration.copyCode')}</span>
                </button>
                <pre>{pythonWorkflow}</pre>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px]">
                {t('integration.actionsSecretNotice')}
              </div>
            </div>
          )}

          {/* 5. Request to IT / Maintenance Partner */}
          {activeTab === 'request' && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-1">{t('integration.requestTitle')}</h4>
                <p className="text-slate-500 text-[11px] mb-2">{t('integration.requestDesc')}</p>
              </div>

              <div className="relative rounded-xl bg-slate-50 text-slate-800 p-4 font-sans text-xs border border-slate-300">
                <button
                  onClick={() => copyToClipboard(requestMessage, 'request-msg')}
                  className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-sans font-medium border border-slate-300 shadow-2xs cursor-pointer"
                >
                  {copiedKey === 'request-msg' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'request-msg' ? t('integration.copied') : t('integration.copyCode')}</span>
                </button>
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed pr-24">
                  {requestMessage}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <a
            href="https://github.com/mahorobalab"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <span>GitHub Documentation</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            {t('integration.doneButton')}
          </button>
        </div>
      </div>
    </div>
  );
};
