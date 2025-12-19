import { Comment, Employee } from "@/generated/prisma/client";

export type CommentWithEmployee = Comment & { employee: Employee };