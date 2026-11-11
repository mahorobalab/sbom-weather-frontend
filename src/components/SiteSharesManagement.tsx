import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Share2,
  Plus,
  Copy,
  Check,
  Calendar,
  Lock,
  Link as LinkIcon,
  Zap,
  Trash2,
  ExternalLink,
  RefreshCw,
  Clock,
  ShieldCheck,
  X
} from 'lucide-react';
import type { ProjectSite, SiteMonitorShare } from '../types';

interface SiteSharesManagementProps {
  site: ProjectSite;
  shares: SiteMonitorShare[];
  onAddShare: (share: Omit<SiteMonitorShare, 'id' | 'createdAt' | 'viewCount'>) => void;
  onDeleteShare: (shareId: string) => void;
  currentUserUid?: string;
}

const generateRandomPin = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateUniqueToken = (): string => {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let token = 'vw_';
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export const SiteSharesManagement: React.FC<SiteSharesManagementProps> = ({
  site,
  shares,
  onAddShare,
  onDeleteShare,
  currentUserUid
}) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [justCreatedShare, setJustCreatedShare] = useState<SiteMonitorShare | null>(null);

  // Form State
  const defaultShareName = `${t('shares.defaultNamePrefix', { defaultValue: 'Monitor View' })} ${shares.length + 1}`;
  const [name, setName] = useState(defaultShareName);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiresAtDate, setExpiresAtDate] = useState('');
  const [pin, setPin] = useState(generateRandomPin());
  const [pinMode, setPinMode] = useState<'input' | 'url'>('url');
  const [isOneTime, setIsOneTime] = useState(false);

  const openCreateModal = () => {
    const nextName = `${t('shares.defaultNamePrefix', { defaultValue: 'Monitor View' })} ${shares.length + 1}`;
    setName(nextName);
    setHasExpiry(false);
    // Default expiry 7 days from now if user enables it
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setExpiresAtDate(defaultDate.toISOString().split('T')[0]);
    setPin(generateRandomPin());
    setPinMode('url');
    setIsOneTime(false);
    setIsModalOpen(true);
  };

  const handleGenerateNewPin = () => {
    setPin(generateRandomPin());
  };

  const buildShareUrl = (share: SiteMonitorShare): string => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sbom-weather.app';
    const uidParam = currentUserUid ? `uid=${encodeURIComponent(currentUserUid)}&` : '';
    const pinParam = share.pinMode === 'url' ? `&pin=${share.pin}` : '';
    return `${origin}/?${uidParam}view=${share.token}${pinParam}`;
  };

  const handleCreateShare = (e: React.FormEvent) => {
    e.preventDefault();
    const token = generateUniqueToken();
    const newShareData: Omit<SiteMonitorShare, 'id' | 'createdAt' | 'viewCount'> = {
      siteId: site.id,
      name: name.trim() || defaultShareName,
      token,
      expiresAt: hasExpiry && expiresAtDate ? new Date(`${expiresAtDate}T23:59:59`).toISOString() : null,
      pin,
      pinMode,
      isOneTime
    };

    onAddShare(newShareData);

    const createdShare: SiteMonitorShare = {
      ...newShareData,
      id: `sh_${Date.now()}`,
      createdAt: new Date().toISOString(),
      viewCount: 0
    };

    setIsModalOpen(false);
    setJustCreatedShare(createdShare);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const siteDisplayName = site.nameKey ? t(site.nameKey as any) : site.name;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                {siteDisplayName}
              </span>
              <span className="text-xs text-slate-400 font-mono">{site.url}</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-600" />
              <span>{t('shares.title')}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {t('shares.description')}
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer hover:shadow-indigo-500/20 active:scale-98 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{t('shares.createNewBtn')}</span>
          </button>
        </div>
      </div>

      {/* Share Links Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {t('shares.activeListTitle', { count: shares.length })}
          </h4>
        </div>

        {shares.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <Share2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">{t('shares.emptyTitle')}</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              {t('shares.emptyDesc')}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('shares.createNewBtn')}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{t('shares.colName')}</th>
                  <th className="py-3 px-4">{t('shares.colUrl')}</th>
                  <th className="py-3 px-4">{t('shares.colPin')}</th>
                  <th className="py-3 px-4">{t('shares.colExpiry')}</th>
                  <th className="py-3 px-4">{t('shares.colOneTime')}</th>
                  <th className="py-3 px-4 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {shares.map((share) => {
                  const shareUrl = buildShareUrl(share);
                  const isExpired = share.expiresAt ? new Date(share.expiresAt).getTime() < Date.now() : false;

                  return (
                    <tr key={share.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{share.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(share.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* URL & Copy */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5 max-w-xs">
                          <input
                            type="text"
                            readOnly
                            value={shareUrl}
                            className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] rounded px-2 py-1 truncate w-full select-all"
                          />
                          <button
                            type="button"
                            onClick={() => copyToClipboard(shareUrl, `url-${share.id}`)}
                            title={t('common.copy')}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shrink-0"
                          >
                            {copiedId === `url-${share.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                            )}
                          </button>
                          <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t('shares.openLinkTitle')}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* PIN */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {share.pin}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {share.pinMode === 'url' ? t('shares.pinModeUrlShort') : t('shares.pinModeInputShort')}
                          </span>
                        </div>
                      </td>

                      {/* Expiry */}
                      <td className="py-3.5 px-4">
                        {share.expiresAt ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className={`w-3.5 h-3.5 ${isExpired ? 'text-rose-500' : 'text-slate-400'}`} />
                            <span className={isExpired ? 'text-rose-600 font-bold line-through' : 'text-slate-600'}>
                              {new Date(share.expiresAt).toLocaleDateString()}
                            </span>
                            {isExpired && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                                {t('shares.expiredBadge')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-medium">{t('shares.unlimitedExpiry')}</span>
                        )}
                      </td>

                      {/* One-Time */}
                      <td className="py-3.5 px-4">
                        {share.isOneTime ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Zap className="w-3 h-3 text-amber-600" />
                            <span>{t('shares.oneTimeBadge')}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">{t('shares.regularBadge')}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteShare(share.id)}
                          title={t('common.delete')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{t('shares.modalTitle')}</h3>
                <p className="text-xs text-slate-500">{siteDisplayName} ({site.url})</p>
              </div>
            </div>

            <form onSubmit={handleCreateShare} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('shares.labelName')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={defaultShareName}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Expiry */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  {t('shares.labelExpiry')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHasExpiry(false)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                      !hasExpiry
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 font-semibold shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t('shares.expiryOptionUnlimited')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasExpiry(true)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      hasExpiry
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 font-semibold shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t('shares.expiryOptionDate')}</span>
                  </button>
                </div>

                {hasExpiry && (
                  <div className="pt-1">
                    <input
                      type="date"
                      required={hasExpiry}
                      value={expiresAtDate}
                      onChange={(e) => setExpiresAtDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* PIN Code */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t('shares.labelPin')}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateNewPin}
                    className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{t('shares.regeneratePin')}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pin}
                    className="w-32 px-3 py-2 text-center rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold text-base tracking-widest select-all"
                  />
                  <span className="text-xs text-slate-400">
                    {t('shares.pinNotice')}
                  </span>
                </div>

                {/* PIN Mode Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      pinMode === 'url'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pinMode"
                      value="url"
                      checked={pinMode === 'url'}
                      onChange={() => setPinMode('url')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <LinkIcon className="w-3 h-3 text-indigo-600" />
                        <span>{t('shares.pinModeUrlTitle')}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {t('shares.pinModeUrlDesc')}
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      pinMode === 'input'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pinMode"
                      value="input"
                      checked={pinMode === 'input'}
                      onChange={() => setPinMode('input')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-indigo-600" />
                        <span>{t('shares.pinModeInputTitle')}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {t('shares.pinModeInputDesc')}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* One-Time Checkbox */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/70 transition-colors">
                  <input
                    type="checkbox"
                    checked={isOneTime}
                    onChange={(e) => setIsOneTime(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('shares.labelOneTime')}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {t('shares.descOneTime')}
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer hover:shadow-indigo-500/20 active:scale-98"
                >
                  {t('shares.submitPublish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Just Created Success Modal */}
      {justCreatedShare && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              {t('shares.successTitle')}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {t('shares.successDesc', { name: justCreatedShare.name })}
            </p>

            <div className="my-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left">
              <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                {t('shares.generatedUrlLabel')}
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <input
                  type="text"
                  readOnly
                  value={buildShareUrl(justCreatedShare)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded px-2.5 py-1.5 truncate text-[11px] select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(buildShareUrl(justCreatedShare), 'success-url')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shrink-0 transition-all shadow-xs"
                >
                  {copiedId === 'success-url' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('common.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t('common.copy')}</span>
                    </>
                  )}
                </button>
              </div>

              {justCreatedShare.pinMode === 'input' && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">{t('shares.requiredPinNotice')}</span>
                  <strong className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                    {justCreatedShare.pin}
                  </strong>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setJustCreatedShare(null)}
                className="w-full px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                {t('common.close')}
              </button>
              <a
                href={buildShareUrl(justCreatedShare)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 no-underline"
              >
                <span>{t('shares.testOpenBtn')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
