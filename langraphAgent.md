# Multi-Agent Workflow for Marketing Content Production

A step-by-step description of each agent, its role, expected inputs & outputs, and available tools—ready for use or further iteration.

---

## 1. Agent 1 – **Marketing Brief Generator**

| Property | Value |
| --- | --- |
| **Model** | `o3-2025-04-16` |
| **System prompt** | “Generate a detailed marketing brief from the following user data that is optimised for an LLM to read.” |
| **User prompt template** | ```Users business context: {Your business context}  Users target Audience: {Who is your target audience?}  Users marketing goals: {What are your marketing goals?}  Users CTA: {CTA}``` |
| **Tools** | • Output parser – **schema TBC** |
| **Output** | A structured marketing brief ready for downstream agents. |

---

## 2. Agent 2 – **Campaign-Idea Generator**

| Property | Value |
| --- | --- |
| **Model options** | `o3-2025-04-16` **or** `claude sonnet 4 (with thinking enabled)` |
| **System prompt** | “Generate **3 campaign ideas** based on the marketing brief and the white-paper—use the Pinecone search tool.” |
| **User prompt template** | ```Marketing brief: {Brief}``` |
| **Tools** | • Pinecone search tool<br>• Think tool *(if Sonnet 4)*<br>• Output parser – **schema unknown** |
| **Output** | Three distinct, high-level campaign concepts. |

---

## 3. Agent 3 – **Deep-Researcher**

| Property | Value |
| --- | --- |
| **Model options** | `o3-2025-04-16` **or** `claude sonnet 4 (with thinking enabled)` |
| **System prompt** | “Based on the user’s approved **theme**, perform deep research using the Pinecone tool and extract extensive details around this key theme.” |
| **User prompt template** | ```Theme: {theme the user chose}``` |
| **Tools** | • Pinecone search tool<br>• Think tool *(if Sonnet 4)*<br>• Output parser – **schema unknown** |
| **Output** | A rich research dossier feeding the drafting agents. |

---

## 4. Drafting Agents

### 4a. **Article Writer**

| Property | Value |
| --- | --- |
| **Model** | `claude sonnet 4 (with thinking enabled)` |
| **System prompt** | “Draft a **1 000-word article** for this company. Research has been provided (marketing brief, theme, research). Write in *The Economist* style guide. Pinecone vector store available for extra white-paper info.” |
| **User prompt template** | ```{marketing brief}  {research}  {theme}``` |
| **Tools** | • Pinecone search tool<br>• Think tool *(if Sonnet 4)*<br>• Output parser – **schema unknown** |
| **Output** | Polished long-form article. |

### 4b. **LinkedIn-Post Writer**

| Property | Value |
| --- | --- |
| **Model** | `claude sonnet 4 (with thinking enabled)` |
| **System prompt** | “Draft **{n} LinkedIn posts** (≈1 000 words total) for this company. Same inputs, Economist style.” |
| **User prompt template** | ```{marketing brief}  {research}  {theme}``` |
| **Tools** | • Pinecone search tool<br>• Think tool *(if Sonnet 4)*<br>• Output parser – **schema unknown** |
| **Output** | Engaging LinkedIn content series. |

### 4c. **Social-Caption Writer**

| Property | Value |
| --- | --- |
| **Model** | `claude sonnet 4 (with thinking enabled)` |
| **System prompt** | “Draft **{n} social captions** (≈1 000 words total) for this company. Same inputs, Economist style.” |
| **User prompt template** | ```{marketing brief}  {research}  {theme}``` |
| **Tools** | • Pinecone search tool<br>• Think tool *(if Sonnet 4)*<br>• Output parser – **schema unknown** |
| **Output** | Scroll-stopping captions for chosen platforms. |

---

## 5. Agent 5a/5b/5c – **Proof-reader & Editor**

| Property | Value |
| --- | --- |
| **Model** | `claude sonnet 4 (with thinking enabled)` |
| **System prompt** | “Proof-read this draft and edit to improve it, following *The Economist* style guide.” |
| **User prompt template** | ```{marketing brief}  {draft}``` |
| **Tools** | • Think tool *(if Sonnet 4)*<br>• Output parser – **schema unknown** |
| **Variations** | Separate instances tuned to the medium (article, LinkedIn, social). |
| **Output** | Final, publication-ready content. |

---

## 📦 **End-to-End Output**

> **MEDIA THAT IS ALMOST READY**  
> (i.e. fully-edited article, LinkedIn posts, and social captions—each aligned with the brief, theme, and Economist style.)

---
*Last updated: 8 July 2025*
