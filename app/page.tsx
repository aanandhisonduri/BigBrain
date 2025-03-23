// // 'use client'
// // import { Button } from "@/components/ui/button";
// // import { ModeToggle } from "@/components/ui/mode-toggle";
// // import { api } from "@/convex/_generated/api";
// // import { SignInButton, UserButton } from "@clerk/nextjs";
// // import { Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
// // import { Content } from "next/font/google";
// // import Image from "next/image";

// // import UploadDocumentButton from "./upload-document-button";
// // import { DocumentCard } from "./documents/document-card";
// // import { Skeleton } from "@/components/ui/skeleton"


// // export default function Home() {

// //   const createDocument = useMutation(api.documents.createDocument);
// //   const documents = useQuery(api.documents.getDocuments);

// //   return (
    
// //     <main className="p-24 space-y-8">
// //     <div className="flex justify-between items-center">
// //       <h1 className="text-4xl font-bold">My Documents</h1>
// //       <UploadDocumentButton/>
     
// //     </div>

// //     <div className="grid grid-cols-4 gap-8">
// //     {documents?.map((doc) => (
// //   <DocumentCard key={doc._id} document={doc} />
// // ))}

// //     </div>

// //   </main>
      
  
// //   );
// // }
// "use client";

// import { api } from "@/convex/_generated/api";
// import { useQuery } from "convex/react";
// // import { DocumentCard } from "./document-card";
// import CreateDocumentButton from "./upload-document-button";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Card } from "@/components/ui/card";
// import Image from "next/image";
// import { DocumentCard } from "./documents/document-card";

// export default function Home() {
//   const documents = useQuery(api.documents.getDocuments);

//   return (
//     <main className="p-24 space-y-8">
//       <div className="flex justify-between items-center">
//         <h1 className="text-4xl font-bold">My Documents</h1>
//         <CreateDocumentButton />
//       </div>

//       {!documents && (
//         <div className="grid grid-cols-3 gap-8">
//           {new Array(8).fill("").map((_, i) => (
//             <Card className="h-[200px] p-6 flex flex-col justify-between">
//               <Skeleton className="h-[20px] rounded" />
//               <Skeleton className="h-[20px] rounded" />
//               <Skeleton className="h-[20px] rounded" />
//               <Skeleton className="w-[80px] h-[40px] rounded" />
//             </Card>
//           ))}
//         </div>
//       )}

//       {documents && documents.length === 0 && (
//         <div className="py-12 flex flex-col justify-center items-center gap-8">
//           <Image
//             src="/documents.svg"
//             width="200"
//             height="200"
//             alt="a picture of documents"
//           />
//           <h2 className="text-2xl">You have no documents</h2>
//           <CreateDocumentButton />
//         </div>
//       )}

//       {documents && documents.length > 0 && (
//         <div className="grid grid-cols-3 gap-8">
//           {documents?.map((doc) => <DocumentCard document={doc} />)}
//         </div>
//       )}
//     </main>
//   );
// }

"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import CreateDocumentButton from "./upload-document-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { DocumentCard } from "./documents/document-card";

export default function Home() {
  const documents = useQuery(api.documents.getDocuments);

  return (
    <main className="p-24 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">My Documents</h1>
        <CreateDocumentButton />
      </div>

      {/* Loading State */}
      {!documents && (
        <div className="grid grid-cols-3 gap-8">
          {new Array(8).fill("").map((_, i) => (
            <Card key={i} className="h-[200px] p-6 flex flex-col justify-between">
              <Skeleton className="h-[20px] rounded" />
              <Skeleton className="h-[20px] rounded" />
              <Skeleton className="h-[20px] rounded" />
              <Skeleton className="w-[80px] h-[40px] rounded" />
            </Card>
          ))}
        </div>
      )}

      {/* No Documents State */}
      {documents && documents.length === 0 && (
        <div className="py-12 flex flex-col justify-center items-center gap-8">
          <Image
            src="/documents.svg"
            width="200"
            height="200"
            alt="a picture of documents"
          />
          <h2 className="text-2xl">You have no documents</h2>
          <CreateDocumentButton />
        </div>
      )}

      {/* Documents Display */}
      {documents && documents.length > 0 && (
        <div className="grid grid-cols-3 gap-8">
          {documents.map((doc) => (
            <DocumentCard key={doc._id} document={doc} />
          ))}
        </div>
      )}
    </main>
  );
}
