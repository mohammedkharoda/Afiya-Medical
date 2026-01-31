"use server";

import { db, users } from "@/lib/db";

export async function getAllUsers() {
  try {
    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    return { users: allUsers };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { error: "Failed to fetch users" };
  }
}

export async function updateUserRole(
  userId: string,
  newRole: "DOCTOR" | "PATIENT",
) {
  try {
    await db
      .update(users)
      .set({ role: newRole })
      .where((users as any).id.eq(userId));
    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { error: "Failed to update user role" };
  }
}
