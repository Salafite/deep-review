# Elixir & Phoenix Code Audit Guide

Comprehensive guidelines for reviewing Elixir and Phoenix applications. Focuses on OTP concurrency, memory management, Ecto database performance, and error recovery.

---

## 1. Concurrency & OTP Architecture

### GenServer Lifecycle & State
- 🔴 `[blocking]` **State Accumulation**: Unbounded state growth in long-running processes (e.g., storing all events in a list without truncation or rotation).
- 🔴 `[blocking]` **Blocking in GenServer Calls**: Performing long synchronous network requests or heavy disk I/O inside `handle_call/3` blocks the entire process mailbox. Offload long tasks to supervised `Task`s or background workers (Oban).
- 🟡 `[important]` **Cast Overload**: Excessive use of `GenServer.cast/2` without backpressure can cause process mailboxes to consume all available BEAM memory. Prefer `handle_call` or explicit flow control (GenStage/Broadway).
- 🔴 `[blocking]` **Unsupervised Tasks**: `Task.async/1` spawned without supervision or missing `Task.await/2` causes crashes to terminate the caller unexpectedly. Use `Task.Supervisor`.

### Process Crashing & Supervision
- 🟡 `[important]` **Supervision Restart Intensity**: Check `max_restarts` and `max_seconds` in supervisor trees. Too low restarts kill supervisors on transient network blips; too high loops endlessly.

---

## 2. Memory & BEAM Internals

### Atom Exhaustion (DoS Vulnerability)
- 🔴 `[blocking]` **Dynamic Atom Creation**: Never convert untrusted user input to atoms via `String.to_atom/1` or `clean_params` decoding into atoms. The BEAM atom table has a global limit (1,048,576 atoms) and is never garbage collected. Always use `String.to_existing_atom/1` or leave keys as binary strings.

### Binary Leakage
- 🟡 `[important]` **Sub-binary Retaining Large Binaries**: Slicing a small portion of a massive binary (e.g., parsing a 50MB file) causes the small slice to reference the whole original binary in memory. Use `:binary.copy/1` on the slice before holding it long-term.

---

## 3. Ecto & Database Access

### Query Optimization
- 🔴 `[blocking]` **N+1 Queries**: Calling `Repo.all` or accessing associations inside `Enum.map/2` without preloading. Use `Repo.preload/2` or Ecto joins.
- 🟡 `[important]` **Unbounded Queries**: Endpoints returning `Repo.all(from p in Post)` without pagination or `limit`.
- 🔴 `[blocking]` **Missing Foreign Key / Index in Migrations**: Verify that every `references(:table)` column in `priv/repo/migrations/` has a corresponding index.

### Changeset & Transactions
- 🟡 `[important]` **Validate Casts**: Ensure sensitive fields (e.g., `role`, `is_admin`) are excluded from `cast/3` in public web changesets.
- 🔴 `[blocking]` **Long Running Transactions**: Running slow external API calls inside `Repo.transaction/2` holds database pool connections open, starving the connection pool. Only keep DB operations inside transactions.

---

## 4. Functional Idioms & Robustness

### Pattern Matching & Control Flow
- 🟡 `[important]` **The `with` Statement Error Masking**: Avoid giant `with` statements where multiple clauses return generic `{:error, reason}` that cannot be differentiated in the `else` block. Use tagged tuples `{:step_name, {:error, reason}}`.
- 🟢 `[nit]` **Pipe Chains**: Avoid single-step pipes (`data |> transform()`). Always start a pipe with raw data, not a function call.
- 🟡 `[important]` **IO Lists vs String Concatenation**: When rendering large outputs or streaming responses, prefer nested lists (IO Lists / iodata) over repeated string concatenation (`<>`).
