import type { ProjectSite, TeamMember } from './types';

export const INITIAL_PROJECTS: ProjectSite[] = [
  {
    id: 'proj-laravel-ec',
    name: 'ECモール受発注システム (Laravel 10)',
    url: 'https://ec-orders.example.com',
    ecosystem: 'composer',
    syncMethod: 'actions',
    isVerified: true,
    verificationToken: 'ninja-site-verification=ec99f1a23b4c',
    currentWeather: 'thunderstorm',
    lastScannedAt: '2026-10-22 18:00',
    daysUnresolved: 1,
    dependencies: [
      {
        name: 'php',
        version: '8.2.14',
        ecosystem: 'composer',
        vulnerabilities: [
          {
            id: 'CVE-2026-109618',
            title: 'php2shell: 未認証リモートコード実行 (RCE)',
            severity: 'CRITICAL',
            cvss: 9.2,
            packageName: 'php',
            affectedVersion: '< 8.2.25',
            fixedVersion: '8.2.25 / 8.3.13',
            detectedAt: '2026-10-21 23:05',
            description: '特定のURLパラメータ処理におけるバッファオーバーフロー。認証なしでサーバー権限を奪取可能。'
          }
        ]
      },
      {
        name: 'laravel/framework',
        version: '10.35.0',
        ecosystem: 'composer',
        vulnerabilities: []
      },
      {
        name: 'guzzlehttp/guzzle',
        version: '7.8.1',
        ecosystem: 'composer',
        vulnerabilities: []
      }
    ],
    forecast: [
      { date: '10/16', dayLabel: '木', weather: 'sunny', summary: '安全・異常なし', vulnerabilityCount: 0 },
      { date: '10/17', dayLabel: '金', weather: 'sunny', summary: '安全・異常なし', vulnerabilityCount: 0 },
      { date: '10/18', dayLabel: '土', weather: 'sunny', summary: '安全・異常なし', vulnerabilityCount: 0 },
      { date: '10/19', dayLabel: '日', weather: 'sunny', summary: '安全・異常なし', vulnerabilityCount: 0 },
      { date: '10/20', dayLabel: '月', weather: 'sunny', summary: '安全・異常なし', vulnerabilityCount: 0 },
      { date: '10/21', dayLabel: '火', weather: 'thunderstorm', summary: '深夜23:00 緊急パッチ公開 (CVSS 9.2)', vulnerabilityCount: 1 },
      { date: '10/22', dayLabel: '今日', weather: 'thunderstorm', summary: '大雨警報発令中：早急なパッチ適用が必要', vulnerabilityCount: 1 }
    ]
  },
  {
    id: 'proj-legacy-hanko',
    name: 'FC店舗受発注バックエンド (レガシーWP)',
    url: 'https://hanko-fc-backend.local',
    ecosystem: 'wordpress',
    syncMethod: 'wp_plugin',
    isVerified: true,
    verificationToken: 'ninja-site-verification=hk77a88b99c0',
    currentWeather: 'typhoon',
    lastScannedAt: '2026-10-22 17:30',
    daysUnresolved: 12,
    dependencies: [
      {
        name: 'wordpress-core',
        version: '6.2.2',
        ecosystem: 'wordpress',
        vulnerabilities: [
          {
            id: 'CVE-2026-8812',
            title: 'WordPress Core SQLインジェクション脆弱性',
            severity: 'HIGH',
            cvss: 8.5,
            packageName: 'wordpress-core',
            affectedVersion: '< 6.5.4',
            fixedVersion: '6.5.4',
            detectedAt: '2026-10-10 14:00',
            description: '10日以上未対応のまま放置されています。外部からDBの直接改ざんを受ける危険があります。'
          }
        ]
      },
      {
        name: 'woocommerce',
        version: '7.8.0',
        ecosystem: 'wordpress',
        vulnerabilities: []
      }
    ],
    forecast: [
      { date: '10/16', dayLabel: '木', weather: 'rain', summary: '未対応 6日経過', vulnerabilityCount: 1 },
      { date: '10/17', dayLabel: '金', weather: 'typhoon', summary: '放置 7日到達 (台風化)', vulnerabilityCount: 1 },
      { date: '10/18', dayLabel: '土', weather: 'typhoon', summary: '放置 8日経過', vulnerabilityCount: 1 },
      { date: '10/19', dayLabel: '日', weather: 'typhoon', summary: '放置 9日経過', vulnerabilityCount: 1 },
      { date: '10/20', dayLabel: '月', weather: 'typhoon', summary: '放置 10日経過', vulnerabilityCount: 1 },
      { date: '10/21', dayLabel: '火', weather: 'typhoon', summary: '放置 11日経過', vulnerabilityCount: 1 },
      { date: '10/22', dayLabel: '今日', weather: 'typhoon', summary: '台風直撃：直ちに保守ベンダーへ相談を！', vulnerabilityCount: 1 }
    ]
  },
  {
    id: 'proj-modern-app',
    name: 'マーケティングLP (Vite + React)',
    url: 'https://ninja-landing.dev',
    ecosystem: 'npm',
    syncMethod: 'actions',
    isVerified: true,
    verificationToken: 'ninja-site-verification=lp1100223344',
    currentWeather: 'sunny',
    lastScannedAt: '2026-10-22 18:20',
    daysUnresolved: 0,
    dependencies: [
      { name: 'vite', version: '5.4.10', ecosystem: 'npm', vulnerabilities: [] },
      { name: 'react', version: '18.3.1', ecosystem: 'npm', vulnerabilities: [] },
      { name: 'tailwindcss', version: '3.4.14', ecosystem: 'npm', vulnerabilities: [] }
    ],
    forecast: [
      { date: '10/16', dayLabel: '木', weather: 'sunny', summary: '快晴・異常なし', vulnerabilityCount: 0 },
      { date: '10/17', dayLabel: '金', weather: 'sunny', summary: '快晴・異常なし', vulnerabilityCount: 0 },
      { date: '10/18', dayLabel: '土', weather: 'sunny', summary: '快晴・異常なし', vulnerabilityCount: 0 },
      { date: '10/19', dayLabel: '日', weather: 'sunny', summary: '快晴・異常なし', vulnerabilityCount: 0 },
      { date: '10/20', dayLabel: '月', weather: 'sunny', summary: '快晴・異常なし', vulnerabilityCount: 0 },
      { date: '10/21', dayLabel: '火', weather: 'sunny', summary: '快晴・異常なし', vulnerabilityCount: 0 },
      { date: '10/22', dayLabel: '今日', weather: 'sunny', summary: '本日も快晴：システムは万全です', vulnerabilityCount: 0 }
    ]
  }
];

export const INITIAL_MEMBERS: TeamMember[] = [
  { id: 'm-1', name: '前田 慎吾 (あなた)', email: 'maeda@example.com', role: 'owner', addedAt: '2026-10-01' },
  { id: 'm-2', name: '佐藤 社内SE', email: 'sato@example.com', role: 'admin', addedAt: '2026-10-15' },
  { id: 'm-3', name: '外部保守パートナー (SIer)', email: 'partner@sier-tech.jp', role: 'viewer', addedAt: '2026-10-21' }
];
