/**
 * PollService.js
 * 
 * Manages poll data, voting logic, and persistence.
 * Designed to separate data handling from the ChatWindow component.
 */

class PollService {
    constructor() {
        // In a real app, this would be empty and fetch from server.
        // For now, we mock some storage or rely on data.json passed in via AppContext, 
        // but for new local polls we need a place to store them during the session.
        this.polls = new Map();
    }

    createPoll(question, options, senderId) {
        const pollId = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const newPoll = {
            id: pollId,
            question,
            options: options.map((opt, index) => ({
                id: `opt_${index}`,
                text: opt,
                votes: [] // array of userIds
            })),
            allowMultipleAnswers: false,
            createdBy: senderId,
            createdAt: new Date().toISOString()
        };

        this.polls.set(pollId, newPoll);
        return newPoll;
    }

    /**
     * Records a vote for a poll.
     * @param {string} pollId 
     * @param {string} optionId 
     * @param {string} userId 
     */
    vote(pollId, optionId, userId) {
        const poll = this.polls.get(pollId);
        if (!poll) return null;

        // Clone to avoid direct mutation issues if we were using React state directly here deeply
        const updatedPoll = { ...poll, options: [...poll.options] };

        updatedPoll.options = updatedPoll.options.map(opt => {
            // If strictly single choice, remove user from other options
            // (Simulate radio button behavior if !allowMultipleAnswers)
            if (!poll.allowMultipleAnswers && opt.id !== optionId) {
                return {
                    ...opt,
                    votes: opt.votes.filter(id => id !== userId)
                };
            }

            // Toggle vote for the target option
            if (opt.id === optionId) {
                const hasVoted = opt.votes.includes(userId);
                let newVotes;
                if (hasVoted) {
                    newVotes = opt.votes.filter(id => id !== userId);
                } else {
                    newVotes = [...opt.votes, userId];
                }
                return { ...opt, votes: newVotes };
            }

            return opt;
        });

        this.polls.set(pollId, updatedPoll);
        return updatedPoll;
    }

    getPoll(pollId) {
        return this.polls.get(pollId);
    }
}

export const pollService = new PollService();
