const { pool } = require('../config/db');

// Helper to format bytes to human readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

exports.getSchema = async (req, res, next) => {
  try {
    // 1. Fetch columns and constraints
    const columnsRes = await pool.query(`
      SELECT 
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        (
          SELECT tc.constraint_type
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name 
            AND tc.table_schema = kcu.table_schema
          WHERE tc.table_schema = 'public' 
            AND tc.table_name = c.table_name 
            AND kcu.column_name = c.column_name
          LIMIT 1
        ) AS constraint_type,
        (
          SELECT kcu_target.table_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name 
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.referential_constraints rc
            ON tc.constraint_name = rc.constraint_name
          JOIN information_schema.key_column_usage kcu_target
            ON rc.unique_constraint_name = kcu_target.constraint_name
          WHERE tc.table_schema = 'public' 
            AND tc.table_name = c.table_name 
            AND kcu.column_name = c.column_name
          LIMIT 1
        ) AS foreign_table_name,
        (
          SELECT kcu_target.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name 
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.referential_constraints rc
            ON tc.constraint_name = rc.constraint_name
          JOIN information_schema.key_column_usage kcu_target
            ON rc.unique_constraint_name = kcu_target.constraint_name
          WHERE tc.table_schema = 'public' 
            AND tc.table_name = c.table_name 
            AND kcu.column_name = c.column_name
          LIMIT 1
        ) AS foreign_column_name
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
      ORDER BY c.table_name, c.ordinal_position;
    `);

    // 2. Fetch table sizes & counts
    const sizesRes = await pool.query(`
      SELECT
        relname AS table_name,
        reltuples::bigint AS row_count,
        pg_total_relation_size(c.oid) AS total_bytes,
        pg_relation_size(c.oid) AS table_bytes,
        pg_indexes_size(c.oid) AS index_bytes
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY table_name;
    `);

    // 3. Fetch custom user-defined ENUMs
    const enumsRes = await pool.query(`
      SELECT 
        t.typname AS enum_name,
        e.enumlabel AS enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY enum_name, e.enumsortorder;
    `);

    // 4. Fetch triggers
    const triggersRes = await pool.query(`
      SELECT 
        trg.trigger_name,
        trg.event_manipulation,
        trg.event_object_table AS table_name,
        trg.action_statement,
        trg.action_timing
      FROM information_schema.triggers trg
      WHERE trg.trigger_schema = 'public';
    `);

    // Aggregate size metrics mapped by table name
    const sizesMap = {};
    sizesRes.rows.forEach(row => {
      sizesMap[row.table_name] = {
        rowCount: parseInt(row.row_count, 10),
        totalSize: formatBytes(parseInt(row.total_bytes, 10)),
        tableSize: formatBytes(parseInt(row.table_bytes, 10)),
        indexSize: formatBytes(parseInt(row.index_bytes, 10)),
        rawTotalBytes: parseInt(row.total_bytes, 10),
      };
    });

    // Aggregate columns by table
    const tablesMap = {};
    columnsRes.rows.forEach(col => {
      if (!tablesMap[col.table_name]) {
        const stats = sizesMap[col.table_name] || {
          rowCount: 0,
          totalSize: '0 Bytes',
          tableSize: '0 Bytes',
          indexSize: '0 Bytes',
          rawTotalBytes: 0
        };
        tablesMap[col.table_name] = {
          name: col.table_name,
          ...stats,
          columns: []
        };
      }
      tablesMap[col.table_name].columns.push({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        defaultValue: col.column_default,
        constraint: col.constraint_type,
        foreignTable: col.foreign_table_name,
        foreignColumn: col.foreign_column_name,
      });
    });

    // Aggregate enums by name
    const enumsMap = {};
    enumsRes.rows.forEach(row => {
      if (!enumsMap[row.enum_name]) {
        enumsMap[row.enum_name] = [];
      }
      enumsMap[row.enum_name].push(row.enum_value);
    });

    const enums = Object.keys(enumsMap).map(name => ({
      name,
      values: enumsMap[name]
    }));

    const result = {
      tables: Object.values(tablesMap),
      enums,
      triggers: triggersRes.rows.map(t => ({
        name: t.trigger_name,
        table: t.table_name,
        event: t.event_manipulation,
        timing: t.action_timing,
        action: t.action_statement
      })),
      totalDbSize: formatBytes(sizesRes.rows.reduce((acc, row) => acc + parseInt(row.total_bytes, 10), 0))
    };

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.getStorageGrid = async (req, res, next) => {
  try {
    // Queries each storage location and details about current items inside them.
    const result = await pool.query(`
      WITH latest_transfer AS (
        SELECT DISTINCT ON (evidence_item_id)
          evidence_item_id,
          storage_location_id,
          transfer_timestamp
        FROM custody_transfers
        ORDER BY evidence_item_id, transfer_timestamp DESC, transfer_id DESC
      )
      SELECT 
        sl.storage_location_id,
        sl.room,
        sl.locker,
        sl.refrigerator,
        sl.vault,
        sl.climate_notes,
        sl.access_level,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ei.evidence_item_id,
              'asset_tag', ei.asset_tag,
              'description', ei.description,
              'current_status', ei.current_status,
              'collected_date', ei.collected_date
            )
          ) FILTER (WHERE ei.evidence_item_id IS NOT NULL),
          '[]'
        ) AS items
      FROM storage_locations sl
      LEFT JOIN latest_transfer lt ON sl.storage_location_id = lt.storage_location_id
      LEFT JOIN evidence_items ei ON lt.evidence_item_id = ei.evidence_item_id AND ei.current_status = 'in_storage'
      GROUP BY sl.storage_location_id, sl.room, sl.locker, sl.refrigerator, sl.vault, sl.climate_notes, sl.access_level
      ORDER BY sl.room, sl.locker, sl.refrigerator, sl.vault;
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};
