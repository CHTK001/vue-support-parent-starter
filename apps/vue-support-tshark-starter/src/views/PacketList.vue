<template>
  <div class="packet-list">
    <div class="list-header">
      <el-button @click="goBack">← 返回</el-button>
      <h2>数据包列表</h2>
      <el-tag size="small">共 {{ total }} 个数据包</el-tag>
    </div>

    <el-table :data="packets" stripe style="width: 100%" @row-click="viewDetail" v-loading="loading">
      <el-table-column prop="packetNumber" label="#" width="80" />
      <el-table-column prop="timestamp" label="时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.timestamp) }}
        </template>
      </el-table-column>
      <el-table-column prop="sourceIp" label="源地址" width="150" />
      <el-table-column prop="sourcePort" label="源端口" width="80" />
      <el-table-column prop="destinationIp" label="目的地址" width="150" />
      <el-table-column prop="destinationPort" label="目的端口" width="80" />
      <el-table-column prop="protocol" label="协议" width="80">
        <template #default="{ row }">
          <el-tag :type="getProtocolColor(row.protocol)" size="small">{{ row.protocol }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="length" label="长度" width="80" />
      <el-table-column prop="info" label="信息" show-overflow-tooltip />
    </el-table>

    <div class="pagination" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadPackets"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { captureApi, type PacketCapture } from '@/api/capture'

const route = useRoute()
const router = useRouter()
const sessionId = Number(route.params.sessionId)

const loading = ref(false)
const packets = ref<PacketCapture[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 50

onMounted(() => {
  loadPackets()
})

async function loadPackets() {
  loading.value = true
  try {
    const offset = (currentPage.value - 1) * pageSize
    const result = await captureApi.listPackets(sessionId, offset, pageSize)
    packets.value = result.data
    total.value = result.total
  } catch (e) {
    console.error('Failed to load packets', e)
  } finally {
    loading.value = false
  }
}

function viewDetail(row: PacketCapture) {
  router.push(`/packet/${row.id}`)
}

function goBack() {
  router.push('/')
}

function formatTime(time: string) {
  if (!time) return '-'
  return new Date(time).toLocaleTimeString()
}

function getProtocolColor(protocol: string) {
  const colors: Record<string, string> = {
    HTTP: 'success',
    TLS: 'warning',
    DNS: 'info',
    TCP: '',
    UDP: '',
    ICMP: 'danger',
    ARP: 'warning',
  }
  return colors[protocol] || 'info'
}
</script>

<style scoped>
.packet-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.list-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.list-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
