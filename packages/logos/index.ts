/** Logo data */
export interface LogoEntry {
  name: string
  category: string
  fileName: string
}

const ai: LogoEntry[] = [
  { name: 'claude', category: 'ai', fileName: 'claude.webp' },
  { name: 'deepseek', category: 'ai', fileName: 'deepseek.webp' },
  { name: 'doubao', category: 'ai', fileName: 'doubao.webp' },
  { name: 'gemini', category: 'ai', fileName: 'gemini.webp' },
  { name: 'gemma', category: 'ai', fileName: 'gemma.webp' },
  { name: 'glm', category: 'client', fileName: 'zcode.webp' },
  { name: 'gpt', category: 'ai', fileName: 'gpt.webp' },
  { name: 'grok', category: 'ai', fileName: 'grok.webp' },
  { name: 'hunyuan', category: 'ai', fileName: 'hunyuan.webp' },
  { name: 'llama', category: 'ai', fileName: 'llama.webp' },
  { name: 'minimax', category: 'ai', fileName: 'minimax.webp' },
  { name: 'nemotron', category: 'ai', fileName: 'nemotron.webp' },
  { name: 'paddle', category: 'ai', fileName: 'paddle.webp' },
  { name: 'qwen', category: 'ai', fileName: 'qwen.webp' },
  { name: 'sensenova', category: 'ai', fileName: 'sensenova.webp' },
]

const client: LogoEntry[] = [
  { name: 'agnes', category: 'client', fileName: 'agnes.webp' },
  { name: 'clawx', category: 'client', fileName: 'clawx.webp' },
  { name: 'cline', category: 'client', fileName: 'cline.webp' },
  { name: 'cursor', category: 'client', fileName: 'cursor.webp' },
  { name: 'joycode', category: 'client', fileName: 'joycode.webp' },
  { name: 'mimo', category: 'client', fileName: 'mimo.webp' },
  { name: 'openclaw', category: 'client', fileName: 'openclaw.webp' },
  { name: 'opencode', category: 'client', fileName: 'opencode.webp' },
  { name: 'trae', category: 'client', fileName: 'trae.webp' },
  { name: 'zcode', category: 'client', fileName: 'zcode.webp' },
]

const cloud: LogoEntry[] = [
  { name: 'ansible', category: 'cloud', fileName: 'ansible.webp' },
  { name: 'docker', category: 'cloud', fileName: 'docker.webp' },
  { name: 'kubernetes', category: 'cloud', fileName: 'kubernetes.webp' },
  { name: 'nginx', category: 'cloud', fileName: 'nginx.webp' },
  { name: 'terraform', category: 'cloud', fileName: 'terraform.webp' },
]

