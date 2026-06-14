<template>
  <div v-if="store.searchVisible" class="global-search-overlay" @click.self="store.closeSearch()">
    <div class="global-search-panel card">
      <div class="search-header">
        <h3>🔍 全局搜索</h3>
        <button class="close-btn" @click="store.closeSearch()">✕</button>
      </div>

      <div class="search-filters">
        <div class="filter-row">
          <div class="filter-item">
            <label>👤 联系人</label>
            <input
              type="text"
              v-model="store.searchFilters.contact"
              placeholder="搜索联系人姓名或号码"
              @input="handleSearch"
              list="contact-list"
            />
            <datalist id="contact-list">
              <option v-for="c in store.getAllContacts()" :key="c" :value="c" />
            </datalist>
          </div>
          <div class="filter-item">
            <label>📝 关键词</label>
            <input
              type="text"
              v-model="store.searchFilters.keyword"
              placeholder="搜索短信内容关键词"
              @input="handleSearch"
            />
          </div>
        </div>

        <div class="filter-row">
          <div class="filter-item">
            <label>🏷️ 标签</label>
            <select
              v-model="store.searchFilters.tag"
              @change="handleSearch"
            >
              <option value="">全部标签</option>
              <option v-for="tag in store.getAllTags()" :key="tag" :value="tag">{{ tag }}</option>
            </select>
          </div>
          <div class="filter-item date-filter">
            <label>📅 日期范围</label>
            <div class="date-range">
              <input
                type="date"
                v-model="store.searchFilters.dateFrom"
                @change="handleSearch"
              />
              <span class="date-separator">至</span>
              <input
                type="date"
                v-model="store.searchFilters.dateTo"
                @change="handleSearch"
              />
            </div>
          </div>
        </div>

        <div class="search-actions">
          <button class="btn btn-secondary" @click="clearFilters">清除筛选</button>
          <button class="btn btn-primary" @click="handleSearch">搜索</button>
        </div>
      </div>

      <div class="search-results">
        <div v-if="hasFilters && store.searchResults.length === 0" class="empty-results">
          <div class="icon">😔</div>
          <p>没有找到匹配的短信</p>
          <p class="tip">试试调整筛选条件</p>
        </div>

        <div v-else-if="store.searchResults.length > 0" class="results-list">
          <div class="results-summary">
            找到 <strong>{{ totalMatched }}</strong> 条匹配短信，来自 <strong>{{ store.searchResults.length }}</strong> 个对话
          </div>

          <div
            v-for="(result, rIdx) in store.searchResults"
            :key="result.letter.conversation.id"
            class="result-group"
          >
            <div class="result-group-header">
              <span class="contact-name">{{ result.letter.conversation.name || result.letter.conversation.address }}</span>
              <span class="match-count">{{ result.matchedMessages.length }} 条匹配</span>
              <div class="tags">
                <span
                  v-for="tag in result.letter.tags.slice(0, 4)"
                  :key="tag"
                  class="tag"
                  :class="getTagClass(tag)"
                >{{ tag }}</span>
              </div>
            </div>

            <div class="matched-messages">
              <div
                v-for="msg in result.matchedMessages"
                :key="msg.id"
                class="matched-message"
                :class="{ sent: msg.isSent, received: msg.isReceived }"
                @click="jumpToMessage(result.letter, msg)"
              >
                <div class="msg-meta">
                  <span class="msg-type">{{ msg.isSent ? '📤 发送' : '📥 接收' }}</span>
                  <span class="msg-date">{{ formatDate(msg.date) }}</span>
                </div>
                <div class="msg-body">
                  <span v-html="highlightKeyword(msg.body)"></span>
                </div>
                <div class="msg-tags" v-if="msg.highlights && msg.highlights.length > 0">
                  <span
                    v-for="hl in msg.highlights"
                    :key="hl.type"
                    class="tag"
                    :class="'tag-' + hl.type"
                  >{{ hl.text }}</span>
                </div>
                <div class="jump-hint">点击跳转 →</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="!hasFilters" class="empty-results">
          <div class="icon">💡</div>
          <p>输入筛选条件开始搜索</p>
          <p class="tip">支持按联系人、关键词、标签和日期查找</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { store } from '@/store'

const router = useRouter()

const hasFilters = computed(() => {
  const f = store.searchFilters
  return f.contact || f.keyword || f.tag || f.dateFrom || f.dateTo
})

const totalMatched = computed(() => {
  return store.searchResults.reduce((sum, r) => sum + r.matchedMessages.length, 0)
})

function handleSearch() {
  store.performSearch()
}

