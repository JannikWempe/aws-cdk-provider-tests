import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { NewNote, Note } from "../shared/note";

const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-central-1",
});

const notesTableName = process.env.NOTES_TABLE_NAME;

export const createNote = async (note: NewNote): Promise<Note> => {
  // not production-ready, but good enough for this example
  const id = `${new Date().getTime()}`;

  await ddbClient.send(
    new PutItemCommand({
      TableName: notesTableName,
      Item: marshall({
        id,
        text: note.text,
      }),
    })
  );

  return {
    id,
    ...note,
  };
};

export const getNote = async (id: Note["id"]): Promise<Note | undefined> => {
  const data = await ddbClient.send(
    new GetItemCommand({
      TableName: notesTableName,
      Key: marshall({ id }),
    })
  );

  return data.Item ? (unmarshall(data.Item) as Note) : undefined;
};

export const deleteNote = async (id: Note["id"]): Promise<void> => {
  ddbClient.send(
    new DeleteItemCommand({
      TableName: notesTableName,
      Key: marshall({ id }),
    })
  );
};
