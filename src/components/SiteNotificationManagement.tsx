import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Plus,
  Mail,
  Send,
  Trash2,
  CheckCircle2,
  Database,
  X,
  Radio,
  Check,
  MessageSquare
} from 'lucide-react';
import type { ProjectSite } from '../types';

export type NotificationChannelType = 'slack' | 'teams' | 'email';

export interface NotificationChannel {
  id: string;
  type: NotificationChannelType;
  name: string;
  target: string; // Webhook URL or Email address
  enabled: boolean;
  triggers: {
    criticalAlerts: boolean; // CVSS 7.0+ / Storm / Typhoon
    pluginUpdates: boolean;  // Config / Plugin changes
    dailyDigest: boolean;    // Daily / Weekly summary
  };
  createdAt: string;
}

interface SiteNotificationManagementProps {
  site: ProjectSite;
}

export const SiteNotificationManagement: React.FC<SiteNotificationManagementProps> = ({ site }) => {
  const { t } = useTranslation();
  const siteDisplayName = site.nameKey ? t(site.nameKey as any) : site.name;

  // Mock list of notification channels
  const [channels, setChannels] = useState<NotificationChannel[]>([
    {
      id: 'nc_1',
      type: 'slack',
      name: 'Slack #security-alerts',
      target: 'https://hooks.slack.com/services/T000/B000/XXXXX',
      enabled: true,
      triggers: {
        criticalAlerts: true,
        pluginUpdates: true,
        dailyDigest: false,
      },
      createdAt: '2026-11-01',
    },
    {
      id: 'nc_2',
      type: 'teams',
      name: t('notifications.mockTeamsName'),
      target: 'https://outlook.office.com/webhook/xxxx@xxxx/IncomingWebhook/xxxx',
      enabled: true,
      triggers: {
        criticalAlerts: true,
        pluginUpdates: false,
        dailyDigest: false,
      },
      createdAt: '2026-11-05',
    },
    {
      id: 'nc_3',
      type: 'email',
      name: t('notifications.mockEmailName'),
      target: 'security-notify@example.com',
      enabled: false,
      triggers: {
        criticalAlerts: true,
        pluginUpdates: true,
        dailyDigest: true,
      },
      createdAt: '2026-11-08',
    },
  ]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testSentId, setTestSentId] = useState<string | null>(null);

  // Form State
  const [channelType, setChannelType] = useState<NotificationChannelType>('slack');
  const [channelName, setChannelName] = useState('');
  const [channelTarget, setChannelTarget] = useState('');
  const [triggerCritical, setTriggerCritical] = useState(true);
  const [triggerPlugin, setTriggerPlugin] = useState(true);
  const [triggerDigest, setTriggerDigest] = useState(false);

  const openAddModal = () => {
    setChannelType('slack');
    setChannelName('');
    setChannelTarget('');
    setTriggerCritical(true);
    setTriggerPlugin(true);
    setTriggerDigest(false);
    setIsModalOpen(true);
  };

  const handleToggleChannel = (id: string) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, enabled: !ch.enabled } : ch))
    );
  };

  const handleDeleteChannel = (id: string) => {
    setChannels((prev) => prev.filter((ch) => ch.id !== id));
  };

  const handleTestSend = (id: string) => {
    setTestSentId(id);
    setTimeout(() => {
      setTestSentId(null);
    }, 2500);
  };

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim() || !channelTarget.trim()) return;

    const newChannel: NotificationChannel = {
      id: `nc_${Date.now()}`,
      type: channelType,
      name: channelName.trim(),
      target: channelTarget.trim(),
      enabled: true,
      triggers: {
        criticalAlerts: triggerCritical,
        pluginUpdates: triggerPlugin,
        dailyDigest: triggerDigest,
      },
      createdAt: new Date().toISOString().split('T')[0],
    };

    setChannels((prev) => [newChannel, ...prev]);
    setIsModalOpen(false);
  };

  const renderChannelIcon = (type: NotificationChannelType) => {
    switch (type) {
      case 'slack':
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      case 'teams':
        return (
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
            <Radio className="w-4 h-4" />
          </div>
        );
      case 'email':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
        );
    }
  };

  const renderChannelTypeName = (type: NotificationChannelType) => {
    switch (type) {
      case 'slack':
        return 'Slack Webhook';
      case 'teams':
        return 'Microsoft Teams';
      case 'email':
        return 'Email';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              {siteDisplayName}
            </span>
            <span className="text-xs text-slate-400 font-mono">{site.url}</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <span>{t('notifications.title')}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {t('notifications.description')}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('notifications.addNotificationBtn')}</span>
        </button>
      </div>

      {/* Architecture / Queue Info Banner */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-xs border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex items-start gap-3.5 relative z-10">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                {t('notifications.architectureBadge')}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/30 text-indigo-200">
                Queue & Audit Log
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-1">
              {t('notifications.architectureTitle')}
            </h4>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-3xl">
              {t('notifications.architectureDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Notification Channels List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900">
              {t('notifications.channelListTitle', { count: channels.length })}
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            {t('notifications.channelListSub')}
          </span>
        </div>

        {channels.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h5 className="text-sm font-bold text-slate-800">
              {t('notifications.emptyTitle')}
            </h5>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {t('notifications.emptyDesc')}
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('notifications.addNotificationBtn')}</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {channels.map((ch) => {
              const isTestSent = testSentId === ch.id;

              return (
                <div
                  key={ch.id}
                  className={`p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    ch.enabled ? 'bg-white hover:bg-slate-50/60' : 'bg-slate-50/50 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {renderChannelIcon(ch.type)}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {ch.name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {renderChannelTypeName(ch.type)}
                        </span>
                        {ch.enabled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            {t('notifications.statusActive')}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {t('notifications.statusDisabled')}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-mono text-slate-500 truncate mt-1 max-w-md">
                        {ch.target}
                      </p>

                      {/* Triggers badges */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="text-[11px] text-slate-400 mr-1">
                          {t('notifications.triggerLabel')}:
                        </span>
                        {ch.triggers.criticalAlerts && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            {t('notifications.triggerCritical')}
                          </span>
                        )}
                        {ch.triggers.pluginUpdates && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            {t('notifications.triggerPlugin')}
                          </span>
                        )}
                        {ch.triggers.dailyDigest && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {t('notifications.triggerDigest')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Toggle Active Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleChannel(ch.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        ch.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                      title={ch.enabled ? t('notifications.disableTooltip') : t('notifications.enableTooltip')}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          ch.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {/* Test Send Button */}
                    <button
                      type="button"
                      onClick={() => handleTestSend(ch.id)}
                      disabled={isTestSent}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isTestSent
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isTestSent ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t('notifications.testSent')}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t('notifications.testSendBtn')}</span>
                        </>
                      )}
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteChannel(ch.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title={t('notifications.deleteTooltip')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Notification Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {t('notifications.modalTitle')}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {siteDisplayName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateChannel} className="p-6 space-y-4">
              {/* Channel Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {t('notifications.labelType')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setChannelType('slack');
                      if (!channelName) setChannelName('Slack #security-alerts');
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      channelType === 'slack'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5 text-amber-500" />
                    <span>Slack</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setChannelType('teams');
                      if (!channelName) setChannelName(t('notifications.defaultTeamsName'));
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      channelType === 'teams'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Radio className="w-5 h-5 text-indigo-600" />
                    <span>MS Teams</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setChannelType('email');
                      if (!channelName) setChannelName(t('notifications.defaultEmailName'));
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      channelType === 'email'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Mail className="w-5 h-5 text-emerald-600" />
                    <span>Email</span>
                  </button>
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('notifications.labelName')}
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder={t('notifications.placeholderName')}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Webhook / Email Target Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {channelType === 'email'
                    ? t('notifications.labelEmail')
                    : t('notifications.labelWebhookUrl')}
                </label>
                <input
                  type={channelType === 'email' ? 'email' : 'url'}
                  value={channelTarget}
                  onChange={(e) => setChannelTarget(e.target.value)}
                  placeholder={
                    channelType === 'email'
                      ? 'sec-alerts@example.com'
                      : 'https://hooks.slack.com/services/...'
                  }
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Trigger Options */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('notifications.labelTriggers')}
                </label>
                <div className="space-y-2 bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={triggerCritical}
                      onChange={(e) => setTriggerCritical(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-rose-700">
                      {t('notifications.triggerOptionCritical')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {t('notifications.triggerDetailCritical')}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={triggerPlugin}
                      onChange={(e) => setTriggerPlugin(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-800">
                      {t('notifications.triggerOptionPlugin')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {t('notifications.triggerDetailPlugin')}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={triggerDigest}
                      onChange={(e) => setTriggerDigest(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-800">
                      {t('notifications.triggerOptionDigest')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {t('notifications.triggerDetailDigest')}
                    </span>
                  </label>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2 text-[11px] text-indigo-900 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>{t('notifications.saveFirstNotice')}</span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  {t('notifications.cancelBtn')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {t('notifications.saveChannelBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
