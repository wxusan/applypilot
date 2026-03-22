"""Soul loader — combines BASE.md + agent-specific SOUL.md into one system prompt."""
import os

_SOULS_DIR = os.path.dirname(__file__)


def load_soul(agent_name: str) -> str:
    """
    Load the combined identity prompt for an agent.

    Reads BASE.md (shared identity) and {agent_name}.md (agent-specific),
    then returns them joined with a separator.

    Args:
        agent_name: Filename stem without extension, e.g. "EMAIL_AGENT"

    Returns:
        Combined system prompt string.
    """
    base_path = os.path.join(_SOULS_DIR, "BASE.md")
    soul_path = os.path.join(_SOULS_DIR, f"{agent_name}.md")

    base = open(base_path, encoding="utf-8").read() if os.path.exists(base_path) else ""
    soul = open(soul_path, encoding="utf-8").read() if os.path.exists(soul_path) else ""

    if base and soul:
        return f"{base}\n\n---\n\n{soul}".strip()
    return (base or soul).strip()
