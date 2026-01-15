#!/usr/bin/env python3
"""Add Technical Model to stepsConfig.js - Fixed implementation v2"""

# Read the original file
with open('/home/ranag/Documents/Accelerator-exp/src/lib/machine/stepsConfig.js', 'r') as f:
    lines = f.readlines()

# Find step17 - it starts with "  {" and has id: "step17"
start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if 'id: "step17"' in line:
        # Find the opening brace for this object
        for j in range(i-1, -1, -1):
            if lines[j].strip() == '{':
                start_idx = j
                break
    if start_idx is not None and 'transitions: { next: "step18" }' in line:
        # This should be the line before the closing brace
        # Find the closing brace
        for j in range(i+1, len(lines)):
            if lines[j].strip() == '},':
                end_idx = j
                break
        break

if start_idx is None or end_idx is None:
    print(f"ERROR: Could not find step17! start_idx={start_idx}, end_idx={end_idx}")
    exit(1)

print(f"Found step17 block: lines {start_idx+1} to {end_idx+1}")

# New Technical Model steps + Target Market (now step25)
new_steps = '''  {
    id: "step17",
    name: "Technical Architecture",
    model: "Technical Model",
    section: "Technical Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution", "modelType"],
      outputKeys: ["techStack", "architecture", "patterns", "scalability"],
      instructions:
        "Design the technical architecture for {{solution}}. Recommend tech stack ({{techStack}}), architecture patterns ({{patterns}}), and scalability approach ({{scalability}}).",
    },
    transitions: { next: "step18" },
  },
  {
    id: "step18",
    name: "MVP Definition",
    model: "Technical Model",
    section: "MVP Planning",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution", "coreFeatures"],
      outputKeys: ["mvpFeatures", "scope", "prioritization"],
      instructions:
        "Define the MVP for {{solution}} by identifying {{mvpFeatures}} from {{coreFeatures}}. Explain scope and prioritization rationale.",
    },
    transitions: { next: "step19" },
  },
  {
    id: "step19",
    name: "Infrastructure & Hosting",
    model: "Technical Model",
    section: "Infrastructure",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution", "scalability"],
      outputKeys: ["cloudProvider", "hosting", "cdn", "costs"],
      instructions:
        "Plan infrastructure and hosting for {{solution}} considering {{scalability}}. Recommend cloud provider, hosting strategy, and CDN approach.",
    },
    transitions: { next: "step20" },
  },
  {
    id: "step20",
    name: "Security Architecture",
    model: "Technical Model",
    section: "Security",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution", "persona"],
      outputKeys: ["auth", "encryption", "compliance", "securityMeasures"],
      instructions:
        "Design security architecture for {{solution}} serving {{persona}}. Include authentication, encryption, compliance requirements, and security measures.",
    },
    transitions: { next: "step21" },
  },
  {
    id: "step21",
    name: "Data Architecture",
    model: "Technical Model",
    section: "Data Strategy",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution", "market"],
      outputKeys: ["databases", "dataFlow", "analytics", "storage"],
      instructions:
        "Plan data architecture for {{solution}} targeting {{market}}. Design databases, data flow, analytics pipeline, and storage strategy.",
    },
    transitions: { next: "step22" },
  },
  {
    id: "step22",
    name: "API & Integrations",
    model: "Technical Model",
    section: "Integration",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["apiDesign", "integrations", "webhooks", "partnerships"],
      instructions:
        "Design API strategy for {{solution}}. Plan REST/GraphQL design, third-party {{integrations}}, webhooks, and partnership opportunities.",
    },
    transitions: { next: "step23" },
  },
  {
    id: "step23",
    name: "Development Workflow",
    model: "Technical Model",
    section: "DevOps",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution", "timeline"],
      outputKeys: ["ciCd", "testing", "deployment", "monitoring"],
      instructions:
        "Establish development workflow for {{solution}} within {{timeline}}. Define CI/CD pipeline, testing strategy, deployment process, and monitoring.",
    },
    transitions: { next: "step24" },
  },
  {
    id: "step24",
    name: "Technical Roadmap",
    model: "Technical Model",
    section: "Planning",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution", "mvpFeatures", "timeline"],
      outputKeys: ["milestones", "resources", "risks", "timelinePhases"],
      instructions:
        "Create technical roadmap for {{solution}} with {{mvpFeatures}} in {{timeline}}. Define milestones, resources needed, technical risks, and timeline phases.",
    },
    transitions: { next: "step25" },
  },
  {
    id: "step25",
    name: "Target Market",
    model: "Marketing Model",
    section: "Market Analysis",
    prompt: {
      template: standardPromptTemplate,
      variables: ["solution"],
      outputKeys: ["market"],
      instructions:
        "Clearly define the target market for {{solution}} by industry, size, and customer type.",
    },
    transitions: { next: "step26" },
  },'''

# Create new content - insert new_steps, remove old step17
new_content = ''.join(lines[:start_idx]) + new_steps + '\n' + ''.join(lines[end_idx+1:])

# Now update ALL step references in the ORIGINAL content (after step17) that need to be shifted
# Old steps 18-55 become new steps 26-63 (+8)
# We only replace in the original content portion (after the old step17)

original_content_after_step17 = ''.join(lines[end_idx+1:])

step_mapping = {
    55: 63, 54: 62, 53: 61, 52: 60, 51: 59, 50: 58, 49: 57, 48: 56,
    47: 55, 46: 54, 45: 53, 44: 52, 43: 51, 42: 50, 41: 49, 40: 48,
    39: 47, 38: 46, 37: 45, 36: 44, 35: 43, 34: 42, 33: 41, 32: 40,
    31: 39, 30: 38, 29: 37, 28: 36, 27: 35, 26: 34, 25: 33, 24: 32,
    23: 31, 22: 30, 21: 29, 20: 28, 19: 27, 18: 26
}

for old_num, new_num in sorted(step_mapping.items(), key=lambda x: -x[0]):
    original_content_after_step17 = original_content_after_step17.replace(f'"step{old_num}"', f'"step{new_num}"')

# Reconstruct
new_content = ''.join(lines[:start_idx]) + new_steps + '\n' + original_content_after_step17

# Write the new file
with open('/home/ranag/Documents/Accelerator-exp/src/lib/machine/stepsConfig.js', 'w') as f:
    f.write(new_content)

print("\nFile written successfully!")

# Verify the result
import re
step_ids = sorted(int(m.group(1)) for m in re.finditer(r'id:\s*"step(\d+)"', new_content))
print(f"\nStep IDs found: {len(step_ids)}")
print(f"Range: {min(step_ids)} to {max(step_ids)}")

# Check for duplicates
from collections import Counter
step_counter = Counter(int(m.group(1)) for m in re.finditer(r'id:\s*"step(\d+)"', new_content))
duplicates = [step for step, count in step_counter.items() if count > 1]
if duplicates:
    print(f"ERROR: Duplicate steps found: {duplicates}")
else:
    print("No duplicates - all step IDs are unique!")

# Count steps per model
model_counts = {}
for match in re.finditer(r'name:\s*"([^"]+)",\s*\n\s*model:\s*"([^"]+)"', new_content):
    name, model = match.groups()
    if name != 'Completed':
        model_counts[model] = model_counts.get(model, 0) + 1

print("\nSteps per model:")
for model, count in sorted(model_counts.items()):
    print(f"  {model}: {count} steps")
print(f"\nTotal: {sum(model_counts.values())} steps")
