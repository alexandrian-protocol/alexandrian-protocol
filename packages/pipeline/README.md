# @alexandrian/pipeline

Compilation pipeline for Knowledge Blocks: chunking, embedding, entity extraction, and artifact-type processing. Produces compiled output suitable for on-chain registration.

**Embedder:** Set `EMBEDDER` (e.g. `stub`, `local`, `openai`, `cohere`). If `EMBEDDER=openai` or `EMBEDDER=cohere`, the corresponding API key must be set (`OPENAI_API_KEY` / `COHERE_API_KEY`) or the pipeline fails at startup with a clear error.