const database: LogoEntry[] = [
  { name: 'access', category: 'database', fileName: 'access.webp' },
  { name: 'apache_kylin', category: 'database', fileName: 'apache_kylin.webp' },
  { name: 'bigquery', category: 'database', fileName: 'bigquery.webp' },
  { name: 'cassandra', category: 'database', fileName: 'cassandra.webp' },
  { name: 'chromadb', category: 'database', fileName: 'chromadb.webp' },
  { name: 'clickhouse', category: 'database', fileName: 'clickhouse.webp' },
  { name: 'cockroachdb', category: 'database', fileName: 'cockroachdb.webp' },
  { name: 'databend', category: 'database', fileName: 'databend.webp' },
  { name: 'databricks', category: 'database', fileName: 'databricks.webp' },
  { name: 'db2', category: 'database', fileName: 'db2.webp' },
  { name: 'dm', category: 'database', fileName: 'dm.webp' },
  { name: 'doris', category: 'database', fileName: 'doris.webp' },
  { name: 'dremio', category: 'database', fileName: 'dremio.webp' },
  { name: 'duckdb', category: 'database', fileName: 'duckdb.webp' },
  { name: 'elasticsearch', category: 'database', fileName: 'elasticsearch.webp' },
  { name: 'etcd', category: 'database', fileName: 'etcd.webp' },
  { name: 'exasol', category: 'database', fileName: 'exasol.webp' },
  { name: 'firebird', category: 'database', fileName: 'firebird.webp' },
  { name: 'gaussdb', category: 'database', fileName: 'gaussdb.webp' },
  { name: 'gbase', category: 'database', fileName: 'gbase.webp' },
  { name: 'goldendb', category: 'database', fileName: 'goldendb.webp' },
  { name: 'greatsql', category: 'database', fileName: 'greatsql.webp' },
  { name: 'h2', category: 'database', fileName: 'h2.webp' },
  { name: 'highgo', category: 'database', fileName: 'highgo.webp' },
  { name: 'hive', category: 'database', fileName: 'hive.webp' },
  { name: 'influxdb', category: 'database', fileName: 'influxdb.webp' },
  { name: 'informix', category: 'database', fileName: 'informix.webp' },
  { name: 'iotdb', category: 'database', fileName: 'iotdb.webp' },
  { name: 'iris', category: 'database', fileName: 'iris.webp' },
  { name: 'kafka', category: 'database', fileName: 'kafka.webp' },
  { name: 'kingbase', category: 'database', fileName: 'kingbase.webp' },
  { name: 'kwdb', category: 'database', fileName: 'kwdb.webp' },
  { name: 'manticoresearch', category: 'database', fileName: 'manticoresearch.webp' },
  { name: 'mariadb', category: 'database', fileName: 'mariadb.webp' },
  { name: 'milvus', category: 'database', fileName: 'milvus.webp' },
  { name: 'mongodb', category: 'database', fileName: 'mongodb.webp' },
  { name: 'mysql', category: 'database', fileName: 'mysql.webp' },
  { name: 'nacos', category: 'database', fileName: 'nacos.webp' },
  { name: 'neo4j', category: 'database', fileName: 'neo4j.webp' },
  { name: 'oceanbase', category: 'database', fileName: 'oceanbase.webp' },
  { name: 'opengauss', category: 'database', fileName: 'opengauss.webp' },
  { name: 'oracle', category: 'database', fileName: 'oracle.webp' },
  { name: 'polardb', category: 'database', fileName: 'polardb.webp' },
  { name: 'postgres', category: 'database', fileName: 'postgres.webp' },
  { name: 'postgresql', category: 'database', fileName: 'postgresql.webp' },
  { name: 'presto', category: 'database', fileName: 'presto.webp' },
  { name: 'pulsar', category: 'database', fileName: 'pulsar.webp' },
  { name: 'qdrant', category: 'database', fileName: 'qdrant.webp' },
  { name: 'questdb', category: 'database', fileName: 'questdb.webp' },
  { name: 'redis', category: 'database', fileName: 'redis.webp' },
  { name: 'redshift', category: 'database', fileName: 'redshift.webp' },
  { name: 'rqlite', category: 'database', fileName: 'rqlite.webp' },
  { name: 'saphana', category: 'database', fileName: 'saphana.webp' },
  { name: 'selectdb', category: 'database', fileName: 'selectdb.webp' },
  { name: 'snowflake', category: 'database', fileName: 'snowflake.webp' },
  { name: 'sqlite', category: 'database', fileName: 'sqlite.webp' },
  { name: 'sqlserver', category: 'database', fileName: 'sqlserver.webp' },
  { name: 'starrocks', category: 'database', fileName: 'starrocks.webp' },
  { name: 'sundb', category: 'database', fileName: 'sundb.webp' },
  { name: 'tdengine', category: 'database', fileName: 'tdengine.webp' },
  { name: 'tdsql', category: 'database', fileName: 'tdsql.webp' },
  { name: 'teradata', category: 'database', fileName: 'teradata.webp' },
  { name: 'tidb', category: 'database', fileName: 'tidb.webp' },
  { name: 'trino', category: 'database', fileName: 'trino.webp' },
  { name: 'turso', category: 'database', fileName: 'turso.webp' },
  { name: 'vastbase', category: 'database', fileName: 'vastbase.webp' },
  { name: 'vertica', category: 'database', fileName: 'vertica.webp' },
  { name: 'weaviate', category: 'database', fileName: 'weaviate.webp' },
  { name: 'xugu', category: 'database', fileName: 'xugu.webp' },
  { name: 'yashandb', category: 'database', fileName: 'yashandb.webp' },
  { name: 'zookeeper', category: 'database', fileName: 'zookeeper.webp' },
]

const framework: LogoEntry[] = [
  { name: 'flutter', category: 'framework', fileName: 'flutter.webp' },
  { name: 'netty', category: 'framework', fileName: 'netty.webp' },
  { name: 'nodedotjs', category: 'framework', fileName: 'nodedotjs.webp' },
  { name: 'rabbitmq', category: 'framework', fileName: 'rabbitmq.webp' },
  { name: 'react', category: 'framework', fileName: 'react.webp' },
  { name: 'spring', category: 'framework', fileName: 'spring.webp' },
  { name: 'springboot', category: 'framework', fileName: 'springboot.webp' },
]

