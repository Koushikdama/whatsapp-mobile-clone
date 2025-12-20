export const formatTimestamp = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).getDate() === date.getDate();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (isYesterday) {
    return 'Yesterday';
  }
  return date.toLocaleDateString();
};