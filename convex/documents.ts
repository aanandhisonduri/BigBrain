import { action, mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { api } from "./_generated/api";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  });

export const getDocuments = query({

    async handler(ctx){
        const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier
        console.log(userId);

        if(!userId){
            return [];
        }
        return await ctx.db.query('documents')
        .withIndex('by_tokenIdentifier',(q) => q.eq('tokenIdentifier',
            userId
        )).collect()
    },
})

export const getDocument = query({
    args: {
      documentId: v.id("documents"),
    },
    async handler(ctx, args) {
      const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;
      if (!userId) {
        return null;
      }

      const document = await ctx.db.get(args.documentId);
      
      if (!document) {
        return null;
      }
      if (document.tokenIdentifier !== userId) {
        return null;
      }
      return {...document,documentUrl: await ctx.storage.getUrl(document.fileId),};
    },
  })


export const createDocument = mutation({
    args:{
        title: v.string(),
        fileId: v.id("_storage"),

    },
    async handler(ctx,args){
        const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier
        console.log(userId);

        if(!userId){
            throw new ConvexError('Not Authenticated');
        }
        await ctx.db.insert('documents',{
            title: args.title,
            tokenIdentifier: userId,
            fileId: args.fileId,
        })

    },
})


export const askQuestion = action({
  args: {
    question: v.string(),
    documentId: v.id("documents"),
  },
  async handler(ctx, args): Promise<string> {
    const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const document = await ctx.runQuery(api.documents.getDocument, {
      documentId: args.documentId,
    });

    if (!document) {
      throw new ConvexError("Document not found");
    }

    const file = await ctx.storage.get(document.fileId);
    if (!file) {
      throw new ConvexError("File not found");
    }

    const text = await file.text();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Given the following  text file, please help me answer the following question: ${text}`,
        },
        {
          role: "user",
          content: `Please answer this question: ${args.question}`,
        },
      ],
      model: "llama-3.3-70b-versatile", // Adjust model as needed
    });

    return chatCompletion.choices[0]?.message?.content || "No response received.";
  },
});
