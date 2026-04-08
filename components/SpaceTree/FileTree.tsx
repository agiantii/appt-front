
import React, { useState, useEffect, useRef } from 'react';
import { slideApi } from '../../api/slide';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  FolderPlus, 
  FilePlus,
  GripVertical,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Slide, FileTreeNode } from '../../types';
import { ConfirmModal, InputModal } from '../Common/Modal';
import { useTheme } from '../../contexts/ThemeContext';

// Toast 通知组件
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: number) => void }> = ({ toasts, onRemove }) => {
  useEffect(() => {
    toasts.forEach(toast => {
      setTimeout(() => onRemove(toast.id), 2000);
    });
  }, [toasts, onRemove]);

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-right duration-200 ${
            toast.type === 'success' ? 'bg-success/90 text-white' : 'bg-destructive/90 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

interface FileTreeProps {
  data: Slide[];
  slideSpaceId?: string | number;
  onSelect?: (id: number) => void;
  onUpdate?: (updatedData: Slide[]) => void;
  onAddChild?: (parentId: number) => void;
  onAddRoot?: () => void;
}

const FileTree: React.FC<FileTreeProps> = ({ data, slideSpaceId, onSelect, onUpdate, onAddChild, onAddRoot }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [localSlides, setLocalSlides] = useState<Slide[]>(data);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'inside' | 'after' | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<number | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [slideToRename, setSlideToRename] = useState<{id: number; originalTitle: string} | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync local state when prop changes
  useEffect(() => {
    setLocalSlides(data);
  }, [data]);

  const buildTree = (nodes: Slide[], parentId: number | null = null): FileTreeNode[] => {
    return nodes
      .filter(node => node.parentId === parentId)
      // Use original order from API, don't sort locally
      .map(node => ({
        ...node,
        children: buildTree(nodes, node.id)
      }));
  };

  const tree = buildTree(localSlides);

  const toggleExpand = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- ACTIONS ---

  const handleRename = async (newTitle: string) => {
    if (!slideToRename) {
      setShowRenameModal(false);
      setSlideToRename(null);
      return;
    }
    const trimmedTitle = newTitle.trim();
    // 如果内容为空或与原标题相同，则不执行重命名
    if (!trimmedTitle || trimmedTitle === slideToRename.originalTitle) {
      setShowRenameModal(false);
      setSlideToRename(null);
      return;
    }
    try {
      const res = await slideApi.update(slideToRename.id, { title: trimmedTitle });
      if (res.statusCode === 0) {
        const updated = localSlides.map(s => s.id === slideToRename.id ? res.data : s);
        setLocalSlides(updated);
        if (onUpdate) onUpdate(updated);
        addToast('Document renamed successfully', 'success');
      } else {
        addToast(res.message || 'Failed to rename document', 'error');
      }
    } catch (err) {
      addToast('Failed to rename document', 'error');
    }
    setShowRenameModal(false);
    setSlideToRename(null);
    setActiveMenuId(null);
  };

  const handleDelete = async () => {
    if (!slideToDelete) return;

    try {
      const res = await slideApi.remove(slideToDelete);
      if (res.statusCode === 0) {
        const idsToDelete = new Set<number>();
        const findChildrenRecursive = (parentId: number) => {
          idsToDelete.add(parentId);
          localSlides.filter(s => s.parentId === parentId).forEach(child => findChildrenRecursive(child.id));
        };
        findChildrenRecursive(slideToDelete);

        const updated = localSlides.filter(s => !idsToDelete.has(s.id));
        setLocalSlides(updated);
        if (onUpdate) onUpdate(updated);
        addToast('Document deleted successfully', 'success');
      } else {
        addToast(res.message || 'Failed to delete document', 'error');
      }
    } catch (err) {
      addToast('Failed to delete document', 'error');
    }
    setShowDeleteModal(false);
    setSlideToDelete(null);
    setActiveMenuId(null);
  };
  
  const openDeleteModal = (id: number) => {
    setSlideToDelete(id);
    setShowDeleteModal(true);
    setActiveMenuId(null);
  };
  
  const openRenameModal = (id: number, currentTitle: string) => {
    setSlideToRename({ id, originalTitle: currentTitle });
    setShowRenameModal(true);
    setActiveMenuId(null);
  };

  // --- DRAG AND DROP ---

  const isDescendant = (potentialChildId: number, potentialParentId: number): boolean => {
    const node = localSlides.find(s => s.id === potentialChildId);
    if (!node || node.parentId === null) return false;
    if (node.parentId === potentialParentId) return true;
    return isDescendant(node.parentId, potentialParentId);
  };

  const onDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    setIsDragging(true);
    e.dataTransfer.setData("nodeId", id.toString());
    e.dataTransfer.effectAllowed = "move";
    // 设置拖拽图像
    const dragEl = e.currentTarget as HTMLElement;
    if (dragEl) {
      e.dataTransfer.setDragImage(dragEl, 20, 12);
    }
  };

  const onDragEnd = () => {
    setDraggedId(null);
    setDropTargetId(null);
    setDropPosition(null);
    setIsDragging(false);
  };

  const onDragOver = (e: React.DragEvent, targetId: number | null, element?: HTMLElement) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedId === null) return;
    
    if (targetId !== null) {
      if (draggedId === targetId || isDescendant(targetId, draggedId)) {
        e.dataTransfer.dropEffect = "none";
        setDropTargetId(null);
        setDropPosition(null);
        return;
      }
    }

    e.dataTransfer.dropEffect = "move";
    setDropTargetId(targetId);
    
    // 计算放置位置
    if (element && targetId !== null) {
      const rect = element.getBoundingClientRect();
      const y = e.clientY - rect.top; 
      const height = rect.height;
      if (y < height * 0.25) {
        setDropPosition('before');
      } else if (y > height * 0.75) {
        setDropPosition('after');
      } else {
        setDropPosition('inside');
      }
    } else {
      setDropPosition('inside');
    }
  };

  const onDrop = async (e: React.DragEvent, targetId: number | null) => {
    e.preventDefault();
    e.stopPropagation();
    
    const id = parseInt(e.dataTransfer.getData("nodeId"));
    const currentPosition = dropPosition;
    
    setDropTargetId(null);
    setDropPosition(null);
    setIsDragging(false);
    
    if (isNaN(id)) return;
    if (id === targetId || (targetId !== null && isDescendant(targetId, id))) return;

    // 根据放置位置确定 parentId
    let finalParentId = targetId;
    if (targetId !== null && currentPosition !== 'inside') {
      const targetNode = localSlides.find(s => s.id === targetId);
      finalParentId = targetNode?.parentId ?? null;
    }

    try {
      // 构建移动参数：包含目标父节点和位置信息
      const moveParams: { parentId: number | null; targetId?: number; position?: 'before' | 'after' } = { 
        parentId: finalParentId 
      };
      
      // 如果是 before/after 位置，需要传递 targetId 和 position 用于排序
      if (targetId !== null && currentPosition && currentPosition !== 'inside') {
        moveParams.targetId = targetId;
        moveParams.position = currentPosition;
      }
      
      const res = await slideApi.move(id, moveParams);
      if (res.statusCode === 0) {
        // Refresh all slides from server after move
        if (slideSpaceId) {
          const refreshRes = await slideApi.findAllBySpace(Number(slideSpaceId));
          if (refreshRes.statusCode === 0) {
            setLocalSlides(refreshRes.data);
            if (onUpdate) onUpdate(refreshRes.data);
          }
        } else if (Array.isArray(res.data)) {
          setLocalSlides(res.data);
          if (onUpdate) onUpdate(res.data);
        } else {
          const updated = localSlides.map(s => s.id === id ? res.data : s);
          setLocalSlides(updated);
          if (onUpdate) onUpdate(updated);
        }
        addToast('Document moved successfully', 'success');
      } else {
        addToast(res.message || 'Failed to move document', 'error');
      }
    } catch (err) {
      addToast('Failed to move document', 'error');
    }
    setDraggedId(null);
    
    if (finalParentId !== null) {
      setExpanded(prev => ({ ...prev, [finalParentId!]: true }));
    }
  };

  interface TreeNodeProps {
    node: FileTreeNode;
    level: number;
  }

  const TreeNode: React.FC<TreeNodeProps> = ({ node, level }) => {
    const isExpanded = expanded[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isTarget = dropTargetId === node.id;
    const isMenuActive = activeMenuId === node.id;
    const isBeingDragged = draggedId === node.id;
    const itemRef = useRef<HTMLDivElement>(null);
  
    const getDropIndicatorClass = () => {
      if (!isTarget || !dropPosition) return '';
      if (dropPosition === 'before') return 'before:absolute before:left-4 before:right-2 before:-top-0.5 before:h-0.5 before:bg-blue-500 before:rounded-full';
      if (dropPosition === 'after') return 'after:absolute after:left-4 after:right-2 after:-bottom-0.5 after:h-0.5 after:bg-blue-500 after:rounded-full';
      return '';
    };

    return (
      <div
        className={`group/item select-none transition-all relative ${getDropIndicatorClass()} ${
          isTarget && dropPosition === 'inside' 
            ? (isDark ? 'bg-blue-500/20 ring-1 ring-blue-500/40' : 'bg-blue-50 ring-1 ring-blue-200')
            : ''
        } ${isBeingDragged ? 'opacity-40' : ''}`}
        onDragOver={(e) => onDragOver(e, node.id, itemRef.current || undefined)}
        onDrop={(e) => onDrop(e, node.id)}
      >
        <div
          ref={itemRef}
          draggable={true}
          onDragStart={(e) => onDragStart(e, node.id)}
          onDragEnd={onDragEnd}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer relative transition-all ${
            isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          <div className={`cursor-grab active:cursor-grabbing transition-opacity ${
            isDragging ? 'opacity-30' : (isDark ? 'opacity-0 group-hover/item:opacity-20' : 'opacity-0 group-hover/item:opacity-40')
          }`}>
            <GripVertical className={isDark ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5 text-gray-400'} />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(e, node.id);
            }}
            className={`p-0.5 rounded transition-opacity ${
              hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'
            } ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
          >
            {isExpanded ? <ChevronDown className={isDark ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5 text-gray-600'} /> : <ChevronRight className={isDark ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5 text-gray-600'} />}
          </button>

          <div
            className="flex-1 flex items-center gap-1.5 min-w-0"
            onClick={() => onSelect?.(node.id)}
          >
            <FileText className={`w-4 h-4 flex-shrink-0 ${
              hasChildren 
                ? (isDark ? 'text-white/50' : 'text-gray-600')
                : (isDark ? 'text-white/30' : 'text-gray-500')
            }`} />
            <span className={`text-xs truncate py-0.5 font-medium ${
              isDark ? 'text-white/70' : 'text-gray-900'
            }`}>
              {node.title}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onAddChild) onAddChild(node.id);
                setExpanded(prev => ({ ...prev, [node.id]: true }));
              }}
              className={`p-1 rounded transition-opacity opacity-0 group-hover/item:opacity-100 ${
                isDark 
                  ? 'hover:bg-white/10 text-white/30 hover:text-white'
                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
              }`}
              title="新建子页面"
            >
              <Plus className="w-3 h-3" />
            </button>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(isMenuActive ? null : node.id);
                }}
                className={`p-1 rounded transition-opacity ${
                  isMenuActive 
                    ? (isDark ? 'opacity-100 bg-white/10' : 'opacity-100 bg-gray-200')
                    : (isDark 
                        ? 'opacity-0 group-hover/item:opacity-100 hover:bg-white/10 text-white/30 hover:text-white'
                        : 'opacity-0 group-hover/item:opacity-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900')
                }`}
              >
                <MoreVertical className={isDark ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5 text-gray-600'} />
              </button>

              {isMenuActive && (
                <div
                  ref={menuRef}
                  className={`absolute right-0 top-full mt-1 w-36 border rounded-lg shadow-2xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100 ${
                    isDark 
                      ? 'bg-[#1c1c1f] border-white/10'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onAddChild) onAddChild(node.id);
                      setActiveMenuId(null);
                      setExpanded(prev => ({ ...prev, [node.id]: true }));
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                      isDark 
                        ? 'text-white/70 hover:bg-white/10'
                        : 'text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Plus className="w-3 h-3" /> New Slide
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openRenameModal(node.id, node.title);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                      isDark 
                        ? 'text-white/70 hover:bg-white/10'
                        : 'text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Pencil className="w-3 h-3" /> Rename
                  </button>
                  <div className={`h-px my-1 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(node.id);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                      isDark 
                        ? 'text-red-400 hover:bg-red-400/10'
                        : 'text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-0.5">
            {node.children!.map(child => (
              <TreeNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-2 mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${
          isDark ? 'text-white/30' : 'text-gray-500'
        }`}>Knowledge Tree</span>
        <div className="flex gap-1">
          <button 
            title="Add Root Slide"
            onClick={onAddRoot}
            className={`p-1.5 rounded transition-colors ${
              isDark 
                ? 'hover:bg-white/5 text-white/30 hover:text-white'
                : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
            }`}
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div 
        className={`flex-1 overflow-y-auto space-y-0.5 min-h-[50px] pb-4 transition-colors ${
          dropTargetId === null && draggedId !== null 
            ? (isDark ? 'bg-white/[0.02]' : 'bg-gray-50/50')
            : ''
        }`}
        onDragOver={(e) => onDragOver(e, null)}
        onDrop={(e) => onDrop(e, null)}
        onDragLeave={() => setDropTargetId(null)}
      >
        {tree.length === 0 ? (
          <div className={`px-3 py-6 border border-dashed rounded-xl text-center flex flex-col items-center gap-2 ${
            isDark ? 'border-white/5' : 'border-gray-200'
          }`}>
            <FileText className={`w-8 h-8 ${isDark ? 'text-white/5' : 'text-gray-200'}`} />
            <span className={`text-[10px] uppercase font-bold ${
              isDark ? 'text-white/20' : 'text-gray-300'
            }`}>No Documents</span>
          </div>
        ) : (
          tree.map(node => <TreeNode key={node.id} node={node} level={0} />)
        )}
      </div>
      
      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSlideToDelete(null);
        }}
        onConfirm={handleDelete}
        title="删除文档"
        message="确定要删除此文档及其所有子文档吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        type="danger"
      />
      
      {/* Rename Input Modal */}
      <InputModal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setSlideToRename(null);
        }}
        onConfirm={handleRename}
        title="重命名文档"
        placeholder="输入新名称..."
        defaultValue={slideToRename?.originalTitle || ''}
        confirmText="确认"
        cancelText="取消"
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default FileTree;
