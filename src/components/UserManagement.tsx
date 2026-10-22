import React, { useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TeamMember } from '../types';

interface UserManagementProps {
  members: TeamMember[];
  onAddMember: (member: Partial<TeamMember>) => void;
  onRemoveMember: (id: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ members, onAddMember, onRemoveMember }) => {
  const { t } = useTranslation();
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
    <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">{t('users.title')}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{t('users.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('users.inviteMember')}</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-6 p-5 rounded-xl bg-slate-50 border border-indigo-200 text-sm">
          <h4 className="font-bold text-slate-900 mb-3">{t('users.addNewMember')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('users.nameLabel')}</label>
              <input
                type="text"
                placeholder={t('users.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('users.emailLabel')}</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('users.roleLabel')}</label>
              <select
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="viewer">{t('users.roleViewer')}</option>
                <option value="admin">{t('users.roleAdmin')}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              {t('users.addButton')}
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-slate-100">
        {members.map((member) => {
          const memberDisplayName = member.nameKey ? t(member.nameKey as any) : member.name;
          return (
            <div key={member.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                  {memberDisplayName.substring(0, 1)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span>{memberDisplayName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                      member.role === 'owner' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      member.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {member.role.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">{member.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{t('users.addedDate', { date: member.addedAt })}</span>
                {member.role !== 'owner' && (
                  <button
                    onClick={() => onRemoveMember(member.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title={t('users.removeMemberTitle')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
