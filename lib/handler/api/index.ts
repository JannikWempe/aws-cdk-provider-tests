import {
  APIGatewayEvent,
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import { isNewNote } from "../shared/note";
import { createNote, deleteNote, getNote } from "./notes";

export const handler: APIGatewayProxyHandler = async (event) => {
  console.debug("event", event);

  // to proof updated / rolled back API
  if (event.path === "/monitoring/info" && event.httpMethod === "GET") {
    return {
      statusCode: 200,
      body: JSON.stringify({ version: "1" }),
    };
  }

  const methodHandler = methodHandlers[event.httpMethod];
  if (methodHandler === undefined) {
    return {
      statusCode: 405,
      body: JSON.stringify({
        message: `Method ${event.httpMethod} is not supported.`,
      }),
    };
  }

  try {
    return methodHandler(event);
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `An unknown error occured.`,
      }),
    };
  }
};

const methodHandlers: Record<
  string,
  (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
> = {
  POST: handlePost,
  GET: handleGet,
  DELETE: handleDelete,
};

async function handlePost(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Missing required body.`,
      }),
    };
  }
  let json: unknown = JSON.parse(event.body);
  if (!isNewNote(json)) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Invalid body.`,
      }),
    };
  }

  const newNote = await createNote({ text: json.text });

  return {
    statusCode: 201,
    headers: {
      Location: `/notes/${newNote.id}`,
    },
    body: JSON.stringify(newNote),
  };
}

async function handleGet(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  const id = event?.pathParameters?.id;
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Missing id.",
      }),
    };
  }

  const note = await getNote(id);

  if (!note) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: `There is no note with id ${id}.` }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(note),
  };
}

async function handleDelete(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  const id = event?.pathParameters?.id;
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Missing id.",
      }),
    };
  }

  await deleteNote(id);

  return {
    statusCode: 204,
    body: "",
  };
}
