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

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UsageRecord {
    pub id: String,
    pub timestamp: String,
    pub model: String,
    pub provider_id: String,
    pub provider_name: String,
    pub prompt_tokens: i64,
    pub completion_tokens: i64,
    pub total_tokens: i64,
    pub cost: f64,
    pub source: String,
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
            );

<<<<<<< Updated upstream
            CREATE TABLE IF NOT EXISTS usage_stats (
                id TEXT PRIMARY KEY,
                client_id TEXT,
                provider TEXT NOT NULL,
                model TEXT NOT NULL,
=======
            CREATE TABLE IF NOT EXISTS usage_records (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                model TEXT NOT NULL,
                provider_id TEXT NOT NULL,
                provider_name TEXT NOT NULL,
>>>>>>> Stashed changes
                prompt_tokens INTEGER DEFAULT 0,
                completion_tokens INTEGER DEFAULT 0,
                total_tokens INTEGER DEFAULT 0,
                cost REAL DEFAULT 0.0,
<<<<<<< Updated upstream
                duration_ms INTEGER DEFAULT 0,
                timestamp TEXT NOT NULL,
                metadata TEXT DEFAULT '{}'
            );

            CREATE TABLE IF NOT EXISTS sync_configs (
                id TEXT PRIMARY KEY,
                source TEXT NOT NULL,
                enabled INTEGER DEFAULT 0,
                api_endpoint TEXT,
                api_key TEXT,
                sync_interval INTEGER DEFAULT 300,
                last_sync_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
=======
                source TEXT DEFAULT 'direct'
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
    // Usage Stats operations
    pub fn save_usage_stat(&self, stat: &UsageStat) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO usage_stats (id, client_id, provider, model, prompt_tokens, completion_tokens, total_tokens, cost, duration_ms, timestamp, metadata)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                stat.id, stat.client_id, stat.provider, stat.model,
                stat.prompt_tokens, stat.completion_tokens, stat.total_tokens,
                stat.cost, stat.duration_ms, stat.timestamp, stat.metadata
            ],
        )?;
        Ok(())
    }

    pub fn list_usage_stats(&self, limit: i64, offset: i64) -> Result<Vec<UsageStat>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, client_id, provider, model, prompt_tokens, completion_tokens, total_tokens, cost, duration_ms, timestamp, metadata
             FROM usage_stats ORDER BY timestamp DESC LIMIT ?1 OFFSET ?2"
        )?;
        let rows = stmt.query_map(params![limit, offset], map_usage_stat)?;
        let mut stats = Vec::new();
        for row in rows { stats.push(row?); }
        Ok(stats)
    }

    pub fn get_usage_stats_summary(&self) -> Result<UsageSummary> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT COALESCE(SUM(prompt_tokens),0), COALESCE(SUM(completion_tokens),0), COALESCE(SUM(total_tokens),0), COALESCE(SUM(cost),0), COUNT(*)
             FROM usage_stats"
        )?;
        let row = stmt.query_row([], |row| {
            Ok(UsageSummary {
                total_prompt_tokens: row.get(0)?,
                total_completion_tokens: row.get(1)?,
                total_tokens: row.get(2)?,
                total_cost: row.get(3)?,
                total_requests: row.get(4)?,
            })
        })?;
        Ok(row)
    }

    pub fn delete_usage_stat(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM usage_stats WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Sync Config operations
    pub fn get_sync_config(&self, id: &str) -> Result<Option<SyncConfig>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, source, enabled, api_endpoint, api_key, sync_interval, last_sync_at, created_at, updated_at
             FROM sync_configs WHERE id = ?1"
        )?;
        let mut rows = stmt.query_map(params![id], |row| {
            Ok(SyncConfig {
                id: row.get(0)?,
                source: row.get(1)?,
                enabled: row.get::<_, i32>(2)? == 1,
                api_endpoint: row.get(3)?,
                api_key: row.get(4)?,
                sync_interval: row.get(5)?,
                last_sync_at: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    pub fn list_sync_configs(&self) -> Result<Vec<SyncConfig>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, source, enabled, api_endpoint, api_key, sync_interval, last_sync_at, created_at, updated_at
             FROM sync_configs ORDER BY source"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(SyncConfig {
                id: row.get(0)?,
                source: row.get(1)?,
                enabled: row.get::<_, i32>(2)? == 1,
                api_endpoint: row.get(3)?,
                api_key: row.get(4)?,
                sync_interval: row.get(5)?,
                last_sync_at: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        let mut configs = Vec::new();
        for row in rows { configs.push(row?); }
        Ok(configs)
    }

    pub fn save_sync_config(&self, config: &SyncConfig) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO sync_configs (id, source, enabled, api_endpoint, api_key, sync_interval, last_sync_at, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                config.id, config.source, config.enabled as i32,
                config.api_endpoint, config.api_key, config.sync_interval,
                config.last_sync_at, config.created_at, config.updated_at
=======
    // Usage Record operations
    pub fn list_usage_records(&self, start_date: &str, end_date: &str) -> Result<Vec<UsageRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, timestamp, model, provider_id, provider_name, prompt_tokens, completion_tokens, total_tokens, cost, source
             FROM usage_records WHERE timestamp >= ?1 AND timestamp <= ?2 ORDER BY timestamp DESC"
        )?;

        let rows = stmt.query_map(params![start_date, end_date], |row| {
            Ok(UsageRecord {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                model: row.get(2)?,
                provider_id: row.get(3)?,
                provider_name: row.get(4)?,
                prompt_tokens: row.get(5)?,
                completion_tokens: row.get(6)?,
                total_tokens: row.get(7)?,
                cost: row.get(8)?,
                source: row.get(9)?,
            })
        })?;

        let mut records = Vec::new();
        for row in rows {
            records.push(row?);
        }
        Ok(records)
    }

    pub fn insert_usage_record(&self, record: &UsageRecord) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO usage_records (id, timestamp, model, provider_id, provider_name, prompt_tokens, completion_tokens, total_tokens, cost, source)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                record.id,
                record.timestamp,
                record.model,
                record.provider_id,
                record.provider_name,
                record.prompt_tokens,
                record.completion_tokens,
                record.total_tokens,
                record.cost,
                record.source,
>>>>>>> Stashed changes
            ],
        )?;
        Ok(())
    }
