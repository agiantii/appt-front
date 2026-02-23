import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, Shield, Search } from 'lucide-react';
import { Modal } from '../Common/Modal';
import { slideApi } from '../../api/slide';
import { userApi } from '../../api/user';
import { User as UserType } from '../../types';

interface CollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  slideId: number | string | undefined;
  currentUser: UserType | null;
}

interface Collaborator {
  userId: number;
  username: string;
  avatarUrl: string | null;
  role: 'owner' | 'editor' | 'viewer';
}

export const CollaboratorModal: React.FC<CollaboratorModalProps> = ({
  isOpen,
  onClose,
  slideId,
  currentUser
}) => {
  // Ensure slideId is a valid number
  const validSlideId = React.useMemo(() => {
    if (slideId === undefined || slideId === null) return null;
    const num = typeof slideId === 'string' ? parseInt(slideId, 10) : slideId;
    return isNaN(num) || num <= 0 ? null : num;
  }, [slideId]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [owner, setOwner] = useState<Collaborator | null>(null);
  const [myRole, setMyRole] = useState<{ role: string; isOwner: boolean } | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<'editor' | 'viewer' | "commenter ">('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchCollaborators = async () => {
    if (!validSlideId) return;
    try {
      const [collabRes, slideRes] = await Promise.all([
        slideApi.getCollaborators(validSlideId),
        slideApi.findOne(validSlideId)
      ]);
      if (collabRes.statusCode === 0) {
        setCollaborators(collabRes.data);
      }
      // API returns creator in slide detail response
      const slideData = slideRes.data as any;
      if (slideRes.statusCode === 0 && slideData.creator) {
        const creator = slideData.creator;
        setOwner({
          userId: creator.id,
          username: creator.username,
          avatarUrl: creator.avatarUrl,
          role: 'owner'
        });
      }
    } catch (err) {
      console.error('Failed to fetch collaborators', err);
    }
  };

  const fetchMyRole = async () => {
    if (!validSlideId) return;
    try {
      const res = await slideApi.getMyRole(validSlideId);
      if (res.statusCode === 0) {
        setMyRole(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch my role', err);
    }
  };

  useEffect(() => {
    if (isOpen && validSlideId) {
      fetchCollaborators();
      fetchMyRole();
    }
  }, [isOpen, validSlideId]);

  // Debounced search
  useEffect(() => {
    if (!newUsername.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await userApi.search({ keyword: newUsername.trim(), page: 1, pageSize: 5 });
        if (res.statusCode === 0) {
          setSearchResults(res.data.items);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newUsername]);

  const handleSelectUser = (user: UserType) => {
    setNewUsername(user.username);
    setShowSearchResults(false);
  };

  const handleAddCollaborator = async () => {
    if (!validSlideId || !newUsername.trim()) return;
    setLoading(true);
    setError('');
    try {
      const userRes = await userApi.search({ keyword: newUsername.trim(), page: 1, pageSize: 10 });
      if (userRes.statusCode !== 0 || !userRes.data.items || userRes.data.items.length === 0) {
        setError('User not found');
        setLoading(false);
        return;
      }
      const targetUser = userRes.data.items.find(u => u.username === newUsername.trim()) || userRes.data.items[0];
      const res = await slideApi.addCollaborator(validSlideId, { userId: targetUser.id, role: newRole });
      if (res.statusCode === 0) {
        setNewUsername('');
        setSearchResults([]);
        fetchCollaborators();
      } else {
        setError(res.message || 'Failed to add collaborator');
      }
    } catch (err) {
      setError('Failed to add collaborator');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: number, role: string) => {
    if (!validSlideId) return;
    try {
      const res = await slideApi.updateCollaborator(validSlideId, userId, role);
      if (res.statusCode === 0) {
        fetchCollaborators();
      }
    } catch (err) {
      console.error('Failed to update role', err);
    }
  };

  const handleRemoveCollaborator = async (userId: number) => {
    if (!validSlideId) return;
    try {
      const res = await slideApi.removeCollaborator(validSlideId, userId);
      if (res.statusCode === 0) {
        fetchCollaborators();
      }
    } catch (err) {
      console.error('Failed to remove collaborator', err);
    }
  };

  const canManage = myRole?.isOwner || myRole?.role === 'owner';

  if (!validSlideId) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Collaborators"
      size="md"
    >
      <div className="space-y-4">
        {canManage && (
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Search username..."
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c1c1f] border border-white/10 rounded-lg shadow-xl z-10 max-h-[200px] overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                    >
                      <img
                        src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                        alt={user.username}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-white/90">{user.username}</span>
                    </button>
                  ))}
                </div>
              )}
              {showSearchResults && newUsername.trim() && searchResults.length === 0 && !searchLoading && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c1c1f] border border-white/10 rounded-lg shadow-xl z-10 px-3 py-2">
                  <span className="text-sm text-white/40">No users found</span>
                </div>
              )}
            </div>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'editor' | 'viewer' | 'commenter')}
              className="bg-[#0c0c0e] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-white/30"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="commenter">Commenter</option>
            </select>
            <button
              onClick={handleAddCollaborator}
              disabled={loading || !newUsername.trim()}
              className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-xs">{error}</div>
        )}

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {/* Owner first */}
          {owner && (
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <img
                  src={owner.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${owner.username}`}
                  alt={owner.username}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="text-sm font-medium text-white/90">{owner.username}</div>
                  <div className="text-xs text-amber-400 capitalize">{owner.role}</div>
                </div>
              </div>
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
          )}
          {/* Other collaborators */}
          {collaborators.filter(c => c.role !== 'owner').map((collab) => (
            <div
              key={collab.userId}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <img
                  src={collab.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${collab.username}`}
                  alt={collab.username}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="text-sm font-medium text-white/90">{collab.username}</div>
                  <div className="text-xs text-white/40 capitalize">{collab.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canManage && collab.userId !== currentUser?.id && (
                  <>
                    <select
                      value={collab.role}
                      onChange={(e) => handleUpdateRole(collab.userId, e.target.value)}
                      className="bg-[#0c0c0e] border border-white/10 rounded px-2 py-1 text-xs text-white/90 focus:outline-none"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="commenter">Commenter</option>
                    </select>
                    <button
                      onClick={() => handleRemoveCollaborator(collab.userId)}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
