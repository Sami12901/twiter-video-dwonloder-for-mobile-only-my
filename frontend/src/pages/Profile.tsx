import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export const Profile = () => {
  const { username } = useParams();
  const currentUser = useAuthStore(state => state.user);
  const targetUsername = username || currentUser?.username;
  
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false); // Simplified for now

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/${targetUsername}`);
        setProfile(response.data);
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (targetUsername) fetchProfile();
  }, [targetUsername]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    try {
      if (isFollowing) {
        await api.delete(`/users/${profile.id}/follow`);
        setIsFollowing(false);
      } else {
        await api.post(`/users/${profile.id}/follow`);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Follow toggle failed', error);
    }
  };

  if (isLoading) return <div className="p-4 text-center">Loading...</div>;
  if (!profile) return <div className="p-4 text-center">User not found</div>;

  const displayName = profile.profile?.displayName || profile.username;

  return (
    <div className="flex-1 flex flex-col border-r border-l border-[var(--border)] max-w-2xl w-full">
      <div className="sticky top-0 z-10 bg-[var(--bg)]/80 backdrop-blur-md p-4 border-b border-[var(--border)] flex items-center gap-4">
        <h1 className="text-xl font-bold">{displayName}</h1>
      </div>

      <div className="relative">
        <div className="h-32 bg-[var(--border)] w-full"></div>
        <div className="absolute -bottom-16 left-4 border-4 border-[var(--bg)] rounded-full">
          <div className="w-24 h-24 rounded-full bg-gray-500"></div>
        </div>
      </div>

      <div className="p-4 pt-20">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <p className="text-[var(--text-muted)]">@{profile.username}</p>
          </div>
          {currentUser?.id !== profile.id && (
            <button
              onClick={handleFollowToggle}
              className={`font-bold py-1.5 px-4 rounded-full ${
                isFollowing
                  ? 'border border-[var(--border)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500'
                  : 'bg-[var(--text)] text-[var(--bg)] hover:opacity-90'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          {currentUser?.id === profile.id && (
            <button className="border border-[var(--border)] font-bold py-1.5 px-4 rounded-full hover:bg-[var(--surface)]">
              Edit Profile
            </button>
          )}
        </div>

        {profile.profile?.bio && (
          <div className="mt-4 text-[var(--text)]">{profile.profile.bio}</div>
        )}

        <div className="flex gap-4 mt-4 text-[var(--text-muted)] text-sm">
          <div className="flex gap-1">
            <span className="font-bold text-[var(--text)]">{profile._count.following}</span> Following
          </div>
          <div className="flex gap-1">
            <span className="font-bold text-[var(--text)]">{profile._count.followers}</span> Followers
          </div>
        </div>
      </div>
      
      <div className="border-b border-[var(--border)] mt-2">
        <div className="flex">
          <div className="flex-1 text-center py-4 font-bold border-b-2 border-[var(--color-primary)]">Posts</div>
          <div className="flex-1 text-center py-4 text-[var(--text-muted)] hover:bg-[var(--surface)] cursor-pointer transition-colors">Replies</div>
          <div className="flex-1 text-center py-4 text-[var(--text-muted)] hover:bg-[var(--surface)] cursor-pointer transition-colors">Media</div>
        </div>
      </div>
      
      <div className="p-4 text-center text-[var(--text-muted)]">
        Posts will appear here.
      </div>
    </div>
  );
};
