# ADR-004: Validate plugin contributions before atomic commit

- Status: Accepted
- Context: Plugin activation is executable code; its actual registrations must agree with its declared contribution manifest, and a failed plugin must not leave partial registrations behind.
- Decision: The host gives each plugin a scoped staging context. Shape providers, command builders, decorators, and attribute handlers are buffered rather than written to live registries. After activate returns, the host compares the exact sorted staged names against contributes (missing categories mean empty). Only a matching manifest is committed. Duplicate names are rejected during staging; an unexpected commit error rolls back already committed entries.
- Consequences: Activation exceptions and manifest mismatches leave live registries unchanged. A plugin is accepted only when declared and actual contributions match. Activation order is deterministic. Plugins must not start asynchronous registration after activate returns.
