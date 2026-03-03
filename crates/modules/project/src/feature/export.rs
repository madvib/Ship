use super::types::{Feature, FeatureCriterion, FeatureMetadata, FeatureTodo};
use anyhow::{Context, Result, anyhow};
use chrono::Utc;

impl Feature {
    pub fn to_markdown(&self) -> Result<String> {
        let toml_str = toml::to_string(&self.metadata)
            .context("Failed to serialise feature metadata as TOML")?;

        let out = format!("+++\n{}+++\n\n{}", toml_str, self.body);

        // Append structured sections if they have data but weren't in the body
        // Note: In the future, we might want to ensure the body doesn't already contain these.
        // For now, let's assume the body contains the narrative and we might append these if they're missing.

        Ok(out)
    }

    pub fn from_markdown(content: &str) -> Result<Self> {
        if content.starts_with("+++\n") {
            Self::from_toml_markdown(content)
        } else {
            let title = content
                .lines()
                .find(|l| l.starts_with("# "))
                .map(|l| l.trim_start_matches("# ").trim().to_string())
                .unwrap_or_default();
            let now = Utc::now().to_rfc3339();
            Ok(Feature {
                metadata: FeatureMetadata {
                    id: String::new(),
                    title,
                    description: None,
                    created: now.clone(),
                    updated: now,
                    release_id: None,
                    spec_id: None,
                    branch: None,
                    agent: None,
                    tags: Vec::new(),
                },
                body: content.to_string(),
                todos: Vec::new(),
                criteria: Vec::new(),
            })
        }
    }

    fn from_toml_markdown(content: &str) -> Result<Self> {
        let rest = &content[4..]; // skip "+++\n"
        let end = rest
            .find("\n+++")
            .ok_or_else(|| anyhow!("Invalid feature format: missing closing +++"))?;
        let toml_str = &rest[..end];
        let body = rest[end + 4..].trim_start_matches('\n').to_string();
        let metadata: FeatureMetadata =
            toml::from_str(toml_str).context("Failed to parse feature TOML frontmatter")?;

        let mut feature = Feature {
            metadata,
            body: body.clone(),
            todos: Vec::new(),
            criteria: Vec::new(),
        };

        // Extract todos and criteria from body
        feature.extract_structured_data();

        Ok(feature)
    }

    pub fn extract_structured_data(&mut self) {
        self.todos = parse_checklist(&self.body, "Delivery Todos");
        self.criteria = parse_checklist(&self.body, "Acceptance Criteria");
    }
}

fn parse_checklist<T: ChecklistItem>(body: &str, section_name: &str) -> Vec<T> {
    let mut items = Vec::new();
    let mut in_section = false;

    for line in body.lines() {
        if line.starts_with("## ") && line.contains(section_name) {
            in_section = true;
            continue;
        } else if line.starts_with("## ") && in_section {
            break;
        }

        if in_section {
            let trimmed = line.trim();
            if trimmed.starts_with("- [ ]") || trimmed.starts_with("- [x]") {
                let completed = trimmed.starts_with("- [x]");
                let text = trimmed[5..].trim().to_string();
                if !text.is_empty() {
                    items.push(T::new(text, completed));
                }
            }
        }
    }
    items
}

trait ChecklistItem {
    fn new(text: String, completed: bool) -> Self;
}

impl ChecklistItem for FeatureTodo {
    fn new(text: String, completed: bool) -> Self {
        FeatureTodo {
            id: runtime::gen_nanoid(),
            text,
            completed,
        }
    }
}

impl ChecklistItem for FeatureCriterion {
    fn new(text: String, completed: bool) -> Self {
        FeatureCriterion {
            id: runtime::gen_nanoid(),
            text,
            met: completed,
        }
    }
}
