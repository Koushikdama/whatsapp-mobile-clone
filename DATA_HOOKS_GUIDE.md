# Global Data Fetching Hooks Guide

This guide explains how to use the global hooks system for data fetching and CRUD operations in your WhatsApp clone application.

## Overview

The hooks system provides a **backend-agnostic** way to fetch and manage data. You can easily switch between Firebase and REST API by changing a single flag in `serviceConfig.js`.

## Quick Start

### 1. Using Existing Feature Hooks

Import and use feature-specific hooks in your components:

```javascript
import { useChats, useMessages, useAuth } from '@/shared/hooks/data';

function ChatList() {
  const { user } = useAuth();
  const { chats, loading, error, createChat } = useChats(user?.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {chats.map(chat => (
        <ChatItem key={chat.id} chat={chat} />
      ))}
    </div>
  );
}
```

### 2. Using Generic Hooks

For custom data fetching needs:

#### useFetch - For GET operations

```javascript
import { useFetch } from '@/shared/hooks/data';
import { dataServices } from '@/shared/hooks/data/serviceConfig';

function UserProfile({ userId }) {
  const fetchUser = async () => {
    return await dataServices.user.getUser(userId);
  };

  const { data: user, loading, error, refetch } = useFetch(
    fetchUser,
    { enableCache: true, cacheKey: `user-${userId}` },
    [userId]
  );

  return <div>{user?.name}</div>;
}
```

#### useMutation - For CREATE/UPDATE/DELETE operations

```javascript
import { useMutation } from '@/shared/hooks/data';
import { dataServices } from '@/shared/hooks/data/serviceConfig';

function CreateChatButton({ currentUserId, contactId }) {
  const { mutate: createChat, loading, error } = useMutation(
    () => dataServices.chat.createIndividualChat(currentUserId, contactId),
    {
      onSuccess: (newChat) => {
        console.log('Chat created:', newChat);
        // Navigate to chat or update UI
      },
      onError: (err) => {
        console.error('Failed to create chat:', err);
      }
    }
  );

  return (
    <button onClick={createChat} disabled={loading}>
      {loading ? 'Creating...' : 'Start Chat'}
    </button>
  );
}
```

#### useCRUD - For complete resource management

```javascript
import { useCRUD } from '@/shared/hooks/data';
import { dataServices } from '@/shared/hooks/data/serviceConfig';

function MessageManager() {
  const crud = useCRUD(dataServices.message, {
    onCreateSuccess: (msg) => console.log('Created:', msg),
    onUpdateSuccess: (msg) => console.log('Updated:', msg),
    onDeleteSuccess: () => console.log('Deleted'),
  });

  const handleSendMessage = async () => {
    await crud.create({ chatId: '123', text: 'Hello!' });
  };

  const handleEditMessage = async (msgId) => {
    await crud.update(msgId, { text: 'Updated text' });
  };

  return <div>{/* Your UI */}</div>;
}
```

## Switching Between Backends

### Current: Firebase

Your app currently uses Firebase. All hooks work with real-time subscriptions.

### Switching to REST API

When you're ready to integrate your backend:

1. **Update the configuration** in `src/shared/hooks/data/serviceConfig.js`:

```javascript
const USE_FIREBASE = false; // Change to false
```

2. **Set your API base URL** in `.env`:

```env
VITE_API_BASE_URL=https://your-api.com/api
```

3. **Update REST service endpoints** in `src/services/api/*.js`:

```javascript
// Example: src/services/api/chatRestService.js
async getUserChats(userId) {
  const response = await apiClient.get('/chats', {
    params: { userId }
  });
  return { chats: response.data };
}
```

That's it! All your hooks will now use the REST API instead of Firebase.

## REST API Service Templates

All REST API service templates are located in `src/services/api/`:

- `authRestService.js` - Authentication (login, signup, logout)
- `userRestService.js` - User profile and contacts
- `chatRestService.js` - Chat management
- `messageRestService.js` - Message operations
- `statusRestService.js` - Status updates
- `callRestService.js` - Call history
- `settingsRestService.js` - User settings

### Customizing Endpoints

Each service file contains placeholder endpoints. Update them to match your backend:

```javascript
// Before
async getUserChats(userId) {
  const response = await apiClient.get('/chats', {
    params: { userId }
  });
  return { chats: response.data };
}

// After - matching your backend
async getUserChats(userId) {
  const response = await apiClient.get(`/v1/users/${userId}/chats`);
  return { chats: response.chats || [] };
}
```

## API Client

The API client (`src/shared/utils/apiClient.js`) provides:

- **Automatic token management** - Set once, used for all requests
- **Request/response interceptors** - Add logging, auth, error handling
- **Error handling** - Consistent error messages
- **TypeScript-like methods** - get, post, put, patch, delete

### Setting Auth Token

```javascript
import apiClient from '@/shared/utils/apiClient';

// After login
apiClient.setAuthToken(response.token);

// After logout
apiClient.setAuthToken(null);
```

### Adding Custom Headers

