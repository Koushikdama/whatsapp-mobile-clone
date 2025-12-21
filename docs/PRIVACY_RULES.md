# Privacy Rules Documentation

## Overview

This document outlines the privacy rules and logic implemented in the WhatsApp Clone application. It serves as a technical reference for developers working with the privacy system.

---

## Core Privacy Principles

### 1. User Control
- Users have full control over their privacy settings
- Privacy changes take effect immediately
- No forced privacy settings

### 2. Default Behavior
- New accounts are **public** by default
- All privacy features are opt-in
- Backward compatibility maintained

### 3. Transparency
- Users are informed about privacy changes
- Clear UI indicators for privacy status
- No hidden privacy restrictions

---

## Privacy Models

### Account Privacy States

```javascript
/**
 * Account Privacy States
 * @enum {string}
 */
const AccountPrivacy = {
  PUBLIC: 'public',    // Default: Anyone can follow, view, message
  PRIVATE: 'private'   // Requires follow approval
};
```

### Follow Relationship States

```javascript
/**
 * Follow Relationship States
 * @enum {string}
 */
const FollowStatus = {
  NONE: 'none',           // No relationship
  PENDING: 'pending',     // Request sent, awaiting approval
  ACCEPTED: 'accepted',   // Following relationship established
  BLOCKED: 'blocked'      // User is blocked
};
```

---

## Privacy Rules Matrix

### Profile Visibility

| User Type | Can View Profile | Can See Followers | Can See Following |
|-----------|------------------|-------------------|-------------------|
| **Self** | ✅ Always | ✅ Always | ✅ Always |
| **Public Account** | ✅ Anyone | ✅ Anyone | ✅ Anyone |
| **Private Account (Not Following)** | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Private Account (Pending)** | ❌ Blocked | ❌ Blocked | ❌ Blocked |
| **Private Account (Following)** | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Blocked User** | ❌ Blocked | ❌ Blocked | ❌ Blocked |

### Messaging Permissions

```javascript
/**
 * Messaging Permission Rules
 * 
 * @param {Object} currentUser - Current user object
 * @param {Object} targetUser - Target user object
 * @param {string} followStatus - Follow relationship status
 * @returns {boolean} Can send message
 */
function canSendMessage(currentUser, targetUser, followStatus) {
  // Rule 1: Can always message self (shouldn't happen in UI)
  if (currentUser.id === targetUser.id) return true;
  
  // Rule 2: Cannot message blocked users
  if (isBlocked(currentUser.id, targetUser.id)) return false;
  
  // Rule 3: Can message public accounts
  if (!targetUser.isPrivate) return true;
  
  // Rule 4: Can message private accounts only if following (accepted)
  if (targetUser.isPrivate && followStatus === 'accepted') return true;
  
  // Default: Cannot message
  return false;
}
```

### Status/Story Visibility

```javascript
/**
 * Status Visibility Rules
 * 
 * @param {Object} statusOwner - User who posted the status
 * @param {Object} viewer - User viewing the status
 * @param {Array} followedUserIds - IDs of users viewer follows
 * @returns {boolean} Can view status
 */
function canViewStatus(statusOwner, viewer, followedUserIds) {
  // Rule 1: Can always see own status
  if (statusOwner.id === viewer.id) return true;
  
  // Rule 2: Cannot see blocked user's status
  if (isBlocked(viewer.id, statusOwner.id)) return false;
  
  // Rule 3: Can see public account status if in contacts
  if (!statusOwner.isPrivate) return true;
  
  // Rule 4: Can see private account status only if following
  if (statusOwner.isPrivate && followedUserIds.includes(statusOwner.id)) {
    return true;
  }
  
  // Default: Cannot view
  return false;
}
```

### Media Access

```javascript
/**
 * Media Access Rules
 * 
 * @param {Object} mediaOwner - User who owns the media
 * @param {Object} viewer - User viewing the media
 * @param {string} followStatus - Follow relationship status
 * @returns {boolean} Can view media
 */
function canViewMedia(mediaOwner, viewer, followStatus) {
  // Media access follows same rules as profile visibility
  return canViewProfile(mediaOwner, viewer, followStatus);
}
```

