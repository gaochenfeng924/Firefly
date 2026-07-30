---
title: 'python学习以及调用api总结'
published: 2026-07-30
updated: 2026-07-30
tags: ["Python", "agent"]
category: '技术'
draft: false
lang: 'zh_CN'
pinned: false
author: '高晨枫'
comment: true
---
## 一、大模型部署

大模型部署主要分为两种方案：**本地部署**、**线上付费 API 接口部署**。

### 1. 本地部署（Ollama）

本地部署即在个人电脑上直接运行开源大模型，主流工具为 Ollama。

> **Ollama = 本地大模型管理器**，外号「大模型界的 Docker」
> 
> - 作用：一键下载、管理、运行本地开源大模型（Qwen、Llama3、DeepSeek、LLaVA 等）
> - 跨平台：Windows /macOS/ Linux 全部支持
> - 开放 API 端口 `11434`，可搭配 Open WebUI 网页界面使用

### 2. 线上付费 API 接口

各大模型厂商负责底层集群部署，使用者通过网络调用接口，按照 Token 消耗计费。

方案对比总结：

- 短期学习、小型测试场景：线上 API 更加省心，无需消耗本地硬件资源；
- 长期项目、高频大量调用场景：本地部署具备更高性价比。

---

## 二、大模型接口调用（以 DeepSeek 为例）

调用任何大模型前，优先查阅官方接口文档。

DeepSeek API 兼容 OpenAI 接口规范，可直接使用 OpenAI SDK 进行请求，便于代码迁移与统一管理。

### 完整调用示例

python

运行

```
# Please install OpenAI SDK first: `pip3 install openai`
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get('DEEPSEEK_API_KEY'),
    base_url="https://api.deepseek.com"
)

response = client.chat.completions.create(
    model="deepseek-v4-pro",
    messages=[
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "Hello"},
    ],
    stream=False,
    reasoning_effort="high",
    extra_body={"thinking": {"type": "enabled"}}
)

print(response.choices[0].message.content)
```

### 参数逐条详解

1. **`api_key=os.environ.get('DEEPSEEK_API_KEY')`**
    
    API 访问凭证。为了安全，推荐将密钥存入系统环境变量，不在代码明文硬编码。

> Key 获取途径：DeepSeek 官网申请；本地 Ollama 部署时可自定义密钥。

2. **`model="deepseek-v4-pro"`**
    
    指定调用的模型名称，可选 `deepseek-v4-pro`、`v4-flash` 等；
    
    如果对接本地 Ollama，此处名称必须和本地拉取的模型名称保持一致。
    
3. **`messages=[...]`**
    
    对话消息数组，包含两类角色：
    

- `system`：设定 AI 人设、输出格式、语气规范。描述越明确，模型输出越稳定规范。
- `user`：用户提问、需求指令。

> [!IMPORTANT]
> 
> 所有大模型接口**原生不具备记忆上下文能力**。需要把历史对话（用户提问 + AI 回复）持续放入 `messages` 数组传递，俗称「滚雪球」模式。
> 
> 同时上下文存在长度上限，超出限制容易出现乱答、失忆等问题。

4. **`stream=False`**
    
    关闭流式输出，接口一次性返回完整结果。

> 对比：`stream=True` 开启流式输出，实现打字机逐字推送效果。

5. **`reasoning_effort="high"`**
    
    推理强度配置，可选档位：`low` / `medium` / `high`。
    
    `high` = 高推理强度，模型投入更多算力推演，答案严谨度提升，但接口响应耗时更长。
    
6. **`extra_body={"thinking": {"type": "enabled"}}`**
    
    开启**思维链思考过程输出**。启用后接口返回两段内容：
    

- `thinking`：模型内部推理、思考推演原文（Think 思考过程）
- `content`：整理后对外展示的正式回答

> [!IMPORTANT]
> 
> 该组拓展参数**仅支持 DeepSeek R1 系列推理模型**。标准 OpenAI 兼容模型无法识别 `reasoning_effort`、`thinking` 字段，直接传入会报错。

---

# JSON 完整入门教程

## 一、JSON 是什么

**JSON（JavaScript Object Notation）**，中文：JavaScript 对象表示法。

- 用途：**跨语言通用数据交换格式**，常用于 API 接口传输、配置文件、数据持久化存储。
- 特点：纯文本、人类可读、几乎所有编程语言原生支持解析。
- 定位：不属于编程语言，是独立的数据格式。

> 典型场景：后端 API 返回数据、前后端通信、程序配置文件。

## 二、JSON 基础语法硬性规则（任意违规都会解析失败）

1. 数据格式为 **`"键" : 值`** 键值对结构
2. **字符串强制使用双引号 `" "`，禁止单引号 `' '`**
3. 对象的键（key）必须是双引号包裹的字符串
4. 多个元素逗号 `,` 分隔，**最后一项末尾不能添加逗号**
5. 两大容器：
    
    - `{ }` 大括号：**对象 Object**，无序键值集合
    - `[ ]` 中括号：**数组 Array**，有序数据列表
    
