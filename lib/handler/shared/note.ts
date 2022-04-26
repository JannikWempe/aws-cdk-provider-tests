export type NewNote = {
  text: string;
};

type WithId = {
  id: string;
};

export type Note = NewNote & WithId;

export const isNewNote = (maybeNote: unknown): maybeNote is NewNote => {
  if (typeof maybeNote !== "object") return false;

  const note = maybeNote as NewNote;
  return typeof note.text === "string";
};