function clearFilters() {
  store.searchFilters = {
    contact: '',
    keyword: '',
    tag: '',
    dateFrom: '',
    dateTo: ''
  }
  store.searchResults = []
}

function highlightKeyword(text) {
  const keyword = store.searchFilters.keyword
  if (!keyword || !text) return text
  const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi')
  return text.replace(regex, '<mark class="highlight">$1</mark>')
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatDate(timestamp) {
  const d = new Date(timestamp)
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hour = d.getHours().toString().padStart(2, '0')
  const minute = d.getMinutes().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function getTagClass(tag) {
  if (tag.includes('想念') || tag.includes('思念')) return 'tag-miss'
  if (tag.includes('晚安')) return 'tag-night'
  if (tag.includes('道歉') || tag.includes('对不起')) return 'tag-sorry'
  if (tag.includes('爱意') || tag.includes('双向奔赴')) return 'tag-love'
  if (tag.includes('争吵') || tag.includes('冤家') || tag.includes('情绪')) return 'tag-quarrel'
  if (tag.includes('撒娇') || tag.includes('可爱') || tag.includes('叠字')) return 'tag-cute'
  if (tag.includes('高频') || tag.includes('秒回') || tag.includes('互动')) return 'tag-freq'
  return 'tag'
}

function jumpToMessage(letter, msg) {
  store.setSelectedConversation(letter)
  store.setScrollTarget({
    conversationId: letter.conversation.id,
    messageId: msg.id
  })
  store.closeSearch()
  router.push('/wall')
}

watch(() => store.searchVisible, (val) => {
  if (val && store.loveLetters.length > 0) {
    handleSearch()
  }
})
</script>

<style scoped>
.global-search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.global-search-panel {
  max-width: 900px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(135deg, #fff5f5 0%, #fff0f6 100%);
}

.search-header h3 {
  color: var(--love-red);
  font-size: 1.3rem;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.3s;
  color: var(--text-light);
}

.close-btn:hover {
  background: var(--love-red);
  color: white;
}

.search-filters {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
  background: #fafafa;
}

.filter-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-item label {
  font-size: 0.9rem;
  color: var(--text-dark);
  font-weight: 500;
}

.filter-item input,
.filter-item select {
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  transition: border-color 0.3s;
}

.filter-item input:focus,
.filter-item select:focus {
  outline: none;
  border-color: var(--love-pink);
}

.date-filter {
  flex: 1.5;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-range input {
  flex: 1;
}

.date-separator {
  color: var(--text-light);
  font-size: 0.9rem;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.empty-results {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-light);
}

.empty-results .icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-results p {
  margin-bottom: 0.5rem;
}

.empty-results .tip {
  font-size: 0.9rem;
  color: #aaa;
}

.results-summary {
  padding: 0.75rem 1rem;
  background: var(--bg-light);
  border-radius: 8px;
  margin-bottom: 1.5rem;
  color: var(--text-dark);
  font-size: 0.95rem;
}

.results-summary strong {
  color: var(--love-red);
}

.result-group {
  margin-bottom: 1.5rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.result-group-header {
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #fff5f5 0%, #fff0f6 100%);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.contact-name {
  font-weight: bold;
  font-size: 1.05rem;
  color: var(--text-dark);
}

.match-count {
  background: var(--love-red);
  color: white;
  padding: 0.2rem 0.7rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.result-group-header .tags {
  margin-left: auto;
}

.matched-messages {
  padding: 0.75rem;
}

.matched-message {
  padding: 1rem 1.25rem;
  border-radius: 10px;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.3s;
  border-left: 4px solid var(--border);
  background: white;
}

.matched-message:last-child {
  margin-bottom: 0;
}

.matched-message:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.15);
}

.matched-message.sent {
  border-left-color: var(--love-red);
  background: #fff9f9;
}

.matched-message.received {
  border-left-color: var(--accent);
  background: #fbf5ff;
}

.msg-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-light);
  margin-bottom: 0.5rem;
}

.msg-body {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-dark);
  margin-bottom: 0.5rem;
}

.msg-body :deep(.highlight) {
  background: #fff3a3;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-weight: 600;
}

.msg-tags {
  margin-bottom: 0.5rem;
}

.jump-hint {
  text-align: right;
  font-size: 0.8rem;
  color: var(--love-red);
  font-weight: 500;
}

@media (max-width: 640px) {
  .global-search-overlay {
    padding: 0.5rem;
  }

  .filter-row {
    flex-direction: column;
  }

  .date-range {
    flex-direction: column;
    align-items: stretch;
  }

  .result-group-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .result-group-header .tags {
    margin-left: 0;
  }
}
</style>
