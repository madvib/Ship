#[cfg(test)]
mod tests {
    use super::*;
    use runtime::project::init_project;
    use tempfile::tempdir;

    #[test]
    fn test_create_release_api() -> anyhow::Result<()> {
        let tmp = tempdir()?;
        let project_dir = init_project(tmp.path().to_path_buf())?;
        let entry = create_release(&project_dir, "v0.1.0-alpha", "", None)?;
        assert_eq!(entry.release.metadata.version, "v0.1.0-alpha");
        assert_eq!(entry.status, ReleaseStatus::Planned);

        let path = std::path::PathBuf::from(&entry.path);
        assert!(path.exists());
        let content = std::fs::read_to_string(&path)?;
        assert!(content.contains("version = \"v0.1.0-alpha\""));
        Ok(())
    }

    #[test]
    fn test_create_release_empty_version_rejected() -> anyhow::Result<()> {
        let tmp = tempdir()?;
        let project_dir = init_project(tmp.path().to_path_buf())?;
        let result = create_release(&project_dir, "", "", None);
        assert!(result.is_err());
        Ok(())
    }

    #[test]
    fn test_get_and_update_release() -> anyhow::Result<()> {
        let tmp = tempdir()?;
        let project_dir = init_project(tmp.path().to_path_buf())?;
        let entry = create_release(&project_dir, "v0.2.0-alpha", "initial", None)?;
        let initial = get_release_by_id(&project_dir, &entry.id)?;
        assert_eq!(initial.release.metadata.version, "v0.2.0-alpha");

        let updated = update_release_content(&project_dir, &entry.id, "updated")?;
        assert_eq!(updated.release.body, "updated");
        assert!(updated.release.metadata.updated >= initial.release.metadata.updated);
        Ok(())
    }

    #[test]
    fn test_list_releases() -> anyhow::Result<()> {
        let tmp = tempdir()?;
        let project_dir = init_project(tmp.path().to_path_buf())?;
        create_release(&project_dir, "v0.1.0-alpha", "", None)?;
        create_release(&project_dir, "v0.2.0-alpha", "", None)?;
        let releases = list_releases(&project_dir)?;
        assert_eq!(releases.len(), 2);
        let versions: Vec<&str> = releases
            .iter()
            .map(|r| r.release.metadata.version.as_str())
            .collect();
        assert!(versions.contains(&"v0.1.0-alpha"));
        assert!(versions.contains(&"v0.2.0-alpha"));
        Ok(())
    }

    #[test]
    fn test_release_collision_gets_suffix() -> anyhow::Result<()> {
        let tmp = tempdir()?;
        let project_dir = init_project(tmp.path().to_path_buf())?;
        let p1 = create_release(&project_dir, "v0.1.0-tmp", "", None)?;
        let p2 = create_release(&project_dir, "v0.1.0-tmp", "", None)?;
        assert_ne!(p1.path, p2.path);
        assert!(std::path::PathBuf::from(&p1.path).exists());
        assert!(std::path::PathBuf::from(&p2.path).exists());
        Ok(())
    }

    #[test]
    fn test_create_feature_api() -> anyhow::Result<()> {
        let tmp = tempdir()?;
        let project_dir = init_project(tmp.path().to_path_buf())?;
        let entry = create_feature(
            &project_dir,
            "Agent Config",
            "",
            Some("v0.1.0-alpha.md"),
            Some("agent-config.md"),
            None,
        )?;
        assert_eq!(entry.feature.metadata.title, "Agent Config");
        assert_eq!(entry.status, FeatureStatus::Planned);
        assert_eq!(
            entry.feature.metadata.release_id.as_deref(),
            Some("v0.1.0-alpha.md")
        );
        assert_eq!(
            entry.feature.metadata.spec_id.as_deref(),
            Some("agent-config.md")
        );
        Ok(())
    }