---

## Follow Request Rules

### Creating Follow Requests

```javascript
/**
 * Follow Request Creation Rules
 * 
 * @param {string} followerId - User sending the request
 * @param {string} followingId - User receiving the request
 * @param {boolean} isPrivateAccount - Target account privacy status
 * @returns {Object} Request result with status
 */
async function followUser(followerId, followingId, isPrivateAccount) {
  // Rule 1: Cannot follow yourself
  if (followerId === followingId) {
    throw new Error('Cannot follow yourself');
  }
  
  // Rule 2: Check if already following or pending
  const existing = await checkExistingRelationship(followerId, followingId);
  if (existing) return existing;
  
  // Rule 3: Determine initial status based on privacy
  const status = isPrivateAccount ? 'pending' : 'accepted';
  
  // Rule 4: Only update counts if immediately accepted
  if (status === 'accepted') {
    await updateFollowCounts(followerId, followingId);
  }
  
  return { success: true, status, isPending: status === 'pending' };
}
```

### Request Approval Rules

```javascript
/**
 * Request Approval Rules
 * 
 * @param {string} followerId - User who sent the request
 * @param {string} followingId - User approving the request
 */
async function acceptFollowRequest(followerId, followingId) {
  // Rule 1: Only pending requests can be accepted
  const request = await getRequest(followerId, followingId);
  if (!request || request.status !== 'pending') {
    throw new Error('No pending request found');
  }
  
  // Rule 2: Update status to accepted
  await updateRequestStatus(followerId, followingId, 'accepted');
  
  // Rule 3: Update follower/following counts
  await updateFollowCounts(followerId, followingId);
  
  // Rule 4: Grant content access
  await grantContentAccess(followerId, followingId);
}
```

### Request Cancellation Rules

```javascript
/**
 * Request Cancellation Rules
 * 
 * @param {string} followerId - User canceling the request
 * @param {string} followingId - Target user
 */
async function cancelFollowRequest(followerId, followingId) {
  // Rule 1: Only pending requests can be canceled
  const request = await getRequest(followerId, followingId);
  if (!request || request.status !== 'pending') {
    throw new Error('No pending request to cancel');
  }
  
  // Rule 2: Delete the request
  await deleteRequest(followerId, followingId);
  
  // Rule 3: No count updates needed (was never accepted)
}
```

---

## Blocking Rules

### Block User

```javascript
/**
 * Block User Rules
 * 
 * @param {string} blockerId - User blocking
 * @param {string} blockedId - User being blocked
 */
async function blockUser(blockerId, blockedId) {
  // Rule 1: Cannot block yourself
  if (blockerId === blockedId) {
    throw new Error('Cannot block yourself');
  }
  
  // Rule 2: Add to blocked list
  await addToBlockedList(blockerId, blockedId);
  
  // Rule 3: Remove any follow relationships (both directions)
  await removeFollowRelationships(blockerId, blockedId);
  
  // Rule 4: Remove from followers/following counts
  await updateCountsAfterBlock(blockerId, blockedId);
  
  // Rule 5: Revoke all content access
  await revokeContentAccess(blockerId, blockedId);
}
```

### Unblock User

```javascript
/**
 * Unblock User Rules
 * 
 * @param {string} blockerId - User unblocking
 * @param {string} blockedId - User being unblocked
 */
async function unblockUser(blockerId, blockedId) {
  // Rule 1: Remove from blocked list
  await removeFromBlockedList(blockerId, blockedId);
  
  // Rule 2: Allow new follow requests
  // (User must re-follow if they want to connect)
  
  // Rule 3: No automatic follow restoration
  // (Must send new request if account is private)
}
```

---

## Implementation Details

### Privacy Check Helper

