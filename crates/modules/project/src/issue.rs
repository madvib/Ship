use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::Path;
use std::str::FromStr;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Type, Default)]
#[serde(rename_all = "kebab-case")]
pub enum IssueStatus {
    #[default]
    Backlog,
    Todo,
    InProgress,
    Done,
}

impl FromStr for IssueStatus {
    type Err = anyhow::Error;

    fn from_str(value: &str) -> std::result::Result<Self, Self::Err> {
        match value.to_lowercase().as_str() {
            "backlog" => Ok(Self::Backlog),
            "todo" => Ok(Self::Todo),
            "in-progress" | "in_progress" => Ok(Self::InProgress),
            "done" => Ok(Self::Done),
            _ => Err(anyhow!("Invalid issue status: {}", value)),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Type, Default)]
pub struct IssueMetadata {
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Type, Default)]
pub struct Issue {
    pub title: String,
    pub description: String,
    pub status: IssueStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assignee: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub priority: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub release_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub feature_id: Option<String>,
    #[serde(default)]
    pub metadata: IssueMetadata,
}

impl Issue {
    pub fn from_markdown(content: &str) -> Result<Self> {
        Ok(Self {
            title: "Issue".to_string(),
            description: content.to_string(),
            ..Self::default()
        })
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Type, Default)]
pub struct IssueEntry {
    pub id: String,
    pub file_name: String,
    pub issue: Issue,
}

pub fn create_issue(
    _ship_dir: &Path,
    _title: &str,
    _description: &str,
    _status: IssueStatus,
    _assignee: Option<String>,
    _priority: Option<String>,
    _release_id: Option<String>,
    _feature_id: Option<String>,
) -> Result<IssueEntry> {
    Err(anyhow!(
        "Issue APIs were removed from ship-module-project and are currently unavailable"
    ))
}

pub fn update_issue(_ship_dir: &Path, _id: &str, _issue: Issue) -> Result<()> {
    Err(anyhow!(
        "Issue APIs were removed from ship-module-project and are currently unavailable"
    ))
}

pub fn move_issue(_ship_dir: &Path, _id: &str, _status: IssueStatus) -> Result<IssueEntry> {
    Err(anyhow!(
        "Issue APIs were removed from ship-module-project and are currently unavailable"
    ))
}

pub fn delete_issue(_ship_dir: &Path, _id: &str) -> Result<()> {
    Err(anyhow!(
        "Issue APIs were removed from ship-module-project and are currently unavailable"
    ))
}

pub fn list_issues(_ship_dir: &Path) -> Result<Vec<IssueEntry>> {
    Ok(Vec::new())
}

pub fn get_issue_by_id(_ship_dir: &Path, _id: &str) -> Result<IssueEntry> {
    Err(anyhow!(
        "Issue APIs were removed from ship-module-project and are currently unavailable"
    ))
}
