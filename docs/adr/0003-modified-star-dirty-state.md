# ADR-003: modified-star compares against the saved document baseline

- Status: Accepted
- Context: An edit-history flag would leave a star after undoing back to the saved state, and would not express actual persisted differences.
- Decision: EditorContext.markSaved() snapshots each current shape's serialized semantic fingerprint after init, read, and successful save. The decorator compares a current subtree fingerprint with the saved fingerprint for that id. New shapes are dirty. A container fingerprint includes descendants, so changes propagate to containing groups/boxes and the SVG root row. Removed nodes have no row to decorate; their surviving parent (including the SVG root) becomes dirty.
- Consequences: Undo back to the saved document removes the star naturally. The policy reflects document state rather than whether a command has ever run.
