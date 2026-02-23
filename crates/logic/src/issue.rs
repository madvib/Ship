use crate::project::sanitize_file_name;
use anyhow::{Context, Result, anyhow};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

// ─── Data types ───────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct IssueMetadata {
    pub title: String,
    pub created: DateTime<Utc>,
    pub updated: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assignee: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub spec: Option<String>,
    #[serde(default)]
    pub links: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Issue {
    #[serde(flatten)]
    pub metadata: IssueMetadata,
    pub description: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct IssueEntry {
    pub file_name: String,
    pub status: String,
    pub path: String,
    pub issue: Issue,
}

// ─── Serialisation ────────────────────────────────────────────────────────────

impl Issue {
    pub fn to_markdown(&self) -> Result<String> {
        let toml_str = toml::to_string(&self.metadata)
            .context("Failed to serialise issue metadata as TOML")?;
        Ok(format!("+++\n{}+++\n\n{}", toml_str, self.description))
    }

    /// Parse both new TOML (`+++`) and legacy YAML (`---`) frontmatter.
    pub fn from_markdown(content: &str) -> Result<Self> {
        if content.starts_with("+++\n") {
            Self::from_toml_markdown(content)
        } else if content.starts_with("---\n") {
            Self::from_yaml_markdown_legacy(content)
        } else {
            Err(anyhow!("Invalid issue format: missing frontmatter start"))
        }
    }

    fn from_toml_markdown(content: &str) -> Result<Self> {
        let rest = &content[4..]; // skip leading "+++\n"
        let end = rest
            .find("\n+++")
            .ok_or_else(|| anyhow!("Invalid issue format: missing closing +++"))?;
        let toml_str = &rest[..end];
        let description = rest[end + 4..].trim_start_matches('\n').to_string();
        let metadata: IssueMetadata =
            toml::from_str(toml_str).context("Failed to parse issue TOML frontmatter")?;
        Ok(Issue { metadata, description })
    }

    /// Minimal YAML reader for the old `---` format — avoids keeping serde_yaml.
    fn from_yaml_markdown_legacy(content: &str) -> Result<Self> {
        let parts: Vec<&str> = content.splitn(3, "---\n").collect();
        if parts.len() < 3 {
            return Err(anyhow!("Invalid legacy issue format: incomplete frontmatter"));
        }
        let yaml = parts[1];
        let description = parts[2].trim_start_matches('\n').to_string();

        let mut title = String::new();
        let mut created = Utc::now();
        let mut updated = Utc::now();
        let mut links: Vec<String> = Vec::new();

        for line in yaml.lines() {
            if let Some(v) = line.strip_prefix("title: ") {
                title = v.trim().to_string();
            } else if let Some(v) = line.strip_prefix("created_at: ") {
                if let Ok(dt) = v.trim().parse::<DateTime<Utc>>() {
                    created = dt;
                }
            } else if let Some(v) = line.strip_prefix("updated_at: ") {
                if let Ok(dt) = v.trim().parse::<DateTime<Utc>>() {
                    updated = dt;
                }
            } else if line.starts_with("- ") {
                // Naive list item under `links:`
                let item = line.trim_start_matches("- ").trim().to_string();
                if !item.is_empty() {
                    links.push(item);
                }
            }
        }

        Ok(Issue {
            metadata: IssueMetadata {
                title,
                created,
                updated,
                links,
                ..Default::default()
            },
            description,
        })
    }
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

pub fn create_issue(
    project_dir: PathBuf,
    title: &str,
    description: &str,
    status: &str,
) -> Result<PathBuf> {
    let issue = Issue {
        metadata: IssueMetadata {
            title: title.to_string(),
            created: Utc::now(),
            updated: Utc::now(),
            ..Default::default()
        },
        description: description.to_string(),
    };

    let file_name = format!("{}.md", sanitize_file_name(title));
    let file_path = project_dir.join("issues").join(status).join(&file_name);

    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let content = issue.to_markdown()?;
    fs::write(&file_path, content).context("Failed to write issue file")?;

    Ok(file_path)
}

pub fn get_issue(path: PathBuf) -> Result<Issue> {
    let content = fs::read_to_string(&path)
        .with_context(|| format!("Failed to read issue: {}", path.display()))?;
    Issue::from_markdown(&content)
}

pub fn update_issue(path: PathBuf, mut issue: Issue) -> Result<()> {
    issue.metadata.updated = Utc::now();
    let content = issue.to_markdown()?;
    fs::write(&path, content)
        .with_context(|| format!("Failed to write issue: {}", path.display()))?;
    Ok(())
}

pub fn list_issues(project_dir: PathBuf) -> Result<Vec<(String, String)>> {
    let mut issues = Vec::new();
    let issues_dir = project_dir.join("issues");
    if !issues_dir.exists() {
        return Ok(issues);
    }
    for status_entry in fs::read_dir(&issues_dir)? {
        let status_entry = status_entry?;
        let status_path = status_entry.path();
        if !status_path.is_dir() {
            continue;
        }
        let status = status_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();
        for entry in fs::read_dir(&status_path)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |e| e == "md") {
                if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                    issues.push((file_name.to_string(), status.clone()));
                }
            }
        }
    }
    Ok(issues)
}

