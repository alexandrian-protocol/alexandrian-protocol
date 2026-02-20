# @alexandrian/pipeline

Compilation pipeline for Knowledge Blocks: chunking, embedding, entity extraction, and artifact-type processing. Produces compiled output suitable for on-chain registration.

**Embedder:** Set `EMBEDDER` (e.g. `stub`, `local`, `openai`, `cohere`). Default is `stub` (no API key). If `EMBEDDER=openai` or `EMBEDDER=cohere`, set the matching API key (`OPENAI_API_KEY` / `COHERE_API_KEY`) or startup throws with a clear error.