<<<<<<< Updated upstream
}

fn map_usage_stat(row: &rusqlite::Row) -> rusqlite::Result<UsageStat> {
    Ok(UsageStat {
        id: row.get(0)?,
        client_id: row.get(1)?,
        provider: row.get(2)?,
        model: row.get(3)?,
        prompt_tokens: row.get(4)?,
        completion_tokens: row.get(5)?,
        total_tokens: row.get(6)?,
        cost: row.get(7)?,
        duration_ms: row.get(8)?,
        timestamp: row.get(9)?,
        metadata: row.get(10)?,
    })
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UsageStat {
    pub id: String,
    pub client_id: Option<String>,
    pub provider: String,
    pub model: String,
    pub prompt_tokens: i64,
    pub completion_tokens: i64,
    pub total_tokens: i64,
    pub cost: f64,
    pub duration_ms: i64,
    pub timestamp: String,
    pub metadata: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UsageSummary {
    pub total_prompt_tokens: i64,
    pub total_completion_tokens: i64,
    pub total_tokens: i64,
    pub total_cost: f64,
    pub total_requests: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SyncConfig {
    pub id: String,
    pub source: String,
    pub enabled: bool,
    pub api_endpoint: Option<String>,
    pub api_key: Option<String>,
    pub sync_interval: i64,
    pub last_sync_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
=======

    pub fn clear_usage_records(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM usage_records", [])?;
        Ok(())
    }
>>>>>>> Stashed changes
}