pub fn list_issues_full(project_dir: PathBuf) -> Result<Vec<IssueEntry>> {
    let mut entries = Vec::new();
    let issues_dir = project_dir.join("issues");
    if !issues_dir.exists() {
        return Ok(entries);
    }
    for status_entry in fs::read_dir(&issues_dir)? {
        let status_entry = status_entry?;
        let status_path = status_entry.path();
        if !status_path.is_dir() {
            continue;
        }
        let status = status_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();
        for entry in fs::read_dir(&status_path)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |e| e == "md") {
                let file_name = path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("")
                    .to_string();
                if let Ok(issue) = get_issue(path.clone()) {
                    entries.push(IssueEntry {
                        file_name,
                        status: status.clone(),
                        path: path.to_string_lossy().to_string(),
                        issue,
                    });
                }
            }
        }
    }
    Ok(entries)
}

pub fn move_issue(
    _project_dir: PathBuf,
    path: PathBuf,
    _current_status: &str,
    new_status: &str,
) -> Result<PathBuf> {
    if !path.exists() {
        return Err(anyhow!("Issue not found: {}", path.display()));
    }

    // path is .ship/issues/[STATUS]/file.md
    let file_name = path.file_name().unwrap().to_str().unwrap().to_string();
    let issues_dir = path.parent().unwrap().parent().unwrap().to_path_buf();
    let target_dir = issues_dir.join(new_status);
    fs::create_dir_all(&target_dir)?;
    let target_path = target_dir.join(&file_name);

    fs::rename(&path, &target_path).context("Failed to move issue file")?;
    Ok(target_path)
}

pub fn delete_issue(path: PathBuf) -> Result<()> {
    fs::remove_file(&path)
        .with_context(|| format!("Failed to delete issue: {}", path.display()))?;
    Ok(())
}

pub fn append_note(path: PathBuf, note: &str) -> Result<()> {
    let mut issue = get_issue(path.clone())?;
    if !issue.description.is_empty() && !issue.description.ends_with('\n') {
        issue.description.push('\n');
    }
    issue.description.push('\n');
    issue.description.push_str(note.trim_end());
    issue.description.push('\n');
    update_issue(path, issue)
}

pub fn add_link(file_path: PathBuf, target: &str) -> Result<()> {
    let mut issue = get_issue(file_path.clone())?;
    issue.metadata.links.push(target.to_string());
    update_issue(file_path, issue)
}

// ─── Migration ────────────────────────────────────────────────────────────────

/// Convert all legacy YAML-frontmatter issues in a project to TOML in-place.
pub fn migrate_yaml_issues(project_dir: &PathBuf) -> Result<usize> {
    let issues_dir = project_dir.join("issues");
    if !issues_dir.exists() {
        return Ok(0);
    }
    let mut count = 0;
    for status_entry in fs::read_dir(&issues_dir)? {
        let status_path = status_entry?.path();
        if !status_path.is_dir() {
            continue;
        }
        for entry in fs::read_dir(&status_path)? {
            let path = entry?.path();
            if path.is_file() && path.extension().map_or(false, |e| e == "md") {
                let content = fs::read_to_string(&path)?;
                if content.starts_with("---\n") {
                    if let Ok(issue) = Issue::from_yaml_markdown_legacy(&content) {
                        let new_content = issue.to_markdown()?;
                        fs::write(&path, new_content)?;
                        count += 1;
                    }
                }
            }
        }
    }
    Ok(count)
}
