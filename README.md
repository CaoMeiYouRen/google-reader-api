<h1 align="center">google-reader-api </h1>
<p>
  <a href="https://www.npmjs.com/package/google-reader-api" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/google-reader-api.svg">
  </a>
  <a href="https://www.npmjs.com/package/google-reader-api" target="_blank">
    <img alt="npm downloads" src="https://img.shields.io/npm/dt/google-reader-api?label=npm%20downloads&color=yellow">
  </a>
  <img alt="Version" src="https://img.shields.io/github/package-json/v/CaoMeiYouRen/google-reader-api.svg" />
  <a href="https://github.com/CaoMeiYouRen/google-reader-api/actions?query=workflow%3ARelease" target="_blank">
    <img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/CaoMeiYouRen/google-reader-api/release.yml?branch=master">
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D16-blue.svg" />
  <a href="https://github.com/CaoMeiYouRen/google-reader-api#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/google-reader-api/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/google-reader-api/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/CaoMeiYouRen/google-reader-api?color=yellow" />
  </a>
</p>


> A Google Reader API package that implements some interfaces. 一个 Google Reader API 的封装包，实现了部分接口。
>
> **目前没有足够的精力编写文档，如果你需要翻译的话，请提 issue**
>
> **At present, there is not enough energy to write the document. If you need translation, please open an issue**

## 🏠 主页

[https://github.com/CaoMeiYouRen/google-reader-api#readme](https://github.com/CaoMeiYouRen/google-reader-api#readme)

## 📦 依赖要求


- node >=16

## 🚀 安装

```sh
npm install google-reader-api
```

## 👨‍💻 使用

更多内容请参考：https://feedhq.readthedocs.io/en/latest/api/reference.html

### 构造函数

```ts
const api = new GoogleReaderApi(baseUrl, email, password);
```

- `baseUrl`: Google Reader 服务的基本 URL，例如 `https://freshrss.example.net/api/greader.php`
- `email`: 用户的电子邮件地址
- `password`: 用户的密码

### 方法

#### 获取用户信息

```typescript
const userInfo = await api.getUserInfo();
```

返回用户的信息，包括用户名、电子邮件地址等。

#### 获取未读文章数量

```typescript 
const unreadCounts = await api.getUnreadCounts();
```

返回所有订阅源的未读文章数量。

#### 禁用标签

```typescript 
const response = await api.disableTag(category);
```

- `category`: 要禁用的标签 ID 或名称

返回 `OK` 表示成功。

#### 重命名标签

```typescript 
const response = await api.renameTag(category, newLabelName);
```

- `category`: 要重命名的标签 ID 或名称
- `newLabelName`: 新的标签名称

返回 `OK` 表示成功。

#### 获取订阅源列表

```typescript 
const subscriptions = await api.getSubscriptionList();
```

返回所有订阅源的列表。

#### 编辑订阅源

```typescript 
const response = await api.editSubscription(data);
```

- `data`: 编辑订阅源的数据，包括 `action`、`streamId`、`title`、`categoryId` 等

返回 `OK` 表示成功。

#### 添加订阅源

```typescript 
const response = await api.quickAddSubscription(feedUrl);
```

- `feedUrl`: 要添加的订阅源 URL

返回添加的订阅源信息。

#### 导出订阅源

```typescript 
const opmlContent = await api.exportSubscriptions();
```

返回 OPML 格式的订阅源列表。

#### 导入订阅源

```typescript 
const response = await api.importSubscriptions(opmlContent);
```

- `opmlContent`: OPML 格式的订阅源列表

返回 `OK` 表示成功。

#### 检查订阅源

```typescript 
const isSubscribed = await api.checkSubscription(streamId);
```

- `streamId`: 要检查的订阅源 ID

返回 `true` 表示订阅了该源，`false` 表示未订阅。

#### 获取流内容

```typescript 
const streamContents = await api.getStreamContents(data);
```

- `data`: 获取流内容的数据，包括 `streamId`、`sortCriteria`、`itemsPerPage` 等

返回流内容列表。

#### 获取流项目 ID

```typescript 
const streamItemIds = await api.getStreamItemIds(data);
```

- `data`: 获取流项目 ID 的数据，包括 `streamId`、`includeAllDirectStreamIds`、`itemsPerPage` 等

返回流项目 ID 列表。

#### 获取流项目数量

```typescript 
const streamItemCount = await api.getStreamItemCount(data);
```

- `data`: 获取流项目数量的数据，包括 `streamId`、`includeLatestDate` 等

返回流项目数量。

#### 获取流项目内容

```typescript 
const streamItemContents = await api.getStreamItemContents(itemIds);
```

- `itemIds`: 要获取内容的项目 ID 列表

返回流项目内容列表。

#### 获取标签列表

```typescript 
const tagList = await api.getTagList();
```

返回标签列表。

#### 编辑标签

```typescript 
const response = await api.editTag(data);
```

- `data`: 编辑标签的数据，包括 `editIds`、`addIds`、`removeIds` 等

返回 `OK` 表示成功。

#### 标记所有文章为已读

```typescript
const response = await api.markAllAsRead(data);
```

- `data`: 标记所有文章为已读的数据，包括 `streamId`、`timestampUsec` 等

返回 `OK` 表示成功。

## 🛠️ 开发

```sh
npm run dev
```

## 🔧 编译

```sh
npm run build
```

## 🔍 Lint

```sh
npm run lint
```

## 💾 Commit

```sh
npm run commit
```


## 👤 作者


**CaoMeiYouRen**

* Website: [https://blog.cmyr.ltd/](https://blog.cmyr.ltd/)

* GitHub: [@CaoMeiYouRen](https://github.com/CaoMeiYouRen)


## 🤝 贡献

欢迎 贡献、提问或提出新功能！<br />如有问题请查看 [issues page](https://github.com/CaoMeiYouRen/google-reader-api/issues). <br/>贡献或提出新功能可以查看[contributing guide](https://github.com/CaoMeiYouRen/google-reader-api/blob/master/CONTRIBUTING.md).

## 💰 支持

如果觉得这个项目有用的话请给一颗⭐️，非常感谢

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=CaoMeiYouRen/google-reader-api&type=Date)](https://star-history.com/#CaoMeiYouRen/google-reader-api&Date)

## 📝 License

Copyright © 2024 [CaoMeiYouRen](https://github.com/CaoMeiYouRen).<br />
This project is [MIT](https://github.com/CaoMeiYouRen/google-reader-api/blob/master/LICENSE) licensed.

***
_This README was generated with ❤️ by [cmyr-template-cli](https://github.com/CaoMeiYouRen/cmyr-template-cli)_
