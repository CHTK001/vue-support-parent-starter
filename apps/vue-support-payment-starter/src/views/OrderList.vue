<template>
  <div class="order-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单管理</span>
          <el-button type="primary" @click="showCreateDialog">创建订单</el-button>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户ID">
          <el-input v-model="searchForm.userId" placeholder="请输入用户ID" clearable />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option
              v-for="(label, value) in OrderStatusMap"
              :key="value"
              :label="label"
              :value="Number(value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 统计信息 -->
      <el-row :gutter="20" class="statistics">
        <el-col :span="8">
          <el-statistic title="订单总数" :value="statistics.totalCount" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="已支付订单" :value="statistics.paidCount" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="订单总金额" :value="statistics.totalAmount / 100" :precision="2" prefix="¥" />
        </el-col>
      </el-row>

      <!-- 订单列表 -->
      <el-table :data="orderList" border stripe v-loading="loading">
        <el-table-column prop="orderNo" label="订单号" width="200" />
        <el-table-column prop="userId" label="用户ID" width="150" />
        <el-table-column prop="subject" label="订单标题" />
        <el-table-column prop="amount" label="订单金额" width="120">
          <template #default="{ row }">
            ¥{{ (row.amount / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ OrderStatusMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handlePay(row)" v-if="canPay(row.status)">
              支付
            </el-button>
            <el-button size="small" type="warning" @click="handleRefund(row)" v-if="canRefund(row.status)">
              退款
            </el-button>
            <el-button size="small" type="danger" @click="handleCancel(row)" v-if="canCancel(row.status)">
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </el-card>

    <!-- 创建订单对话框 -->
    <el-dialog v-model="createDialogVisible" title="创建订单" width="600px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="createForm.userId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="订单标题" prop="subject">
          <el-input v-model="createForm.subject" placeholder="请输入订单标题" />
        </el-form-item>
        <el-form-item label="订单金额" prop="amount">
          <el-input-number v-model="createForm.amount" :min="0.01" :step="0.01" :precision="2" />
          <span class="ml-2">元</span>
        </el-form-item>
        <el-form-item label="支付方式" prop="tradeType">
          <el-select v-model="createForm.tradeType" placeholder="请选择支付方式">
            <el-option label="扫码支付" value="NATIVE" />
            <el-option label="公众号支付" value="JSAPI" />
            <el-option label="APP支付" value="APP" />
            <el-option label="H5支付" value="H5" />
          </el-select>
        </el-form-item>
        <el-form-item label="OpenID" prop="openid" v-if="createForm.tradeType === 'JSAPI'">
          <el-input v-model="createForm.openid" placeholder="请输入OpenID（JSAPI支付必填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="creating">创建并支付</el-button>
      </template>
    </el-dialog>

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="订单详情" width="800px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ currentOrder.userId }}</el-descriptions-item>
        <el-descriptions-item label="订单标题">{{ currentOrder.subject }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">
          ¥{{ (currentOrder.amount / 100).toFixed(2) }}
        </el-descriptions-item>
        <el-descriptions-item label="实付金额">
          ¥{{ ((currentOrder.paidAmount || 0) / 100).toFixed(2) }}
        </el-descriptions-item>
        <el-descriptions-item label="退款金额">
          ¥{{ ((currentOrder.refundAmount || 0) / 100).toFixed(2) }}
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(currentOrder.status)">
            {{ OrderStatusMap[currentOrder.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="第三方订单号">
          {{ currentOrder.thirdOrderNo || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentOrder.createTime }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ currentOrder.payTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="退款时间">{{ currentOrder.refundTime || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 支付二维码对话框 -->
    <el-dialog v-model="qrcodeDialogVisible" title="扫码支付" width="400px" align-center>
      <div class="qrcode-container">
        <div id="qrcode" ref="qrcodeRef"></div>
        <p class="qrcode-tip">请使用微信/支付宝扫码支付</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { getOrderList, createOrderAndPay, cancelOrder, refundOrder, countOrders, sumOrderAmount } from '../api/payment';
import { OrderStatus, OrderStatusMap, type Order } from '../types/payment';
import QRCode from 'qrcodejs2';

// 搜索表单
const searchForm = reactive({
  userId: '',
  status: undefined as number | undefined,
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 订单列表
const orderList = ref<Order[]>([]);
const loading = ref(false);

// 统计信息
const statistics = reactive({
  totalCount: 0,
  paidCount: 0,
  totalAmount: 0,
});

// 创建订单对话框
const createDialogVisible = ref(false);
const creating = ref(false);
const createFormRef = ref<FormInstance>();
const createForm = reactive({
  userId: '',
  subject: '',
  amount: 0,
  tradeType: 'NATIVE',
  openid: '',
});

const createRules: FormRules = {
  userId: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
  subject: [{ required: true, message: '请输入订单标题', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入订单金额', trigger: 'blur' }],
  tradeType: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
};

// 订单详情对话框
const detailDialogVisible = ref(false);
const currentOrder = ref<Order | null>(null);

// 二维码对话框
const qrcodeDialogVisible = ref(false);
const qrcodeRef = ref<HTMLElement>();

// 加载订单列表
const loadOrderList = async () => {
  loading.value = true;
  try {
    const res = await getOrderList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm,
    });
    orderList.value = res.data.list;
    pagination.total = res.data.total;
  } catch (error) {
    ElMessage.error('加载订单列表失败');
  } finally {
    loading.value = false;
  }
};

// 加载统计信息
const loadStatistics = async () => {
  try {
    const [totalRes, paidRes, amountRes] = await Promise.all([
      countOrders({}),
      countOrders({ status: OrderStatus.PAID }),
      sumOrderAmount({ status: OrderStatus.PAID }),
    ]);
    statistics.totalCount = totalRes.data;
    statistics.paidCount = paidRes.data;
    statistics.totalAmount = amountRes.data;
  } catch (error) {
    console.error('加载统计信息失败', error);
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  loadOrderList();
};

// 重置
const handleReset = () => {
  searchForm.userId = '';
  searchForm.status = undefined;
  handleSearch();
};

// 分页变化
const handleSizeChange = () => {
  loadOrderList();
};

const handleCurrentChange = () => {
  loadOrderList();
};

// 显示创建对话框
const showCreateDialog = () => {
  createDialogVisible.value = true;
};

// 创建订单
const handleCreate = async () => {
  if (!createFormRef.value) return;
  
  await createFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    creating.value = true;
    try {
      const res = await createOrderAndPay(
        {
          userId: createForm.userId,
          subject: createForm.subject,
          amount: Math.round(createForm.amount * 100),
        },
        {
          outTradeNo: '',
          tradeType: createForm.tradeType,
          subject: createForm.subject,
          totalAmount: Math.round(createForm.amount * 100),
          expireMinutes: 30,
          openid: createForm.openid || undefined,
        }
      );
      
      if (res.data.success) {
        ElMessage.success('订单创建成功');
        createDialogVisible.value = false;
        
        // 如果是扫码支付，显示二维码
        if (res.data.codeUrl) {
          showQRCode(res.data.codeUrl);
        }
        
        loadOrderList();
        loadStatistics();
      } else {
        ElMessage.error(res.data.errorMsg || '订单创建失败');
      }
    } catch (error) {
      ElMessage.error('订单创建失败');
    } finally {
      creating.value = false;
    }
  });
};

// 显示二维码
const showQRCode = (codeUrl: string) => {
  qrcodeDialogVisible.value = true;
  setTimeout(() => {
    if (qrcodeRef.value) {
      qrcodeRef.value.innerHTML = '';
      new QRCode(qrcodeRef.value, {
        text: codeUrl,
        width: 256,
        height: 256,
      });
    }
  }, 100);
};

// 查看订单
const handleView = (order: Order) => {
  currentOrder.value = order;
  detailDialogVisible.value = true;
};

// 支付订单
const handlePay = (order: Order) => {
  ElMessage.info('请使用创建订单功能重新发起支付');
};

// 取消订单
const handleCancel = async (order: Order) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    
    const res = await cancelOrder(order.orderNo);
    if (res.data) {
      ElMessage.success('订单取消成功');
      loadOrderList();
    } else {
      ElMessage.error('订单取消失败');
    }
  } catch (error) {
    // 用户取消操作
  }
};

// 退款订单
const handleRefund = async (order: Order) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入退款金额（元）', '退款', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^\d+(\.\d{1,2})?$/,
      inputErrorMessage: '请输入正确的金额',
    });
    
    const refundAmount = Math.round(parseFloat(value) * 100);
    if (refundAmount > order.amount) {
      ElMessage.error('退款金额不能超过订单金额');
      return;
    }
    
    const res = await refundOrder(order.orderNo, {
      outTradeNo: order.orderNo,
      outRefundNo: `REFUND_${Date.now()}`,
      totalAmount: order.amount,
      refundAmount,
      refundReason: '用户申请退款',
    });
    
    if (res.data.success) {
      ElMessage.success('退款申请成功');
      loadOrderList();
    } else {
      ElMessage.error(res.data.errorMsg || '退款申请失败');
    }
  } catch (error) {
    // 用户取消操作
  }
};

// 获取状态类型
const getStatusType = (status: OrderStatus) => {
  if (status === OrderStatus.PAID) return 'success';
  if (status === OrderStatus.PAYING) return 'warning';
  if (status === OrderStatus.CANCELED || status === OrderStatus.CLOSED) return 'info';
  if (status === OrderStatus.PAY_FAILED || status === OrderStatus.REFUND_FAILED) return 'danger';
  return '';
};

// 判断是否可以支付
const canPay = (status: OrderStatus) => {
  return status === OrderStatus.CREATED || status === OrderStatus.PAY_FAILED;
};

// 判断是否可以取消
const canCancel = (status: OrderStatus) => {
  return status === OrderStatus.CREATED || status === OrderStatus.PAYING || status === OrderStatus.PAY_FAILED;
};

// 判断是否可以退款
const canRefund = (status: OrderStatus) => {
  return status === OrderStatus.PAID || status === OrderStatus.PARTIAL_REFUNDED;
};

onMounted(() => {
  loadOrderList();
  loadStatistics();
});
</script>

<style scoped>
.order-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.statistics {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.qrcode-tip {
  margin-top: 20px;
  color: #666;
}

.ml-2 {
  margin-left: 8px;
}
</style>
