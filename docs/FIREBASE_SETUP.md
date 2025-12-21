# Firebase Setup Guide

## Issue Fixed
The permission errors were caused by a mismatch between the collection name in code (`follows`) and the security rules (`followRelationships`).

## Files Updated

### 1. `firestore.rules`
Updated security rules to:
- ✅ Match collection name `follows` (line 89)
- ✅ Allow authenticated users to read all follow relationships
- ✅ Allow users to create follow requests for themselves
- ✅ Allow both parties to update/delete relationships
- ✅ Proper permissions for follow-related user field updates

### 2. `firestore.indexes.json` (NEW)
Created composite indexes for:
- ✅ `followingId + status + createdAt` - Get followers query
- ✅ `followerId + status + createdAt` - Get following query
- ✅ `followingId + createdAt` - Real-time followers subscription
- ✅ `followerId + createdAt` - Real-time following subscription
- ✅ Status updates by user and expiry
- ✅ Messages by chat and timestamp
- ✅ Chats by participants and last message

---

## Deployment Steps

### Step 1: Deploy Security Rules

```bash
# Navigate to your project directory
cd /Users/dama.koushik/Desktop/whatsapp-mobile-clone

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### Step 2: Deploy Indexes

```bash
# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

**Note**: Index creation can take 5-15 minutes. Firebase will notify you when ready.

### Step 3: Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database → Rules**
4. Verify the rules are updated with `follows` collection
5. Navigate to **Firestore Database → Indexes**
6. Check that all indexes are building/complete

---

## Alternative: Manual Deployment

If you don't have Firebase CLI or prefer manual deployment:

### Security Rules
1. Go to Firebase Console → Firestore Database → Rules
2. Copy entire content from `firestore.rules`
3. Paste and **Publish**

### Indexes
1. Go to Firebase Console → Firestore Database → Indexes
2. Click **Add Index**
3. For each index in `firestore.indexes.json`, create manually:
   - Collection: `follows`
   - Fields: (as specified in JSON)
   - Query scope: Collection

---

## Testing After Deployment

### 1. Test Follow Functionality
```javascript
// In your browser console after deployment
// Should work without permission errors
await followFirebaseService.followUser('userId1', 'userId2', false);
```

### 2. Test Get Followers
```javascript
// Should return followers without errors
await followFirebaseService.getFollowers('userId');
```

### 3. Test Follow Requests
```javascript
// Should work for private accounts
await followFirebaseService.followUser('userId1', 'privateUserId', true);
```

---

## What Changed

### Before (Incorrect)
```javascript
// firestore.rules (line 81)
match /followRelationships/{relationshipId} {
  // ...
}

// Code uses (line 39)
this.collectionName = 'follows'; // ❌ Mismatch!
```

### After (Fixed)
```javascript
// firestore.rules (line 89)
match /follows/{relationshipId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && request.resource.data.followerId == request.auth.uid;
  allow update: if isAuthenticated() && (
    resource.data.followerId == request.auth.uid ||
    resource.data.followingId == request.auth.uid
  );
  allow delete: if isAuthenticated() && (
    resource.data.followerId == request.auth.uid ||
    resource.data.followingId == request.auth.uid
  );
}

// Code uses (line 39)
this.collectionName = 'follows'; // ✅ Match!
```

---

## Troubleshooting

### Error: "Still getting permission errors"
**Solution**: 
1. Clear browser cache
2. Log out and log back in
3. Wait 1-2 minutes for rules to propagate
4. Check Firebase Console that rules are published

### Error: "Index not found"
**Solution**:
1. Check Firebase Console → Indexes tab
2. Wait for indexes to finish building (shows green checkmark)
3. If stuck, delete and recreate the index

### Error: "PERMISSION_DENIED when deploying"
**Solution**:
```bash
# Re-authenticate
firebase login

# Set correct project
firebase use <your-project-id>

# Try deployment again
firebase deploy --only firestore:rules,firestore:indexes
```

---

## Security Notes

The updated rules ensure:
- ✅ Users can only create follow requests for themselves
- ✅ Only parties involved can modify relationships
- ✅ All authenticated users can read relationships (needed for privacy checks)
- ✅ Follow counts update atomically via batch writes
- ✅ Privacy is maintained through application logic + rules

---

## Next Steps

After deployment:
1. ✅ Test all follow features
2. ✅ Verify no permission errors in console
3. ✅ Test private account workflow
4. ✅ Test follow request accept/reject
5. ✅ Monitor Firebase Console for any rule violations

---

## Need Help?

If you encounter issues:
1. Check browser console for specific error messages
2. Verify Firebase project configuration
3. Ensure you're authenticated
4. Check Firebase Console → Firestore → Usage for error details

**Questions?** Review the Firebase documentation:
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
