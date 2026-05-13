# n8n MCP — verktøy som må aktiveres for workflow-bygging

Vår n8n MCP (`azuren8n.micronet.no`) eksponerer per nå kun `search_executions`. For å la Claude bygge workflows direkte må admin aktivere disse tools i MCP-config:

| Tool | Formål |
|------|--------|
| `get_sdk_reference` | Hente n8n Workflow SDK-syntaks |
| `search_nodes` | Finne tilgjengelige n8n-noder |
| `get_node_types` | TypeScript-parameter-definisjoner per node |
| `get_suggested_nodes` | Anbefalte node-kombinasjoner |
| `validate_workflow` | Validere workflow før save |
| `create_workflow_from_code` | Opprette ny workflow |
| `update_workflow` | Oppdatere eksisterende workflow |
| `archive_workflow` | Arkivere |

Når disse er aktivert, kan Claude bygge og oppdatere de to webhook-workflowene (`timer-tickets`, `timer-log`) direkte mot n8n-instansen.

## Alternativ: manuell import

Hvis admin ikke kan utvide MCP, kan Claude skrive workflow-JSON som importeres manuelt via n8n UI → Workflows → ⋯ → Import from File.
