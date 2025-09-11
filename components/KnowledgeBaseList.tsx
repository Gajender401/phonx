'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { useApp } from '@/context/GlobalContext';
import { knowledgeBaseApi, KnowledgeBaseDocument } from '@/lib/api';
import { formatFileSize, formatDate } from '@/lib/utils';
import { DataLoader } from './Loader';

const KnowledgeBaseList = () => {
  const router = useRouter();
  const { isAuthenticated, authLoading } = useApp();
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const docs = await knowledgeBaseApi.getAllDocuments();
        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      fetchDocuments();
    }
  }, [authLoading, isAuthenticated]);

  const handleViewDocument = (id: string) => {
    router.push(`/claire/${id}`);
  };

  if (loading) {
    return <DataLoader />;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Knowledge Base Documents</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="border rounded-lg p-4 hover:border-accent transition-colors cursor-pointer"
            onClick={() => handleViewDocument(doc.id)}
          >
            <div className="flex items-start space-x-4">
              <FileText className="h-8 w-8 text-accent flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-base mb-1">{doc.brandInfo?.brandName}</h4>
                <div className="text-sm text-muted-foreground">
                  <p>Type: {doc.fileType}</p>
                  <p>Size: {formatFileSize(doc.size)}</p>
                  <p>Last updated: {formatDate(doc.lastUpdated)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnowledgeBaseList; 