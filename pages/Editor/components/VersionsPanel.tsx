import React, { useState, useEffect } from 'react';
import { History, RotateCcw, GitCommit } from 'lucide-react';
import { Version } from '../../../types';
import { versionApi } from '../../../api/version';
import { InputModal, ConfirmModal } from '../../../components/Common/Modal';

interface VersionsPanelProps {
  slideId?: string;
  onVersionRollback?: (content: string) => void;
}

export const VersionsPanel: React.FC<VersionsPanelProps> = ({
  slideId,
  onVersionRollback,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionToRollback, setVersionToRollback] = useState<Version | null>(null);
  const [rollbackMessage, setRollbackMessage] = useState('');

  useEffect(() => {
    if (slideId) {
      loadVersions();
    }
  }, [slideId]);

  const loadVersions = async () => {
    if (!slideId) return;
    setIsLoadingVersions(true);
    try {
      const res = await versionApi.findAll(Number(slideId), { page: 1, pageSize: 20 });
      if (res.statusCode === 0) {
        setVersions(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleCreateVersion = async (commitMsg: string) => {
    if (!slideId) return;
    try {
      const res = await versionApi.create(Number(slideId), { commitMsg });
      if (res.statusCode === 0) {
        setVersions([res.data, ...versions]);
      }
    } catch (err) {
      console.error('Failed to create version:', err);
    }
  };

  const handleRollback = async () => {
    if (!slideId || !versionToRollback) return;
    try {
      const res = await versionApi.rollback(Number(slideId), versionToRollback.id, {
        commitMsg: rollbackMessage || `回滚到版本 ${versionToRollback.versionNumber}`
      });
      if (res.statusCode === 0) {
        loadVersions();
        const versionRes = await versionApi.findOne(Number(slideId), versionToRollback.id);
        if (versionRes.statusCode === 0 && onVersionRollback) {
          onVersionRollback(versionRes.data.content);
        }
      }
    } catch (err) {
      console.error('Failed to rollback:', err);
    } finally {
      setVersionToRollback(null);
      setRollbackMessage('');
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 mb-2">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">版本历史</span>
          <button
            onClick={() => setShowVersionModal(true)}
            className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/60 hover:text-white transition-colors"
          >
            <GitCommit className="w-3 h-3" />
            创建版本
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-2">
          {isLoadingVersions ? (
            <div className="text-center py-8 text-white/20 text-xs">加载中...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-white/20 text-xs">暂无版本记录</div>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className="flex gap-2 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all group"
              >
                <History className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-white/40">v{version.versionNumber}</span>
                    <span className="text-xs font-medium text-white/80 truncate">{version.commitMsg}</span>
                  </div>
                  <div className="text-[10px] text-white/30 mt-1">
                    {version.creatorName} • {new Date(version.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => setVersionToRollback(version)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded text-white/40 hover:text-white transition-all"
                  title="回滚到此版本"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <InputModal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        onConfirm={handleCreateVersion}
        title="创建新版本"
        placeholder="输入版本提交信息..."
        confirmText="创建"
        cancelText="取消"
      />

      <ConfirmModal
        isOpen={!!versionToRollback}
        onClose={() => setVersionToRollback(null)}
        onConfirm={handleRollback}
        title="回滚版本"
        message={versionToRollback
          ? `确定要回滚到版本 v${versionToRollback.versionNumber} 吗？当前内容将被替换。`
          : ''}
        confirmText="回滚"
        cancelText="取消"
        type="warning"
      />
    </>
  );
};
