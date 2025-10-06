import NextAuth from "next-auth";
import { authOptions } from "@/auth";

const handler = (NextAuth as any)(authOptions as any);
export const GET = handler;
export const POST = handler;
