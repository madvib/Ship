use super::db::{delete_release_db, get_release_db, list_releases_db, upsert_release_db};
use super::types::{Release, ReleaseEntry, ReleaseMetadata, ReleaseStatus};
use anyhow::{Result, anyhow};
use chrono::Utc;
use std::path::{Path, PathBuf};

// ── File helpers ─────────────────────────────────────────────────────────────

fn release_file_path(ship_dir: &Path, version: &str) -> PathBuf {
    let dir = runtime::project::releases_dir(ship_dir);
    std::fs::create_dir_all(&dir).ok();
    let candidate = dir.join(format!("{}.md", version));
    if !candidate.exists() {
        return candidate;
    }
    let mut n = 2u32;
    loop {
        let candidate = dir.join(format!("{}-{}.md", version, n));
        if !candidate.exists() {
            return candidate;
        }
        n += 1;
    }
}

pub fn write_release_file(ship_dir: &Path, release: &Release) -> Result<PathBuf> {
    let path = release_file_path(ship_dir, &release.metadata.version);
    let content = release.to_markdown()?;
    runtime::fs_util::write_atomic(&path, content)?;
    Ok(path)
}

fn remove_release_files(ship_dir: &Path, version: &str) {
    let releases_dir = runtime::project::releases_dir(ship_dir);
    let upcoming_dir = runtime::project::upcoming_releases_dir(ship_dir);

    for dir in &[releases_dir, upcoming_dir] {
        if !dir.exists() {
            continue;
        }
        for suffix in &["", "-2", "-3", "-4", "-5"] {
            let file_name = if suffix.is_empty() {
                format!("{}.md", version)
            } else {
                format!("{}{}.md", version, suffix)
            };
            let p = dir.join(file_name);
            if p.exists() {
                if let Ok(content) = std::fs::read_to_string(&p) {
                    if content.contains(version) {
                        std::fs::remove_file(&p).ok();
                    }
                }
            }
        }
    }
}

// ── Public CRUD ──────────────────────────────────────────────────────────────

pub fn create_release(ship_dir: &Path, version: &str, body: &str) -> Result<ReleaseEntry> {
    if version.trim().is_empty() {
        return Err(anyhow!("Release version cannot be empty"));
    }
    let id = version.to_string(); // version is the ID for releases
    let now = Utc::now().to_rfc3339();

    let mut release = Release {
        metadata: ReleaseMetadata {
            id: id.clone(),
            version: version.to_string(),
            status: ReleaseStatus::Planned,
            created: now.clone(),
            updated: now,
            supported: None,
            target_date: None,
            tags: vec![],
        },
        body: body.to_string(),
        breaking_changes: vec![],
    };

    release.extract_breaking_changes();

    upsert_release_db(ship_dir, &release, &ReleaseStatus::Planned)?;
    let file_path = write_release_file(ship_dir, &release)?;

    runtime::append_event(
        ship_dir,
        "logic",
        runtime::EventEntity::Release,
        runtime::EventAction::Create,
        id.clone(),
        Some(format!("version={}", version)),
    )?;

    Ok(ReleaseEntry {
        id,
        file_name: file_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string(),
        path: file_path.to_string_lossy().to_string(),
        version: version.to_string(),
        status: ReleaseStatus::Planned,
        release,
    })
}

pub fn get_release_by_id(ship_dir: &Path, id: &str) -> Result<ReleaseEntry> {
    get_release_db(ship_dir, id)?.ok_or_else(|| anyhow!("Release not found: {}", id))
}

pub fn update_release(ship_dir: &Path, id: &str, mut release: Release) -> Result<ReleaseEntry> {
    let existing =
        get_release_db(ship_dir, id)?.ok_or_else(|| anyhow!("Release not found: {}", id))?;
    release.metadata.updated = Utc::now().to_rfc3339();

    upsert_release_db(ship_dir, &release, &existing.status)?;
    write_release_file(ship_dir, &release)?;

    runtime::append_event(
        ship_dir,
        "logic",
        runtime::EventEntity::Release,
        runtime::EventAction::Update,
        id.to_string(),
        Some(format!("version={}", release.metadata.version)),
    )?;

    Ok(get_release_db(ship_dir, id)?.unwrap())
}

pub fn update_release_content(ship_dir: &Path, id: &str, content: &str) -> Result<ReleaseEntry> {
    let mut entry =
        get_release_db(ship_dir, id)?.ok_or_else(|| anyhow!("Release not found: {}", id))?;
    entry.release.body = content.to_string();
    update_release(ship_dir, id, entry.release)
}

pub fn delete_release(ship_dir: &Path, id: &str) -> Result<()> {
    let entry =
        get_release_db(ship_dir, id)?.ok_or_else(|| anyhow!("Release not found: {}", id))?;
    delete_release_db(ship_dir, id)?;
    remove_release_files(ship_dir, &entry.version);

    runtime::append_event(
        ship_dir,
        "logic",
        runtime::EventEntity::Release,
        runtime::EventAction::Delete,
        id.to_string(),
        None,
    )?;
    Ok(())
}

pub fn list_releases(ship_dir: &Path) -> Result<Vec<ReleaseEntry>> {
    list_releases_db(ship_dir)
}