```javascript
/**
 * Centralized Privacy Check
 * 
 * @param {string} targetUserId - User to check privacy for
 * @param {string} currentUserId - Current user
 * @returns {Object} Privacy check results
 */
export function usePrivacyCheck(targetUserId, currentUserId) {
  const { users, followedUsers } = useApp();
  const targetUser = users[targetUserId];
  
  // Check 1: Own profile always accessible
  if (targetUserId === currentUserId) {
    return {
      canView: true,
      canViewStatus: true,
      canViewMedia: true,
      canSendMessage: true,
      relationshipStatus: 'self'
    };
  }
  
  // Check 2: Public account
  if (!targetUser?.isPrivate) {
    return {
      canView: true,
      canViewStatus: true,
      canViewMedia: true,
      canSendMessage: true,
      relationshipStatus: 'public'
    };
  }
  
  // Check 3: Private account - check follow status
  const followStatus = await checkFollowStatus(currentUserId, targetUserId);
  
  return {
    canView: followStatus.status === 'accepted',
    canViewStatus: followStatus.status === 'accepted',
    canViewMedia: followStatus.status === 'accepted',
    canSendMessage: followStatus.status === 'accepted',
    relationshipStatus: followStatus.status
  };
}
```

---

## Edge Cases

### Case 1: User Blocks Then Unblocks
- Blocking removes all follow relationships
- Unblocking allows new follow requests
- Previous follow request history is lost
- User must send new request

### Case 2: Private → Public → Private
- Switching to public auto-accepts all pending requests
- Switching back to private keeps existing followers
- New followers need approval again

### Case 3: Mutual Follow Requests
- User A sends request to User B
- User B sends request to User A
- Both requests should be auto-accepted
- Implementation: Check for mutual requests on creation

### Case 4: Request During Account Type Change
- If account changes from private to public mid-request
- Pending request should auto-accept
- Implementation: Background job or on-login check

---

## Performance Considerations

### Caching Strategy
```javascript
// Cache follow status checks for 5 minutes
const FOLLOW_STATUS_CACHE_TTL = 300000; // 5 minutes

// Cache blocked users list for 10 minutes
const BLOCKED_USERS_CACHE_TTL = 600000; // 10 minutes
```

### Batch Operations
- Use Firebase batch writes for follow/unfollow
- Batch accept/reject for multiple requests
- Minimize Firestore reads with proper indexing

### Real-time Updates
- Subscribe to follow relationship changes
- Update UI reactively when privacy settings change
- Invalidate caches on privacy changes

---

## Security Considerations

1. **Server-Side Validation**
   - Never trust client-side privacy checks alone
   - Validate all privacy rules on server (Firebase Security Rules)

2. **Firestore Security Rules**
   ```javascript
   // Example security rule
   match /follows/{relationshipId} {
     allow read: if request.auth != null;
     allow create: if request.auth != null && isValidFollow();
     allow update: if request.auth != null && isOwnerOrTarget();
     allow delete: if request.auth != null && isOwnerOrTarget();
   }
   ```

3. **Rate Limiting**
   - Limit follow requests per hour (e.g., 50/hour)
   - Limit block/unblock actions (prevent abuse)

---

## Testing Scenarios

1. **Privacy Toggle Tests**
   - [ ] Toggle private → public
   - [ ] Toggle public → private
   - [ ] Verify existing followers preserved
   - [ ] Verify new requests require approval

2. **Follow Request Tests**
   - [ ] Send request to private account
   - [ ] Accept incoming request
   - [ ] Reject incoming request
   - [ ] Cancel outgoing request
   - [ ] Batch accept multiple requests

3. **Content Visibility Tests**
   - [ ] View private profile (should block)
   - [ ] View private profile after follow (should allow)
   - [ ] View status from private account
   - [ ] Send message to private account

4. **Blocking Tests**
   - [ ] Block user removes follow relationship
   - [ ] Blocked user cannot view profile
   - [ ] Unblock allows new requests

---

## Future Enhancements

1. **Request Expiration**
   - Auto-expire requests after 30 days
   - Notify users of expiring requests

2. **Privacy Analytics**
   - Track who views profile (if enabled)
   - Analytics on request acceptance rate

3. **Advanced Privacy**
   - Custom privacy groups (Close Friends, Acquaintances)
   - Time-based privacy (private during work hours)
   - Location-based privacy

---

## References

- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/rules-structure)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

**Last Updated**: 2025-12-21
