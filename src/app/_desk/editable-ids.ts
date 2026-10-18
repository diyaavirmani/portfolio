// Every object in the desk scene that edit mode can move, resize, rotate, hide or reorder.
// The save route accepts only these ids, so add a new object here before wrapping it in <Editable>.

export const EDITABLES = {
  window: "Window",
  intro: "Introduction",
  curtains: "Curtains",
  clock: "Digital clock",
  pegboard: "Wire grid",
  quote: "Quote",
  "print-messi": "Print: Messi",
  "print-dear-zindagi": "Print: Dear Zindagi",
  "print-snoopy": "Print: Snoopy",
  "print-gym": "Print: G:YM",
  "print-octocat": "Print: GitHub Octocat",
  "print-taylor": "Print: Taylor Swift",
  "photo-strip": "Photo-booth strip",
  sunglasses: "Sunglasses",
  ticket: "Platform 9¾ ticket",
  "commit-card": "Commit card",
  bracelet: "Friendship bracelet",
  "evil-eye": "Evil-eye keyring",
  "micro-lights": "Micro lights",
  bookshelf: "Bookshelf",
  moonlight: "Moonlight",
  "lamp-glow": "Lamp glow",
  "sticky-cube": "Sticky-note cube",
  macbook: "MacBook",
  earphones: "Pink earphones",
  "pookie-mug": "Pookie pen stand",
  clawd: "Clawd",
  "sprite-can": "Sprite can (night)",
  lamp: "Desk lamp",
  "lamp-books": "Books under the lamp",
  "lamp-book-phoenix": "Lamp book: Order of the Phoenix",
  "lamp-book-gottlieb": "Lamp book: Maybe You Should Talk to Someone",
  "lamp-book-it-ends": "Lamp book: It Ends with Us",
  "lamp-book-housemaid": "Lamp book: The Housemaid",
  "lamp-book-mockingbird": "Lamp book: To Kill a Mockingbird",
  "lamp-book-gone": "Lamp book: Then She Was Gone",
  switchboard: "Switchboard",
  "platform-sign": "Platform 9¾ sign",
  "wall-frame": "Framed poster: All Too Well",
  "polaroid-series": "Photo strip",
  "polaroid-2": "Photo strip: black and white",
  "key-clicker": "Key clicker keychain",
  "old-laptop": "Old Lenovo laptop",
  "book-stack": "Book stack",
  glasses: "Glasses",
  notebook: "Notebook and pencil",
  "paper-ball": "Paper ball",
  calendar: "Desk calendar",
  speaker: "Sony speaker",
} as const;

export type EditableId = keyof typeof EDITABLES;

export const EDITABLE_IDS = Object.keys(EDITABLES) as EditableId[];

// Text and images that edit mode can change, per object.
export type PropField = { key: string; label: string; kind: "text" | "image" };

const STRIP_FIELDS: PropField[] = [{ key: "caption", label: "Footer text", kind: "text" }];

const PRINT_FIELDS: PropField[] = [
  { key: "src", label: "Image path", kind: "image" },
  { key: "caption", label: "Caption", kind: "text" },
];

export const PROP_FIELDS: Partial<Record<EditableId, PropField[]>> = {
  "polaroid-2": STRIP_FIELDS,
  quote: [
    { key: "line1", label: "First line", kind: "text" },
    { key: "line2", label: "Second line", kind: "text" },
    { key: "author", label: "Author", kind: "text" },
  ],
  "print-messi": PRINT_FIELDS,
  "print-dear-zindagi": PRINT_FIELDS,
  "print-snoopy": PRINT_FIELDS,
  "print-gym": PRINT_FIELDS,
  "print-octocat": PRINT_FIELDS,
  "print-taylor": PRINT_FIELDS,
  "wall-frame": [{ key: "src", label: "Image path", kind: "image" }],
  "commit-card": [
    { key: "line1", label: "First line", kind: "text" },
    { key: "line2", label: "Second line", kind: "text" },
  ],
  bracelet: [{ key: "beads", label: "Letter beads", kind: "text" }],
  "pookie-mug": [
    { key: "small", label: "Small text", kind: "text" },
    { key: "big", label: "Big text", kind: "text" },
  ],
};
