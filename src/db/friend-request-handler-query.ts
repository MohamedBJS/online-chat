"use server";
import { drizzle } from "drizzle-orm/node-postgres";
import client from "./client";
import {
  messagesTable,
  userFriendsTable,
  usersTable,
} from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import chatTableHandler from "../../drizzle/dinamic-chat-table";
import { customType, pgTable, serial, text } from "drizzle-orm/pg-core";

const friendRequestHandlerQuery = async ({
  user_id,
  friend_id,
  requestState,
}: {
  user_id: string;
  friend_id: string;
  requestState: "accepted" | "denied";
}) => {
  const generateChatId = nanoid();

  try {
    const db = drizzle(client);
    await db
      .update(userFriendsTable)
      .set(
        requestState == "accepted"
          ? { requestState: requestState, chat_id: generateChatId }
          : { requestState: requestState },
      )
      .where(
        sql`${userFriendsTable.user_id} = ${user_id} and ${userFriendsTable.friend_id} = ${friend_id}`,
      );

    const customMessageStatusType = customType<{
      data: "sent" | "deleted";
    }>({
      dataType() {
        return "sent";
      },
    });

    const chatTable = pgTable(`chat-${generateChatId}`, {
      id: serial("id").primaryKey(),
      user_message_id: text("user_message_id").notNull(),
      message: text("user_id").notNull(),
      status: customMessageStatusType("user_id").notNull().default("sent"),
    });

    return await { status: 200 };
  } catch (error) {
    console.log(error);
  }
};

export default friendRequestHandlerQuery;
