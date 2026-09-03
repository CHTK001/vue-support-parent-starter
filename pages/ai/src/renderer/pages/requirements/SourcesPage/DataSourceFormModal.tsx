/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * DataSourceFormModal — create / edit a requirement data source.
 *
 * The `type` select is driven by the backend registry (`/api/requirements/data-sources/types`),
 * which today returns LOCAL / LARK / GENERIC. Config fields are rendered per type so the
 * caller never hand-writes the `config` JSON:
 *   - LOCAL  → host / port / database / username / password / table
 *   - LARK   → app_id / app_secret / table_id
 *   - GENERIC→ api_url / api_method / api_auth_type / api_auth_value
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, Modal, Select, Switch } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import type { IDataSource } from '@/common/adapter/ipcBridge';
import { useArcoMessage } from '@/renderer/utils/ui/useArcoMessage';

type DataSourceFormModalProps = {
  visible: boolean;
  editing: IDataSource | null;
  types: string[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

const TYPE_LABELS: Record<string, string> = {
  LOCAL: '本机数据库',
  LARK: '飞书多维表格',
  GENERIC: '通用 REST API',
};

const DataSourceFormModal: React.FC<DataSourceFormModalProps> = ({ visible, editing, types, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [message, ctx] = useArcoMessage();
  const [submitting, setSubmitting] = useState(false);

  const isEdit = editing != null;
  const type = Form.useWatch('type', form);

  useEffect(() => {
    if (visible) {
      if (editing) {
        form.setFieldsValue({
          name: editing.name,
          type: editing.type,
          enabled: editing.enabled !== false,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ type: types[0] ?? 'LOCAL', enabled: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editing, types, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setSubmitting(true);

      const config: Record<string, unknown> = {};
      if (type === 'LOCAL') {
        config.host = values.host || '127.0.0.1';
        config.port = Number(values.port) || 3306;
        config.database = values.database;
        config.username = values.username;
        config.password = values.password || '';
        config.table = values.table || 'sys_ai_requirement';
      } else if (type === 'LARK') {
        config.app_id = values.app_id;
        config.app_secret = values.app_secret;
        config.table_id = values.table_id;
      } else if (type === 'GENERIC') {
        config.api_url = values.api_url;
        config.api_method = values.api_method || 'GET';
        config.api_auth_type = values.api_auth_type || 'none';
        config.api_auth_value = values.api_auth_value || '';
      }

      const base = {
        name: values.name,
        type: type as string,
        enabled: values.enabled,
        sync_cron: undefined,
      };

      if (isEdit) {
        await ipcBridge.requirements.updateDataSource.invoke({
          id: editing!.id,
          updates: { ...base, config },
        });
        message.success('数据源已更新');
      } else {
        await ipcBridge.requirements.createDataSource.invoke({ ...base, config });
        message.success('数据源已创建');
      }

      await onSuccess();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) {
        return;
      }
      message.error(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const typeOptions = types.map((tname) => ({
    label: TYPE_LABELS[tname] ?? tname,
    value: tname,
  }));

  return (
    <Modal
      title={isEdit ? '编辑数据源' : '新建数据源'}
      visible={visible}
      onCancel={onClose}
      onOk={() => void handleSubmit()}
      confirmLoading={submitting}
      unmountOnExit
    >
      {ctx}
      <Form form={form} layout='vertical'>
        <Form.Item label='名称' field='name' rules={[{ required: true, message: '请输入数据源名称' }]}>
          <Input placeholder='例如：本机数据库' />
        </Form.Item>
        <Form.Item label='类型' field='type'>
          <Select options={typeOptions} />
        </Form.Item>

        {type === 'LOCAL' && (
          <>
            <Form.Item label='主机' field='host'>
              <Input placeholder='127.0.0.1' />
            </Form.Item>
            <Form.Item label='端口' field='port'>
              <Input placeholder='3306' />
            </Form.Item>
            <Form.Item label='数据库' field='database' rules={[{ required: true, message: '请输入数据库名' }]}>
              <Input placeholder='ai_test' />
            </Form.Item>
            <Form.Item label='用户名' field='username' rules={[{ required: true, message: '请输入用户名' }]}>
              <Input placeholder='root' />
            </Form.Item>
            <Form.Item label='密码' field='password'>
              <Input.Password placeholder='请输入密码' />
            </Form.Item>
            <Form.Item label='需求表' field='table'>
              <Input placeholder='sys_ai_requirement' />
            </Form.Item>
          </>
        )}

        {type === 'LARK' && (
          <>
            <Form.Item label='App ID' field='app_id' rules={[{ required: true, message: '请输入 App ID' }]}>
              <Input placeholder='cli_xxx' />
            </Form.Item>
            <Form.Item label='App Secret' field='app_secret' rules={[{ required: true, message: '请输入 App Secret' }]}>
              <Input.Password placeholder='请输入 App Secret' />
            </Form.Item>
            <Form.Item label='多维表格 ID' field='table_id' rules={[{ required: true, message: '请输入多维表格 ID' }]}>
              <Input placeholder='bascnxxx' />
            </Form.Item>
          </>
        )}

        {type === 'GENERIC' && (
          <>
            <Form.Item label='API URL' field='api_url' rules={[{ required: true, message: '请输入 API URL' }]}>
              <Input placeholder='https://jira.example.com/rest/api/2/search' />
            </Form.Item>
            <Form.Item label='请求方法' field='api_method'>
              <Select options={[{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }]} />
            </Form.Item>
            <Form.Item label='认证方式' field='api_auth_type'>
              <Select
                options={[
                  { label: '无', value: 'none' },
                  { label: 'Basic', value: 'basic' },
                  { label: 'Bearer', value: 'bearer' },
                  { label: 'Token', value: 'token' },
                ]}
              />
            </Form.Item>
            <Form.Item label='认证值' field='api_auth_value'>
              <Input placeholder='user:password 或 token' />
            </Form.Item>
          </>
        )}

        <Form.Item label='启用' field='enabled' triggerPropName='checked'>
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DataSourceFormModal;
