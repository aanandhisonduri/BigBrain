import { ConvexError, v } from "convex/values";
import {
  internalAction,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import Groq from "groq-sdk";
import { internal } from "./_generated/api";

import { InferenceClient } from '@huggingface/inference';



const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Ensure you set this in your environment variables
});

export const getNote = query({
  args: {
    noteId: v.id("notes"), 
  },
  async handler(ctx, args) {
    const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;

    if (!userId) {
      return null;
    }

    const note = await ctx.db.get(args.noteId);

    if (!note) {
      return null;
    }

    if (note.tokenIdentifier !== userId) {
      return null;
    }

    return note;
  },
});

export const getNotes = query({
  async handler(ctx) {
    const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;

    if (!userId) {
      return null;
    }

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", userId))
      .order("desc")
      .collect();

    return notes;
  },
});


console.log("env variables",process.env);


const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);  

export async function embed(text: string): Promise<number[]> { 
  try {
    const response = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: text,
    });

    if (!Array.isArray(response)) {
      throw new Error("Invalid embedding response from Hugging Face API");
    }

    return response as number[];
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw new Error("Embedding generation failed.");
  }
}





// export async function embed(text: string): Promise<number[]> {
//     const response = await groq.embeddings.create({
//       model: "llama3-8b-8192", // Ensure correct model name
//       input: text,
//     });
  
//     if (!response.data || !Array.isArray(response.data[0]?.embedding)) {
//       throw new Error("Invalid embedding response from Groq API");
//     }
  
//     return response.data[0].embedding as number[]; // Type assertion
//   }
  

export const setNoteEmbedding = internalMutation({
  args: {
    noteId: v.id("notes"),
    embedding: v.array(v.number()),
  },
  async handler(ctx, args) {
    await ctx.db.patch(args.noteId, {
      embedding: args.embedding,
    });
  },
});





export const createNoteEmbedding = internalAction({
  args: {
    noteId: v.id("notes"),
    text: v.string(),
  },
  async handler(ctx, args) {
    const embedding = await embed(args.text);

    await ctx.runMutation(internal.notes.setNoteEmbedding, {
      noteId: args.noteId,
      embedding,
    });
  },
});

export const createNote = mutation({
  args: {
    text: v.string(),
  },
  async handler(ctx, args) {
    const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;

    if (!userId) {
      throw new ConvexError("You must be logged in to create a note");
    }

    const noteId = await ctx.db.insert("notes", {
      text: args.text,
      tokenIdentifier: userId,
    });

    await ctx.scheduler.runAfter(0, internal.notes.createNoteEmbedding, {
      noteId,
      text: args.text,
    });
  },
});

export const deleteNote = mutation({
  args: {
    noteId: v.id("notes"),
  },
  async handler(ctx, args) {
    const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;

    if (!userId) {
      throw new ConvexError("You must be logged in to delete a note");
    }

    const note = await ctx.db.get(args.noteId);

    if (!note) {
      throw new ConvexError("Note not found");
    }

    if (note.tokenIdentifier !== userId) {
      throw new ConvexError("You do not have permission to delete this note");
    }

    await ctx.db.delete(args.noteId);
  },
});














///////////////////////
// import { ConvexError, v } from "convex/values";
// import {
//   internalAction,
//   internalMutation,
//   mutation,
//   query,
// } from "./_generated/server";
// import Groq from "groq-sdk";
// import { internal } from "./_generated/api";
// import { InferenceClient } from "@huggingface/inference";



// // Initialize Groq client
// const groq = new Groq({
//   apiKey: process.env.GROQ_API_KEY, // Ensure Groq API key is set
// });

// // Query to get a note
// export const getNote = query({
//   args: {
//     noteId: v.id("notes"),
//   },
//   async handler(ctx, args) {
//     const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;

//     if (!userId) {
//       return null;
//     }

//     const note = await ctx.db.get(args.noteId);

//     if (!note || note.tokenIdentifier !== userId) {
//       return null;
//     }

//     return note;
//   },
// });

// // Query to get all notes
// export const getNotes = query({
//   async handler(ctx) {
//     const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;

//     if (!userId) {
//       return null;
//     }

//     const notes = await ctx.db
//       .query("notes")
//       .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", userId))
//       .order("desc")
//       .collect();

//     return notes;
//   },
// });


// const apiKey = process.env.HUGGINGFACE_API_KEY;
// const client = new InferenceClient(apiKey); 
// export async function embed(text: string): Promise<number[]> {
//   const model = 'sentence-transformers/all-MiniLM-L6-v2'; // Example model for text embeddings

//   try {
//     const response = await client.request({
//       model,
//       inputs: text,
//     });

//     const embeddingResponse = response as { embedding: number[] }[];

//     if (!embeddingResponse || !Array.isArray(embeddingResponse) || !Array.isArray(embeddingResponse[0]?.embedding)) {
//       throw new Error('Invalid embedding response from Hugging Face API');
//     }

//     return embeddingResponse[0].embedding;
//   } catch (error) {
//     console.error("Error while fetching embeddings from Hugging Face API:", error);
//     throw error;  // Re-throw the error or handle it accordingly
//   }
// }


// // Internal mutation to save note embedding
// export const setNoteEmbedding = internalMutation({
//   args: {
//     noteId: v.id("notes"),
//     embedding: v.array(v.number()),
//   },
//   async handler(ctx, args) {
//     await ctx.db.patch(args.noteId, {
//       embedding: args.embedding,
//     });
//   },
// });

// // Internal action to create note embedding
// export const createNoteEmbedding = internalAction({
//   args: {
//     noteId: v.id("notes"),
//     text: v.string(),
//   },
//   async handler(ctx, args) {
//     // Get the text embedding
//     const embedding = await embed(args.text);

//     // Store the embedding for the note
//     await ctx.runMutation(internal.notes.setNoteEmbedding, {
//       noteId: args.noteId,
//       embedding,
//     });
//   },
// });

// // Mutation to create a new note
// export const createNote = mutation({
//   args: {
//     text: v.string(),
//   },
//   async handler(ctx, args) {
//     const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;

//     if (!userId) {
//       throw new ConvexError("You must be logged in to create a note");
//     }

//     // Insert a new note into the database
//     const noteId = await ctx.db.insert("notes", {
//       text: args.text,
//       tokenIdentifier: userId,
//     });

//     // Create note embedding asynchronously after insertion
//     await ctx.scheduler.runAfter(0, internal.notes.createNoteEmbedding, {
//       noteId,
//       text: args.text,
//     });
//   },
// });

// // Mutation to delete a note
// export const deleteNote = mutation({
//   args: {
//     noteId: v.id("notes"),
//   },
//   async handler(ctx, args) {
//     const userId = (await ctx.auth.getUserIdentity())?.tokenIdentifier;

//     if (!userId) {
//       throw new ConvexError("You must be logged in to delete a note");
//     }

//     const note = await ctx.db.get(args.noteId);

//     if (!note) {
//       throw new ConvexError("Note not found");
//     }

//     if (note.tokenIdentifier !== userId) {
//       throw new ConvexError("You do not have permission to delete this note");
//     }

//     await ctx.db.delete(args.noteId);
//   },
// });
