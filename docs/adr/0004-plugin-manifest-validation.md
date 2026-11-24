# ADR-004: Validate plugin contributions after activation with rollback

- Status: Accepted
- Context: Plugin activation is executable code; its actual registrations must agree with its declared contribution manifest, and a failed plugin must not leave partial registrations behind.
- Decision: The host records names for shapes, commands, decorators, and attributes before activation. It invokes the plugin synchronously, compares the exact sorted delta against contributes (missing categories mean empty), and rolls back all names added by that plugin if activation or validation fails. Duplicate registration is rejected at the registry boundary.
- Consequences: A plugin is accepted only when declared and actual contributions match. Activation order is deterministic. The current host uses synchronous snapshot/rollback; plugins must not start asynchronous registration after activate returns.
