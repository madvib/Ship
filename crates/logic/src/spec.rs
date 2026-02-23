use crate::project::sanitize_file_name;
use anyhow::{Context, Result};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct SpecEntry {
    pub file_name: String,
    pub title: String,
    pub path: String,
}

/// Create a new spec file in `.ship/specs/`.
pub fn create_spec(project_dir: PathBuf, title: &str, content: &str) -> Result<PathBuf> {
    let specs_dir = project_dir.join("specs");
    fs::create_dir_all(&specs_dir)?;

    let file_name = format!("{}.md", sanitize_file_name(title));
    let file_path = specs_dir.join(&file_name);

    let body = if content.is_empty() {
        format!("# {}\n\n", title)
    } else {
        content.to_string()
    };

    fs::write(&file_path, body).context("Failed to write spec file")?;
    Ok(file_path)
}

/// Read the raw markdown content of a spec.
pub fn get_spec(path: PathBuf) -> Result<String> {
    fs::read_to_string(&path)
        .with_context(|| format!("Failed to read spec: {}", path.display()))
}

/// Overwrite a spec's content.
pub fn update_spec(path: PathBuf, content: &str) -> Result<()> {
    fs::write(&path, content)
        .with_context(|| format!("Failed to write spec: {}", path.display()))
}

/// List all spec files in `.ship/specs/`.
pub fn list_specs(project_dir: PathBuf) -> Result<Vec<SpecEntry>> {
    let specs_dir = project_dir.join("specs");
    if !specs_dir.exists() {
        return Ok(vec![]);
    }

    let mut entries = Vec::new();
    for entry in fs::read_dir(&specs_dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_file() && path.extension().map_or(false, |e| e == "md") {
            let file_name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();
            // Derive a display title: read first `# Heading` or fall back to filename stem
            let title = derive_title(&path).unwrap_or_else(|| {
                path.file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or(&file_name)
                    .replace('-', " ")
            });
            entries.push(SpecEntry {
                file_name,
                title,
                path: path.to_string_lossy().to_string(),
            });
        }
    }
    Ok(entries)
}

fn derive_title(path: &PathBuf) -> Option<String> {
    let content = fs::read_to_string(path).ok()?;
    content
        .lines()
        .find(|l| l.starts_with("# "))
        .map(|l| l.trim_start_matches("# ").trim().to_string())
}
