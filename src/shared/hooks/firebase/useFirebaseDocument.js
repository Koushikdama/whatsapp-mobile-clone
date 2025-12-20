/**
 * useFirebaseDocument Hook
 * Generic hook for subscribing to a Firestore document
 */

import { useState, useEffect } from 'react';

export const useFirebaseDocument = (service, documentId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!service || !documentId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = service.subscribeToDocument(
            service.collectionName,
            documentId,
            (documentData) => {
                setData(documentData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            }
        );

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [service, documentId]);

    return { data, loading, error };
};

export default useFirebaseDocument;
