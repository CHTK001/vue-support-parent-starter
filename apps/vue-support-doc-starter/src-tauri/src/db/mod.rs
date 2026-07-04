use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ClientConfig {
    pub id: String,
    pub name: String,
    pub mcp_json: String,
    pub skills_json: String,
    pub api_key: Option<String>,
    pub api_endpoint: Option<String>,
    pub model: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ModelProvider {
    pub id: String,
    pub name: String,
    pub api_base: String,
    pub api_key: Option<String>,
    pub models: Vec<String>,
    pub is_active: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SkillEntry {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub path: String,
    pub enabled: bool,
    pub client_id: Option<String>,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Database {
            conn: Mutex::new(conn),
        };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS client_configs (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                mcp_json TEXT DEFAULT '{}',
                skills_json TEXT DEFAULT '{}',
                api_key TEXT,
                api_endpoint TEXT,
                model TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS model_providers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                api_base TEXT NOT NULL,
                api_key TEXT,
                models TEXT DEFAULT '[]',
                is_active INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS skills (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                category TEXT DEFAULT 'other',
                path TEXT NOT NULL,
                enabled INTEGER DEFAULT 1,
                client_id TEXT
            );

            CREATE TABLE IF NOT EXISTS mcp_servers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                category TEXT DEFAULT 'other',
                command TEXT NOT NULL,
                args TEXT DEFAULT '[]',
                env TEXT DEFAULT '{}',
                enabled INTEGER DEFAULT 1,
                client_id TEXT
            );"
        )?;

        Ok(())
    }

    // Client Config operations
    pub fn get_client_config(&self, id: &str) -> Result<Option<ClientConfig>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, mcp_json, skills_json, api_key, api_endpoint, model, created_at, updated_at
             FROM client_configs WHERE id = ?1"
        )?;

        let mut rows = stmt.query_map(params![id], |row| {
            Ok(ClientConfig {
                id: row.get(0)?,
                name: row.get(1)?,
                mcp_json: row.get(2)?,
                skills_json: row.get(3)?,
                api_key: row.get(4)?,
                api_endpoint: row.get(5)?,
                model: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    pub fn save_client_config(&self, config: &ClientConfig) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO client_configs (id, name, mcp_json, skills_json, api_key, api_endpoint, model, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                config.id,
                config.name,
                config.mcp_json,
                config.skills_json,
                config.api_key,
                config.api_endpoint,
                config.model,
                config.created_at,
                config.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn list_client_configs(&self) -> Result<Vec<ClientConfig>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, mcp_json, skills_json, api_key, api_endpoint, model, created_at, updated_at
             FROM client_configs ORDER BY updated_at DESC"
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(ClientConfig {
                id: row.get(0)?,
                name: row.get(1)?,
                mcp_json: row.get(2)?,
                skills_json: row.get(3)?,
                api_key: row.get(4)?,
                api_endpoint: row.get(5)?,
                model: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        let mut configs = Vec::new();
        for row in rows {
            configs.push(row?);
        }
        Ok(configs)
    }

    pub fn delete_client_config(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM client_configs WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Model Provider operations
    pub fn list_providers(&self) -> Result<Vec<ModelProvider>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, api_base, api_key, models, is_active FROM model_providers ORDER BY name"
        )?;

        let rows = stmt.query_map([], |row| {
            let models_json: String = row.get(4)?;
            let models: Vec<String> = serde_json::from_str(&models_json).unwrap_or_default();
            Ok(ModelProvider {
                id: row.get(0)?,
                name: row.get(1)?,
                api_base: row.get(2)?,
                api_key: row.get(3)?,
                models,
                is_active: row.get::<_, i32>(5)? == 1,
            })
        })?;

        let mut providers = Vec::new();
        for row in rows {
            providers.push(row?);
        }
        Ok(providers)
    }

    pub fn save_provider(&self, provider: &ModelProvider) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let models_json = serde_json::to_string(&provider.models).unwrap_or_default();
        conn.execute(
            "INSERT OR REPLACE INTO model_providers (id, name, api_base, api_key, models, is_active)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                provider.id,
                provider.name,
                provider.api_base,
                provider.api_key,
                models_json,
                provider.is_active as i32,
            ],
        )?;
        Ok(())
    }

    pub fn delete_provider(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM model_providers WHERE id = ?1", params![id])?;
        Ok(())
    }
}
