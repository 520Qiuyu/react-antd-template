# 卡密复制模板设置设计

**日期：** 2026-08-03  
**范围：** 仅前端；localStorage 持久化，无后端接口  
**对齐页面：** `views/qishui/cardSecret`  
**参考实现：** `cardSecret/components/ExportModal`（模板占位符 + 预览）、`utils/copyCardSecretText`

---

## 1. 目标

支持用户自定义「复制卡密发货文本」的模板：

- 工具栏按钮打开设置弹窗
- 可点击占位符标签插入到编辑区光标处
- 用示例数据实时预览渲染结果
- 模板写入 localStorage，刷新后仍生效
- `copyCardSecretText`（含快速创建页）按模板渲染后复制

---

## 2. 非目标

- 不接后端、不做账号级云同步
- 不改导出卡密模板（`qishuiCardSecretExportTemplate` 保持独立）
- 不做多套模板切换 / 命名管理

---

## 3. 文件组织

| 路径 | 职责 |
|------|------|
| `cardSecret/components/CopyTemplateModal/` | 设置弹窗（编辑、标签插入、预览、恢复默认、保存） |
| `cardSecret/utils/copyTemplate.ts` | 占位符定义、默认模板、套餐文案、`applyCopyTemplate`、读写 storage key |
| `cardSecret/utils/copyCardSecretText.tsx` | 改为读取本地模板后渲染再复制 |
| `cardSecret/index.tsx` | 接入弹窗与 `handleSetCopyTemplate`；补齐 `SettingOutlined` 导入 |

快速创建页继续调用 `copyCardSecretText`，无需改页面逻辑。

---

## 4. 占位符

与导出侧风格统一，使用 `【】`：

| 占位符 | 取值 |
|--------|------|
| `【卡号】` | `record.secret` |
| `【访问链接】` | `{origin}{pathname}#/qishui/link-parse?cardSecret={secret}` |
| `【类型】` | `CARD_SECRET_TYPE_TEXT_MAP[type]` |
| `【套餐】` | 见下节组合描述 |
| `【过期时间】` | `YYYY-MM-DD HH:mm:ss`，无则 `-` |
| `【总次数】` | `parseLimit`，无则 `-` |
| `【每日上限】` | `>0` 为数字，否则 `不限` |
| `【备注】` | `remark`，无则空字符串 |

### 4.1 【套餐】组合规则

- `type === 'count'`：`按次付费，总次数 {parseLimit}次`（无 limit 时总次数为 `-`）
- 否则：`过期时间：{expireTimeText}，{每日上限 N 次 | 每日不限次数}`

与当前 `buildCardSecretShipText` 中对应行语义一致。

---

## 5. 默认模板与存储

**localStorage key：** `qishuiCardSecretCopyTemplate`

**默认值：**

```text
欢迎使用汽水音乐下载系统
您的卡密：【卡号】
卡密类型为：【类型】
【套餐】
请使用以下链接前往浏览器访问：
  【访问链接】
```

未设置或读到空字符串时，回退到上述默认模板。

---

## 6. 弹窗交互

组件：`CopyTemplateModal`，`forwardRef` + `useVisible`，`MyModal` 承载。

布局（自上而下）：

1. **模板编辑**：`TextArea`（等宽字体），本地编辑态，打开时灌入当前已存模板  
2. **占位符标签**：可点击 Tag；点击后插入 textarea 光标处；支持 `tabIndex` / `aria-label` / Enter·Space 触发  
3. **实时预览**：固定示例 `CardSecretListItem` 调用 `applyCopyTemplate`，`pre-wrap` 展示  
4. **底部**：恢复默认（仅改编辑态） / 取消 / 保存（写入 localStorage 后关闭并 `msgSuccess`）

打开时用当前 storage 值初始化编辑态；取消不落盘。

---

## 7. 复制链路

`copyCardSecretText(record)`：

1. 读取 `qishuiCardSecretCopyTemplate`（缺省用默认模板）  
2. `applyCopyTemplate(template, record)`  
3. `copy(text)` + `confirm` 预览（保持现有交互）

`buildCardSecretShipText` 可改为内部走默认模板渲染，或删除并由 `applyCopyTemplate` 替代，避免两套文案逻辑。

---

## 8. 视觉

- 参考 `ExportModal` 的说明条与预览区风格，略增强标签区：标签间距、主色左边框说明、预览区等宽字体与浅底  
- 不引入新设计体系；跟随 Ant Design / 项目 CSS 变量

---

## 9. 验收

- [ ] 点击「设置卡密复制模板」打开弹窗  
- [ ] 点击占位符可插入光标处  
- [ ] 预览随模板实时变化  
- [ ] 保存后刷新页面，复制发货文本仍为新模板  
- [ ] 恢复默认后保存，复制结果与改版前语义一致  
- [ ] 快速创建页复制同样走新模板  
- [ ] 未保存取消，下次打开仍是原模板  
