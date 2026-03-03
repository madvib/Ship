use super::types::{
    Feature, FeatureCriterion, FeatureEntry, FeatureMetadata, FeatureStatus, FeatureTodo,
};
use anyhow::Result;
use chrono::Utc;
use sqlx::{Connection, Row};
use std::path::Path;
use std::str::FromStr;

pub fn upsert_feature_db(ship_dir: &Path, feature: &Feature, status: &FeatureStatus) -> Result<()> {
    let mut conn = runtime::state_db::open_project_connection(ship_dir)?;
    let now = Utc::now().to_rfc3339();

    runtime::state_db::block_on(async {
        let mut tx = conn.begin().await?;

        // Upsert feature
        sqlx::query(
            "INSERT INTO feature
               (id, title, description, status, release_id, spec_id, branch, agent_json, tags_json, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               title       = excluded.title,
               description = excluded.description,
               status      = excluded.status,
               release_id  = excluded.release_id,
               spec_id     = excluded.spec_id,
               branch      = excluded.branch,
               agent_json  = excluded.agent_json,
               tags_json   = excluded.tags_json,
               updated_at  = excluded.updated_at",
        )
        .bind(&feature.metadata.id)
        .bind(&feature.metadata.title)
        .bind(&feature.metadata.description)
        .bind(status.to_string())
        .bind(&feature.metadata.release_id)
        .bind(&feature.metadata.spec_id)
        .bind(&feature.metadata.branch)
        .bind(serde_json::to_string(&feature.metadata.agent).unwrap_or_default())
        .bind(serde_json::to_string(&feature.metadata.tags).unwrap_or_else(|_| "[]".to_string()))
        .bind(&feature.metadata.created)
        .bind(&now)
        .execute(&mut *tx)
        .await?;

        // Delete existing todos/criteria to replace
        sqlx::query("DELETE FROM feature_todo WHERE feature_id = ?")
            .bind(&feature.metadata.id)
            .execute(&mut *tx)
            .await?;
        sqlx::query("DELETE FROM feature_criterion WHERE feature_id = ?")
            .bind(&feature.metadata.id)
            .execute(&mut *tx)
            .await?;

        // Insert todos
        for (i, todo) in feature.todos.iter().enumerate() {
            sqlx::query(
                "INSERT INTO feature_todo (id, feature_id, text, completed, ord) VALUES (?, ?, ?, ?, ?)",
            )
            .bind(&todo.id)
            .bind(&feature.metadata.id)
            .bind(&todo.text)
            .bind(if todo.completed { 1 } else { 0 })
            .bind(i as i64)
            .execute(&mut *tx)
            .await?;
        }

        // Insert criteria
        for (i, criterion) in feature.criteria.iter().enumerate() {
            sqlx::query(
                "INSERT INTO feature_criterion (id, feature_id, text, met, ord) VALUES (?, ?, ?, ?, ?)",
            )
            .bind(&criterion.id)
            .bind(&feature.metadata.id)
            .bind(&criterion.text)
            .bind(if criterion.met { 1 } else { 0 })
            .bind(i as i64)
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;
        Ok(())
    })?;
    Ok(())
}

pub fn get_feature_db(ship_dir: &Path, id: &str) -> Result<Option<FeatureEntry>> {
    let mut conn = runtime::state_db::open_project_connection(ship_dir)?;
    runtime::state_db::block_on(async {
        let row_opt = sqlx::query(
            "SELECT id, title, description, status, release_id, spec_id, branch, agent_json, tags_json, created_at, updated_at
             FROM feature WHERE id = ?",
        )
        .bind(id)
        .fetch_optional(&mut conn)
        .await?;

        if let Some(r) = row_opt {
            let id: String = r.get(0);
            let title: String = r.get(1);
            let description: Option<String> = r.get(2);
            let status_str: String = r.get(3);
            let release_id: Option<String> = r.get(4);
            let spec_id: Option<String> = r.get(5);
            let branch: Option<String> = r.get(6);
            let agent_json: Option<String> = r.get(7);
            let tags_json: String = r.get(8);
            let created: String = r.get(9);
            let updated: String = r.get(10);

            let status = FeatureStatus::from_str(&status_str).unwrap_or_default();
            let agent = agent_json.and_then(|j| serde_json::from_str(&j).ok());
            let tags = serde_json::from_str(&tags_json).unwrap_or_default();

            // Fetch todos
            let todos_rows = sqlx::query(
                "SELECT id, text, completed FROM feature_todo WHERE feature_id = ? ORDER BY ord ASC",
            )
            .bind(&id)
            .fetch_all(&mut conn)
            .await?;

            let todos = todos_rows
                .into_iter()
                .map(|tr| FeatureTodo {
                    id: tr.get(0),
                    text: tr.get(1),
                    completed: tr.get::<i64, _>(2) != 0,
                })
                .collect();

            // Fetch criteria
            let criteria_rows = sqlx::query(
                "SELECT id, text, met FROM feature_criterion WHERE feature_id = ? ORDER BY ord ASC",
            )
            .bind(&id)
            .fetch_all(&mut conn)
            .await?;

            let criteria = criteria_rows
                .into_iter()
                .map(|cr| FeatureCriterion {
                    id: cr.get(0),
                    text: cr.get(1),
                    met: cr.get::<i64, _>(2) != 0,
                })
                .collect();

            let file_name = runtime::project::sanitize_file_name(&title) + ".md";

            Ok(Some(FeatureEntry {
                id: id.clone(),
                file_name,
                path: String::new(),
                status,
                feature: Feature {
                    metadata: FeatureMetadata {
                        id,
                        title,
                        description,
                        created,
                        updated,
                        release_id,
                        spec_id,
                        branch,
                        agent,
                        tags,
                    },
                    body: String::new(), // Body handled by file system or separate field
                    todos,
                    criteria,
                },
            }))
        } else {
            Ok(None)
        }
    })
}

pub fn list_features_db(ship_dir: &Path) -> Result<Vec<FeatureEntry>> {
    let mut conn = runtime::state_db::open_project_connection(ship_dir)?;
    runtime::state_db::block_on(async {
        let rows = sqlx::query(
            "SELECT id, title, description, status, release_id, spec_id, branch, agent_json, tags_json, created_at, updated_at
             FROM feature ORDER BY updated_at DESC",
        )
        .fetch_all(&mut conn)
        .await?;

        let mut entries = Vec::new();
        for r in rows {
            let id: String = r.get(0);
            let title: String = r.get(1);
            let description: Option<String> = r.get(2);
            let status_str: String = r.get(3);
            let release_id: Option<String> = r.get(4);
            let spec_id: Option<String> = r.get(5);
            let branch: Option<String> = r.get(6);
            let agent_json: Option<String> = r.get(7);
            let tags_json: String = r.get(8);
            let created: String = r.get(9);
            let updated: String = r.get(10);

            let status = FeatureStatus::from_str(&status_str).unwrap_or_default();
            let agent = agent_json.and_then(|j| serde_json::from_str(&j).ok());
            let tags = serde_json::from_str(&tags_json).unwrap_or_default();
            let file_name = runtime::project::sanitize_file_name(&title) + ".md";

            entries.push(FeatureEntry {
                id: id.clone(),
                file_name,
                path: String::new(),
                status,
                feature: Feature {
                    metadata: FeatureMetadata {
                        id,
                        title,
                        description,
                        created,
                        updated,
                        release_id,
                        spec_id,
                        branch,
                        agent,
                        tags,
                    },
                    body: String::new(),
                    todos: Vec::new(), // Optional: lazy load or join? Joining is better.
                    criteria: Vec::new(), // For list, maybe we don't need the full checklists.
                },
            });
        }
        Ok(entries)
    })
}

pub fn delete_feature_db(ship_dir: &Path, id: &str) -> Result<()> {
    let mut conn = runtime::state_db::open_project_connection(ship_dir)?;
    runtime::state_db::block_on(async {
        sqlx::query("DELETE FROM feature WHERE id = ?")
            .bind(id)
            .execute(&mut conn)
            .await?;
        Ok(())
    })?;
    Ok(())
}
