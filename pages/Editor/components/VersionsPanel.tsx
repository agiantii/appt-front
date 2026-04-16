import React, { useState, useEffect } from 'react';
import { History, RotateCcw, GitCommit, GitCompare } from 'lucide-react';
import * as Diff from 'diff';
import { Version } from '../../../types';
import { versionApi } from '../../../api/version';
import { InputModal, ConfirmModal, Modal } from '../../../components/Common/Modal';
import { useTheme } from '../../../contexts/ThemeContext';

interface VersionsPanelProps {
  slideId?: string;
  currentContent?: string;
  onVersionRollback?: (content: string) => void;
}

export const VersionsPanel: React.FC<VersionsPanelProps> = ({
  slideId,
  currentContent,
  onVersionRollback,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionToRollback, setVersionToRollback] = useState<Version | null>(null);
  const [rollbackMessage, setRollbackMessage] = useState('');
  const [compareVersion, setCompareVersion] = useState<Version | null>(null);
  const [diffResult, setDiffResult] = useState<Diff.Change[]>([]);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);

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

  const handleCompare = async (version: Version) => {
    if (!currentContent || !slideId) return;
    setIsLoadingDiff(true);
    setCompareVersion(version);
    try {
      const res = await versionApi.findOne(Number(slideId), version.id);
      if (res.statusCode === 0) {
        const changes = Diff.diffLines(res.data.content, currentContent);
        setDiffResult(changes);
      }
    } catch (err) {
      console.error('Failed to load version content:', err);
    } finally {
      setIsLoadingDiff(false);
    }
  };

  const renderDiffContent = () => {
    return diffResult.map((part, index) => {
      let colorClass = '';
      let prefixColor = isDark ? 'text-white/80' : 'text-black/80';
      // 用黑白增强可读性（新增/删除有明显的深浅对比）
      if (part.added) {
        // 新增：使用“纯底色”来强对比
        colorClass = isDark ? 'bg-white text-black' : 'bg-black text-white';
        prefixColor = isDark ? 'text-black' : 'text-white';
      } else if (part.removed) {
        // 删除：不使用彩色，改用边框 + 前缀标识
        colorClass = isDark
          ? 'bg-black/50 text-white border-l-2 border-white/80'
          : 'bg-white text-black border-l-2 border-black/80';
        prefixColor = isDark ? 'text-white' : 'text-black';
      } else {
        colorClass = isDark ? 'text-white/80' : 'text-black/80';
      }
      
      const prefix = part.added ? '+' : part.removed ? '-' : ' ';
      
      const value = part.value || '';
      return (
        <div key={index} className={`${colorClass} font-mono text-xs whitespace-pre-wrap`}>
          {value.split('\n').map((line, i) => (
            <div
              key={i}
              className={`px-2 py-0.5 ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'} transition-colors`}
            >
              {line && (
                <>
                  <span className={`select-none mr-2 ${prefixColor}`}>{prefix}</span>
                  {line}
                </>
              )}
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <>
      <div className={`flex flex-col h-full ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
        <div className="flex items-center justify-between px-3 py-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-black/70 dark:text-white/70">版本历史</span>
          <button
            onClick={() => setShowVersionModal(true)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            <GitCommit className="w-3 h-3" />
            创建版本
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-2">
          {isLoadingVersions ? (
            <div className="text-center py-8 text-xs text-black/70 dark:text-white/70">加载中...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-xs text-black/70 dark:text-white/70">暂无版本记录</div>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className={`flex gap-2 p-3 ${isDark ? 'bg-black' : 'bg-white'} rounded-xl border transition-all group ${
                  isDark ? 'border-white/60 hover:border-white/90' : 'border-black/60 hover:border-black/90'
                }`}
              >
                <History className="w-4 h-4 flex-shrink-0 mt-0.5 text-black/70 dark:text-white/70" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-black/70 dark:text-white/70">v{version.versionNumber}</span>
                    <span className="text-xs font-medium truncate">{version.commitMsg}</span>
                  </div>
                  <div className="text-[10px] mt-1 text-black/70 dark:text-white/70">
                    {version.creatorName} • {new Date(version.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleCompare(version)}
                    className={`p-1.5 rounded transition-all ${
                      isDark ? 'hover:bg-white/15 text-white/80' : 'hover:bg-black/5 text-black/80'
                    }`}
                    title="对比版本"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setVersionToRollback(version)}
                    className={`p-1.5 rounded transition-all ${
                      isDark ? 'hover:bg-white/15 text-white/80' : 'hover:bg-black/5 text-black/80'
                    }`}
                    title="回滚到此版本"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
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

      <Modal
        isOpen={!!compareVersion}
        onClose={() => {
          setCompareVersion(null);
          setDiffResult([]);
        }}
        title={compareVersion ? `版本对比 - v${compareVersion.versionNumber}` : '版本对比'}
        size="lg"
        theme="blackWhite"
      >
        <div className="space-y-3 p-4 rounded-lg">
          <div className="flex items-center gap-4 text-xs text-black/80 dark:text-white/80">
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${isDark ? 'bg-white' : 'bg-black'}`} />
              <span className="font-medium">版本内容 (删除)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${isDark ? 'border border-white/80' : 'border border-black/80'} ${isDark ? 'bg-black' : 'bg-white'}`} />
              <span className="font-medium">当前内容 (新增)</span>
            </div>
          </div>
          <div
            className={`max-h-[400px] overflow-y-auto rounded-lg border ${
              isDark ? 'bg-black border-white/60' : 'bg-white border-black/60'
            }`}
          >
            {isLoadingDiff ? (
              <div className="text-center py-8 text-xs text-black/70 dark:text-white/70">加载中...</div>
            ) : (
              renderDiffContent()
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
