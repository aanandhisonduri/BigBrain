import {
  MutationCtx,
  QueryCtx,
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import Groq from "groq-sdk";
import { Id } from "./_generated/dataModel";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function hasAccessToDocument(
  ctx: MutationCtx | QueryCtx,
  documentId: Id<"documents">
) {
  const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;

  if (!userId) {
    return null;
  }

  const document = await ctx.db.get(documentId);

  if (!document || document.tokenIdentifier !== userId) {
    return null;
  }

  return { document, userId };
}

export const hasAccessToDocumentQuery = internalQuery({
  args: {
    documentId: v.id("documents"),
  },
  async handler(ctx, args) {
    return await hasAccessToDocument(ctx, args.documentId);
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const getDocuments = query({
  async handler(ctx) {
    const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;
    if (!userId) {
      return undefined;
    }
    return await ctx.db
      .query("documents")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", userId))
      .collect();
  },
});

export const getDocument = query({
  args: {
    documentId: v.id("documents"),
  },
  async handler(ctx, args) {
    const accessObj = await hasAccessToDocument(ctx, args.documentId);
    if (!accessObj) {
      return null;
    }
    return {
      ...accessObj.document,
      documentUrl: await ctx.storage.getUrl(accessObj.document.fileId),
    };
  },
});

export const createDocument = mutation({
  args: {
    title: v.string(),
    fileId: v.id("_storage"),
  },
  async handler(ctx, args) {
    const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }
    const documentId = await ctx.db.insert("documents", {
      title: args.title,
      tokenIdentifier: userId,
      fileId: args.fileId,
      description: "",
    });

    await ctx.scheduler.runAfter(
      0,
      internal.documents.generateDocumentDescription,
      {
        fileId: args.fileId,
        documentId,
      }
    );
  },
});

export const generateDocumentDescription = internalAction({
  args: {
    fileId: v.id("_storage"),
    documentId: v.id("documents"),
  },
  async handler(ctx, args): Promise<void> {
    const file = await ctx.storage.get(args.fileId);

    if (!file) {
      throw new ConvexError("File not found");
    }

    const text = await file.text();

    // Call Groq API for chat completion
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Here is a text file: ${text}`,
        },
        {
          role: "user",
          content: `Please generate a 1-sentence description for this document.`,
        },
      ],
      model: "llama-3.3-70b-versatile", // Use an appropriate Groq model
    });

    const response =
      chatCompletion.choices[0]?.message?.content ??
      "Could not generate a description for this document";

    // Store the generated description in the database
    await ctx.runMutation(internal.documents.updateDocumentDescription, {
      documentId: args.documentId,
      description: response,
    });
  },
});

export const updateDocumentDescription = internalMutation({
  args: {
    documentId: v.id("documents"),
    description: v.string(),
  },
  async handler(ctx, args) {
    await ctx.db.patch(args.documentId, {
      description: args.description,
    });
  },
});


export const askQuestion = action({
  args: {
    question: v.string(),
    documentId: v.id("documents"),
  },
  async handler(ctx, args): Promise<string>
 {
    const accessObj = await ctx.runQuery(
      internal.documents.hasAccessToDocumentQuery,
      { documentId: args.documentId }
    );

    if (!accessObj) {
      throw new ConvexError("You do not have access to this document");
    }

    const file = await ctx.storage.get(accessObj.document.fileId);
    if (!file) {
      throw new ConvexError("File not found");
    }

    const text = await file.text();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Here is a text file: ${text}`,
        },
        {
          role: "user",
          content: `Please answer this question: ${args.question}`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    await ctx.runMutation(internal.chats.createChatRecord, {
      documentId: args.documentId,
      text: args.question,
      isHuman: true,
      tokenIdentifier: accessObj.userId,
    });

    const response =
      chatCompletion.choices[0]?.message?.content || "Could not generate a response";

    await ctx.runMutation(internal.chats.createChatRecord, {
      documentId: args.documentId,
      text: response,
      isHuman: false,
      tokenIdentifier: accessObj.userId,
    });

    return response;
  },
});

export const deleteDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  async handler(ctx, args) {
    const accessObj = await hasAccessToDocument(ctx, args.documentId);

    if (!accessObj) {
      throw new ConvexError("You do not have access to this document");
    }

    await ctx.storage.delete(accessObj.document.fileId);
    await ctx.db.delete(args.documentId);
  },
});