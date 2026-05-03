import type * as Monaco from "monaco-editor";

import { normalizeEditorError } from "@/lib/editor-errors/normalize-error";
import type { ActiveEditorError } from "@/lib/editor-errors/types";

const compareMarkers = (
  left: Monaco.editor.IMarkerData,
  right: Monaco.editor.IMarkerData,
) => {
  const lineDelta = (left.startLineNumber ?? 0) - (right.startLineNumber ?? 0);

  if (lineDelta !== 0) {
    return lineDelta;
  }

  const columnDelta = (left.startColumn ?? 0) - (right.startColumn ?? 0);

  if (columnDelta !== 0) {
    return columnDelta;
  }

  const endLineDelta = (left.endLineNumber ?? 0) - (right.endLineNumber ?? 0);

  if (endLineDelta !== 0) {
    return endLineDelta;
  }

  const endColumnDelta = (left.endColumn ?? 0) - (right.endColumn ?? 0);

  if (endColumnDelta !== 0) {
    return endColumnDelta;
  }

  return left.message.localeCompare(right.message);
};

export const getTopActiveEditorError = (
  monaco: typeof Monaco,
  model: Monaco.editor.ITextModel,
  modelKey: string,
): ActiveEditorError | null => {
  const markers = monaco.editor
    .getModelMarkers({ resource: model.uri })
    .filter((marker) => marker.severity === monaco.MarkerSeverity.Error)
    .sort(compareMarkers);

  const topMarker = markers[0];

  if (!topMarker) {
    return null;
  }

  return normalizeEditorError(topMarker, modelKey);
};
