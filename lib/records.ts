export type RecordKind =
  | "gmail"
  | "drive-folder"
  | "spreadsheet"
  | "web"
  | "none";

export type ParsedRecord =
  | { kind: "gmail"; threadId: string }
  | { kind: "drive-folder"; folderId: string }
  | { kind: "spreadsheet"; spreadsheetId: string }
  | { kind: "web"; href: string }
  | { kind: "none" };

export function parseRecord(href?: string | null): ParsedRecord {
  if (!href) return { kind: "none" };

  const gmail =
    href.match(
      /mail\.google\.com\/mail\/(?:u\/\d+\/)?#(?:inbox|all|sent|starred|important|drafts|spam|trash|search\/[^/]+|label\/[^/]+)\/([a-f0-9]{10,})/i,
    ) ||
    href.match(/mail\.google\.com\/mail\/#[^/]*\/([a-f0-9]{10,})/i) ||
    href.match(/[?&]th=([a-f0-9]{10,})/i);
  if (gmail?.[1]) return { kind: "gmail", threadId: gmail[1] };

  const folder = href.match(
    /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/,
  );
  if (folder?.[1]) return { kind: "drive-folder", folderId: folder[1] };

  const sheet = href.match(
    /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
  );
  if (sheet?.[1]) return { kind: "spreadsheet", spreadsheetId: sheet[1] };

  if (href.startsWith("http")) return { kind: "web", href };
  return { kind: "none" };
}