```javascript
apiClient.setHeader('X-Custom-Header', 'value');
```

### Adding Interceptors

```javascript
// Request interceptor - add timestamp
apiClient.addRequestInterceptor(async (config) => {
  config.headers['X-Request-Time'] = new Date().toISOString();
  return config;
});

// Response interceptor - handle rate limiting
apiClient.addResponseInterceptor(async (response) => {
  if (response.status === 429) {
    // Handle rate limiting
  }
  return response;
});
```

## Available Hooks

### Feature-Specific Hooks

All located in `src/shared/hooks/data/`:

- **useAuth** - Authentication state and methods
- **useUser** - User profile and contacts
- **useChats** - Chat list and operations
- **useMessages** - Message list and operations
- **useStatus** - Status updates
- **useCalls** - Call history
- **useSettings** - User settings

### Generic Hooks

- **useFetch** - GET operations with caching
- **useFetchRealtime** - Real-time subscriptions (Firebase) with REST fallback
- **useMutation** - CREATE/UPDATE/DELETE operations
- **useCRUD** - Complete resource management

## Best Practices

1. **Use feature hooks when available** - They're optimized for your use case
2. **Use generic hooks for custom needs** - When feature hooks don't fit
3. **Enable caching for static data** - User profiles, settings
4. **Handle loading and error states** - Always show feedback to users
5. **Use optimistic updates** - Update UI before server confirms (advanced)

## Real-time vs REST API

| Feature | Firebase | REST API |
|---------|----------|----------|
| Real-time updates | ✅ Automatic | ❌ Need polling/WebSockets |
| Subscriptions | ✅ Built-in | ❌ Not supported |
| Caching | ✅ Automatic | ✅ Manual (useFetch) |
| Offline support | ✅ Built-in | ❌ Need service workers |

## Environment Variables

Create a `.env` file in your project root:

```env
# Firebase (current)
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
# ... other Firebase config

# REST API (future)
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=30000
```

## Examples

### Example 1: Chat List with Create

```javascript
import { useChats } from '@/shared/hooks/data';

function ChatList({ userId }) {
  const {
    chats,
    loading,
    error,
    createChat,
    deleteChat,
    togglePinChat
  } = useChats(userId);

  const handleCreateChat = async (contactId) => {
    try {
      const newChat = await createChat(contactId);
      console.log('Created:', newChat);
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  return (
    <div>
      {loading && <Spinner />}
      {error && <ErrorMessage error={error} />}
      {chats.map(chat => (
        <ChatItem
          key={chat.id}
          chat={chat}
          onDelete={() => deleteChat(chat.id)}
          onPin={() => togglePinChat(chat.id)}
        />
      ))}
    </div>
  );
}
```

### Example 2: Custom Search Hook

```javascript
import { useState } from 'react';
import { useFetch } from '@/shared/hooks/data';
import { dataServices } from '@/shared/hooks/data/serviceConfig';

function useUserSearch() {
  const [query, setQuery] = useState('');

  const { data: results, loading } = useFetch(
    () => dataServices.user.searchUsers(query),
    {
      skip: !query || query.length < 2,
      enableCache: true,
      cacheKey: `search-${query}`
    },
    [query]
  );

  return { query, setQuery, results, loading };
}

// Usage
function UserSearch() {
  const { query, setQuery, results, loading } = useUserSearch();

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users..."
      />
      {loading && <Spinner />}
      {results?.map(user => (
        <UserItem key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### Example 3: Batch Operations

```javascript
import { useMutation } from '@/shared/hooks/data';
import { dataServices } from '@/shared/hooks/data/serviceConfig';

function MessageBulkActions({ chatId, selectedMessageIds }) {
  const { mutate: deleteMessages, loading } = useMutation(
    (messageIds) => dataServices.message.deleteMessages(chatId, messageIds),
    {
      onSuccess: () => {
        console.log('Deleted successfully');
        // Clear selection
      }
    }
  );

  const handleBulkDelete = () => {
    deleteMessages(selectedMessageIds);
  };

  return (
    <button onClick={handleBulkDelete} disabled={loading}>
      {loading ? 'Deleting...' : `Delete ${selectedMessageIds.length} messages`}
    </button>
  );
}
```

## Troubleshooting

### Hook returns empty data

- Check if userId/chatId is provided
- Verify backend service is running
- Check browser console for errors

### Real-time updates not working

- Ensure you're using Firebase (USE_FIREBASE = true)
- Check Firebase rules and permissions
- Verify subscription methods exist in service

### Authentication errors

- Ensure auth token is set: `apiClient.setAuthToken(token)`
- Check token expiration
- Verify backend CORS settings

### TypeScript users

Types are not included yet. You can add them in a future update.

## Summary

✅ **Switch backends easily** - Change one flag in serviceConfig.js  
✅ **Use feature hooks** - Already optimized for your needs  
✅ **Use generic hooks** - For custom data fetching  
✅ **REST API templates ready** - Just update endpoints to match your backend  
✅ **Error handling included** - All hooks manage loading/error states  

Happy coding! 🚀
