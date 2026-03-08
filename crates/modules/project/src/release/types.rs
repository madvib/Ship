use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Default, Type)]
#[serde(rename_all = "kebab-case")]
pub enum ReleaseStatus {
    #[default]
    Upcoming,
    Active,
    Deprecated,
}

impl std::fmt::Display for ReleaseStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ReleaseStatus::Upcoming => write!(f, "upcoming"),
            ReleaseStatus::Active => write!(f, "active"),
            ReleaseStatus::Deprecated => write!(f, "deprecated"),
        }
    }
}

impl std::str::FromStr for ReleaseStatus {
    type Err = anyhow::Error;
    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "upcoming" => Ok(ReleaseStatus::Upcoming),
            "active" => Ok(ReleaseStatus::Active),
            "deprecated" => Ok(ReleaseStatus::Deprecated),
            _ => Err(anyhow::anyhow!("Invalid release status: {}", s)),
        }
    }
}

// ─── Core types ───────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
pub struct ReleaseBreakingChange {
    pub id: String,
    pub text: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
pub struct ReleaseMetadata {
    pub id: String,
    pub version: String,
    #[serde(default)]
    pub status: ReleaseStatus,
    pub created: String,
    pub updated: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub supported: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_date: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
pub struct Release {
    pub metadata: ReleaseMetadata,
    pub body: String,
    #[serde(default)]
    pub breaking_changes: Vec<ReleaseBreakingChange>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
pub struct ReleaseEntry {
    pub id: String,
    pub file_name: String,
    pub path: String,
    pub version: String,
    pub status: ReleaseStatus,
    pub release: Release,
}
