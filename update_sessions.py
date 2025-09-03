import json
import os

# Open the JSON file with UTF-8 encoding
with open("data/sessions.json", "r", encoding="utf-8") as f:
    data = json.load(f)

os.makedirs("content/schedule", exist_ok=True)

for session in data["sessions"]:
    session_id = session["id"]
    title = session.get("title", "Untitled Session")
    filename = f"content/schedule/{session_id}.md"
    
    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"---\n")
        f.write(f"title: \"{title}\"\n")
        f.write(f"id: \"{session_id}\"\n")
        f.write(f"---\n")
