# Owner revision requests

`POST /api/issues/:id/owner-revision-request` returns the same in-review task to
the producing agent with a human-authored feedback comment. It requires the
current human assignee, active non-viewer membership, task visibility, an
unpaused task, and the normal `tasks:assign` permission for the producer.

The body contains `body`, `clientRequestId`, `expectedAssigneeUserId`,
`producerAgentId`, `documentKey`, and `expectedRevisionId`. The transaction locks
the task and current document revision. Status, assignee, producer or revision
drift rejects the request without leaving a comment or reassigning the task.
Execution-policy reviews and active recovery remain on their own governed paths.
The feedback is not an approval, interaction answer or execution verdict.

Retry the same request ID and body after an ambiguous response. The existing
comment and activity receipt prevent another transition; wake deduplication
serializes concurrent retries. Failed, cancelled or skipped wakes can be retried.
The API response separately reports `replayed` and `wakeQueued`.

This is the installed fork's board API workflow. The installed source has no
owner-revision form in the UI. The reviewed-HTML UI remains a separate private
preview with its existing accessibility behavior. Generic runner `call_api`
cannot invoke this lifecycle mutation.
