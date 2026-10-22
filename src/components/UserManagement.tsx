import React, { useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import type { TeamMember } from '../types';

interface UserManagementProps {
  members: TeamMember[];
  onAddMember: (member: Partial<TeamMember>) => void;
  onRemoveMember: (id: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ members, onAddMember, onRemoveMember }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    onAddMember({
      name,
      email,
      role,
      addedAt: new Date().toISOString().split('T')[0]
    });

    setName('');
    setEmail('');
    setIsAdding(false);
  };

  return (
    <div className="rounded-2xl glass-panel p-6 border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-white">チームメンバー / 権限管理</h3>
          <p className="text-xs text-slate-400">ダッシュボードへのアクセス権限および通知を受け取るユーザー</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>メンバーを招待</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 text-sm">
          <h4 className="font-semibold text-white mb-3">新しいメンバーの追加</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">氏名 / 担当名</label>
              <input
                type="text"
                placeholder="例: 山田 太郎"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">メールアドレス</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">権限ロール</label>
              <select
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="viewer">閲覧専用 (Viewer: PDF出力・ステータス確認のみ)</option>
                <option value="admin">管理者 (Admin: サイト追加・設定変更可能)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
            >
              追加
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-slate-800/60">
        {members.map((member) => (
          <div key={member.id} className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-semibold text-xs">
                {member.name.substring(0, 1)}
              </div>
              <div>
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  <span>{member.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    member.role === 'owner' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    member.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {member.role.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">{member.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">追加日: {member.addedAt}</span>
              {member.role !== 'owner' && (
                <button
                  onClick={() => onRemoveMember(member.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors"
                  title="メンバーを削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