6. 标准 JSON**不支持注释**；带注释的拓展格式为 JSONC
7. 不能存放函数、`undefined` 等 JavaScript 独有类型

## 三、JSON 支持的 6 种基础数据类型

表格

|类型|示例|说明|
|---|---|---|
|字符串 string|`"name": "张三"`|必须双引号包裹|
|数字 number|`"age": 20`|整数、小数，不加引号|
|布尔 boolean|`"isStudent": true`|`true` / `false` 小写，不加引号|
|空值 null|`"remark": null`|小写 `null`，代表空|
|对象 object|`{"key": value}`|`{}` 包裹，支持嵌套键值对|
|数组 array|`["a", 1, true]`|`[]` 包裹，内部可存放任意类型|

## 四、JSON 基础示例

### 示例 1：简单 JSON 对象

json

```
{
  "username": "admin",
  "password": "123456",
  "age": 22,
  "isVip": true,
  "tag": null
}
```

### 示例 2：纯数组格式

json

```
["苹果", "香蕉", "橙子"]
```

### 示例 3：嵌套结构（接口最常用）

json

```
{
  "name": "高晨枫",
  "hobbies": ["编程", "物理实验"],
  "info": {
    "studentId": "2024011154",
    "major": "计算机科学与技术"
  }
}
```

## 五、JSON 和 JS 对象核心区别（高频混淆点）

1. JSON 的键必须双引号；原生 JS 对象键允许不加引号、单引号
2. JSON 不支持函数、`undefined`
3. JSON 字符串只能使用双引号
4. JSON = **纯文本字符串**；JS 对象 = 内存中可直接操作的数据实体

- JS 对象 → JSON 字符串：**序列化**
- JSON 字符串 → JS 对象：**反序列化**

## 六、JavaScript 操作 JSON（前端）

### 1. `JSON.stringify()` 序列化：对象 → JSON 字符串

javascript

运行

```
const user = {
  name: "小明",
  age: 18
};
// 对象转为JSON文本字符串
const jsonStr = JSON.stringify(user);
console.log(jsonStr);
```

### 2. `JSON.parse()` 反序列化：JSON 字符串 → 对象

javascript

运行

```
const jsonStr = '{"name":"小明","age":18}';
// 文本转为可操作JS对象
const obj = JSON.parse(jsonStr);
console.log(obj.name);
```

> ⚠️ 常见报错诱因：单引号包裹字符串、末尾多余逗号、语法非法。

## 七、Python 操作 JSON（后端接口开发）

使用内置 `json` 标准库，无需额外安装。

python

运行

```
import json

# 1. Python字典 → JSON字符串（序列化）
data = {"name": "测试", "status": True}
json_text = json.dumps(data, ensure_ascii=False, indent=2)
print(json_text)

# 2. JSON字符串 → Python字典（反序列化）
text = '''{"name": "测试", "status": true}'''
obj = json.loads(text)
print(obj["name"])
```

参数说明：

- `indent=2`：自动换行格式化，美化输出
- `ensure_ascii=False`：正常展示中文，不转义 `\uXXXX`

## 八、JSON 校验与格式化在线工具

复制文本一键校验语法错误、自动美化排版

1. [JSON.cn](https://link.wtturl.cn/?target=https%3A%2F%2Fwww.json.cn&scene=im&aid=582478&lang=zh)
2. [jsonlint.com](https://link.wtturl.cn/?target=https%3A%2F%2Fjsonlint.com&scene=im&aid=582478&lang=zh)

## 九、JSON 常见错误避坑清单

1. ❌ 键使用单引号：`'name': "张三"`
    
    ✅ 规范写法：`"name": "张三"`
    
2. ❌ 对象 / 数组最后一个元素末尾加逗号
    

json

```
{
  "a": 1,
  "b": 2,  // 禁止此处添加逗号！
}
```

3. ❌ 布尔值、null 大写：`True`、`NULL`
    
    ✅ 标准：`true`、`false`、`null`
    
4. ❌ 在标准 JSON 中写入 `// 注释`
    

> 标准 JSON 无注释，配置文件需要注释请选用 **JSONC**

5. ❌ 对象键名不添加引号：`name: "张三"`

## 十、实战范例：DeepSeek 接口参数对应的 JSON

json

```
{
  "stream": false,
  "reasoning_effort": "high",
  "extra_body": {
    "thinking": {
      "type": "enabled"
    }
  }
}
```

## 十一、拓展：JSON / JSON5 / JSONC 三者区别

- **JSON**：官方标准，无注释，语法严格；API 接口传输首选
- **JSONC（JSON with Comments）**：支持单行 / 多行注释，多用于编辑器配置文件
- **JSON5**：宽松拓展语法，允许单引号、末尾逗号，多用于本地项目配置

---

如果你需要，我可以追加以下内容补充到笔记：

1. JSON 配套练习题 + 参考答案
2. Python 读写本地 `.json` 文件完整代码
3. OpenAI 风格接口通用请求体模板

> 格式说明：全文适配 Obsidian / Github / 语雀 主流 Markdown 渲染器，Callout 提示框、代码高亮、标题层级全部标准化，无格式错乱问题。

