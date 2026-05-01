import type { RpcClient } from './client'
import type { DynamicSummary, StaticData } from '../types'

export const listAgentUuids = (c: RpcClient) =>
  c.call<{ uuids?: string[] }>('nodeget-server_list_all_agent_uuid', {}).then(r => r?.uuids || [])

export const staticDataMulti = (c: RpcClient, uuids: string[], fields: string[]) =>
  c.call<StaticData[]>('agent_static_data_multi_last_query', { uuids, fields })

export const dynamicSummaryMulti = (c: RpcClient, uuids: string[], fields: string[]) =>
  c.call<DynamicSummary[]>('agent_dynamic_summary_multi_last_query', { uuids, fields })

export const kvGetMulti = (
  c: RpcClient,
  items: { namespace: string; key: string }[],
) => c.call<{ namespace: string; key: string; value: unknown }[]>('kv_get_multi_value', { namespace_key: items })

export interface TcpPingRow {
  uuid: string
  timestamp: number | null
  success: boolean | null
  task_event_result: { tcp_ping?: number } | null
  cron_source: string | null
}

export const queryTcpPings = (c: RpcClient, from: number, to: number, limit = 500) =>
  c.call<TcpPingRow[]>('task_query', {
    task_data_query: {
      condition: [{ type: 'tcp_ping' }, { timestamp_from_to: [from, to] }, { limit }],
    },
  })

export const queryNodeTcpPings = (c: RpcClient, uuid: string, from: number, to: number, limit = 500) =>
  c.call<TcpPingRow[]>('task_query', {
    task_data_query: {
      condition: [{ type: 'tcp_ping' }, { uuid }, { timestamp_from_to: [from, to] }, { limit }],
    },
  })
