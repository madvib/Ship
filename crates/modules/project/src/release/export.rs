use super::types::{Release, ReleaseBreakingChange, ReleaseMetadata, ReleaseStatus};
use anyhow::{Context, Result, anyhow};
use chrono::Utc;

impl Release {
    pub fn to_markdown(&self) -> Result<String> {
        let toml_str = toml::to_string(&self.metadata)
            .context("Failed to serialise release metadata as TOML")?;
        Ok(format!("+++\n{}+++\n\n{}", toml_str, self.body))
    }

    pub fn from_markdown(content: &str) -> Result<Self> {
        if content.starts_with("+++\n") {
            Self::from_toml_markdown(content)
        } else {
            let version = content
                .lines()
                .find(|l| l.starts_with("# "))
                .map(|l| l.trim_start_matches("# ").trim().to_string())
                .unwrap_or_default();
            let now = Utc::now().to_rfc3339();
            Ok(Release {
                metadata: ReleaseMetadata {
                    id: version.clone(),
                    version,
                    status: ReleaseStatus::default(),
                    created: now.clone(),
                    updated: now,
                    supported: None,
                    target_date: None,
                    tags: Vec::new(),
                },
                body: content.to_string(),
                breaking_changes: Vec::new(),
            })
        }
    }

    fn from_toml_markdown(content: &str) -> Result<Self> {
        let rest = &content[4..]; // skip "+++\n"
        let end = rest
            .find("\n+++")
            .ok_or_else(|| anyhow!("Invalid release format: missing closing +++"))?;
        let toml_str = &rest[..end];
        let body = rest[end + 4..].trim_start_matches('\n').to_string();
        let metadata: ReleaseMetadata =
            toml::from_str(toml_str).context("Failed to parse release TOML frontmatter")?;

        let mut release = Release {
            metadata,
            body: body.clone(),
            breaking_changes: Vec::new(),
        };

        release.extract_breaking_changes();

        Ok(release)
    }

    pub fn extract_breaking_changes(&mut self) {
        let mut items = Vec::new();
        let mut in_section = false;

        for line in self.body.lines() {
            if line.starts_with("## ") && line.contains("Breaking Changes") {
                in_section = true;
                continue;
            } else if line.starts_with("## ") && in_section {
                break;
            }

            if in_section {
                let trimmed = line.trim();
                if trimmed.starts_with("- ") {
                    let text = trimmed[2..].trim().to_string();
                    if !text.is_empty() {
                        items.push(ReleaseBreakingChange {
                            id: runtime::gen_nanoid(),
                            text,
                        });
                    }
                }
            }
        }
        self.breaking_changes = items;
    }
}
