import { CloudFormationCustomResourceHandler } from "aws-lambda";
import axios from "axios";
import { NewNote, Note } from "../shared/note";

export const handler: CloudFormationCustomResourceHandler = async (event) => {
  console.debug("event", event);

  // no need to run test on deletion
  if (event.RequestType === "Delete") return;

  const { apiBaseUrl } = event.ResourceProperties;
  console.log(`Testing ${apiBaseUrl}...`);

  // throws if failing; CDK provider framework will send failure response to CF
  await runTest(apiBaseUrl);
};

// throws in case of any unexpected behavior
const runTest = async (apiBaseUrl: string) => {
  const createdNote = await createNote(apiBaseUrl);
  await getNote(apiBaseUrl, createdNote);
  await deleteNote(apiBaseUrl, createdNote);
};

const createNote = async (apiBaseUrl: string): Promise<Note> => {
  const newNote: NewNote = {
    text: "TEST NOTE",
  };

  // create a new note
  const notesUrl = `${apiBaseUrl}notes`;
  const storeNoteResponse = await axios.post<Note>(notesUrl, newNote);
  console.log(
    `Successfully created note: ${JSON.stringify(storeNoteResponse.data)}`
  );

  return storeNoteResponse.data;
};

const getNote = async (
  apiBaseUrl: string,
  createdNote: Note
): Promise<Note> => {
  const noteUrl = createNoteUrl(apiBaseUrl, createdNote);
  const getNoteResponse = await axios.get<Note>(noteUrl);
  if (!areEqual(createdNote, getNoteResponse.data))
    throw (
      "Notes are not equal:\nNote A: " +
      JSON.stringify(createdNote) +
      "\nNote B:" +
      JSON.stringify(getNoteResponse.data)
    );
  console.log(
    `Successfully retrieved note: ${JSON.stringify(getNoteResponse.data)}`
  );

  return getNoteResponse.data;
};

const deleteNote = async (apiBaseUrl: string, createdNote: Note) => {
  const noteUrl = createNoteUrl(apiBaseUrl, createdNote);
  await axios.delete(noteUrl);
  try {
    await axios.get<Note>(noteUrl);
  } catch (error) {
    // it is desired that the note is deleted -> 404
    if (axios.isAxiosError(error) && error?.response?.status === 404) {
      console.log(`Successfully deleted note: ${createdNote.id}`);
      return;
    }
    console.error("Error while verifying note being deleted: " + error);
  }
  throw "Deletion failed. Note still exists.";
};

const createNoteUrl = (apiBaseUrl: string, createdNote: Note) =>
  `${apiBaseUrl}notes/${createdNote.id}`;

const areEqual = (noteA: Note, noteB: Note) =>
  noteA.id === noteB.id && noteA.text === noteB.text;