    #[test]
    fn test_create_feature_empty_title_rejected() -> anyhow::Result<()> {
        let tmp = tempdir()?;
        let project_dir = init_project(tmp.path().to_path_buf())?;
        let result = create_feature(&project_dir, "", "", None, None, None);
        assert!(result.is_err());
        Ok(())
    }

    #[test]
    fn test_get_and_update_feature() -> anyhow::Result<()> {
        let tmp = tempdir()?;
        let project_dir = init_project(tmp.path().to_path_buf())?;
        let entry = create_feature(&project_dir, "UI Agent Panel", "initial", None, None, None)?;
        let initial = get_feature_by_id(&project_dir, &entry.id)?;

        let updated = update_feature_content(&project_dir, &entry.id, "updated")?;
        assert_eq!(updated.feature.body, "updated");
        assert!(updated.feature.metadata.updated >= initial.feature.metadata.updated);
        Ok(())
    }

    #[test]
    fn test_list_features() -> anyhow::Result<()> {
        let tmp = tempdir()?;
        let project_dir = init_project(tmp.path().to_path_buf())?;
        create_feature(&project_dir, "Feature One", "", None, None, None)?;
        create_feature(&project_dir, "Feature Two", "", None, None, None)?;
        let features = list_features(&project_dir)?;
        assert_eq!(features.len(), 2);
        let titles: Vec<&str> = features
            .iter()
            .map(|f| f.feature.metadata.title.as_str())
            .collect();
        assert!(titles.contains(&"Feature One"));
        assert!(titles.contains(&"Feature Two"));
        Ok(())
    }

    #[test]
    fn test_feature_collision_gets_suffix() -> anyhow::Result<()> {
        let tmp = tempdir()?;
        let project_dir = init_project(tmp.path().to_path_buf())?;
        let p1 = create_feature(&project_dir, "Ship Agents", "", None, None, None)?;
        let p2 = create_feature(&project_dir, "Ship Agents!", "", None, None, None)?;
        assert_ne!(p1.path, p2.path);
        assert!(std::path::PathBuf::from(&p1.path).exists());
        assert!(std::path::PathBuf::from(&p2.path).exists());
        Ok(())
    }

    #[test]
    fn test_import_release_supports_upcoming_and_legacy_locations() -> anyhow::Result<()> {
        let tmp = tempdir()?;
        let project_dir = init_project(tmp.path().to_path_buf())?;

        // New layout: upcoming/
        let upcoming_path =
            runtime::project::upcoming_releases_dir(&project_dir).join("v0-3-0-alpha.md");
        std::fs::create_dir_all(upcoming_path.parent().unwrap())?;
        std::fs::write(
            &upcoming_path,
            "+++\nid = \"v0.3.0-alpha\"\nversion = \"v0.3.0-alpha\"\nstatus = \"planned\"\ncreated = \"2026-01-01T00:00:00Z\"\nupdated = \"2026-01-01T00:00:00Z\"\nfeature_ids = []\nadr_ids = []\nbreaking_changes = []\ntags = []\n+++\n\nnew\n",
        )?;

        // Legacy layout: top-level project/releases/
        let legacy_path = runtime::project::releases_dir(&project_dir).join("v0-0-9-alpha.md");
        std::fs::create_dir_all(legacy_path.parent().unwrap())?;
        std::fs::write(
            &legacy_path,
            "+++\nid = \"v0.0.9-alpha\"\nversion = \"v0.0.9-alpha\"\nstatus = \"shipped\"\ncreated = \"2026-01-01T00:00:00Z\"\nupdated = \"2026-01-01T00:00:00Z\"\nfeature_ids = []\nadr_ids = []\nbreaking_changes = []\ntags = []\n+++\n\nlegacy\n",
        )?;

        import_releases_from_files(&project_dir)?;

        let releases = list_releases(&project_dir)?;
        let versions: Vec<&str> = releases
            .iter()
            .map(|r| r.release.metadata.version.as_str())
            .collect();
        assert!(versions.contains(&"v0.3.0-alpha"));
        assert!(versions.contains(&"v0.0.9-alpha"));
        Ok(())
    }
}