const language: LogoEntry[] = [
  { name: 'go', category: 'language', fileName: 'go.webp' },
  { name: 'java', category: 'language', fileName: 'java.webp' },
  { name: 'javascript', category: 'language', fileName: 'javascript.webp' },
  { name: 'kotlin', category: 'language', fileName: 'kotlin.webp' },
  { name: 'perl', category: 'language', fileName: 'perl.webp' },
  { name: 'php', category: 'language', fileName: 'php.webp' },
  { name: 'python', category: 'language', fileName: 'python.webp' },
  { name: 'ruby', category: 'language', fileName: 'ruby.webp' },
  { name: 'rust', category: 'language', fileName: 'rust.webp' },
  { name: 'typescript', category: 'language', fileName: 'typescript.webp' },
]

const os: LogoEntry[] = [
  { name: 'centos', category: 'os', fileName: 'centos.webp' },
  { name: 'debian', category: 'os', fileName: 'debian.webp' },
  { name: 'fedora', category: 'os', fileName: 'fedora.webp' },
  { name: 'ios', category: 'os', fileName: 'ios.webp' },
  { name: 'linux', category: 'os', fileName: 'linux.webp' },
  { name: 'macos', category: 'os', fileName: 'macos.webp' },
  { name: 'opensuse', category: 'os', fileName: 'opensuse.webp' },
  { name: 'redhat', category: 'os', fileName: 'redhat.webp' },
  { name: 'ubuntu', category: 'os', fileName: 'ubuntu.webp' },
  { name: 'windows', category: 'os', fileName: 'windows.webp' },
  { name: 'android', category: 'os', fileName: 'android.webp' },
]

const tool: LogoEntry[] = [
  { name: 'dropbox', category: 'tool', fileName: 'dropbox.webp' },
  { name: 'eclipseide', category: 'tool', fileName: 'eclipseide.webp' },
  { name: 'elk', category: 'tool', fileName: 'elk.webp' },
  { name: 'excel', category: 'tool', fileName: 'excel.webp' },
  { name: 'git', category: 'tool', fileName: 'git.webp' },
  { name: 'github', category: 'tool', fileName: 'github.webp' },
  { name: 'gitlab', category: 'tool', fileName: 'gitlab.webp' },
  { name: 'gradle', category: 'tool', fileName: 'gradle.webp' },
  { name: 'grafana', category: 'tool', fileName: 'grafana.webp' },
  { name: 'intellijidea', category: 'tool', fileName: 'intellijidea.webp' },
  { name: 'jenkins', category: 'tool', fileName: 'jenkins.webp' },
  { name: 'maven', category: 'tool', fileName: 'maven.webp' },
  { name: 'postman', category: 'tool', fileName: 'postman.webp' },
  { name: 'tomcat', category: 'tool', fileName: 'tomcat.webp' },
  { name: 'vscode', category: 'tool', fileName: 'vscode.webp' },
  { name: 'cad', category: 'tool', fileName: 'cad.webp' },
  { name: 'css', category: 'tool', fileName: 'css.webp' },
  { name: 'less', category: 'tool', fileName: 'less.webp' },
  { name: 'markdown', category: 'tool', fileName: 'markdown.webp' },
  { name: 'scss', category: 'tool', fileName: 'scss.webp' },
  { name: 'skywalking', category: 'tool', fileName: 'skywalking.webp' },
]

const other: LogoEntry[] = [
  { name: 'apple', category: 'other', fileName: 'apple.webp' },
  { name: 'google', category: 'other', fileName: 'google.webp' },
  { name: 'microsoft', category: 'other', fileName: 'microsoft.webp' },
  { name: 'xiaomi', category: 'other', fileName: 'xiaomi.webp' },
  { name: 'xinghuo', category: 'other', fileName: 'xinghuo.webp' },
]

export const logoCategories = {
  ai,
  client,
  cloud,
  database,
  framework,
  language,
  os,
  tool,
  other,
} as const

export type LogoCategory = keyof typeof logoCategories

/**
 * Lookup a single logo entry by name.
 */
export function getLogo(name: string): LogoEntry | undefined {
  for (const entries of Object.values(logoCategories)) {
    const found = entries.find((e) => e.name === name)
    if (found) return found
  }
  return undefined
}

/**
 * Build a URL path for a logo (relative to public dir or CDN root).
 * e.g. `logoUrl('claude')` → `/ai/claude.webp`
 */
export function logoUrl(name: string, base = ''): string | undefined {
  const entry = getLogo(name)
  if (!entry) return undefined
  return `${base}/${entry.category}/${entry.fileName}`
}
