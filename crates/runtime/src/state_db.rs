use anyhow::{Context, Result, anyhow};
use chrono::Utc;
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::{Connection, SqliteConnection};
use std::path::{Path, PathBuf};
use std::str::FromStr;

const PROJECT_SCHEMA_V1: &str = r#"
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kv_state (
  namespace TEXT NOT NULL,
  key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(namespace, key)
);

CREATE TABLE IF NOT EXISTS migration_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL,
  source_path TEXT NOT NULL,
  target_path TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TEXT NOT NULL
);
"#;

const GLOBAL_SCHEMA_V1: &str = r#"
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS global_state (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
"#;

const PROJECT_MIGRATIONS: &[(&str, &str)] = &[("0001_project_schema", PROJECT_SCHEMA_V1)];
const GLOBAL_MIGRATIONS: &[(&str, &str)] = &[("0001_global_schema", GLOBAL_SCHEMA_V1)];

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct DatabaseMigrationReport {
    pub db_path: PathBuf,
    pub created: bool,
    pub applied_migrations: usize,
}

pub fn ensure_project_database(ship_dir: &Path) -> Result<DatabaseMigrationReport> {
    let db_path = ship_dir.join("ship.db");
    ensure_database(&db_path, PROJECT_MIGRATIONS)
}

pub fn ensure_global_database(global_dir: &Path) -> Result<DatabaseMigrationReport> {
    let db_path = global_dir.join("ship.db");
    ensure_database(&db_path, GLOBAL_MIGRATIONS)
}

fn ensure_database(db_path: &Path, migrations: &[(&str, &str)]) -> Result<DatabaseMigrationReport> {
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let created = !db_path.exists();

    let db_url = sqlite_url(db_path);
    let options = SqliteConnectOptions::from_str(&db_url)
        .with_context(|| format!("Invalid sqlite url {}", db_url))?
        .create_if_missing(true);
    let mut connection = block_on(async { SqliteConnection::connect_with(&options).await })?;

    // Keep write behavior stable across CLI/UI/MCP call paths.
    block_on(async {
        sqlx::query("PRAGMA journal_mode = WAL;")
            .execute(&mut connection)
            .await
    })?;
    block_on(async {
        sqlx::query("PRAGMA foreign_keys = ON;")
            .execute(&mut connection)
            .await
    })?;

    let mut applied = 0usize;
    for (version, ddl) in migrations {
        let has_row = block_on(async {
            sqlx::query("SELECT version FROM schema_migrations WHERE version = ?")
                .bind(*version)
                .fetch_optional(&mut connection)
                .await
        })
        .ok()
        .flatten()
        .is_some();
        if has_row {
            continue;
        }

        block_on(async { sqlx::query(ddl).execute(&mut connection).await }).with_context(|| {
            format!(
                "Failed applying schema migration {} for {}",
                version,
                db_path.display()
            )
        })?;
        block_on(async {
            sqlx::query("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)")
                .bind(*version)
                .bind(Utc::now().to_rfc3339())
                .execute(&mut connection)
                .await
        })
        .with_context(|| {
            format!(
                "Failed recording schema migration {} for {}",
                version,
                db_path.display()
            )
        })?;
        applied += 1;
    }

    Ok(DatabaseMigrationReport {
        db_path: db_path.to_path_buf(),
        created,
        applied_migrations: applied,
    })
}

fn sqlite_url(path: &Path) -> String {
    let mut raw = path.to_string_lossy().replace('\\', "/");
    if !raw.starts_with('/') {
        raw = format!("/{}", raw);
    }
    format!("sqlite://{}", raw)
}

fn block_on<F, T>(future: F) -> Result<T>
where
    F: std::future::Future<Output = std::result::Result<T, sqlx::Error>>,
{
    let runtime = tokio::runtime::Builder::new_current_thread()
        .enable_time()
        .build()
        .map_err(|err| anyhow!("Failed to create SQLite runtime: {}", err))?;
    runtime
        .block_on(future)
        .map_err(|err| anyhow!("SQLite operation failed: {}", err))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn ensure_project_database_is_idempotent() -> Result<()> {
        let tmp = tempdir()?;
        let report_a = ensure_project_database(tmp.path())?;
        let report_b = ensure_project_database(tmp.path())?;
        assert!(report_a.created);
        assert!(report_a.applied_migrations >= 1);
        assert!(!report_b.created);
        assert_eq!(report_b.applied_migrations, 0);
        Ok(())
    }
}
