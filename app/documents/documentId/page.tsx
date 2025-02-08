'use client'

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

import { useQuery } from "convex/react";

export default function DocumentPage({
    params
}: {
  params: {
    documentId:  Id<"documents">;
  };
}) {
  if (!params?.documentId) {
    return <p>Document ID not found</p>;
}
  console.log("Params:", params);
  console.log("Document ID:", params?.documentId);
  
  
  const document = useQuery(api.documents.getDocument, {
    documentId: params.documentId,
  });
  if (!document) {
    return <div>You don't have access to view this document</div>;
  }

  return (
    
    <main className="p-24 space-y-8">
        <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">{document?.title}</h1>
        {document.documentUrl};
      </div>
  </main>
      
  
  );
}
