// lib/auth-helpers.ts
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";
import { UserRole } from "@prisma/client";

// Get session on server components
export async function getSession() {
  return await getServerSession(authOptions);
}

// Get current user on server components
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

// Require authentication - redirect to login if not authenticated
export async function requireAuth() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}

// Require admin role
export async function requireAdmin() {
  const user = await requireAuth();

  if (user.role !== UserRole.ADMIN) {
    redirect("/unauthorized");
  }

  return user;
}

// Check if user has specific role
export async function hasRole(role: UserRole) {
  const user = await getCurrentUser();
  return user?.role === role;
}
