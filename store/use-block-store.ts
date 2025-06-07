import { create } from 'zustand';

interface BlockStore {
    blockedUsers: Set<string>;
    addBlockedUser: (userId: string) => void;
    removeBlockedUser: (userId: string) => void;
    isUserBlocked: (userId: string) => boolean;
}

export const useBlockStore = create<BlockStore>((set, get) => ({
    blockedUsers: new Set(),
    addBlockedUser: (userId) =>
        set((state) => {
            const newSet = new Set(state.blockedUsers);
            newSet.add(userId);
            return { blockedUsers: newSet };
        }),
    removeBlockedUser: (userId) =>
        set((state) => {
            const newSet = new Set(state.blockedUsers);
            newSet.delete(userId);
            return { blockedUsers: newSet };
        }),
    isUserBlocked: (userId) => get().blockedUsers.has(userId),
})); 