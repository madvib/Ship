mod helpers;
use helpers::TestProject;
use runtime::config::{McpServerConfig, McpServerType, ProjectConfig, save_config};
use std::collections::HashMap;

fn make_stdio_server(id: &str) -> McpServerConfig {
    McpServerConfig {
        id: id.to_string(),
        name: id.to_string(),
        command: "npx".to_string(),
        args: vec!["-y".to_string(), format!("@mcp/{}", id)],
        env: HashMap::new(),
        scope: "project".to_string(),
        server_type: McpServerType::Stdio,
        url: None,
        disabled: false,
        timeout_secs: None,
    }
}

/// export_to("claude") writes .mcp.json at project root.
#[test]
fn claude_export_writes_mcp_json_at_project_root() {
    let p = TestProject::new().unwrap();
    let mut config = ProjectConfig::default();
    config.mcp_servers = vec![make_stdio_server("github")];
    save_config(&config, Some(p.ship_dir.clone())).unwrap();

    runtime::agent_export::export_to(p.ship_dir.clone(), "claude").unwrap();

    let mcp_json = p.root().join(".mcp.json");
    assert!(mcp_json.exists(), ".mcp.json should exist at project root");

    let content = std::fs::read_to_string(&mcp_json).unwrap();
    let val: serde_json::Value = serde_json::from_str(&content).unwrap();
    assert!(val["mcpServers"]["github"].is_object());
    assert!(val["mcpServers"]["ship"].is_object(), "ship server always injected");
}

/// Disabled servers are not exported.
#[test]
fn disabled_server_not_exported() {
    let p = TestProject::new().unwrap();
    let mut server = make_stdio_server("disabled-one");
    server.disabled = true;
    let mut config = ProjectConfig::default();
    config.mcp_servers = vec![server];
    save_config(&config, Some(p.ship_dir.clone())).unwrap();

    runtime::agent_export::export_to(p.ship_dir.clone(), "claude").unwrap();

    let content = std::fs::read_to_string(p.root().join(".mcp.json")).unwrap();
    let val: serde_json::Value = serde_json::from_str(&content).unwrap();
    assert!(
        val["mcpServers"]["disabled-one"].is_null(),
        "disabled server should not appear in .mcp.json"
    );
}

/// Second export preserves user-added servers (no _ship marker).
#[test]
fn export_preserves_user_servers() {
    let p = TestProject::new().unwrap();
    let mut config = ProjectConfig::default();
    config.mcp_servers = vec![make_stdio_server("mine")];
    save_config(&config, Some(p.ship_dir.clone())).unwrap();

    runtime::agent_export::export_to(p.ship_dir.clone(), "claude").unwrap();

    // Manually inject a user server
    let mcp_json = p.root().join(".mcp.json");
    let mut val: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&mcp_json).unwrap()).unwrap();
    val["mcpServers"]["user-server"] =
        serde_json::json!({ "command": "user-tool", "args": [] });
    std::fs::write(&mcp_json, serde_json::to_string_pretty(&val).unwrap()).unwrap();

    // Re-export — user server must survive
    runtime::agent_export::export_to(p.ship_dir.clone(), "claude").unwrap();

    let content = std::fs::read_to_string(&mcp_json).unwrap();
    let val2: serde_json::Value = serde_json::from_str(&content).unwrap();
    assert!(
        val2["mcpServers"]["user-server"].is_object(),
        "user server was clobbered by re-export"
    );
}

/// Gemini export uses httpUrl field (not url) for HTTP servers.
#[test]
fn gemini_http_server_uses_httpurl() {
    let p = TestProject::new().unwrap();
    let mut config = ProjectConfig::default();
    config.mcp_servers = vec![McpServerConfig {
        id: "figma".to_string(),
        name: "figma".to_string(),
        command: String::new(),
        args: vec![],
        env: HashMap::new(),
        scope: "project".to_string(),
        server_type: McpServerType::Http,
        url: Some("https://mcp.figma.com/mcp".to_string()),
        disabled: false,
        timeout_secs: None,
    }];
    save_config(&config, Some(p.ship_dir.clone())).unwrap();

    runtime::agent_export::export_to(p.ship_dir.clone(), "gemini").unwrap();

    let settings = p.root().join(".gemini/settings.json");
    assert!(settings.exists());
    let val: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&settings).unwrap()).unwrap();
    assert!(val["mcpServers"]["figma"]["httpUrl"].is_string());
    assert!(val["mcpServers"]["figma"]["url"].is_null());
}
