
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
  Plus
} from 'lucide-react';
import { Slide, FileTreeNode } from '../../types';

interface FileTreeProps {
  data: Slide[];
  onSelect?: (id: number) => void;
  onUpdate?: (updatedData: Slide[]) => void;
  onAddChild?: (parentId: number) => void;
  onAddRoot?: () => void;
}

const FileTree: React.FC<FileTreeProps> = ({ data, onSelect, onUpdate, onAddChild, onAddRoot }) => {
  const [localSlides, setLocalSlides] = useState<Slide[]>(data);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

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
      .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }))
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

  const handleRename = async (id: number, newTitle: string) => {
    if (!newTitle.trim()) {
      setEditingId(null);
      return;
    }
    try {
      const res = await slideApi.update(id, { title: newTitle });
      if (res.statusCode === 0) {
        const updated = localSlides.map(s => s.id === id ? res.data : s);
        setLocalSlides(updated);
        if (onUpdate) onUpdate(updated);
      }
    } catch (err) {
      console.error(err);
    }
    setEditingId(null);
    setActiveMenuId(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Confirm deletion of this document and all its children? This action cannot be undone.")) return;

    try {
      const res = await slideApi.remove(id);
      if (res.statusCode === 0) {
        const idsToDelete = new Set<number>();
        const findChildrenRecursive = (parentId: number) => {
          idsToDelete.add(parentId);
          localSlides.filter(s => s.parentId === parentId).forEach(child => findChildrenRecursive(child.id));
        };
        findChildrenRecursive(id);

        const updated = localSlides.filter(s => !idsToDelete.has(s.id));
        setLocalSlides(updated);
        if (onUpdate) onUpdate(updated);
      }
    } catch (err) {
      console.error(err);
    }
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
    e.dataTransfer.setData("nodeId", id.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, targetId: number | null) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedId === null) return;
    
    if (targetId !== null) {
      if (draggedId === targetId || isDescendant(targetId, draggedId)) {
        e.dataTransfer.dropEffect = "none";
        setDropTargetId(null);
        return;
      }
    }

    e.dataTransfer.dropEffect = "move";
    setDropTargetId(targetId);
  };

  const onDrop = async (e: React.DragEvent, targetId: number | null) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDropTargetId(null);
    const id = parseInt(e.dataTransfer.getData("nodeId"));
    if (isNaN(id)) return;
    
    if (id === targetId || (targetId !== null && isDescendant(targetId, id))) return;

    try {
      const res = await slideApi.move(id, targetId);
      if (res.statusCode === 0) {
        const updated = localSlides.map(s => s.id === id ? res.data : s);
        setLocalSlides(updated);
        if (onUpdate) onUpdate(updated);
      }
    } catch (err) {
      console.error(err);
    }
    setDraggedId(null);
    
    if (targetId !== null) {
      setExpanded(prev => ({ ...prev, [targetId]: true }));
    }
  };

  const TreeItem: React.FC<{ node: FileTreeNode; level: number }> = ({ node, level }) => {
    const isExpanded = expanded[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isEditing = editingId === node.id;
    const isTarget = dropTargetId === node.id;
    const isMenuActive = activeMenuId === node.id;

    return (
      <div 
        className={`group/item select-none transition-all ${isTarget ? 'bg-white/10 ring-1 ring-white/20 rounded-md' : ''}`}
        onDragOver={(e) => onDragOver(e, node.id)}
        onDrop={(e) => onDrop(e, node.id)}
      >
        <div 
          draggable={!isEditing}
          onDragStart={(e) => onDragStart(e, node.id)}
          className={`flex items-center gap-1.5 px-2 py-1.5 hover:bg-white/5 rounded-md cursor-pointer relative transition-all ${isEditing ? 'bg-white/10' : ''}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onSelect?.(node.id)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingId(node.id);
            setEditValue(node.title);
          }}
        >
          <div className="opacity-0 group-hover/item:opacity-20 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <button 
            onClick={(e) => toggleExpand(e, node.id)} 
            className={`p-0.5 hover:bg-white/10 rounded transition-opacity ${hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          
          <FileText className={`w-4 h-4 ${hasChildren ? 'text-white/50' : 'text-white/30'}`} />
          
          {isEditing ? (
            <input 
              autoFocus
              className="flex-1 bg-white/10 border border-white/30 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-white/40"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleRename(node.id, editValue)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename(node.id, editValue)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 text-xs text-white/70 truncate py-0.5 font-medium">
              {node.title}
            </span>
          )}

          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(isMenuActive ? null : node.id);
              }}
              className={`p-1 hover:bg-white/10 text-white/30 hover:text-white rounded transition-opacity ${isMenuActive ? 'opacity-100 bg-white/10' : 'opacity-0 group-hover/item:opacity-100'}`}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {isMenuActive && (
              <div 
                ref={menuRef}
                className="absolute right-0 top-full mt-1 w-36 bg-[#1c1c1f] border border-white/10 rounded-lg shadow-2xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100"
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAddChild) onAddChild(node.id);
                    setActiveMenuId(null);
                    setExpanded(prev => ({ ...prev, [node.id]: true }));
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-3 h-3" /> New Slide
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(node.id);
                    setEditValue(node.title);
                    setActiveMenuId(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Rename
                </button>
                <div className="h-px bg-white/5 my-1" />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(node.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-0.5">
            {node.children!.map(child => (
              <TreeItem key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-2 mb-3">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Knowledge Tree</span>
        <div className="flex gap-1">
          <button 
            title="Add Root Slide"
            onClick={onAddRoot}
            className="p-1.5 hover:bg-white/5 text-white/30 hover:text-white rounded transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button 
            title="New Folder (Collection)"
            className="p-1.5 hover:bg-white/5 text-white/30 hover:text-white rounded transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div 
        className={`flex-1 overflow-y-auto space-y-0.5 min-h-[50px] pb-4 transition-colors ${dropTargetId === null && draggedId !== null ? 'bg-white/[0.02]' : ''}`}
        onDragOver={(e) => onDragOver(e, null)}
        onDrop={(e) => onDrop(e, null)}
        onDragLeave={() => setDropTargetId(null)}
      >
        {tree.length === 0 ? (
          <div className="px-3 py-6 border border-dashed border-white/5 rounded-xl text-center flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-white/5" />
            <span className="text-[10px] text-white/20 uppercase font-bold">No Documents</span>
          </div>
        ) : (
          tree.map(node => (
            <TreeItem key={node.id} node={node} level={0} />
          ))
        )}
      </div>
    </div>
  );
};

export default FileTree;
