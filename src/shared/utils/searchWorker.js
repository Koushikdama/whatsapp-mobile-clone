
// This function contains the code that will run in the Web Worker thread.
// It must not reference external variables outside its scope.
const workerCode = () => {
    self.onmessage = (e) => {
        const { type, payload } = e.data;

        if (type === 'FILTER_CHATS') {
            const { chats, users, query, activeFilter } = payload;
            const normalizedQuery = query.toLowerCase().trim();

            const filtered = chats.filter((chat) => {
                if (chat.isArchived) return false;

                let matchesSearch = true;
                if (normalizedQuery) {
                    if (chat.isGroup) {
                        const groupNameMatch = (chat.groupName || '').toLowerCase().includes(normalizedQuery);
                        // Search within group participant names
                        const participantsMatch = (chat.groupParticipants || []).some((pId) => {
                            const participant = users[pId];
                            return participant && (
                                participant.name.toLowerCase().includes(normalizedQuery) ||
                                participant.phone.includes(normalizedQuery)
                            );
                        });
                        matchesSearch = groupNameMatch || participantsMatch;
                    } else {
                        const user = users[chat.contactId];
                        matchesSearch = user && (
                            user.name.toLowerCase().includes(normalizedQuery) ||
                            user.phone.replace(/\s/g, '').includes(normalizedQuery.replace(/\s/g, '')) ||
                            user.phone.includes(normalizedQuery)
                        );
                    }
                }

                let matchesTab = true;
                if (activeFilter === 'unread') {
                    matchesTab = chat.unreadCount > 0;
                } else if (activeFilter === 'groups') {
                    matchesTab = chat.isGroup;
                }

                return matchesSearch && matchesTab;
            });

            // Sorting logic: Pinned first, then by timestamp descending
            const sorted = filtered.sort((a, b) => {
                if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });

            self.postMessage({ type: 'FILTER_CHATS_RESULT', result: sorted });
        }

        if (type === 'FILTER_MESSAGES') {
            const { messages, query } = payload;

            if (!query) {
                self.postMessage({ type: 'FILTER_MESSAGES_RESULT', result: messages });
                return;
            }

            const normalizedQuery = query.toLowerCase();
            const filtered = messages.filter((m) =>
                m.type === 'text' && m.text.toLowerCase().includes(normalizedQuery)
            );

            self.postMessage({ type: 'FILTER_MESSAGES_RESULT', result: filtered });
        }
    };
};

// Helper to create the worker instance
export const createWorker = () => {
    const code = workerCode.toString();
    const blob = new Blob([`(${code})()`], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
};
