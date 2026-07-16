# Remote Execution Diagnostics 编码规范（EXE）

## 状态

- Draft
- 日期：2026-07-16
- Global Phase：G2 Executable Full-stack Workspace
- 关联：
  - `specs/diagnostics/README.md`
  - `specs/decisions/40.execution-provider-and-job.md`
  - `specs/implementation/g2-execution-provider-remote-runner.md`

## 1. 范围

`EXE-xxxx` 覆盖 Remote Execution transport/client 的稳定失败与恢复语义。当前使用
`domain: workspace` 和 ExecutionRequest 的作者态 target；供应商错误、堆栈、credential、URL
和 Secret 不进入 diagnostic message、hint 或 meta。

## 2. 已占用码位

| Code       | 稳定语义                                 | Retryable                                |
| ---------- | ---------------------------------------- | ---------------------------------------- |
| `EXE-4001` | protocol version unsupported             | false                                    |
| `EXE-4002` | request/response strict codec rejected   | false                                    |
| `EXE-4011` | authorization required                   | false                                    |
| `EXE-4031` | operation forbidden                      | false                                    |
| `EXE-4041` | execution/artifact not found             | false                                    |
| `EXE-4091` | request idempotency identity conflict    | false                                    |
| `EXE-4092` | cursor/provider/status recovery required | true                                     |
| `EXE-4291` | execution quota exceeded                 | false                                    |
| `EXE-5001` | remote runner unavailable                | true                                     |
| `EXE-5002` | remote transport request timed out       | true                                     |
| `EXE-5003` | sanitized remote internal failure        | 由稳定 wire taxonomy 的 `retryable` 决定 |

## 3. 安全与恢复规则

1. Client 只按稳定 error taxonomy 选择 code 和固定用户消息，不复制 provider message。
2. `EXE-4092` 出现时不得猜测缺失事件或终态；重新读取 authoritative status，并从确认 cursor 恢复。
3. retry 必须复用原 `messageId` 和业务幂等键，遵守 bounded exponential backoff；不得无限重放。
4. Remote provider 完成后仍复用本码表，不为 HTTP、WebSocket、queue 或容器供应商建立 UI 私有错误码。
